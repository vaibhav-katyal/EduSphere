import mongoose from 'mongoose';

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Error:", err);
        process.exit(1);
    }
};

export default connectMongo;