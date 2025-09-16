import express from "express";
import {
    cancelRideRequest,
    checkRideStatus,
    createRideRequest,
    getUserRideRequests
} from "../controllers/rideRequest.controller";
import { protect } from "../middlewares/auth.middleware";
import { rideRequestSchema, validateRequest } from "../middlewares/validation.middleware";

const rideRequestRouter = express.Router();

// Protect all routes
rideRequestRouter.use(protect);

// Create new ride request
rideRequestRouter.post("/", validateRequest(rideRequestSchema), createRideRequest);

// Get user's ride requests
rideRequestRouter.get("/", getUserRideRequests);

// Get specific ride request status
rideRequestRouter.get("/:id/status", checkRideStatus);

// Cancel ride request
rideRequestRouter.delete("/:id", cancelRideRequest);

export default rideRequestRouter;
