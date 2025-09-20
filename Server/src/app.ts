import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import { authRouter } from "./routers/auth.routes";
import { carpoolRouter } from "./routers/carpool.routes";
import rideRequestRouter from "./routers/rideRequest.routes";
import { transportationRouter } from "./routers/transportation.routes";

const app = express();

// CORS Configuration
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://10.6.192.157:8081",
            "http://10.6.192.157:8082",
            "exp://10.6.192.157:8081",
            "exp://10.6.192.157:8082"
        ],
        credentials: true, // ✅ required to allow cookies or Authorization headers
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Server is running",
        timestamp: new Date().toISOString(),
        services: {
            database: "connected",
            api: "running"
        }
    });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/ride-requests", rideRequestRouter);
app.use("/api/pools", carpoolRouter);
app.use("/api/transportation", transportationRouter);

export { app };
