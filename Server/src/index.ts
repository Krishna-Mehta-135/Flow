import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import connectDB from "./db/index";
import { setSocketIO } from "./services/matchingService";

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

    // Pass io to matchingService
    setSocketIO(io);

    // Socket.IO connections
    io.on("connection", (socket) => {
        console.log("User connected", socket.id);

        socket.on("joinRoom", (userId: string) => {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
});
