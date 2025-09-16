import express from "express";
import {
    getPeakHours,
    getPlatformAnalytics,
    getPopularRoutes,
    getUserAnalytics
} from "../controllers/analytics.controller";
import { protect } from "../middlewares/auth.middleware";

const analyticsRouter = express.Router();

// Protect all routes
analyticsRouter.use(protect);

// Get user's personal analytics
analyticsRouter.get("/user", getUserAnalytics);

// Get popular routes
analyticsRouter.get("/routes/popular", getPopularRoutes);

// Get peak hours
analyticsRouter.get("/peak-hours", getPeakHours);

// Get platform analytics (admin only - you might want to add admin middleware)
analyticsRouter.get("/platform", getPlatformAnalytics);

export { analyticsRouter };
