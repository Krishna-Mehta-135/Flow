import { Request, Response } from "express";
import Pool from "../models/carpools.models";
import RideRequest from "../models/rideRequest.models";
import { IPool, IRideRequest, tryFormPool } from "../services/matchingService";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Create a new ride request
 */
export const createRideRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const {source, destination, time} = req.body;
    if (!source || !destination || !time) {
        return res.status(400).json(new ApiResponse(400, null, "Source, destination, and time are required"));
    }

    // Check if user already has an active ride request
    const existingRequest = await RideRequest.findOne({
        userId,
        status: { $in: ["waiting", "matched"] }
    });

    if (existingRequest) {
        return res.status(400).json(new ApiResponse(400, null, "You already have an active ride request"));
    }

    // Create ride request
    const rideRequest = await RideRequest.create({
        userId,
        source,
        destination,
        time: new Date(time),
    }) as IRideRequest;

    // Try to form a pool immediately
    let pool: IPool | null = await tryFormPool(rideRequest._id.toString());

    // Populate members and convert ObjectIds to strings for frontend
    let poolData = null;
    if (pool) {
        await pool.populate("members", "username email");
        poolData = {
            ...pool.toObject(),
            _id: pool._id.toString(),
            members: pool.members.map((m: any) => ({
                _id: m._id.toString(),
                username: m.username,
                email: m.email,
            })),
            rideRequests: pool.rideRequests.map((id) => id.toString()),
        };
    }

    return res.status(201).json(
        new ApiResponse(201, {
            rideRequest,
            poolFormed: !!pool,
            pool: poolData,
        }, "Ride request created successfully")
    );
});

/**
 * Cancel a ride request
 */
export const cancelRideRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const rideRequest = await RideRequest.findOne({
        _id: id,
        userId
    }) as IRideRequest;

    if (!rideRequest) {
        return res.status(404).json(new ApiResponse(404, null, "Ride request not found"));
    }

    if (rideRequest.status === "completed") {
        return res.status(400).json(new ApiResponse(400, null, "Cannot cancel completed ride"));
    }

    // If ride is matched to a pool, handle pool updates
    if (rideRequest.poolId) {
        const pool = await Pool.findById(rideRequest.poolId) as IPool;
        if (pool) {
            // Remove user from pool
            pool.members = pool.members.filter(memberId => !memberId.equals(userId));
            
            // If pool becomes too small, cancel it
            if (pool.members.length <= 1) {
                pool.status = "cancelled";
                await RideRequest.updateMany(
                    { poolId: pool._id },
                    { $unset: { poolId: "" }, status: "waiting" }
                );
            }
            await pool.save();
        }
    }

    // Cancel the ride request
    rideRequest.status = "cancelled";
    await rideRequest.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Ride request cancelled successfully")
    );
});

/**
 * Get user's ride requests
 */
export const getUserRideRequests = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    
    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const rideRequests = await RideRequest.find({ userId })
        .populate("poolId")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, rideRequests, "Ride requests fetched successfully")
    );
});

/**
 * Check the status of a ride request
 */
export const checkRideStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const {id} = req.params;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const rideRequest = await RideRequest.findOne({_id: id, userId}) as IRideRequest;

    if (!rideRequest) {
        return res.status(404).json(new ApiResponse(404, null, "Ride request not found"));
    }

    // Fetch pool details if matched
    let poolData = null;
    if (rideRequest.poolId) {
        const pool = await Pool.findById(rideRequest.poolId).populate("members", "username email") as IPool;
        if (pool) {
            poolData = {
                ...pool.toObject(),
                _id: pool._id.toString(),
                members: pool.members.map((m: any) => ({
                    _id: m._id.toString(),
                    username: m.username,
                    email: m.email,
                })),
                rideRequests: pool.rideRequests.map((id) => id.toString()),
            };
        }
    }

    return res.status(200).json(
        new ApiResponse(200, {
            status: rideRequest.status,
            rideRequest,
            pool: poolData,
        }, "Ride status fetched successfully")
    );
});
