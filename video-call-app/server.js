const express = require('express');
const { ExpressPeerServer } = require('peer');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());

const peerServer = ExpressPeerServer(server, {
    debug: true
});

app.use('/peerjs', peerServer);

const users = {};  // Stores connected users

const io = require("socket.io")(server, {
    cors: {
        origin: "*",
    }
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        if (!users[roomId]) {
            users[roomId] = [];
        }
        users[roomId].push(userId);

        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            users[roomId] = users[roomId].filter(id => id !== userId);
            socket.broadcast.to(roomId).emit("user-disconnected", userId);
        });
    });
});

server.listen(5000, () => {
    console.log("Server is running on port 5000");
});
