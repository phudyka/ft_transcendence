import { navigateTo } from '../app.js';
import { logout, setGlobalSocket } from '../utils/token.js';
import { getSocket, initializeSocket } from '../utils/socketManager.js';
import { fetchFriendList, sendFriendRequest, fetchFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../utils/friendManager.js';
import { getCookie } from './settingsv.js';
import { removeLoginEventListeners } from './login.js';
import { checkAuthentication } from '../utils/auth.js';
import { showToast } from '../utils/unmask.js';
import { checkFriendshipStatus } from './profile.js';
import { updateOnlineStatus, sendFriendRequestSocket, sendFriendRequestResponse } from '../utils/socketManager.js';

let socket;
const privateChatLogs = new Map();
const privateMessages = new Map(); // Nouvelle Map pour stocker les messages
const username = sessionStorage.getItem('username');
let blockedUsers = new Set();

export async function dashboard(player_name) {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
        navigateTo('/login');
        return;
    }

    removeLoginEventListeners();

    const username = sessionStorage.getItem('username');
    const displayName = sessionStorage.getItem('display_name');
    let avatarUrl = sessionStorage.getItem('avatar_url');
    socket = initializeSocket(displayName);
    setupChatListeners(socket);

    if (!displayName) {
        navigateTo('/login');
        return;
    }

    if (avatarUrl) {
        avatarUrl = avatarUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    }

    document.getElementById('ft_transcendence').innerHTML = `
    <div class="dashboard-container">
        <div class="header">
            <a class="navbar-brand" href="#">
                <img src="${staticUrl}content/logo2.png" id="pongonlineLink" alt="Logo" class="logo">
            </a>
            <span class="nav-item" style="font-size: 2.5em; font-weight: bold; color: #ff7043;">${displayName}</span>
            <div class="profile-container">
                <img src="${avatarUrl}" class="profile-icon" alt="Profile Picture" id="img_profile_pic" style="
    cursor: pointer;
">
            </div>
        </div>

        <div class="content">
            <div class="sidebar">
                <h2 class="title-friends">Friends</h2>
                <div class="friends-tabs">
                    <button class="tab-button active" data-tab="online">Online Friends</button>
                    <button class="tab-button" data-tab="pending">Pending Requests</button>
                    <button class="tab-button" data-tab="blocked">Blocked Users</button>
                </div>
                <div class="friends-content">
                    <div id="online" class="tab-content active">
                        <ul id="online-friends" class="list-group">
                        </ul>
                    </div>
                    <div id="pending" class="tab-content">
                        <ul id="pending-friends" class="list-group">
                        </ul>
                    </div>
                    <div id="blocked" class="tab-content">
                        <ul id="blocked-friends" class="list-group">
                        </ul>
                    </div>
                </div>
                <div id="friendDropdown" class="dropdown-menu" style="display: none;">
                    <a class="dropdown-item" href="#" id="sendMessagePrivate">Send Private Message</a>
                    <a class="dropdown-item" href="#" id="startGame">Start a Game</a>
                    <a class="dropdown-item" href="#" id="viewProfile">View Profile</a>
                </div>
                <div id="friendDropdown_chat" class="dropdown-menu_chat" style="display: none;">
                    <a class="dropdown-item" href="#" id="addToFriend">Add To Friend</a>
                    <a class="dropdown-item" href="#" id="blockUser">Block User</a>
                    <a class="dropdown-item" href="#" id="viewProfile">View Profile</a>
                </div>
            </div>

                <div class="game-container">
                    <iframe id="pong" title="Pong" src="http://localhost:4000"></iframe>
                </div>

            <div class="chat-container">
                <h2 class="title-chat">Chat</h2>
                <div class="chat-log" id="chat-log"></div>
                <div class="input-container">
                    <input id="message-input" placeholder="Type your message..." rows="1"></input>
                    <button id="send-button">►</button>
                </div>
            </div>
        </div>
        <div id="profileDropdown" class="dropdown-menu" style="display: none;">
            <a class="dropdown-item" href="#" id="viewmyProfile">My Profile</a>
            <a class="dropdown-item" href="#" id="settings">Settings</a>
            <a class="dropdown-item" href="#" id="logoutLink">Logout</a>
        </div>
        <div class="offcanvas offcanvas-end" data-bs-scroll="true" tabindex="-1" id="chatbox" aria-labelledby="chatboxLabel">
            <div class="offcanvas-header">
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
                <div id="private-chats-container"></div>
            </div>
        </div>

        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="blockUserToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">Block User</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    User blocked successfully!
                </div>
            </div>
        </div>

        <footer id="footer-dashboard">© 2024 42Company, Inc</footer>
    </div>`;
    const iframe = document.getElementById('pong');
    iframe.onload = function () {
        const displayName = sessionStorage.getItem('display_name');
        const token = sessionStorage.getItem('accessToken');
        const csrfToken = getCookie('csrftoken');
        console.log(sessionStorage);
        const avatar = sessionStorage.getItem('avatar_url');
        iframe.contentWindow.postMessage({ username: displayName, token: token, csrfToken: csrfToken, avatar: avatar }, 'http://localhost:4000');
    };

	setupDashboardEvents(navigateTo, displayName);
	setupTabSystem();
	checkForFriendRequests();
    fetchAndDisplayFriends();
    loadGeneralChatMessages();
}

