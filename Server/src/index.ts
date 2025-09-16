import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import connectDB from "./db/index";
import { setSocketIO } from "./services/matchingService";
import logger from "./utils/logger";

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    // Create HTTP server from Express app
    const server = http.createServer(app);

    // Create Socket.IO instance
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        },
    });

    // Pass io to services
    setSocketIO(io);

    // Socket.IO connections
    io.on("connection", (socket) => {
        logger.info(`User connected: ${socket.id}`);

        // User joins their personal room for notifications
        socket.on("joinRoom", (userId: string) => {
            socket.join(userId);
            logger.info(`User ${userId} joined their room`);
        });

        // Handle user going online/offline
        socket.on("userOnline", (userId: string) => {
            socket.join(userId);
            logger.info(`User ${userId} is online`);
        });

        socket.on("userOffline", (userId: string) => {
            socket.leave(userId);
            logger.info(`User ${userId} is offline`);
        });

        socket.on("disconnect", () => {
            logger.info(`User disconnected: ${socket.id}`);
        });
    });

    server.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    logger.error("Failed to connect to database:", error);
    process.exit(1);
});
