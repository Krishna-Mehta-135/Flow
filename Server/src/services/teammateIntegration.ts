// Integration points with your teammates' services

export interface RouteMLRequest {
    route_key: string;
    hour_of_day: number;
    day_of_week: number;
    is_weekend: number;
    is_holiday: number;
    time_bin: string;
    duration_traffic?: number;
    congestion_ratio?: number;
    distance_km: number;
    origin_zone: string;
    destination_zone: string;
    // Add weather data when available
    rain_mm?: number;
    temperature?: number;
    visibility_km?: number;
    pressure?: number;
    wind_speed?: number;
    humidity?: number;
}

export interface RouteMLResponse {
    estimatedDuration: number;
    estimatedCost: number;
    trafficLevel: "low" | "medium" | "high";
    confidence: number;
    alternatives: Array<{
        mode: string;
        duration: number;
        cost: number;
        reliability: number;
    }>;
}

export interface RouteSwitchRequest {
    currentRoute: {
        source: { lat: number; lng: number; address: string };
        destination: { lat: number; lng: number; address: string };
        selectedTransport: string;
        estimatedTime: number;
        estimatedCost: number;
    };
    realTimeFactors: {
        traffic: "low" | "medium" | "high";
        weather: string;
        incidents: Array<{ type: string; location: string; impact: string }>;
    };
    userPreferences: {
        prioritizeCost: boolean;
        prioritizeTime: boolean;
        preferredModes: string[];
    };
}

export interface RouteSwitchResponse {
    shouldSwitch: boolean;
    reason: string;
    confidence: number;
    recommendation: string; // Natural language explanation
    newOptions: Array<{
        mode: string;
        estimatedTime: number;
        estimatedCost: number;
        benefits: string[];
        switchingTime: number; // Time to make the switch
    }>;
}

// API Endpoints for your teammates to implement
export const TEAMMATE_APIS = {
    // Teammate 1: Route ML Service
    ROUTE_ML_BASE: process.env.ROUTE_ML_API || "http://localhost:8001",
    ROUTE_PREDICTION: "/predict",
    BULK_PREDICTIONS: "/predict-bulk",
    
    // Teammate 2: Route Switching LLM
    ROUTE_SWITCH_BASE: process.env.ROUTE_SWITCH_API || "http://localhost:8002", 
    ROUTE_ANALYSIS: "/analyze",
    ALTERNATIVE_SUGGESTIONS: "/suggest-alternatives",
    REAL_TIME_ALERTS: "/alerts"
};

// Integration helper functions
export async function callTeammate1API(endpoint: string, data: RouteMLRequest): Promise<RouteMLResponse> {
    try {
        const response = await fetch(`${TEAMMATE_APIS.ROUTE_ML_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`ML API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error calling teammate 1 API:", error);
        throw error;
    }
}

export async function callTeammate2API(endpoint: string, data: RouteSwitchRequest): Promise<RouteSwitchResponse> {
    try {
        const response = await fetch(`${TEAMMATE_APIS.ROUTE_SWITCH_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`Route Switch API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error calling teammate 2 API:", error);
        throw error;
    }
}

// Mock data for development when teammates' APIs aren't ready
export const MOCK_RESPONSES = {
    routeML: {
        estimatedDuration: 45,
        estimatedCost: 200,
        trafficLevel: "medium" as const,
        confidence: 0.85,
        alternatives: [
            { mode: "metro", duration: 55, cost: 60, reliability: 0.95 },
            { mode: "bus", duration: 65, cost: 30, reliability: 0.75 },
            { mode: "taxi", duration: 40, cost: 400, reliability: 0.80 }
        ]
    },
    routeSwitch: {
        shouldSwitch: true,
        reason: "Heavy traffic detected on current route",
        confidence: 0.92,
        recommendation: "I recommend switching to the metro. Current traffic will add 20 minutes to your journey, but the metro is running on time and will save you ₹150.",
        newOptions: [
            {
                mode: "metro",
                estimatedTime: 50,
                estimatedCost: 60,
                benefits: ["Avoid traffic", "Save money", "More reliable"],
                switchingTime: 5
            }
        ]
    }
};