function setupChatListeners(socket) {
    if (socket) {
        const displayName = sessionStorage.getItem('display_name');
        updateOnlineStatus(displayName, true);
        console.log('=== Setting up chat listeners ===');
        console.log('Socket state:', {
            id: socket.id,
            connected: socket.connected,
            displayName: socket.displayName
        });

        socket.off('private message');

        socket.on('chat message', (msg) => {
            if (msg.name === socket.displayName) {
                console.log('Message duplicate');
                return;
            }
            console.log('Message reçu du serveur:', msg);
            receiveMessage(msg);
        });

        socket.on('private message', (msg) => {
            console.log('=== Private message received ===');
            console.log('Message data:', msg);
            
            const currentUser = sessionStorage.getItem('display_name');
            console.log('Current user:', currentUser);

            console.log('Message validation:', {
                isForCurrentUser: msg.to === currentUser,
                isFromCurrentUser: msg.from === currentUser,
                from: msg.from,
                to: msg.to
            });

            // Si le message est pour l'utilisateur courant ou de l'utilisateur courant
            if (msg.to === currentUser || msg.from === currentUser) {
                console.log('Processing message for:', currentUser);
                receivePrivateMessage(msg);
            } else {
                console.log('Message ignored - not relevant for current user');
            }
        });

        socket.on('friend_request_received', (data) => {
            console.log('Friend request received:', data);
            showFriendRequestToast(data.from, data.requestId);
        });

        socket.on('friend_request_updated', (data) => {
            console.log('Friend request updated:', data);
            const message = data.response === 'accepted' 
                ? `${data.from} a accepté votre demande d'ami!` 
                : `${data.from} a refusé votre demande d'ami.`;
            showToast(message, data.response === 'accepted' ? 'success' : 'info');
            fetchAndDisplayFriends();
        });

    }
}

