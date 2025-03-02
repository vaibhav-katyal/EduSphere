const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 5e6 // 5MB max file size
});

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("joinRoom", ({ room, username }) => {
        socket.join(room);
        socket.username = username;
        socket.currentRoom = room;
        console.log(`${username} joined room: ${room}`);
        
        // Notify others in the room
        socket.to(room).emit("message", {
            username: "System",
            message: `${username} has joined the chat`
        });
    });

    socket.on("chatMessage", ({ room, username, message }) => {
        io.to(room).emit("message", { username, message });
    });

    socket.on("sendMedia", (data) => {
        io.to(data.room).emit("media", {
            username: data.username,
            file: data.file,
            fileType: data.fileType,
            fileName: data.fileName
        });
    });

    socket.on("disconnect", () => {
        if (socket.username && socket.currentRoom) {
            io.to(socket.currentRoom).emit("userLeft", socket.username);
            console.log(`${socket.username} disconnected from room ${socket.currentRoom}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});