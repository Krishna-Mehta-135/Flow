import { Request, Response } from "express";
import RideRequest from "../models/rideRequest.models";
import Transportation from "../models/transportation.models";
import { tryFormPool } from "../services/matchingService";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// ML API Response interface
interface MLServiceResponse {
    options: Array<{
        type: string;
        estimatedCost: number;
        estimatedTime: number;
        estimatedDistance: number;
        trafficLevel: string;
        confidence: number;
        mlPrediction?: any;
    }>;
}

/**
 * Get transportation options for a route
 * This will call your teammates' ML services
 */
export const getTransportationOptions = asyncHandler(async (req: Request, res: Response) => {
    console.log("Transportation options request received");
    console.log("Request body:", req.body);
    console.log("User from token:", (req as any).user);
    
    const { source, destination, requestedTime, passengerCount = 1 } = req.body;

    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
        console.log("No user ID found in request");
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    console.log("Processing request for user:", userId);

    // Parse and validate the requested time
    let parsedTime: Date;
    try {
        // Handle both ISO string and timestamp formats
        parsedTime = new Date(requestedTime);
        if (isNaN(parsedTime.getTime())) {
            throw new Error("Invalid date format");
        }
    } catch (error) {
        console.error("Date parsing error:", error, "Original value:", requestedTime);
        // Default to current time if parsing fails
        parsedTime = new Date();
    }

    // Prepare data for teammate's ML model
    const routeData = {
        route_key: `${source.address}_${destination.address}`,
        hour_of_day: parsedTime.getHours(),
        day_of_week: parsedTime.getDay(),
        is_weekend: [0, 6].includes(parsedTime.getDay()) ? 1 : 0,
        distance_km: calculateDistance(source.lat, source.lng, destination.lat, destination.lng),
        origin_zone: source.zone || "Unknown",
        destination_zone: destination.zone || "Unknown",
        // Add current weather and traffic data here if available
    };

    try {
        // Call teammate 1's ML service
        const mlResponse = await callRouteMLService(routeData);
        
        // Create transportation request
        const transportRequest = await Transportation.create({
            userId,
            source,
            destination,
            requestedTime: parsedTime,
            transportOptions: mlResponse.options, // Use the options array from ML response
            status: "pending"
        });

        // Format response to match frontend expectations
        const response = {
            requestId: transportRequest._id.toString(),
            options: mlResponse.options.map((option: any, index: number) => ({
                id: `${transportRequest._id}_${index}`,
                type: option.type,
                estimatedCost: option.estimatedCost,
                estimatedTime: option.estimatedTime,
                estimatedDistance: option.estimatedDistance,
                confidence: option.confidence || 0.8,
                trafficLevel: option.trafficLevel,
                description: getOptionDescription(option),
                icon: getOptionIcon(option.type),
                mlInsights: option.mlPrediction ? {
                    prediction: `Traffic prediction: ${option.trafficLevel}`,
                    factors: ['Historical data', 'Current conditions', 'Time of day']
                } : undefined
            })),
            mlRecommendation: generateMLRecommendation(mlResponse.options),
            estimatedSavings: calculateSavings(mlResponse.options)
        };

        return res.status(200).json(
            new ApiResponse(200, response, "Transportation options fetched successfully")
        );
    } catch (error) {
        console.error("Error getting transportation options:", error);
        
        // Fallback to default options if ML service fails
        const fallbackOptions = getDefaultOptions(routeData);
        const transportRequest = await Transportation.create({
            userId,
            source,
            destination,
            requestedTime: parsedTime,
            transportOptions: fallbackOptions.options,
            status: "pending"
        });

        // Format response to match frontend expectations
        const response = {
            requestId: transportRequest._id.toString(),
            options: fallbackOptions.options.map((option: any, index: number) => ({
                id: `${transportRequest._id}_${index}`,
                type: option.type,
                estimatedCost: option.estimatedCost,
                estimatedTime: option.estimatedTime,
                estimatedDistance: option.estimatedDistance,
                confidence: option.confidence || 0.8,
                trafficLevel: option.trafficLevel,
                description: getOptionDescription(option),
                icon: getOptionIcon(option.type),
                mlInsights: {
                    prediction: `Traffic prediction: ${option.trafficLevel} (fallback)`,
                    factors: ['Default estimation', 'Historical patterns']
                }
            })),
            mlRecommendation: generateMLRecommendation(fallbackOptions.options),
            estimatedSavings: calculateSavings(fallbackOptions.options)
        };

        return res.status(200).json(
            new ApiResponse(200, response, "Transportation options fetched (fallback)")
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

async function callRouteMLService(routeData: any): Promise<MLServiceResponse> {
    const url = "https://traffic-api-latest.onrender.com/predict";
    
    // Prepare the data for the ML API (match the expected format from Postman)
    const mlRequestData = {
        route_key: routeData.route_key,
        hour_of_day: routeData.hour_of_day,
        day_of_week: routeData.day_of_week,
        is_weekend: routeData.is_weekend,
        is_holiday: 0, // Default to not holiday
        time_bin: getTimeBin(routeData.hour_of_day),
        duration_traffic: Math.round((routeData.distance_km * 1.53) * 100) / 100, // More realistic duration
        congestion_ratio: 0,
        "lag_duration_t-1": 25.0,
        "lag_duration_t-2": 26.5,
        rolling_avg_duration_last_3: 24.5,
        last_jam_state: 0,
        neighbor_avg_duration: Math.round((routeData.distance_km * 1.54) * 100) / 100,
        road_type: "arterial", // Default road type
        lanes: 6, // Default lanes as in your example
        distance_km: routeData.distance_km,
        rain_mm: 0, // Default no rain
        temperature: 27.97, // Match your Postman example
        visibility_km: 4.5, // Match your Postman example
        pressure: 1013.25, // Match your Postman example
        wind_speed: 10.0, // Match your Postman example
        humidity: 50.0, // Match your Postman example
        rain_x_hour: 0,
        dist_x_weekend: 0,
        origin_zone: routeData.origin_zone,
        destination_zone: routeData.destination_zone,
        is_commute_corridor: 0, // Match your Postman example
        rolling_15min: 25.0, // Match your Postman example
        rolling_1hr: 50.0, // Match your Postman example
        event_flag: 0,
        metro_strike_flag: 0
    };

    try {
        console.log("Sending to ML API:", JSON.stringify(mlRequestData, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mlRequestData)
        });
        
        console.log("ML API Response status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("ML API Error Response:", errorText);
            throw new Error(`ML API error: ${response.status}`);
        }
        
        const mlResponse = await response.json();
        console.log("ML API Response:", mlResponse);
        
        // Convert ML response to our expected format
        // prediction: 0 = low traffic, 1 = high traffic
        const hasTraffic = mlResponse.prediction === 1;
        const trafficConfidence = Math.max(...mlResponse.probabilities);
        
        // Adjust duration based on traffic prediction
        const baseDuration = routeData.distance_km * 3; // 3 minutes per km base
        const predictedDuration = hasTraffic ? baseDuration * 1.5 : baseDuration; // 50% longer if traffic
        const baseCost = routeData.distance_km * 10;
        
        return {
            options: [
                {
                    type: "carpool",
                    estimatedCost: Math.round(baseCost * 0.4),
                    estimatedTime: Math.round(predictedDuration),
                    estimatedDistance: Math.round(routeData.distance_km * 10) / 10, // Round to 1 decimal
                    trafficLevel: hasTraffic ? "high" : "low",
                    confidence: trafficConfidence,
                    mlPrediction: mlResponse
                },
                {
                    type: "metro",
                    estimatedCost: Math.round(Math.min(60, baseCost * 0.2)),
                    estimatedTime: Math.round(baseDuration * 1.3), // Metro not affected by road traffic
                    estimatedDistance: Math.round(routeData.distance_km * 1.2 * 10) / 10, // Round to 1 decimal
                    trafficLevel: "low",
                    confidence: 0.95
                },
                {
                    type: "taxi",
                    estimatedCost: Math.round(baseCost),
                    estimatedTime: Math.round(predictedDuration * 0.9), // Slightly faster than carpool
                    estimatedDistance: Math.round(routeData.distance_km * 10) / 10, // Round to 1 decimal
                    trafficLevel: hasTraffic ? "high" : "medium",
                    confidence: trafficConfidence
                }
            ]
        };
    } catch (error) {
        console.error("Error calling ML API:", error);
        // Fallback to default options if ML service fails
        return getDefaultOptions(routeData);
    }
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

function getDefaultOptions(routeData: any): MLServiceResponse {
    const baseCost = routeData.distance_km * 10;
    const baseTime = routeData.distance_km * 3;
    
    return {
        options: [
            {
                type: "carpool",
                estimatedCost: Math.round(baseCost * 0.4),
                estimatedTime: Math.round(baseTime),
                estimatedDistance: Math.round(routeData.distance_km * 10) / 10, // Round to 1 decimal
                trafficLevel: "medium",
                confidence: 0.7
            },
            {
                type: "metro",
                estimatedCost: Math.round(Math.min(60, baseCost * 0.2)),
                estimatedTime: Math.round(baseTime * 1.3),
                estimatedDistance: Math.round(routeData.distance_km * 1.2 * 10) / 10, // Round to 1 decimal
                trafficLevel: "low",
                confidence: 0.9
            },
            {
                type: "taxi",
                estimatedCost: Math.round(baseCost),
                estimatedTime: Math.round(baseTime * 0.8),
                estimatedDistance: Math.round(routeData.distance_km * 10) / 10, // Round to 1 decimal
                trafficLevel: "medium",
                confidence: 0.8
            }
        ]
    };
}

// Helper function to determine time bin based on hour
function getTimeBin(hour: number): string {
    if (hour >= 6 && hour < 10) return "morning_peak";
    if (hour >= 10 && hour < 16) return "midday";
    if (hour >= 16 && hour < 20) return "evening_peak";
    if (hour >= 20 && hour < 23) return "evening";
    return "late_night";
}

// Helper functions for response formatting
function getOptionDescription(option: any): string {
    switch (option.type) {
        case 'carpool':
            return `Share a ride with others. ${option.trafficLevel === 'high' ? 'Traffic expected' : 'Good conditions'}`;
        case 'metro':
            return 'Fast and reliable metro service';
        case 'taxi':
            return `Private taxi ride. ${option.trafficLevel === 'high' ? 'May face traffic delays' : 'Quick and convenient'}`;
        case 'bus':
            return 'Affordable public bus service';
        case 'auto':
            return 'Quick auto-rickshaw ride';
        default:
            return 'Transportation option';
    }
}

function getOptionIcon(type: string): string {
    switch (type) {
        case 'carpool': return 'car';
        case 'metro': return 'train';
        case 'taxi': return 'car-sport';
        case 'bus': return 'bus';
        case 'auto': return 'car';
        case 'walking': return 'walk';
        default: return 'car';
    }
}

function generateMLRecommendation(options: any[]): string {
    const bestOption = options.reduce((best, current) => {
        const bestScore = (best.confidence || 0.5) * (best.trafficLevel === 'low' ? 1.2 : best.trafficLevel === 'medium' ? 1.0 : 0.8);
        const currentScore = (current.confidence || 0.5) * (current.trafficLevel === 'low' ? 1.2 : current.trafficLevel === 'medium' ? 1.0 : 0.8);
        return currentScore > bestScore ? current : best;
    });

    return `Based on current traffic conditions, we recommend ${bestOption.type}. Expected ${bestOption.trafficLevel} traffic with ${Math.round((bestOption.confidence || 0.8) * 100)}% confidence.`;
}

function calculateSavings(options: any[]): { cost: number; time: number; co2: number } {
    const carpoolOption = options.find(opt => opt.type === 'carpool');
    const taxiOption = options.find(opt => opt.type === 'taxi');
    
    if (!carpoolOption || !taxiOption) {
        return { cost: 0, time: 0, co2: 0 };
    }

    return {
        cost: Math.max(0, taxiOption.estimatedCost - carpoolOption.estimatedCost),
        time: Math.max(0, taxiOption.estimatedTime - carpoolOption.estimatedTime),
        co2: Math.round(Math.random() * 50 + 20) // Mock CO2 savings
    };
}
