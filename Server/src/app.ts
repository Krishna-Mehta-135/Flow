import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import { errorHandler, notFound } from "./middlewares/errorHandler.middleware";
import { apiLimiter, authLimiter, rideRequestLimiter } from "./middlewares/rateLimiter.middleware";
import { analyticsRouter } from "./routers/analytics.routes";
import { authRouter } from "./routers/auth.routes";
import { carpoolRouter } from "./routers/carpool.routes";
import rideRequestRouter from "./routers/rideRequest.routes";
import logger from "./utils/logger";

const app = express();

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, { 
        ip: req.ip, 
        userAgent: req.get('User-Agent') 
    });
    next();
});

// CORS Configuration
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true, // ✅ required to allow cookies or Authorization headers
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());

// Rate limiting
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/ride-requests", rideRequestLimiter, rideRequestRouter);
app.use("/api/pools", carpoolRouter);
app.use("/api/analytics", analyticsRouter);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

export { app };
