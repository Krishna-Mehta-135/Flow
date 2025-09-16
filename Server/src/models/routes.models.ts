import mongoose from "mongoose";

// Route analytics model for tracking popular routes
const RouteAnalyticsSchema = new mongoose.Schema(
    {
        source: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
            address: { type: String }
        },
        destination: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
            address: { type: String }
        },
        requestCount: { type: Number, default: 1 },
        lastRequested: { type: Date, default: Date.now },
        averageCost: { type: Number, default: 0 },
        averageDistance: { type: Number, default: 0 }, // in kilometers
        popularTimes: [{
            hour: { type: Number, min: 0, max: 23 },
            count: { type: Number, default: 0 }
        }]
    },
    { timestamps: true }
);

// Index for geospatial queries
RouteAnalyticsSchema.index({ 
    "source.lat": 1, 
    "source.lng": 1,
    "destination.lat": 1,
    "destination.lng": 1 
});

export default mongoose.model("RouteAnalytics", RouteAnalyticsSchema);