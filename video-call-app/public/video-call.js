// Initialize Lucide icons
lucide.createIcons();

// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navbarUl = document.querySelector('.navbar ul');

menuToggle.addEventListener('click', () => {
    navbarUl.classList.toggle('show');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) {
        navbarUl.classList.remove('show');
    }
});

const SERVER_URL = "https://edusphere-dvyv.onrender.com";
const socket = io(SERVER_URL);
const peer = new Peer();

const myVideo = document.getElementById("myVideo");
const videoContainer = document.querySelector(".video-container");
const toggleCameraBtn = document.getElementById('toggleCamera');
const toggleMicBtn = document.getElementById('toggleMic');
const shareScreenBtn = document.getElementById('shareScreen');
const peers = {};
let myStream;
let myPeerId;
let callStartTime;
let screenStream;
let isScreenSharing = false;
const activeCalls = new Set();

// Initialize call timer
function startCallTimer() {
    callStartTime = Date.now();
    setInterval(updateCallTimer, 1000);
}

function updateCallTimer() {
    const elapsed = Date.now() - callStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    document.getElementById('callTimer').textContent =
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Initialize peer connection
peer.on("open", id => {
    myPeerId = id;
    console.log(`My peer ID is: ${id}`);
});

// Get user media and set up connections
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    myStream = stream;
    myVideo.srcObject = stream;
    startCallTimer();

    // Handle incoming calls
    peer.on("call", call => {
        console.log("Receiving call from:", call.peer);
        call.answer(myStream);

        call.on("stream", userVideoStream => {
            console.log("Received stream from:", call.peer);
            addVideoStream(call.peer, userVideoStream);
        });

        peers[call.peer] = call;
        activeCalls.add(call.peer);
    });

    // Join room when creating or joining a call
    function joinRoom() {
        socket.emit("join-room", myPeerId, room => {
            console.log("Joined room, existing users:", room.users);
            room.users.forEach(userId => {
                if (userId !== myPeerId && !peers[userId]) {
                    connectToNewUser(userId, myStream);
                }
            });
        });
    }

    // Handle create call button
    document.getElementById('createCall').addEventListener('click', () => {
        const popup = document.querySelector('.popup-overlay');
        const callIdText = popup.querySelector('.call-id-text');
        callIdText.textContent = myPeerId;
        popup.style.display = 'flex';
        joinRoom();
    });

    document.querySelector('.popup-close').addEventListener('click', () => {
        document.querySelector('.popup-overlay').style.display = 'none';
    });

    document.querySelector('.copy-button').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(myPeerId);
            const copyButton = document.querySelector('.copy-button');
            const copySpan = copyButton.querySelector('span');
            copySpan.textContent = 'Copied!';
            setTimeout(() => {
                copySpan.textContent = 'Copy';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    });

    // Close popup when clicking outside
    document.querySelector('.popup-overlay').addEventListener('click', (e) => {
        if (e.target === document.querySelector('.popup-overlay')) {
            document.querySelector('.popup-overlay').style.display = 'none';
        }
    });

    // Handle join call button
    document.getElementById('joinCall').addEventListener('click', () => {
        const callId = document.getElementById('callId').value;
        if (!callId) return alert('Enter a Call ID');
        joinRoom();

        const call = peer.call(callId, myStream);
        call.on("stream", userVideoStream => {
            addVideoStream(call.peer, userVideoStream);
        });
        peers[call.peer] = call;

        const conn = peer.connect(callId);
        conn.on('open', () => {
            conn.send(peer.id);
        });
    });

    // When a new user connects
    socket.on("user-connected", userId => {
        console.log("New user connected:", userId);
        if (userId !== myPeerId && !peers[userId]) {
            connectToNewUser(userId, myStream);
        }
    });

    // When a user disconnects
    socket.on("user-disconnected", userId => {
        console.log("User disconnected:", userId);
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
            removeVideoStream(userId);
        }
    });

    socket.on("all-users", users => {
        users.forEach(userId => {
            if (userId !== myPeerId && !peers[userId]) {
                connectToNewUser(userId, myStream);
            }
        });
    });
});