function receivePrivateMessage(msg) {
    console.log('=== Processing received private message ===');
    console.log('Message details:', msg);
    
    const currentUser = sessionStorage.getItem('display_name');
    
    if (!msg.from) {
        console.error('Message reçu sans expéditeur (from)');
        return;
    }

    let chatPartner;
    if (!msg.to) {
        console.log('Message reçu sans destinataire (to), utilisation de l\'expéditeur comme partenaire');
        chatPartner = msg.from === currentUser ? undefined : msg.from;
    } else {
        chatPartner = msg.from === currentUser ? msg.to : msg.from;
    }

    console.log('Chat partner identification:', {
        currentUser,
        messageFrom: msg.from,
        messageTo: msg.to,
        identifiedPartner: chatPartner
    });

    if (!chatPartner) {
        console.error('Impossible d\'identifier le partenaire de chat');
        return;
    }

    if (!privateChatLogs.has(chatPartner)) {
        console.log('Setting up new chat for:', chatPartner);
        setupPrivateChat(chatPartner);
    }

    if (!privateMessages.has(chatPartner)) {
        console.log('Initializing message array for:', chatPartner);
        privateMessages.set(chatPartner, []);
    }

    privateMessages.get(chatPartner).push({
        sender: msg.from,
        content: msg.message
    });

    const senderDisplay = msg.from === currentUser ? 'Vous' : msg.from;
    console.log('Displaying message from:', senderDisplay);
    
    displayPrivateMessage(chatPartner, senderDisplay, msg.message);
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function openPrivateChat(friendName) {
	let chatLog = privateChatLogs.get(friendName);
	if (!chatLog) {
		chatLog = document.createElement('div');
		chatLog.id = `chat-log-${friendName}`;
		chatLog.className = 'chat-log';
		privateChatLogs.set(friendName, chatLog);
	}

	const chatContainer = document.getElementById('private-chats-container');
	chatContainer.innerHTML = '';
	chatContainer.appendChild(chatLog);

	const inputContainer = document.createElement('div');
	inputContainer.className = 'input-container';
	inputContainer.innerHTML = `
		<input type="text" id="message-input-${friendName}" placeholder="Type your message...">
		<button id="send-button-${friendName}">Send</button>
	`;
	chatContainer.appendChild(inputContainer);

	document.getElementById(`send-button-${friendName}`).addEventListener('click', () => sendPrivateMessage(friendName));
}

function setupDashboardEvents(navigateTo, username) {
	//Logout
	document.getElementById('logoutLink').addEventListener('click', handleLogout);

	// Friend menu
	document.querySelectorAll('#friends .list-group-item').forEach(item => {
		item.addEventListener('click', handleFriendClick);
	});

	// Profile picture dropdown
	document.getElementById('img_profile_pic').addEventListener('click', handleProfilePictureClick);

	// Hide the dropdown menu when clicking outside of it
	document.addEventListener('click', hideDropdowns);

	// Prevent the dropdown menu from closing when clicking inside it
	document.getElementById('friendDropdown').addEventListener('click', (event) => event.stopPropagation());
	document.getElementById('friendDropdown_chat').addEventListener('click', (event) => event.stopPropagation());
	document.getElementById('profileDropdown').addEventListener('click', (event) => event.stopPropagation());
    const displayName = sessionStorage.getItem('display_name');
    document.getElementById('viewmyProfile').addEventListener('click', (event) => { event.preventDefault(); navigateTo(`/profile/${displayName}`); });

	// Dropdown actions
	document.getElementById('sendMessagePrivate').addEventListener('click', showChatbox);
	document.getElementById('startGame').addEventListener('click', startGame);
	document.getElementById('settings').addEventListener('click', goTosettings);

	// Chat functionnalitis
	document.getElementById('send-button').addEventListener('click', sendMessage);

	// Send message when pressing Enter key
	document.addEventListener("keydown", handleEnterKey);

	//View profile
	document.getElementById('friendDropdown').querySelector('#viewProfile').addEventListener('click', viewProfile);
	document.getElementById('friendDropdown_chat').querySelector('#viewProfile').addEventListener('click', viewProfile);

	// Friend actions
	document.getElementById('friendDropdown_chat').querySelector('#addToFriend').addEventListener('click', addFriend);
	document.getElementById('friendDropdown_chat').querySelector('#blockUser').addEventListener('click', blockUser);

    setInterval(checkForFriendRequests, 60000);
}

function scrollToBottom2(friendName) {
	const chatLog2 = document.getElementById(`chat-log-${friendName}`);
	chatLog2.scrollTop = chatLog2.scrollHeight;
}

function formatMessage(message) {
	/* for no html injection */
	if (message.startsWith("```")) {
		return `<pre>${message}</pre>`;
	}

	/* syntax : [player_name] : message */
	message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	message = message.replace(/(```[\s\S]*?```)/g, '<pre>$1</pre>');

	return `${message}`;
  }

function handleProfilePictureClick(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');

    // Masquer tous les dropdowns visibles
    const visibleDropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
    visibleDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });

    // Afficher le dropdown pour le calculer ses dimensions
    dropdown.style.display = 'block';

    // Obtenir les dimensions de la fenêtre et du dropdown
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const dropdownRect = dropdown.getBoundingClientRect();

    // Calculer la position optimale
    let top = event.clientY;
    let left = event.clientX;

    // Ajuster la position verticale si nécessaire
    if (top + dropdownRect.height > windowHeight) {
        top = windowHeight - dropdownRect.height;
    }

    // Ajuster la position horizontale si nécessaire
    if (left + dropdownRect.width > windowWidth) {
        left = windowWidth - dropdownRect.width;
    }

    // Appliquer la nouvelle position
    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
}

function handleFriendClick(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('friendDropdown');
    const friendName = this.getAttribute('data-friend');

    // Hide all visible dropdowns
    const visibleDropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
    visibleDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });

    // Position the dropdown near the clicked friend item
    dropdown.style.top = `${event.clientY}px`;
    dropdown.style.left = `${event.clientX}px`;
    dropdown.style.display = 'block';

    // Store the clicked friend's name
    dropdown.setAttribute('data-friend', friendName);
}

function hideDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
    dropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

function showChatbox(event) {
    event.preventDefault();
    const dropdown = event.target.closest('.dropdown-menu, .dropdown-menu_chat');
    if (dropdown) {
        const friendName = dropdown.getAttribute('data-friend');
        if (friendName) {
            var chatbox = new bootstrap.Offcanvas(document.getElementById('chatbox'));
            chatbox.show();
        } else {
            console.error('Friend name not found');
        }
    } else {
        console.error('Dropdown not found');
    }
}

function setupPrivateChat(friendName) {
    if (privateChatLogs.has(friendName)) {
        console.log(`Chat privé déjà configuré pour ${friendName}`);
        return;
    }
    
    const privateChatContainer = document.getElementById('private-chats-container');
    privateChatContainer.innerHTML = `
        <h5 class="offcanvas-title" id="chatboxLabel">Message privé : ${friendName}</h5>
        <div class="chat-container2">
            <div class="chat-log2" id="chat-log-${friendName}"></div>
        </div>
        <div class="input-container2">
            <input type="text" id="message-input-${friendName}" placeholder="Tapez votre message...">
            <button id="send-button-${friendName}">►</button>
        </div>
    `;

    // Restaurer les messages précédents
    if (privateMessages.has(friendName)) {
        const messages = privateMessages.get(friendName);
        messages.forEach(msg => {
            displayPrivateMessage(friendName, msg.sender, msg.content);
        });
    }

    const sendButton = document.getElementById(`send-button-${friendName}`);
    sendButton.addEventListener('click', () => {
        sendPrivateMessage(friendName);
        document.getElementById(`message-input-${friendName}`).value = '';
    });

    // Créer une connexion privée pour ce chat
    // createPrivateConnection(friendName);
    console.log(`Connexion privée créée entre ${friendName} et ${sessionStorage.getItem('display_name')}`);    
}

function createPrivateConnection(friendName) {
    const displayName = sessionStorage.getItem('display_name');
    const socket = getSocket(displayName);
    if (socket) {
        socket.emit('create private room', { friend: friendName });
    }
}

function sendPrivateMessage(friendName) {
    console.log('=== Starting sendPrivateMessage ===');
    console.log(`Attempting to send message to: ${friendName}`);
    
    const input = document.getElementById(`message-input-${friendName}`);
    if (!input) {
        console.error(`Input element not found for friend: ${friendName}`);
        return;
    }

    const message = input.value.trim();
    const currentUser = sessionStorage.getItem('display_name');
    const socket = getSocket(currentUser);

    if (message && socket && socket.connected) {
        const sanitizedMessage = sanitizeHTML(message);
        const messageData = {
            to: friendName,      // Destinataire explicite
            from: currentUser,   // Expéditeur explicite
            message: sanitizedMessage,
            time: Date.now()
        };
        
        console.log('Emitting socket message with data:', messageData);
        socket.emit('private message', messageData);
        
        // Stocker le message localement aussi
        if (!privateMessages.has(friendName)) {
            privateMessages.set(friendName, []);
        }
        privateMessages.get(friendName).push({
            sender: currentUser,
            content: sanitizedMessage
        });
        
        displayPrivateMessage(friendName, 'Vous', sanitizedMessage);
        input.value = '';
    }
}

// Fonction de sanitization
function sanitizeHTML(str) {
    var temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function displayPrivateMessage(friendName, sender, message) {
    const chatLog = document.getElementById(`chat-log-${friendName}`);
    if (chatLog) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message-container');

        const usernameElement = document.createElement('span');
        usernameElement.classList.add('username-link');
        usernameElement.textContent = sender === 'Vous' ? `[Me] ` : `[${sanitizeHTML(friendName)}]`;

        const messageTextElement = document.createElement('span');
        messageTextElement.classList.add('message-text');
        messageTextElement.textContent = sanitizeHTML(message);

        messageElement.appendChild(usernameElement);
        messageElement.appendChild(document.createTextNode(': '));
        messageElement.appendChild(messageTextElement);

        chatLog.appendChild(messageElement);
        chatLog.scrollTop = chatLog.scrollHeight;
    }
}

