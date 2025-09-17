import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}`)
        console.log(`Mongo Db connected successfully`);
    } catch (error) {
        console.log(`Failed to connect to mongodb:`, error);
        // For development, we'll continue without MongoDB
        console.log('Continuing without MongoDB for development...');
    }
}

export default connectDB