function connectToNewUser(userId, stream) {
    console.log("Connecting to new user:", userId);
    const call = peer.call(userId, stream);

    call.on("stream", userVideoStream => {
        console.log("Received stream from new user:", userId);
        addVideoStream(userId, userVideoStream);
    });

    call.on("close", () => {
        removeVideoStream(userId);
    });

    peers[userId] = call;

    const conn = peer.connect(userId);
    conn.on('open', () => {
        conn.send(peer.id);
    });
}

function addVideoStream(peerId, stream) {
    const existingVideo = document.getElementById(`video-${peerId}`);
    if (existingVideo) {
        existingVideo.srcObject = stream;
        return;
    }

    const videoWrapper = document.createElement("div");
    videoWrapper.classList.add("video-wrapper");

    const videoElement = document.createElement("video");
    videoElement.id = `video-${peerId}`;
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    const participantInfo = document.createElement("div");
    participantInfo.classList.add("participant-info");
    participantInfo.innerHTML = `
<i data-lucide="user"></i>
<span>Participant</span>
`;

    videoWrapper.appendChild(videoElement);
    videoWrapper.appendChild(participantInfo);
    videoContainer.appendChild(videoWrapper);
    lucide.createIcons();
}

function removeVideoStream(peerId) {
    const videoElement = document.getElementById(`video-${peerId}`);
    if (videoElement) {
        videoElement.parentElement.remove();
    }
}

toggleCameraBtn.addEventListener('click', () => {
    const videoTrack = myStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    toggleCameraBtn.innerHTML = videoTrack.enabled ?
        '<i data-lucide="video"></i>' :
        '<i data-lucide="video-off"></i>';
    toggleCameraBtn.classList.toggle('off');
    lucide.createIcons();
});

toggleMicBtn.addEventListener('click', () => {
    const audioTrack = myStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    toggleMicBtn.innerHTML = audioTrack.enabled ?
        '<i data-lucide="mic"></i>' :
        '<i data-lucide="mic-off"></i>';
    toggleMicBtn.classList.toggle('off');
    lucide.createIcons();
});

shareScreenBtn.addEventListener('click', async () => {
    if (isScreenSharing) {
        stopScreenSharing();
        return;
    }

    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = stopScreenSharing;

        for (let peerId of activeCalls) {
            const sender = peers[peerId].peerConnection.getSenders().find(s => s.track.kind === 'video');
            sender.replaceTrack(screenTrack);

            // Share audio track if available
            const audioSender = peers[peerId].peerConnection.getSenders().find(s => s.track.kind === 'audio');
            if (audioSender) {
                const audioTrack = screenStream.getAudioTracks()[0];
                if (audioTrack) {
                    audioSender.replaceTrack(audioTrack);
                }
            }
        }

        myVideo.srcObject = screenStream;
        isScreenSharing = true;
        shareScreenBtn.innerHTML = '<i data-lucide="monitor-off"></i>';
        shareScreenBtn.classList.add('off');
        lucide.createIcons();
    } catch (err) {
        console.error("Error sharing screen:", err);
    }
});

function stopScreenSharing() {
    screenStream.getTracks().forEach(track => track.stop());
    isScreenSharing = false;
    shareScreenBtn.innerHTML = '<i data-lucide="monitor"></i>';
    lucide.createIcons();
    myVideo.srcObject = myStream;

    for (let peerId of activeCalls) {
        const sender = peers[peerId].peerConnection.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(myStream.getVideoTracks()[0]);
    }
}

document.getElementById('endCall').addEventListener('click', () => {
    socket.emit('leave-room', myPeerId);
    myStream.getTracks().forEach(track => track.stop());
    Object.values(peers).forEach(call => call.close());
    videoContainer.innerHTML = `
<div class="video-wrapper">
    <video id="myVideo" autoplay muted></video>
    <div class="time-indicator">
        <i data-lucide="clock"></i>
        <span id="callTimer">00:00:00</span>
    </div>
    <div class="participant-info">
        <i data-lucide="user"></i>
        <span>You</span>
    </div>
</div>
`;
    lucide.createIcons();
});