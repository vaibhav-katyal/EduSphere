const socket = io();

// Get media devices
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        document.getElementById('localVideo').srcObject = stream;
        localStream = stream;
    })
    .catch(error => console.error('Error accessing media devices.', error));

let localStream;
let remoteStream;
let peerConnection;
const roomId = 'example-room'; // Change as needed
const userId = Math.floor(Math.random() * 10000); // Generate a random user ID

// Join a room
socket.emit('join-room', roomId, userId);

socket.on('room-users', usersInRoom => {
    console.log('Users in room:', usersInRoom);
    if (usersInRoom.length > 1) {
        createOffer();
    }
});

socket.on('user-connected', userId => {
    console.log('User connected:', userId);
});

socket.on('user-disconnected', userId => {
    console.log('User disconnected:', userId);
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
    }
});

socket.on('offer', (offer, fromUserId, toUserId) => {
    if (toUserId === userId) {
        createAnswer(offer);
    }
});

socket.on('answer', (answer, fromUserId, toUserId) => {
    if (toUserId === userId) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
});

socket.on('ice-candidate', (candidate, fromUserId, toUserId) => {
    if (toUserId === userId) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

function createPeerConnection() {
    peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('ice-candidate', event.candidate, roomId, userId);
        }
    };

    peerConnection.ontrack = event => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
            document.getElementById('remoteVideo').srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
}

function createOffer() {
    createPeerConnection();
    peerConnection.createOffer()
        .then(offer => {
            peerConnection.setLocalDescription(offer);
            socket.emit('offer', offer, roomId, userId);
        })
        .catch(error => console.error('Error creating offer:', error));
}

function createAnswer(offer) {
    createPeerConnection();
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => peerConnection.createAnswer())
        .then(answer => {
            peerConnection.setLocalDescription(answer);
            socket.emit('answer', answer, roomId, userId);
        })
        .catch(error => console.error('Error creating answer:', error));
}