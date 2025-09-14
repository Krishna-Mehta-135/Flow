import {Request, Response} from "express";
import RideRequest from "../models/rideRequest.models";
import Pool from "../models/carpools.models";
import {tryFormPool} from "../services/matchingService";
import {IRideRequest, IPool} from "../services/matchingService";

/**
 * Create a new ride request
 */
export const createRideRequest = async (req: Request, res: Response) => {
    try {
        // Ensure user is authenticated
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({error: "Unauthorized"});
        }

        const {source, destination, time} = req.body;
        if (!source || !destination || !time) {
            return res.status(400).json({error: "Source, destination, and time are required"});
        }

        // Create ride request
        const rideRequest = (await RideRequest.create({
            userId,
            source,
            destination,
            time: new Date(time),
        })) as IRideRequest;

        // Try to form a pool immediately
        let pool: IPool | null = await tryFormPool(rideRequest._id.toString());

        // Populate members and convert ObjectIds to strings for frontend
        let poolData = null;
        if (pool) {
            await pool.populate("members", "name email");
            poolData = {
                ...pool.toObject(),
                _id: pool._id.toString(),
                members: pool.members.map((m: any) => ({
                    _id: m._id.toString(),
                    name: m.name,
                    email: m.email,
                })),
                rideRequests: pool.rideRequests.map((id) => id.toString()),
            };
        }

        return res.status(201).json({
            success: true,
            rideRequest,
            poolFormed: !!pool,
            pool: poolData,
        });
    } catch (error: any) {
        console.error("createRideRequest error:", error);
        return res.status(500).json({error: error.message || "Server error"});
    }
};

/**
 * Check the status of a ride request
 */
export const checkRideStatus = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({error: "Unauthorized"});
        }

        const {id} = req.params; // rideRequestId

        const rideRequest = (await RideRequest.findOne({_id: id, userId})) as IRideRequest;

        if (!rideRequest) {
            return res.status(404).json({error: "Ride request not found"});
        }

        // Fetch pool details if matched
        let poolData = null;
        if (rideRequest.poolId) {
            const pool = (await Pool.findById(rideRequest.poolId).populate("members", "name email")) as IPool;
            if (pool) {
                poolData = {
                    ...pool.toObject(),
                    _id: pool._id.toString(),
                    members: pool.members.map((m: any) => ({
                        _id: m._id.toString(),
                        name: m.name,
                        email: m.email,
                    })),
                    rideRequests: pool.rideRequests.map((id) => id.toString()),
                };
            }
        }

        return res.json({
            status: rideRequest.status,
            rideRequest,
            pool: poolData,
        });
    } catch (error: any) {
        console.error("checkRideStatus error:", error);
        return res.status(500).json({error: error.message || "Server error"});
    }
};
