import express from "express";
import {
    getRouteSuggestions,
    getTransportationOptions,
    selectTransportationOption,
    getCarpoolStatus
} from "../controllers/transportation.controller";
import { protect } from "../middlewares/auth.middleware";

const transportationRouter = express.Router();

// Protect all routes
transportationRouter.use(protect);

// Get transportation options for a route
transportationRouter.post("/options", getTransportationOptions);

// Select a transportation option
transportationRouter.post("/select", selectTransportationOption);

// Get carpool status for a transportation request
transportationRouter.get("/:transportId/carpool-status", getCarpoolStatus);

// Get route switching suggestions
transportationRouter.get("/:transportId/suggestions", getRouteSuggestions);

export { transportationRouter };
