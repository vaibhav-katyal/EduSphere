const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

app.use(cors());
app.use(express.json());
let users = [];

io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("join-room", (userId, callback) => {
        if (!users.includes(userId)) {
            users.push(userId);

            // Send the current users list back to the joining user
            callback({ users });

            // Notify all other users about the new user
            socket.broadcast.emit("user-connected", userId);
        }

        socket.on("disconnect", () => {
            users = users.filter(id => id !== userId);
            io.emit("user-disconnected", userId);
            console.log("user disconnected:", userId);
        });
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/video-call.html');
});

app.post("/join-room", (req, res) => {
    const { peerId } = req.body;
    if (!users.includes(peerId)) {
        users.push(peerId);
        io.emit("user-joined", peerId);
    }
    res.json({ success: true });
});

app.get("/get-users", (req, res) => {
    res.json(users);
});

app.post("/leave-room", (req, res) => {
    const { peerId } = req.body;
    users = users.filter(user => user !== peerId);
    io.emit("user-left", peerId);
    res.json({ success: true });
});

io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("join-room", (userId) => {
        users.push(userId);
        socket.join(userId);
        socket.emit("all-users", users);
        socket.to(userId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            users = users.filter(user => user !== userId);
            socket.to(userId).emit("user-disconnected", userId);
        });
    });

    socket.on("leave-room", (userId) => {
        users = users.filter(user => user !== userId);
        socket.broadcast.emit("user-disconnected", userId);
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));