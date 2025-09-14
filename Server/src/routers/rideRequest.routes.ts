import express from "express";
import { checkRideStatus, createRideRequest } from "../controllers/rideRequest.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/", protect, createRideRequest);
router.get("/:id/status", protect, checkRideStatus);

export default router;
