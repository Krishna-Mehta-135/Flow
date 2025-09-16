import express from "express";
import {
    completePool,
    getPoolById,
    getPoolHistory,
    getUserPools,
    leavePool
} from "../controllers/carpool.controller";
import { protect } from "../middlewares/auth.middleware";

const carpoolRouter = express.Router();

// Protect all routes
carpoolRouter.use(protect);

// Get user's active pools
carpoolRouter.get("/", getUserPools);

// Get pool history
carpoolRouter.get("/history", getPoolHistory);

// Get specific pool details
carpoolRouter.get("/:poolId", getPoolById);

// Leave a pool
carpoolRouter.delete("/:poolId/leave", leavePool);

// Complete a pool
carpoolRouter.patch("/:poolId/complete", completePool);

export { carpoolRouter };