function startGame(event) {
	event.preventDefault();
    // need api for check if friend is already in game or in tournament or in queue
    // create a toast to display the error if friend is already in game or in tournament or in queue with showToast function
    const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
    showToast(`${friendName} is already in game or in tournament or in queue`, 'Impossible to start a game with this user');
}

function goTosettings(event) {
	event.preventDefault();
	console.log('Go to settings');
	navigateTo('/settings');
}

function sendMessage(event) {
    event.preventDefault();
    const displayName = sessionStorage.getItem('display_name');
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    const socket = getSocket(displayName);
    console.log(`sendMessage function called`);
    console.log(`Socket connected: ${socket.connected}`);
    console.log(`Socket id: ${socket.id}`);
    console.log(`End of sendMessage function`);
    updateOnlineStatus(displayName);

    if (message !== '' && socket && socket.connected) {
        socket.emit('chat message', { name: displayName, message: message });
        messageInput.value = '';
        getSocket(displayName);
    }
}

function receiveMessage(msg) {
    console.log('Fonction receive Message appelée avec:', msg);
    
    // Vérifier si l'expéditeur est bloqué
    if (blockedUsers.has(msg.name)) {
        console.log(`Message ignoré de ${msg.name} car il est bloqué.`);
        return;
    }

    const chatLog = document.getElementById('chat-log');
    if (!chatLog) {
        console.error("L'élément chat-log n'existe pas dans le DOM");
        return;
    }
    const messageElement = document.createElement('div');

    const usernameElement = document.createElement('span');
    usernameElement.classList.add('username-link');
    usernameElement.dataset.friend = msg.name;
    usernameElement.innerText = `[${msg.name}]`;
    usernameElement.style = "cursor: pointer;";

    updateOnlineStatus(msg.name);

    saveMessage(msg.name, msg.message);

    usernameElement.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const currentUsername = sessionStorage.getItem('display_name');
        const isOwnUsername = msg.name === currentUsername;
        const dropdown = isOwnUsername ? document.getElementById('profileDropdown') : document.getElementById('friendDropdown_chat');
        const friendName = this.dataset.friend;
        usernameElement.classList.add('username-link', 'bold-username');

        // Masquer tous les menus déroulants visibles
        const visibleDropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
        visibleDropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });

        if (dropdown) {
            dropdown.style.position = 'fixed';
            dropdown.style.display = 'block';

            // Vérifier si le dropdown dépasse la fenêtre
            const rect = dropdown.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            if (event.clientY + rect.height > windowHeight) {
                dropdown.style.top = `${event.clientY - rect.height}px`;
            } else {
                dropdown.style.top = `${event.clientY}px`;
            }

            if (event.clientX + rect.width > windowWidth) {
                dropdown.style.left = `${event.clientX - rect.width}px`;
            } else {
                dropdown.style.left = `${event.clientX}px`;
            }

            dropdown.dataset.friend = friendName;
        }
        console.log('Message reçu:', msg);
    });

    const messageTextElement = document.createElement('span');
    messageTextElement.innerText = ` : ${msg.message}`;

    messageElement.appendChild(usernameElement);
    messageElement.appendChild(messageTextElement);

    chatLog.appendChild(messageElement);

    chatLog.scrollTop = chatLog.scrollHeight;
}

function handleEnterKey(event) {
    if (event.key === "Enter") {
        const offcanvas = document.querySelector('.offcanvas.offcanvas-end.show');
        if (offcanvas) {
            const friendName = offcanvas.querySelector('.offcanvas-title').textContent.split(': ')[1];
            const messageInput = document.getElementById(`message-input-${friendName}`);
            if (messageInput && document.activeElement === messageInput) {
                const sendButton = document.getElementById(`send-button-${friendName}`);
                if (sendButton) {
                    sendButton.click();
                } else {
                    sendPrivateMessage(friendName);
                }
                messageInput.value = '';
            }
        } else {
            const messageInput = document.getElementById('message-input');
            if (messageInput && document.activeElement === messageInput) {
                sendMessage(event);
            }
        }
    }
}

