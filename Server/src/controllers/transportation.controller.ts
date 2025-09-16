import { Request, Response } from "express";
import Transportation from "../models/transportation.models";
import RideRequest from "../models/rideRequest.models";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { tryFormPool } from "../services/matchingService";

/**
 * Get transportation options for a route
 * This will call your teammates' ML services
 */
export const getTransportationOptions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { source, destination, requestedTime } = req.body;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    // Prepare data for teammate's ML model
    const routeData = {
        route_key: `${source.address}_${destination.address}`,
        hour_of_day: new Date(requestedTime).getHours(),
        day_of_week: new Date(requestedTime).getDay(),
        is_weekend: [0, 6].includes(new Date(requestedTime).getDay()) ? 1 : 0,
        distance_km: calculateDistance(source.lat, source.lng, destination.lat, destination.lng),
        origin_zone: source.zone || "Unknown",
        destination_zone: destination.zone || "Unknown",
        // Add current weather and traffic data here if available
    };

    try {
        // TODO: Call teammate 1's ML service
        const mlResponse = await callRouteMLService(routeData);
        
        // Create transportation request
        const transportRequest = await Transportation.create({
            userId,
            source,
            destination,
            requestedTime: new Date(requestedTime),
            transportOptions: mlResponse.options || getDefaultOptions(routeData),
            status: "pending"
        });

        return res.status(200).json(
            new ApiResponse(200, transportRequest, "Transportation options fetched successfully")
        );
    } catch (error) {
        console.error("Error getting transportation options:", error);
        
        // Fallback to default options if ML service fails
        const fallbackOptions = getDefaultOptions(routeData);
        const transportRequest = await Transportation.create({
            userId,
            source,
            destination,
            requestedTime: new Date(requestedTime),
            transportOptions: fallbackOptions,
            status: "pending"
        });

        return res.status(200).json(
            new ApiResponse(200, transportRequest, "Transportation options fetched (fallback)")
        );
    }
});

/**
 * Select a transportation option
 */
export const selectTransportationOption = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { transportId, selectedType } = req.body;

    const transport = await Transportation.findOne({ _id: transportId, userId });
    if (!transport) {
        return res.status(404).json(new ApiResponse(404, null, "Transportation request not found"));
    }

    // Update selected option
    transport.selectedOption = {
        type: selectedType,
        selectedAt: new Date()
    };
    
    transport.status = "in_progress";
    await transport.save();

    // If carpool selected, trigger your existing matching service
    if (selectedType === "carpool") {
        try {
            // Create a ride request from the transportation request
            const rideRequest = await RideRequest.create({
                userId,
                source: transport.source,
                destination: transport.destination,
                time: transport.requestedTime,
                status: "waiting"
            });

            // Try to form a pool immediately
            const pool = await tryFormPool(rideRequest._id.toString());
            
            if (pool) {
                // Pool was formed - update transportation status
                transport.status = "in_progress";
                await transport.save();
                
                return res.status(200).json(
                    new ApiResponse(200, {
                        transport,
                        rideRequest,
                        pool: {
                            _id: pool._id.toString(),
                            members: pool.members.map(id => id.toString()),
                            pickupZone: pool.pickupZone,
                            departureTime: pool.departureTime,
                            costPerUser: pool.costPerUser,
                            memberCount: pool.members.length
                        },
                        message: `Great! Found ${pool.members.length} people for your carpool!`
                    }, "Carpool pool formed successfully")
                );
            } else {
                // No pool formed yet - user is waiting
                return res.status(200).json(
                    new ApiResponse(200, {
                        transport,
                        rideRequest,
                        pool: null,
                        message: "You're in the queue! We'll notify you when we find matching riders."
                    }, "Carpool request created - searching for matches")
                );
            }
        } catch (error) {
            console.error("Error creating carpool:", error);
            // Fallback - just update transport status
            return res.status(200).json(
                new ApiResponse(200, transport, "Transportation option selected (carpool matching failed)")
            );
        }
    }

    return res.status(200).json(
        new ApiResponse(200, transport, "Transportation option selected")
    );
});

/**
 * Get carpool status for a transportation request
 */
