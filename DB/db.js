import mongoose from "mongoose";
import dotenv from "dotenv";

// Load env variables
dotenv.config();
let mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoURI, { dbName: "ecommerce" });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log("Error in connecting to MongoDB",error);
    }
}

export default connectToMongo;