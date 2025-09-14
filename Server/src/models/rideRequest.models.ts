import mongoose from "mongoose";

const RideRequestSchema = new mongoose.Schema(
    {
        userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},

        source: {
            lat: {type: Number, required: true},
            lng: {type: Number, required: true},
            address: {type: String},
        },

        destination: {
            lat: {type: Number, required: true},
            lng: {type: Number, required: true},
            address: {type: String},
        },

        time: {type: Date, required: true}, // requested departure time
        poolId: {type: mongoose.Schema.Types.ObjectId, ref: "Pool"},

        status: {
            type: String,
            enum: ["waiting", "matched", "completed", "cancelled"],
            default: "waiting",
        },
    },
    {timestamps: true}
);

export default mongoose.model("RideRequest", RideRequestSchema);
