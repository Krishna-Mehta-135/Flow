import { Document, Types } from "mongoose";
import { Server } from "socket.io";
import Pool from "../models/carpools.models";
import RideRequest from "../models/rideRequest.models";

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
// Enhanced Matching Function with Transportation Integration
// ---------------------
export const tryFormPool = async (newRequestId: string, maxUsers = 4): Promise<IPool | null> => {
    const newReq = (await RideRequest.findById(newRequestId)) as IRideRequest;
    if (!newReq) throw new Error("RideRequest not found");

    // Get waiting ride requests excluding this one
    const candidates = (await RideRequest.find({
        _id: {$ne: newRequestId},
        status: "waiting",
    })) as IRideRequest[];

    // Enhanced filtering with smarter criteria
    const matched = candidates.filter((req) => {
        // Time matching: ±15 minutes window
        const timeDiff = Math.abs(req.time.getTime() - newReq.time.getTime());
        if (timeDiff > 15 * 60 * 1000) return false; // ±15 min

        // Pickup zone: 2km radius (good for urban areas)
        const pickupDist = getDistance(newReq.source.lat, newReq.source.lng, req.source.lat, req.source.lng);
        if (pickupDist > 2) return false; // 2 km radius

        // Destination proximity: 5km tolerance (allows for efficient routing)
        const destDist = getDistance(
            newReq.destination.lat,
            newReq.destination.lng,
            req.destination.lat,
            req.destination.lng
        );
        if (destDist > 5) return false; // 5 km destination tolerance

        return true;
    });

    // Sort candidates by proximity (closer pickup locations first)
    matched.sort((a, b) => {
        const distA = getDistance(newReq.source.lat, newReq.source.lng, a.source.lat, a.source.lng);
        const distB = getDistance(newReq.source.lat, newReq.source.lng, b.source.lat, b.source.lng);
        return distA - distB;
    });

    // Include new request, slice to maxUsers
    const groupRequests = [newReq, ...matched].slice(0, maxUsers);
    if (groupRequests.length < 2) return null; // Not enough users to form a pool

    // Calculate optimal pickup location (weighted average based on arrival order)
    const avgLat = groupRequests.reduce((sum, r) => sum + r.source.lat, 0) / groupRequests.length;
    const avgLng = groupRequests.reduce((sum, r) => sum + r.source.lng, 0) / groupRequests.length;

    // Earliest departure time in the group
    const departureTime = new Date(Math.min(...groupRequests.map((r) => r.time.getTime())));

    // Calculate cost per user based on distance and group size
    const totalDistance = calculateTotalDistance(groupRequests);
    const baseCost = totalDistance * 8; // ₹8 per km base rate
    const costPerUser = Math.round(baseCost / groupRequests.length);

    // Create Pool
    const pool = (await Pool.create({
        members: groupRequests.map((r) => r.userId),
        rideRequests: groupRequests.map((r) => r._id),
        pickupZone: {lat: avgLat, lng: avgLng},
        departureTime,
        costPerUser,
        status: "active"
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
                memberCount: pool.members.length,
                savings: Math.round((baseCost * 4 / groupRequests.length) - costPerUser), // Money saved vs individual ride
                message: `Great! Found ${pool.members.length} people for your carpool. You'll save ₹${Math.round((baseCost * 4 / groupRequests.length) - costPerUser)}!`
            });
        }
    });

    return pool;
};

// Helper function to calculate total distance for cost estimation
function calculateTotalDistance(requests: IRideRequest[]): number {
    if (requests.length === 0) return 0;
    
    // Simple estimation: average distance of all requests
    const totalDist = requests.reduce((sum, req) => {
        return sum + getDistance(req.source.lat, req.source.lng, req.destination.lat, req.destination.lng);
    }, 0);
    
    return totalDist / requests.length;
}
