import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

// Global error handler middleware
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("Error Stack:", err.stack);

    // Handle specific error types
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json(
            new ApiResponse(err.statusCode, { errors: err.errors }, err.message)
        );
    }

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((error: any) => error.message);
        return res.status(400).json(
            new ApiResponse(400, { errors }, "Validation Error")
        );
    }

    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json(
            new ApiResponse(400, null, `${field} already exists`)
        );
    }

    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json(
            new ApiResponse(401, null, "Invalid token")
        );
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json(
            new ApiResponse(401, null, "Token expired")
        );
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === "CastError") {
        return res.status(400).json(
            new ApiResponse(400, null, "Invalid ID format")
        );
    }

    // Default error
    return res.status(500).json(
        new ApiResponse(500, null, "Internal Server Error")
    );
};

// 404 handler for undefined routes
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json(
        new ApiResponse(404, null, `Route ${req.originalUrl} not found`)
    );
};
