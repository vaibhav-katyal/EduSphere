// run `node index.js` in the terminal

// MongoDB Connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://adityasharma08093:Lakshya9780@groupstudy.yl0qi.mongodb.net/?retryWrites=true&w=majority&appName=groupstudy";

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB Connected Successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Connection Error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB Disconnected');
});

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err);
        // Retry connection
        setTimeout(connectDB, 5000);
    }
};

connectDB();

console.log(`Hello Node.js v${process.versions.node}!`);