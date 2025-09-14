import RideRequest from "../models/rideRequest.models";
import Pool from "../models/carpools.models";
import {Server} from "socket.io";
import {Document, Types} from "mongoose";

// ---------------------
// Interfaces
// ---------------------
export interface IRideRequest extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    source: {lat: number; lng: number; address?: string};
    destination: {lat: number; lng: number; address?: string};
    time: Date;
    poolId?: Types.ObjectId;
    status: "waiting" | "matched" | "completed" | "cancelled";
}

export interface IPool extends Document {
    _id: Types.ObjectId;
    members: Types.ObjectId[];
    rideRequests: Types.ObjectId[];
    pickupZone: {lat: number; lng: number};
    departureTime: Date;
    costPerUser: number;
    status: "active" | "completed" | "cancelled";
}

// ---------------------
// Socket.IO instance
// ---------------------
let io: Server;

export const setSocketIO = (ioInstance: Server) => {
    io = ioInstance;
};

// ---------------------
// Haversine distance helper
// ---------------------
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ---------------------
// Core Matching Function
// ---------------------
export const tryFormPool = async (newRequestId: string, maxUsers = 4): Promise<IPool | null> => {
    const newReq = (await RideRequest.findById(newRequestId)) as IRideRequest;
    if (!newReq) throw new Error("RideRequest not found");

    // Get waiting ride requests excluding this one
    const candidates = (await RideRequest.find({
        _id: {$ne: newRequestId},
        status: "waiting",
    })) as IRideRequest[];

    // Filter candidates based on time and location proximity
    const matched = candidates.filter((req) => {
        const timeDiff = Math.abs(req.time.getTime() - newReq.time.getTime());
        if (timeDiff > 15 * 60 * 1000) return false; // ±15 min

        const pickupDist = getDistance(newReq.source.lat, newReq.source.lng, req.source.lat, req.source.lng);
        if (pickupDist > 2) return false; // 2 km radius

        const destDist = getDistance(
            newReq.destination.lat,
            newReq.destination.lng,
            req.destination.lat,
            req.destination.lng
        );
        if (destDist > 5) return false; // 5 km destination tolerance

        return true;
    });

    // Include new request, slice to maxUsers
    const groupRequests = [newReq, ...matched].slice(0, maxUsers);
    if (groupRequests.length < 2) return null; // Not enough users to form a pool

    // Calculate average pickup location
    const avgLat = groupRequests.reduce((sum, r) => sum + r.source.lat, 0) / groupRequests.length;
    const avgLng = groupRequests.reduce((sum, r) => sum + r.source.lng, 0) / groupRequests.length;

    // Earliest departure time in the group
    const departureTime = new Date(Math.min(...groupRequests.map((r) => r.time.getTime())));

    // Create Pool
    const pool = (await Pool.create({
        members: groupRequests.map((r) => r.userId),
        rideRequests: groupRequests.map((r) => r._id),
        pickupZone: {lat: avgLat, lng: avgLng},
        departureTime,
        costPerUser: 100 / groupRequests.length, // Example cost split
    })) as IPool;

    // Update ride requests with pool info
    await RideRequest.updateMany(
        {_id: {$in: groupRequests.map((r) => r._id)}},
        {$set: {poolId: pool._id, status: "matched"}}
    );

    // ---------------------
    // Real-time notifications via Socket.IO
    // ---------------------
    groupRequests.forEach((r) => {
        if (io) {
            io.to(r.userId.toString()).emit("poolFormed", {
                ...pool.toObject(),
                _id: pool._id.toString(),
                members: pool.members.map((id) => id.toString()),
                rideRequests: pool.rideRequests.map((id) => id.toString()),
            });
        }
    });

    return pool;
};
