import mongoose from "mongoose";

// Transportation options model
const TransportationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    source: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true }
    },
    destination: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true }
    },
    requestedTime: { type: Date, required: true },
    
    // Available options from ML teammate
    transportOptions: [{
        type: { 
            type: String, 
            enum: ["carpool", "metro", "bus", "auto", "taxi", "uber", "walking"], 
            required: true 
        },
        estimatedCost: { type: Number, required: true },
        estimatedTime: { type: Number, required: true }, // in minutes
        estimatedDistance: { type: Number, required: true }, // in km
        trafficLevel: { 
            type: String, 
            enum: ["low", "medium", "high"], 
            default: "medium" 
        },
        routeData: { type: mongoose.Schema.Types.Mixed }, // From teammate's ML model
        confidence: { type: Number, min: 0, max: 1 } // ML prediction confidence
    }],
    
    // User's selected option
    selectedOption: {
        type: { type: String },
        selectedAt: { type: Date, default: Date.now }
    },
    
    // Route switching data from teammate 2
    alternativeRoutes: [{
        reason: { type: String }, // "traffic", "accident", "cheaper", etc.
        newRoute: { type: mongoose.Schema.Types.Mixed },
        suggestedAt: { type: Date, default: Date.now },
        llmRecommendation: { type: String } // Natural language suggestion
    }],
    
    status: { 
        type: String, 
        enum: ["pending", "in_progress", "completed", "cancelled"], 
        default: "pending" 
    }
}, { timestamps: true });

export default mongoose.model("Transportation", TransportationSchema);