export const getCarpoolStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { transportId } = req.params;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const transport = await Transportation.findOne({ _id: transportId, userId });
    if (!transport) {
        return res.status(404).json(new ApiResponse(404, null, "Transportation request not found"));
    }

    // If carpool was selected, find the associated ride request and pool
    if (transport.selectedOption?.type === "carpool") {
        try {
            const rideRequest = await RideRequest.findOne({
                userId,
                source: transport.source,
                destination: transport.destination,
                time: transport.requestedTime
            }).populate("poolId");

            if (!rideRequest) {
                return res.status(404).json(new ApiResponse(404, null, "Carpool request not found"));
            }

            let poolData = null;
            if (rideRequest.poolId) {
                const Pool = require("../models/carpools.models").default;
                const pool = await Pool.findById(rideRequest.poolId).populate("members", "username email");
                
                if (pool) {
                    poolData = {
                        _id: pool._id.toString(),
                        members: pool.members.map((member: any) => ({
                            _id: member._id.toString(),
                            username: member.username,
                            email: member.email
                        })),
                        memberCount: pool.members.length,
                        pickupZone: pool.pickupZone,
                        departureTime: pool.departureTime,
                        costPerUser: pool.costPerUser,
                        status: pool.status
                    };
                }
            }

            return res.status(200).json(
                new ApiResponse(200, {
                    transport,
                    rideRequest: {
                        _id: rideRequest._id,
                        status: rideRequest.status,
                        source: rideRequest.source,
                        destination: rideRequest.destination,
                        time: rideRequest.time
                    },
                    pool: poolData,
                    isMatched: !!poolData,
                    waitingMessage: poolData ? 
                        `You're matched with ${poolData.memberCount} people!` : 
                        "Still searching for matching riders..."
                }, "Carpool status fetched successfully")
            );
        } catch (error) {
            console.error("Error getting carpool status:", error);
            return res.status(500).json(new ApiResponse(500, null, "Error fetching carpool status"));
        }
    }

    return res.status(200).json(
        new ApiResponse(200, { transport, isCarpool: false }, "Not a carpool request")
    );
});

/**
 * Get route switching suggestions (from teammate 2's LLM)
 */
export const getRouteSuggestions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { transportId } = req.params;

    const transport = await Transportation.findOne({ _id: transportId, userId });
    if (!transport) {
        return res.status(404).json(new ApiResponse(404, null, "Transportation request not found"));
    }

    try {
        // TODO: Call teammate 2's LLM service for route switching
        const llmSuggestions = await callRouteSwitchingService({
            currentRoute: transport,
            realTimeTraffic: true // Get from traffic API
        });

        // Update with new suggestions
        if (llmSuggestions.shouldSwitch) {
            transport.alternativeRoutes.push({
                reason: llmSuggestions.reason,
                newRoute: llmSuggestions.newRoute,
                llmRecommendation: llmSuggestions.recommendation
            });
            await transport.save();
        }

        return res.status(200).json(
            new ApiResponse(200, {
                shouldSwitch: llmSuggestions.shouldSwitch,
                suggestions: transport.alternativeRoutes
            }, "Route suggestions fetched")
        );
    } catch (error) {
        console.error("Error getting route suggestions:", error);
        return res.status(200).json(
            new ApiResponse(200, { shouldSwitch: false, suggestions: [] }, "No suggestions available")
        );
    }
});

// Helper functions
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function callRouteMLService(routeData: any) {
    // TODO: Replace with actual API call to teammate 1's service
    // For now, return mock data
    return {
        options: [
            {
                type: "carpool",
                estimatedCost: 150,
                estimatedTime: 45,
                estimatedDistance: routeData.distance_km,
                trafficLevel: "medium",
                confidence: 0.85
            },
            {
                type: "metro",
                estimatedCost: 60,
                estimatedTime: 55,
                estimatedDistance: routeData.distance_km * 1.2,
                trafficLevel: "low",
                confidence: 0.95
            },
            {
                type: "taxi",
                estimatedCost: 400,
                estimatedTime: 40,
                estimatedDistance: routeData.distance_km,
                trafficLevel: "medium",
                confidence: 0.80
            }
        ]
    };
}

async function callRouteSwitchingService(data: any) {
    // TODO: Replace with actual API call to teammate 2's LLM service
    return {
        shouldSwitch: Math.random() > 0.7, // Mock: 30% chance of suggesting switch
        reason: "Heavy traffic detected on current route",
        newRoute: { /* new route data */ },
        recommendation: "I recommend switching to the metro. There's heavy traffic on your current route, and the metro will save you 15 minutes and ₹100."
    };
}

function getDefaultOptions(routeData: any) {
    const baseCost = routeData.distance_km * 10;
    const baseTime = routeData.distance_km * 3;
    
    return [
        {
            type: "carpool",
            estimatedCost: baseCost * 0.4,
            estimatedTime: baseTime,
            estimatedDistance: routeData.distance_km,
            trafficLevel: "medium",
            confidence: 0.7
        },
        {
            type: "metro",
            estimatedCost: Math.min(60, baseCost * 0.2),
            estimatedTime: baseTime * 1.3,
            estimatedDistance: routeData.distance_km * 1.2,
            trafficLevel: "low",
            confidence: 0.9
        },
        {
            type: "taxi",
            estimatedCost: baseCost,
            estimatedTime: baseTime * 0.8,
            estimatedDistance: routeData.distance_km,
            trafficLevel: "medium",
            confidence: 0.8
        }
    ];
}
