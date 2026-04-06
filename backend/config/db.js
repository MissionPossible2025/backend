import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Trying to connect to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log("DB:", conn.connection.name);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Stop the server if connection fails
  }
};

export default connectDB;