function addFriend(event) {
    event.preventDefault();
    const dropdown = event.target.closest('.dropdown-menu, .dropdown-menu_chat');
    const friendName = dropdown ? dropdown.getAttribute('data-friend') : null;
    if (!friendName) {
        console.error("Unable to determine friend's name");
        return;
    }

    checkFriendshipStatus(friendName)
        .then(({ isFriend, requestSent }) => {
            if (isFriend) {
                showToast('Already friends', 'info');
                return;
            }
            if (requestSent) {
                showToast('Friend request already sent', 'info');
                return;
            }

            sendFriendRequest(friendName)
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.message || `Erreur HTTP: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Friend request sent successfully', data);
                    showToast('Friend request sent successfully', 'success');
                    sendFriendRequestSocket(friendName, data.request_id);
                })
                .catch(error => {
                    console.error('Error sending friend request:', error);
                    showToast(error.message, 'error');
                });
        })
        .catch(error => {
            console.error('Error checking friendship status:', error);
            showToast('Error checking friendship status', 'error');
        });
}

function showFriendRequestSentToast(friendName) {
    const toastHtml = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">Friend Request Sent</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                Friend request sent to ${friendName} successfully!
            </div>
        </div>
    `;

    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
    toastContainer.innerHTML = toastHtml;
    document.body.appendChild(toastContainer);

    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

function blockUser(event) {
    event.preventDefault();
    const dropdown = event.target.closest('.dropdown-menu_chat');
    const username = dropdown.getAttribute('data-friend');
    
    if (!username) {
        console.error("Username not found");
        return;
    }

    fetch('/api/block-user/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ display_name: username })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('User blocked successfully', 'success');

            if (privateChatLogs.has(username)) {
                privateChatLogs.delete(username);
                const chatbox = document.getElementById('chatbox');
                if (chatbox) {
                    const bsOffcanvas = bootstrap.Offcanvas.getInstance(chatbox);
                    if (bsOffcanvas) {
                        bsOffcanvas.hide();
                    }
                }
            }
        } else {
            showToast(data.message || 'Failed to block user', 'error');
        }
    })
    .catch(error => {
        console.error('Error blocking user:', error);
        showToast('An error occurred while blocking the user', 'error');
    });
}

function viewProfile(event) {
    event.preventDefault();
    const dropdown = event.target.closest('.dropdown-menu, .dropdown-menu_chat');
    const friendName = dropdown ? dropdown.getAttribute('data-friend') : null;
    if (friendName) {
        console.log(`View profile of ${friendName}`);
        navigateTo(`/profile/${encodeURIComponent(friendName)}`);
    } else {
        console.error("Unable to determine friend's name");
    }
}

function saveMessage(friendName, message) {
    let messages = JSON.parse(sessionStorage.getItem('general_chat_messages')) || [];

    messages.push({ friendName, message, timestamp: new Date().toISOString() });
    console.log('Message saved:', messages);
    console.log('From:', friendName);

    if (messages.length > 15) {
        messages = messages.slice(-15);
    }

    sessionStorage.setItem('general_chat_messages', JSON.stringify(messages));
}

function loadGeneralChatMessages() {
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) {
        console.error("L'élément chat-log n'existe pas dans le DOM");
        return;
    }

    const messagesString = sessionStorage.getItem('general_chat_messages');
    if (!messagesString) {
        return;
    }

    try {
        // Parse les messages correctement
        const messages = JSON.parse(messagesString);
        
        chatLog.innerHTML = ''; // Effacer les messages précédents

        messages.forEach(msg => {
            const messageElement = document.createElement('div');

            const usernameElement = document.createElement('span');
            usernameElement.classList.add('username-link');
            usernameElement.dataset.friend = msg.friendName;
            usernameElement.innerText = `[${msg.friendName}]`;
            usernameElement.style.cursor = "pointer";
            usernameElement.classList.add('bold-username');

            // Ajouter l'écouteur d'événements pour le clic sur le nom d'utilisateur
            usernameElement.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                handleUsernameClick(event, msg.friendName);
            });

            const messageTextElement = document.createElement('span');
            messageTextElement.innerText = ` : ${msg.message}`;

            messageElement.appendChild(usernameElement);
            messageElement.appendChild(messageTextElement);

            chatLog.appendChild(messageElement);
        });

        chatLog.scrollTop = chatLog.scrollHeight;
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
    }
}

