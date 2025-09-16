import rateLimit from "express-rate-limit";

// General API rate limiting
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: "Too many requests from this IP, please try again later"
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth
    message: {
        error: "Too many authentication attempts, please try again later"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for ride request creation
export const rideRequestLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 ride requests per 5 minutes
    message: {
        error: "Too many ride requests, please try again later"
    },
    standardHeaders: true,
    legacyHeaders: false,
});
