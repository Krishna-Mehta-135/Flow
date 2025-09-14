import mongoose from "mongoose";

const PoolSchema = new mongoose.Schema(
    {
        members: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],

        rideRequests: [{type: mongoose.Schema.Types.ObjectId, ref: "RideRequest"}],

        pickupZone: {
            lat: Number,
            lng: Number,
        },

        departureTime: {type: Date, required: true},

        costPerUser: {type: Number, default: 0},

        status: {
            type: String,
            enum: ["active", "completed", "cancelled"],
            default: "active",
        },
    },
    {timestamps: true}
);

export default mongoose.model("Pool", PoolSchema);
