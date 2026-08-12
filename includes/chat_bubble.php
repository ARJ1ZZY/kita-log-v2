<?php
// Only show chat bubble if user is logged in
if (!isset($_SESSION['user_id'])) return;
?>

<style>
.chat-bubble-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    font-family: 'Inter', sans-serif;
}

.chat-bubble-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--primary, #1a4d6b);
    border: none;
    box-shadow: var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.08));
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast, 0.15s cubic-bezier(0.4, 0, 0.2, 1));
    position: relative;
    color: white;
    font-size: 1.2rem;
}

.chat-bubble-btn:hover {
    transform: scale(1.05);
    background: var(--primary-light, #2d6f94);
    box-shadow: var(--shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.1));
}

.chat-bubble-btn .notification-dot {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    background: var(--danger, #b13e3e);
    border-radius: 50%;
    border: 2px solid white;
    display: none;
}

.chat-bubble-btn.has-notification .notification-dot {
    display: block;
}

/* Chat Popup Window */
.chat-popup {
    position: fixed;
    bottom: 90px;
    right: 24px;
    width: 360px;
    height: 500px;
    background: white;
    border-radius: var(--border-radius, 1rem);
    box-shadow: var(--shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.1));
    display: none;
    flex-direction: column;
    overflow: hidden;
    z-index: 10000;
    border: 1px solid var(--gray-200, #eef2f5);
    transition: opacity var(--transition, 0.2s cubic-bezier(0.4, 0, 0.2, 1)), transform var(--transition);
}

.chat-popup.show {
    display: flex;
    animation: none;
}

/* Chat Header */
.chat-header {
    background: var(--primary, #1a4d6b);
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.chat-header-title i {
    font-size: 1rem;
}

.chat-header-title h5 {
    margin: 0;
    font-weight: 600;
    font-size: 0.9rem;
}

.chat-header-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.7;
    transition: opacity var(--transition-fast);
}

.chat-header-close:hover {
    opacity: 1;
}

/* Chat Messages Area */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: var(--gray-50, #fcfcfd);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.message {
    display: flex;
    margin-bottom: 0.5rem;
}

.message.user {
    justify-content: flex-end;
}

.message-content {
    max-width: 80%;
    padding: 0.6rem 1rem;
    border-radius: 1rem;
    position: relative;
    font-size: 0.85rem;
    line-height: 1.4;
}

.message.user .message-content {
    background: var(--primary, #1a4d6b);
    color: white;
    border-bottom-right-radius: 0.2rem;
}

.message.bot .message-content {
    background: white;
    color: var(--gray-700, #475569);
    border-bottom-left-radius: 0.2rem;
    box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.02));
    border: 1px solid var(--gray-200, #eef2f5);
}

.message-time {
    font-size: 0.6rem;
    margin-top: 0.2rem;
    opacity: 0.6;
    text-align: right;
}

/* Quick Actions */
.quick-actions {
    padding: 0.5rem;
    background: white;
    border-top: 1px solid var(--gray-200, #eef2f5);
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.quick-action-btn {
    background: var(--gray-50, #fcfcfd);
    border: 1px solid var(--gray-200, #eef2f5);
    border-radius: 2rem;
    padding: 0.3rem 0.8rem;
    font-size: 0.7rem;
    color: var(--primary, #1a4d6b);
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
}

.quick-action-btn:hover {
    background: var(--primary, #1a4d6b);
    color: white;
    border-color: var(--primary, #1a4d6b);
}

/* Chat Input Area */
.chat-input-area {
    padding: 0.75rem;
    background: white;
    border-top: 1px solid var(--gray-200, #eef2f5);
    display: flex;
    gap: 0.5rem;
}

.chat-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--gray-200, #eef2f5);
    border-radius: 2rem;
    font-size: 0.85rem;
    transition: all var(--transition-fast);
}

.chat-input:focus {
    outline: none;
    border-color: var(--primary-light, #2d6f94);
    box-shadow: 0 0 0 3px var(--primary-glow, rgba(26, 77, 107, 0.08));
}

.chat-send-btn {
    background: var(--primary, #1a4d6b);
    color: white;
    border: none;
    border-radius: 2rem;
    padding: 0.5rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
}

.chat-send-btn:hover {
    background: var(--primary-light, #2d6f94);
    transform: translateY(-1px);
}

.chat-send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* Typing Indicator */
.typing-indicator {
    display: flex;
    gap: 0.3rem;
    padding: 0.5rem 1rem;
    background: white;
    border-radius: 1rem;
    width: fit-content;
    border: 1px solid var(--gray-200, #eef2f5);
}

.typing-indicator span {
    width: 6px;
    height: 6px;
    background: var(--primary, #1a4d6b);
    border-radius: 50%;
    animation: typing 1s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing {
    0%, 100% { transform: translateY(0); opacity: 0.4; }
    50% { transform: translateY(-4px); opacity: 1; }
}

/* Mobile */
@media (max-width: 480px) {
    .chat-popup {
        width: calc(100vw - 32px);
        right: 16px;
        bottom: 80px;
        height: 480px;
    }
    
    .chat-bubble-container {
        bottom: 16px;
        right: 16px;
    }
}
</style>

<div class="chat-bubble-container">
    <button class="chat-bubble-btn" id="chatBubbleBtn">
        <i class="fas fa-robot"></i>
        <span class="notification-dot"></span>
    </button>

    <div class="chat-popup" id="chatPopup">
        <div class="chat-header">
            <div class="chat-header-title">
                <i class="fas fa-robot"></i>
                <h5>KITA-LOG Assistant</h5>
            </div>
            <button class="chat-header-close" id="closeChatBtn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="chat-messages" id="chatMessages">
            <div class="message bot">
                <div class="message-content">
                    👋 Hi! I can help you with your business data. Try asking:
                    <br>• "Sales yesterday?"
                    <br>• "Monthly expenses?"
                    <br>• "Low stock items?"
                    <div class="message-time">Just now</div>
                </div>
            </div>
        </div>
        
        <div class="quick-actions">
            <button class="quick-action-btn" onclick="quickAsk('sales yesterday')">📊 Yesterday's Sales</button>
            <button class="quick-action-btn" onclick="quickAsk('expenses this month')">💰 Monthly Expenses</button>
            <button class="quick-action-btn" onclick="quickAsk('profit today')">📈 Today's Profit</button>
            <button class="quick-action-btn" onclick="quickAsk('low stock')">⚠️ Low Stock</button>
        </div>
        
        <div class="chat-input-area">
            <input type="text" class="chat-input" id="chatInput" placeholder="Ask me anything..." onkeypress="if(event.key==='Enter') sendMessage()">
            <button class="chat-send-btn" id="sendBtn" onclick="sendMessage()">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    </div>
</div>

<script>
let isTyping = false;

document.getElementById('chatBubbleBtn').addEventListener('click', function() {
    const popup = document.getElementById('chatPopup');
    popup.classList.toggle('show');
    if (popup.classList.contains('show')) {
        document.getElementById('chatInput').focus();
    }
});

document.getElementById('closeChatBtn').addEventListener('click', function() {
    document.getElementById('chatPopup').classList.remove('show');
});

window.quickAsk = function(question) {
    document.getElementById('chatInput').value = question;
    sendMessage();
};

function addMessage(text, isUser = false) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${text.replace(/\n/g, '<br>')}
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;
    
    const messagesDiv = document.getElementById('chatMessages');
    const indicator = document.createElement('div');
    indicator.className = 'message bot';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    messagesDiv.appendChild(indicator);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
    isTyping = false;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    const sendBtn = document.getElementById('sendBtn');
    
    if (!message) return;
    
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    
    addMessage(message, true);
    showTypingIndicator();
    
    try {
        const formData = new FormData();
        formData.append('message', message);
        
        const response = await fetch('ajax/chatbot_advanced.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        hideTypingIndicator();
        
        if (data.success) {
            addMessage(data.response);
        } else {
            addMessage('Sorry, I had trouble understanding. Please try again.');
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, there was an error. Please try again.');
        console.error('Error:', error);
    }
    
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
}

document.addEventListener('click', function(event) {
    const popup = document.getElementById('chatPopup');
    const bubble = document.getElementById('chatBubbleBtn');
    
    if (!popup.contains(event.target) && !bubble.contains(event.target) && popup.classList.contains('show')) {
        popup.classList.remove('show');
    }
});
</script>