function handleUsernameClick(event, username) {
    const currentUsername = sessionStorage.getItem('username');
    const isOwnUsername = username === currentUsername;
    const dropdown = isOwnUsername ? document.getElementById('profileDropdown') : document.getElementById('friendDropdown_chat');

    // Masquer tous les menus déroulants visibles
    const visibleDropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
    visibleDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });

    if (dropdown) {
        dropdown.style.position = 'fixed';
        dropdown.style.display = 'block';

        // Vérifier si le dropdown dépasse la fenêtre
        const rect = dropdown.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (event.clientY + rect.height > windowHeight) {
            dropdown.style.top = `${event.clientY - rect.height}px`;
        } else {
            dropdown.style.top = `${event.clientY}px`;
        }

        if (event.clientX + rect.width > windowWidth) {
            dropdown.style.left = `${event.clientX - rect.width}px`;
        } else {
            dropdown.style.left = `${event.clientX}px`;
        }

        dropdown.dataset.friend = username;
    }
}

function checkForFriendRequests() {
    fetchFriendRequests()
        .then(friendRequests => {
            console.log('Données des demandes d\'ami:', friendRequests);
            friendRequests.forEach(request => {
                showFriendRequestToast(request.from_username, request.id);
            });
        })
        .catch(error => console.error('Erreur lors de la récupération des demandes d\'ami:', error));
}

function showFriendRequestToast(fromUsername, requestId) {
    const toastHtml = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header" style="background-color: #FF8C00;">
                <strong class="me-auto" style="color: #ff5722; background-color: white;">Friend Request</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body" style="color: black; background-color: white;">
                ${fromUsername} wants to add you as a friend.
                <div class="mt-2 pt-2 border-top">
                    <button type="button" class="btn btn-primary btn-sm accept-friend-request" data-request-id="${requestId}" style="background-color: #FF8C00;">Accept</button>
                    <button type="button" class="btn btn-primary btn-sm reject-friend-request" data-request-id="${requestId}" style="background-color: #FF8C00;">Reject</button>
                </div>
            </div>
        </div>
    `;

    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
    toastContainer.innerHTML = toastHtml;
    document.body.appendChild(toastContainer);

    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);

    // Ajoutez les écouteurs d'événements pour les boutons
    toastElement.querySelector('.accept-friend-request').addEventListener('click', function() {
        acceptFriendRequest(this.dataset.requestId)
            .then(() => {
                toast.hide();
                fetchAndDisplayFriends();
            })
            .catch(error => console.error('Erreur lors de l\'acceptation de la demande d\'ami:', error));
    });

    toastElement.querySelector('.reject-friend-request').addEventListener('click', function() {
        rejectFriendRequest(this.dataset.requestId)
            .then(() => {
                toast.hide();
            })
            .catch(error => console.error('Erreur lors du rejet de la demande d\'ami:', error));
    });    toast.show();
}

export async function fetchAndDisplayFriends() {
    const onlineFriendsList = document.getElementById('online-friends');
    const pendingFriendsList = document.getElementById('pending-friends');
    const blockedFriendsList = document.getElementById('blocked-friends');

    if (onlineFriendsList && pendingFriendsList && blockedFriendsList) {
        try {
            const [friendsResponse, pendingResponse] = await Promise.all([
                fetch('/api/friends/', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch('/api/friends/pending/', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            const [friendsData, pendingData] = await Promise.all([
                friendsResponse.json(),
                pendingResponse.json()
            ]);

            // Clear all lists
            onlineFriendsList.innerHTML = '';
            pendingFriendsList.innerHTML = '';
            blockedFriendsList.innerHTML = '';
            blockedUsers.clear();

            // Display online friends
            friendsData.friends
                .filter(friend => friend.is_online && !friend.is_blocked)
                .forEach(friend => {
                    createFriendListItem(friend, onlineFriendsList);
                });

            // Display pending requests
            pendingData.pending_requests.forEach(request => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center pending-request';
                li.innerHTML = `
                    <span>${request.from_username}</span>
                    <div class="pending-actions">
                        <button class="accept-btn" data-request-id="${request.id}">✓</button>
                        <button class="reject-btn" data-request-id="${request.id}">✗</button>
                    </div>
                `;
                pendingFriendsList.appendChild(li);

                // Add event listeners for accept/reject buttons
                li.querySelector('.accept-btn').addEventListener('click', () => acceptFriendRequest(request.id));
                li.querySelector('.reject-btn').addEventListener('click', () => rejectFriendRequest(request.id));
            });

            // Display blocked users
            friendsData.friends
                .filter(friend => friend.is_blocked)
                .forEach(friend => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center blocked-user';
                    li.innerHTML = `
                        <span>${friend.display_name || friend.username}</span>
                        <button class="unblock-btn" data-username="${friend.username}">Unblock</button>
                    `;
                    blockedFriendsList.appendChild(li);
                    blockedUsers.add(friend.username);

                    // Add event listener for unblock button
                    li.querySelector('.unblock-btn').addEventListener('click', () => unblockUser(friend.username));
                });

        } catch (error) {
            console.error('Error fetching friends data:', error);
        }
    }
}

// Nouvelle fonction helper pour créer les éléments de la liste d'amis
function createFriendListItem(friend, listElement) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.setAttribute('data-friend', friend.username);

    const statusDot = document.createElement('span');
    statusDot.className = `status-dot ${friend.is_online ? 'online' : 'offline'}`;

    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = friend.display_name || friend.username;

    li.appendChild(statusDot);
    li.appendChild(usernameSpan);

    li.addEventListener('click', handleFriendClick);

    listElement.appendChild(li);

    if (friend.is_online) {
        if (!privateChatLogs.has(friend.display_name)) {
            setupPrivateChat(friend.display_name);
        }
    }
}

// Nouvelle fonction pour débloquer un utilisateur
async function unblockUser(username) {
    try {
        const response = await fetch('/api/unblock-user/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ display_name: username })
        });

        const data = await response.json();
        if (data.success) {
            showToast('User unblocked successfully', 'success');
            fetchAndDisplayFriends(); // Refresh the lists
        } else {
            showToast(data.message || 'Failed to unblock user', 'error');
        }
    } catch (error) {
        console.error('Error unblocking user:', error);
        showToast('An error occurred while unblocking the user', 'error');
    }
}

function reinitializeSocket() {
    const username = sessionStorage.getItem('username');
    if (username && !socket) {
        socket = initializeSocket(username);
        setupChatListeners(socket);
    }
}

// // Appelez reinitializeSocket au chargement de la page
// window.addEventListener('load', reinitializeSocket);

function showFriendDropdown(event, friendName) {
    const dropdown = document.getElementById('friendDropdown');
    dropdown.setAttribute('data-friend', friendName);
    dropdown.style.display = 'block';
    // Positionner le dropdown près du curseur
    dropdown.style.left = `${event.clientX}px`;
    dropdown.style.top = `${event.clientY}px`;
}

function updateFriendStatus(friendName, isOnline) {
    const friendItem = document.querySelector(`#friends li[data-friend="${friendName}"]`);
    if (friendItem) {
        const statusDot = friendItem.querySelector('.status-dot');
        statusDot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
    }
}

