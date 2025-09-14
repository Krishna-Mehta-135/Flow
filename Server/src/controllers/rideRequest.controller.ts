import {Request, Response} from "express";
import RideRequest from "../models/rideRequest.models";
import {tryFormPool} from "../services/matchingService";
import Pool from "../models/carpools.models"

export const createRideRequest = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id; // comes from auth middleware
        const {source, destination, time} = req.body;

        if (!source || !destination || !time) {
            return res.status(400).json({error: "Source, destination, and time are required"});
        }

        // Create ride request
        const rideRequest = await RideRequest.create({
            userId,
            source,
            destination,
            time,
        });

        // Try to form a pool after creating request
        const pool = await tryFormPool(rideRequest._id.toString());

        return res.json({
            success: true,
            rideRequest,
            poolFormed: !!pool,
            pool,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({error: error.message});
    }
};



export const checkRideStatus = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const {id} = req.params; // rideRequestId

        const rideRequest = await RideRequest.findOne({_id: id, userId});

        if (!rideRequest) {
            return res.status(404).json({error: "Ride request not found"});
        }

        // If matched, fetch pool details
        let pool = null;
        if (rideRequest.poolId) {
            pool = await Pool.findById(rideRequest.poolId).populate("members", "name email");
        }

        return res.json({
            status: rideRequest.status,
            rideRequest,
            pool,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({error: error.message});
    }
};
