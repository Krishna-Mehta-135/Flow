import { Request, Response } from "express";
import { AnalyticsService } from "../services/analyticsService";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Get platform analytics (admin only)
 */
export const getPlatformAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const analytics = await AnalyticsService.getPlatformAnalytics();
    
    return res.status(200).json(
        new ApiResponse(200, analytics, "Platform analytics fetched successfully")
    );
});

/**
 * Get user statistics
 */
export const getUserAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const userStats = await AnalyticsService.getUserStats(userId.toString());
    
    return res.status(200).json(
        new ApiResponse(200, userStats, "User statistics fetched successfully")
    );
});

/**
 * Get popular routes
 */
export const getPopularRoutes = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const routes = await AnalyticsService.getPopularRoutes(limit);
    
    return res.status(200).json(
        new ApiResponse(200, routes, "Popular routes fetched successfully")
    );
});

/**
 * Get peak hours
 */
export const getPeakHours = asyncHandler(async (req: Request, res: Response) => {
    const peakHours = await AnalyticsService.getPeakHours();
    
    return res.status(200).json(
        new ApiResponse(200, peakHours, "Peak hours fetched successfully")
    );
});