// Ajouter un écouteur pour les mouvements de souris et les frappes au clavier
document.addEventListener('mousemove', resetActivityTimer);
document.addEventListener('keypress', resetActivityTimer);

function resetActivityTimer() {
    const displayName = sessionStorage.getItem('display_name');
    if (displayName) {
        getSocket(displayName); // Utiliser displayName
    }
}


export function removeDashboardEventListeners() {
    // Remove logout listener
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.removeEventListener('click', handleLogout);
    }

    // Remove friend item listeners
    const friendItems = document.querySelectorAll('#friends .list-group-item');
    friendItems.forEach(item => {
        item.removeEventListener('click', handleFriendClick);
    });

    // Remove profile picture listener
    const profilePic = document.getElementById('img_profile_pic');
    if (profilePic) {
        profilePic.removeEventListener('click', handleProfilePictureClick);
    }

    // Remove other listeners
    document.removeEventListener('click', hideDropdowns);
    document.removeEventListener('keydown', handleEnterKey);

    // Clear intervals
    clearInterval(window.fetchFriendsInterval);
    clearInterval(window.checkFriendRequestsInterval);

    // Remove socket listeners
    const displayName = sessionStorage.getItem('display_name');
    const socket = getSocket(displayName);
    if (socket) {
        socket.off('chat message');
        socket.off('private message');
        socket.off('force_disconnect');
        socket.off('user_disconnected');
    }
    console.log('removeDashboardEventListeners');
}

// Modify the existing logout function
function handleLogout(event) {
    event.preventDefault();
    const displayName = sessionStorage.getItem('display_name');
    const socket = getSocket(displayName);
    if (socket) {
        socket.disconnect();
    }
    removeDashboardEventListeners();
    sessionStorage.removeItem('general_chat_messages');
    logout();
}

function setupTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons et contenus
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');
            
            // Afficher le contenu correspondant
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}
