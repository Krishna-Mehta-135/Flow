import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiResponse } from "../utils/ApiResponse";

// Ride request validation schema
export const rideRequestSchema = z.object({
    source: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        address: z.string().optional()
    }),
    destination: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        address: z.string().optional()
    }),
    time: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format"
    })
});

// Pool completion validation
export const poolCompletionSchema = z.object({
    rating: z.number().min(1).max(5).optional(),
    feedback: z.string().max(500).optional()
});

// Generic validation middleware factory
export const validateRequest = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validationResult = schema.safeParse(req.body);
            if (!validationResult.success) {
                const errors = validationResult.error.issues.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                
                return res.status(400).json(
                    new ApiResponse(400, { errors }, "Validation failed")
                );
            }
            
            // Replace req.body with validated data
            req.body = validationResult.data;
            next();
        } catch (error) {
            return res.status(500).json(
                new ApiResponse(500, null, "Validation error")
            );
        }
    };
};
