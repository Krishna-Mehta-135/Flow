import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import connectDB from "./db/index";
import { setSocketIO } from "./services/matchingService";

const PORT = process.env.PORT || 9898;

connectDB().then(() => {
    // Create HTTP server from Express app
    const server = http.createServer(app);

    // Create Socket.IO instance
    const io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://10.6.192.157:8081",
                "http://10.6.192.157:8082",
                "exp://10.6.192.157:8081",
                "exp://10.6.192.157:8082"
            ],
            credentials: true,
        },
    });

    // Pass io to matchingService
    setSocketIO(io);

    // Store active users for real-time tracking
    const activeUsers = new Map();

    // Socket.IO connections
    io.on("connection", (socket) => {
        console.log("User connected", socket.id);

        // Handle user joining live carpool map
        socket.on("joinLiveMap", (userData) => {
            const { userId, username, userType, location, destination } = userData;
            
            // Store user data
            activeUsers.set(socket.id, {
                socketId: socket.id,
                userId,
                username,
                userType, // 'driver', 'passenger', 'looking'
                location,
                destination,
                rating: 4.8, // Default rating
                status: 'looking',
                joinedAt: new Date().toISOString()
            });

            // Join the live map room
            socket.join("liveMap");
            
            console.log(`${username} joined live map as ${userType}`);
            
            // Send current active users to new user
            const allUsers = Array.from(activeUsers.values());
            socket.emit("activeUsers", allUsers);
            
            // Broadcast new user to all others
            socket.to("liveMap").emit("userJoined", activeUsers.get(socket.id));
        });

        // Handle location updates
        socket.on("updateLocation", (locationData) => {
            const user = activeUsers.get(socket.id);
            if (user) {
                user.location = locationData.location;
                user.updatedAt = new Date().toISOString();
                
                // Broadcast location update to all users
                socket.to("liveMap").emit("userLocationUpdate", {
                    socketId: socket.id,
                    userId: user.userId,
                    location: locationData.location
                });
            }
        });

        // Handle ride requests
        socket.on("sendRideRequest", (requestData) => {
            const { targetUserId, message } = requestData;
            const sender = activeUsers.get(socket.id);
            
            if (sender) {
                // Find target user's socket
                const targetUser = Array.from(activeUsers.values()).find(u => u.userId === targetUserId);
                if (targetUser) {
                    // Send request to target user
                    io.to(targetUser.socketId).emit("rideRequestReceived", {
                        from: sender,
                        message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });

        // Handle ride request responses
        socket.on("respondToRideRequest", (responseData) => {
            const { targetSocketId, accepted, message } = responseData;
            const responder = activeUsers.get(socket.id);
            
            if (responder) {
                io.to(targetSocketId).emit("rideRequestResponse", {
                    from: responder,
                    accepted,
                    message,
                    timestamp: new Date().toISOString()
                });

                // If accepted, update both users' status
                if (accepted) {
                    responder.status = 'matched';
                    const requester = activeUsers.get(targetSocketId);
                    if (requester) {
                        requester.status = 'matched';
                        
                        // Broadcast status updates
                        io.to("liveMap").emit("userStatusUpdate", {
                            users: [
                                { socketId: socket.id, status: 'matched' },
                                { socketId: targetSocketId, status: 'matched' }
                            ]
                        });
                    }
                }
            }
        });

        // Handle chat messages
        socket.on("sendChatMessage", (messageData) => {
            const { senderId, senderName, targetUserId, message, timestamp } = messageData;
            
            // Find target user's socket
            const targetUser = Array.from(activeUsers.values()).find(u => u.userId === targetUserId);
            if (targetUser) {
                // Send message to target user
                io.to(targetUser.socketId).emit("chatMessage", {
                    senderId,
                    senderName,
                    message,
                    timestamp
                });
                
                console.log(`💬 Chat message from ${senderName} to ${targetUser.username}: ${message}`);
            }
        });

        socket.on("joinRoom", (userId: string) => {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
            
            // Remove user from active users
            const user = activeUsers.get(socket.id);
            if (user) {
                activeUsers.delete(socket.id);
                
                // Notify others that user left
                socket.to("liveMap").emit("userLeft", {
                    socketId: socket.id,
                    userId: user.userId
                });
                
                console.log(`${user.username} left the live map`);
            }
        });
    });

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
});
