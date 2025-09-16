import { Request, Response } from "express";
import Pool from "../models/carpools.models";
import RideRequest from "../models/rideRequest.models";
import { IPool } from "../services/matchingService";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Get all active pools for the authenticated user
 */
export const getUserPools = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const pools = await Pool.find({
        members: userId,
        status: "active"
    })
    .populate("members", "username email")
    .populate("rideRequests")
    .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, pools, "User pools fetched successfully")
    );
});

/**
 * Get pool details by ID
 */
export const getPoolById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { poolId } = req.params;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const pool = await Pool.findOne({
        _id: poolId,
        members: userId
    })
    .populate("members", "username email")
    .populate("rideRequests");

    if (!pool) {
        return res.status(404).json(new ApiResponse(404, null, "Pool not found"));
    }

    return res.status(200).json(
        new ApiResponse(200, pool, "Pool details fetched successfully")
    );
});

/**
 * Cancel/Leave a pool
 */
export const leavePool = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { poolId } = req.params;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const pool = await Pool.findById(poolId) as IPool;
    if (!pool) {
        return res.status(404).json(new ApiResponse(404, null, "Pool not found"));
    }

    // Check if user is a member
    if (!pool.members.includes(userId)) {
        return res.status(403).json(new ApiResponse(403, null, "You are not a member of this pool"));
    }

    // Remove user from pool
    pool.members = pool.members.filter(memberId => !memberId.equals(userId));
    
    // Update user's ride request status back to waiting
    await RideRequest.updateMany(
        { userId, poolId },
        { $unset: { poolId: "" }, status: "waiting" }
    );

    // If pool becomes empty or has only 1 member, cancel it
    if (pool.members.length <= 1) {
        pool.status = "cancelled";
        
        // Update remaining member's ride request
        await RideRequest.updateMany(
            { poolId },
            { $unset: { poolId: "" }, status: "waiting" }
        );
    }

    await pool.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Successfully left the pool")
    );
});

/**
 * Mark pool as completed
 */
export const completePool = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { poolId } = req.params;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const pool = await Pool.findOne({
        _id: poolId,
        members: userId
    }) as IPool;

    if (!pool) {
        return res.status(404).json(new ApiResponse(404, null, "Pool not found"));
    }

    // Update pool status
    pool.status = "completed";
    await pool.save();

    // Update all related ride requests
    await RideRequest.updateMany(
        { poolId },
        { status: "completed" }
    );

    return res.status(200).json(
        new ApiResponse(200, pool, "Pool marked as completed")
    );
});

/**
 * Get pool history for user
 */
export const getPoolHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    
    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const pools = await Pool.find({
        members: userId,
        status: { $in: ["completed", "cancelled"] }
    })
    .populate("members", "username email")
    .populate("rideRequests")
    .sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, pools, "Pool history fetched successfully")
    );
});