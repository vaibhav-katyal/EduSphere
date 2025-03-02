const socket = io("https://edusphere-chat.onrender.com");
let room = "";
let username = "";

// Initialize Lucide icons
lucide.createIcons();

function createRoom() {
    username = document.getElementById('nickname').value.trim();
    if (!username) {
        alert('Please enter a nickname');
        return;
    }
    room = Math.random().toString(36).substring(2, 8).toUpperCase();
    joinChatRoom();
}

function joinRoom() {
    username = document.getElementById('nickname').value.trim();
    room = document.getElementById('room-id').value.trim();
    if (!username || !room) {
        alert('Please enter both nickname and room ID');
        return;
    }
    joinChatRoom();
}

function joinChatRoom() {
    document.getElementById('room-display').innerText = room;
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'flex';
    socket.emit('joinRoom', { room, username });
    
    // Add system message for joining
    addSystemMessage(`${username} joined the room`);
}

function copyRoomId() {
    navigator.clipboard.writeText(room);
    const btn = document.querySelector('.chat-header .icon-btn');
    btn.innerHTML = '<i data-lucide="check"></i>';
    lucide.createIcons();
    setTimeout(() => {
        btn.innerHTML = '<i data-lucide="copy"></i>';
        lucide.createIcons();
    }, 2000);
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const messageInput = document.getElementById('message');
    const message = messageInput.value.trim();
    if (message !== "") {
        socket.emit('chatMessage', { room, username, message });
        messageInput.value = '';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.includes('pdf')) return 'file-text';
    if (fileType.includes('document') || fileType.includes('doc')) return 'file-text';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'presentation';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'table';
    return 'file';
}

// Handle file sending
document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('File size should be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = {
                room,
                username,
                file: e.target.result,
                fileType: file.type,
                fileName: file.name,
                fileSize: file.size
            };
            socket.emit('sendMedia', fileData);
        };
        reader.readAsDataURL(file);
    }
});

function addSystemMessage(text) {
    const chatBox = document.getElementById('chat-box');
    const msgElement = document.createElement('div');
    msgElement.className = 'message system-message';
    msgElement.style.alignSelf = 'center';
    msgElement.textContent = text;
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function createMessageElement(data, isMedia = false) {
    const msgElement = document.createElement('div');
    msgElement.className = `message ${data.username === username ? 'own-message' : 'other-message'}`;
    
    const usernameElement = document.createElement('div');
    usernameElement.className = 'username';
    usernameElement.textContent = data.username;
    msgElement.appendChild(usernameElement);

    if (!isMedia) {
        msgElement.appendChild(document.createTextNode(data.message));
    }

    return msgElement;
}

function createDocumentPreview(data) {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'document-preview';
    
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', getFileIcon(data.fileType));
    previewDiv.appendChild(icon);
    
    const docInfo = document.createElement('div');
    docInfo.className = 'doc-info';
    
    const docName = document.createElement('div');
    docName.className = 'doc-name';
    docName.textContent = data.fileName;
    
    const docSize = document.createElement('div');
    docSize.className = 'doc-size';
    docSize.textContent = formatFileSize(data.fileSize);
    
    docInfo.appendChild(docName);
    docInfo.appendChild(docSize);
    previewDiv.appendChild(docInfo);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = data.file;
    downloadLink.download = data.fileName;
    downloadLink.className = 'icon-btn';
    
    const downloadIcon = document.createElement('i');
    downloadIcon.setAttribute('data-lucide', 'download');
    downloadLink.appendChild(downloadIcon);
    
    previewDiv.appendChild(downloadLink);
    
    // Initialize the new Lucide icons
    lucide.createIcons();
    
    return previewDiv;
}

socket.on('message', (data) => {
    const chatBox = document.getElementById('chat-box');
    const msgElement = createMessageElement(data);
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('media', (data) => {
    const chatBox = document.getElementById('chat-box');
    const msgElement = createMessageElement(data, true);
    
    if (data.fileType.startsWith("image/")) {
        const mediaElement = document.createElement('img');
        mediaElement.src = data.file;
        mediaElement.alt = "Shared image";
        mediaElement.loading = "lazy";
        msgElement.appendChild(mediaElement);
    } else if (data.fileType.startsWith("video/")) {
        const mediaElement = document.createElement('video');
        mediaElement.src = data.file;
        mediaElement.controls = true;
        msgElement.appendChild(mediaElement);
    } else {
        // Handle documents
        const docPreview = createDocumentPreview(data);
        msgElement.appendChild(docPreview);
    }

    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Handle user disconnection
socket.on('userLeft', (username) => {
    addSystemMessage(`${username} left the room`);
});