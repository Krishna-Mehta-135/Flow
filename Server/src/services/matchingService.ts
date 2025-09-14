import RideRequest from "../models/rideRequest.models";
import Pool from "../models/carpools.models";
import {Server} from "socket.io";

import {Document} from "mongoose";

export interface IRideRequest extends Document {
    _id: string;
    userId: string;
    source: {lat: number; lng: number; address?: string};
    destination: {lat: number; lng: number; address?: string};
    time: Date;
    poolId?: string;
    status: "waiting" | "matched" | "completed" | "cancelled";
}

export interface IPool extends Document {
    _id: string;
    members: string[]; // userIds
    rideRequests: string[]; // rideRequestIds
    pickupZone: {lat: number; lng: number};
    departureTime: Date;
    costPerUser: number;
    status: "active" | "completed" | "cancelled";
}

let io: Server; // will be set from main server

export const setSocketIO = (ioInstance: Server) => {
    io = ioInstance;
};

// Haversine distance in km
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Try to form a pool for a new ride request in real-time
 */
export const tryFormPool = async (newRequestId: string, maxUsers = 4): Promise<IPool | null> => {
    const newReq = (await RideRequest.findById(newRequestId)) as IRideRequest;
    if (!newReq) throw new Error("RideRequest not found");

    const candidates = (await RideRequest.find({
        _id: {$ne: newRequestId},
        status: "waiting",
    })) as IRideRequest[];

    const matched = candidates.filter((req) => {
        // Departure time within ±15 min
        const timeDiff = Math.abs(new Date(req.time).getTime() - new Date(newReq.time).getTime());
        if (timeDiff > 15 * 60 * 1000) return false;

        // Pickup within 2 km
        const pickupDist = getDistance(newReq.source.lat, newReq.source.lng, req.source.lat, req.source.lng);
        if (pickupDist > 2) return false;

        // Destination within 5 km
        const destDist = getDistance(
            newReq.destination.lat,
            newReq.destination.lng,
            req.destination.lat,
            req.destination.lng
        );
        if (destDist > 5) return false;

        return true;
    });

    const groupRequests = [newReq, ...matched].slice(0, maxUsers);

    if (groupRequests.length < 2) return null; // Not enough users

    // Average pickup
    const avgLat = groupRequests.reduce((sum, r) => sum + r.source.lat, 0) / groupRequests.length;
    const avgLng = groupRequests.reduce((sum, r) => sum + r.source.lng, 0) / groupRequests.length;
    const departureTime = new Date(Math.min(...groupRequests.map((r) => r.time.getTime())));

    // Create pool
    const pool = (await Pool.create({
        members: groupRequests.map((r) => r.userId),
        rideRequests: groupRequests.map((r) => r._id),
        pickupZone: {lat: avgLat, lng: avgLng},
        departureTime,
        costPerUser: 100 / groupRequests.length,
    })) as IPool;

    // Update ride requests
    await RideRequest.updateMany(
        {_id: {$in: groupRequests.map((r) => r._id)}},
        {$set: {poolId: pool._id, status: "matched"}}
    );

    // Real-time notification via Socket.IO
    groupRequests.forEach((r) => {
        if (io) {
            io.to(r.userId).emit("poolFormed", pool);
        }
    });

    return pool;
};
