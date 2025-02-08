const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the public folder
app.use(express.static('public'));

// Serve video-call.html when visiting the home page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/video-call.html');
});

// Start PeerJS server
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});
app.use('/peerjs', peerServer); // Attach PeerJS to the main server

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join-call', (callId, userId) => {
        socket.join(callId);
        socket.to(callId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            socket.to(callId).emit('user-disconnected', userId);
        });
    });
});

// Start server on port 3000
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
