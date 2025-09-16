import { Server } from "socket.io";
import logger from "../utils/logger";

export interface NotificationData {
    type: "pool_formed" | "pool_cancelled" | "member_left" | "ride_completed" | "ride_reminder";
    title: string;
    message: string;
    data?: any;
}

export class NotificationService {
    private static io: Server;

    static setSocketIO(ioInstance: Server) {
        this.io = ioInstance;
    }

    /**
     * Send notification to a specific user
     */
    static async sendToUser(userId: string, notification: NotificationData) {
        try {
            if (!this.io) {
                logger.warn("Socket.IO not initialized");
                return;
            }

            this.io.to(userId).emit("notification", notification);
            logger.info(`Notification sent to user ${userId}:`, notification);
        } catch (error) {
            logger.error("Error sending notification to user:", error);
        }
    }

    /**
     * Send notification to multiple users
     */
    static async sendToUsers(userIds: string[], notification: NotificationData) {
        try {
            if (!this.io) {
                logger.warn("Socket.IO not initialized");
                return;
            }

            userIds.forEach(userId => {
                this.io.to(userId).emit("notification", notification);
            });
            
            logger.info(`Notification sent to ${userIds.length} users:`, notification);
        } catch (error) {
            logger.error("Error sending notification to users:", error);
        }
    }

    /**
     * Send pool formation notification
     */
    static async notifyPoolFormed(userIds: string[], poolData: any) {
        const notification: NotificationData = {
            type: "pool_formed",
            title: "Pool Formed! 🚗",
            message: `Great news! We found ${poolData.members.length} people for your ride.`,
            data: poolData
        };

        await this.sendToUsers(userIds, notification);
    }

    /**
     * Send pool cancellation notification
     */
    static async notifyPoolCancelled(userIds: string[], reason: string = "A member left the pool") {
        const notification: NotificationData = {
            type: "pool_cancelled",
            title: "Pool Cancelled",
            message: `Your pool has been cancelled. ${reason}`,
        };

        await this.sendToUsers(userIds, notification);
    }

    /**
     * Send member left notification
     */
    static async notifyMemberLeft(userIds: string[], memberName: string) {
        const notification: NotificationData = {
            type: "member_left",
            title: "Member Left Pool",
            message: `${memberName} has left your pool.`,
        };

        await this.sendToUsers(userIds, notification);
    }

    /**
     * Send ride completion notification
     */
    static async notifyRideCompleted(userIds: string[], poolData: any) {
        const notification: NotificationData = {
            type: "ride_completed",
            title: "Ride Completed! ✅",
            message: "Hope you had a great ride! Don't forget to rate your experience.",
            data: poolData
        };

        await this.sendToUsers(userIds, notification);
    }

    /**
     * Send ride reminder notification
     */
    static async sendRideReminder(userIds: string[], poolData: any, minutesUntilDeparture: number) {
        const notification: NotificationData = {
            type: "ride_reminder",
            title: `Ride Reminder - ${minutesUntilDeparture} minutes! ⏰`,
            message: `Your ride is departing in ${minutesUntilDeparture} minutes. Get ready!`,
            data: poolData
        };

        await this.sendToUsers(userIds, notification);
    }
}
