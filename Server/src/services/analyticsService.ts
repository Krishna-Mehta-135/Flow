import Pool from "../models/carpools.models";
import RideRequest from "../models/rideRequest.models";
import { User } from "../models/user.models";
import logger from "../utils/logger";

export interface PoolAnalytics {
    totalPools: number;
    activePools: number;
    completedPools: number;
    cancelledPools: number;
    averagePoolSize: number;
    totalCostSaved: number;
    totalUsers: number;
    activeUsers: number;
}

export interface UserStats {
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    totalCostSaved: number;
    averageRating?: number;
}

export class AnalyticsService {
    
    /**
     * Get overall platform analytics
     */
    static async getPlatformAnalytics(): Promise<PoolAnalytics> {
        try {
            const [
                totalPools,
                activePools,
                completedPools,
                cancelledPools,
                totalUsers,
                poolsWithMembers
            ] = await Promise.all([
                Pool.countDocuments(),
                Pool.countDocuments({ status: "active" }),
                Pool.countDocuments({ status: "completed" }),
                Pool.countDocuments({ status: "cancelled" }),
                User.countDocuments(),
                Pool.find({ status: { $in: ["active", "completed"] } })
                    .select("members costPerUser")
            ]);

            // Calculate average pool size
            const totalMembers = poolsWithMembers.reduce((sum, pool) => sum + pool.members.length, 0);
            const averagePoolSize = poolsWithMembers.length > 0 ? totalMembers / poolsWithMembers.length : 0;

            // Calculate total cost saved (assuming alternative would be individual rides)
            const totalCostSaved = poolsWithMembers.reduce((sum, pool) => {
                const membersCount = pool.members.length;
                if (membersCount > 1) {
                    // Cost saved = (individual_cost * members) - actual_pool_cost
                    // Assuming individual cost would be 4x the pool cost per person
                    const individualCostPerPerson = pool.costPerUser * 4;
                    const totalIndividualCost = individualCostPerPerson * membersCount;
                    const actualPoolCost = pool.costPerUser * membersCount;
                    return sum + (totalIndividualCost - actualPoolCost);
                }
                return sum;
            }, 0);

            // Count active users (users with active ride requests or pools)
            const activeUsers = await RideRequest.distinct("userId", {
                status: { $in: ["waiting", "matched"] }
            }).then(users => users.length);

            return {
                totalPools,
                activePools,
                completedPools,
                cancelledPools,
                averagePoolSize: Math.round(averagePoolSize * 100) / 100,
                totalCostSaved: Math.round(totalCostSaved * 100) / 100,
                totalUsers,
                activeUsers
            };
        } catch (error) {
            logger.error("Error getting platform analytics:", error);
            throw error;
        }
    }

    /**
     * Get user-specific statistics
     */
    static async getUserStats(userId: string): Promise<UserStats> {
        try {
            const [
                totalRides,
                completedRides,
                cancelledRides,
                userPools
            ] = await Promise.all([
                RideRequest.countDocuments({ userId }),
                RideRequest.countDocuments({ userId, status: "completed" }),
                RideRequest.countDocuments({ userId, status: "cancelled" }),
                Pool.find({ 
                    members: userId, 
                    status: "completed" 
                }).select("costPerUser members")
            ]);

            // Calculate cost saved for this user
            const totalCostSaved = userPools.reduce((sum, pool) => {
                const membersCount = pool.members.length;
                if (membersCount > 1) {
                    const individualCost = pool.costPerUser * 4; // Assuming 4x cost for individual ride
                    const costSaved = individualCost - pool.costPerUser;
                    return sum + costSaved;
                }
                return sum;
            }, 0);

            return {
                totalRides,
                completedRides,
                cancelledRides,
                totalCostSaved: Math.round(totalCostSaved * 100) / 100
            };
        } catch (error) {
            logger.error("Error getting user stats:", error);
            throw error;
        }
    }

    /**
     * Get popular routes (most frequent source-destination pairs)
     */
    static async getPopularRoutes(limit: number = 10) {
        try {
            const routes = await RideRequest.aggregate([
                {
                    $match: { status: { $in: ["completed", "matched"] } }
                },
                {
                    $group: {
                        _id: {
                            source: "$source",
                            destination: "$destination"
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: limit }
            ]);

            return routes;
        } catch (error) {
            logger.error("Error getting popular routes:", error);
            throw error;
        }
    }

    /**
     * Get peak hours for ride requests
     */
    static async getPeakHours() {
        try {
            const peakHours = await RideRequest.aggregate([
                {
                    $group: {
                        _id: { $hour: "$time" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            return peakHours;
        } catch (error) {
            logger.error("Error getting peak hours:", error);
            throw error;
        }
    }
}
