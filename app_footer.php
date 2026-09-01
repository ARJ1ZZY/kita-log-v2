<?php
// app_footer.php - Complete with modern chatbot (centered, full width, blur background)
?>
    <!-- Bottom Navigation -->
    <div class="bottom-nav">
        <div class="nav-items">
            <a href="app_dashboard.php" class="nav-item <?php echo $current_page == 'app_dashboard' ? 'active' : ''; ?>">
                <i class="fas fa-chart-pie"></i><span>Overview</span>
            </a>
            <a href="transactions.php" class="nav-item <?php echo $current_page == 'transactions' ? 'active' : ''; ?>">
                <i class="fas fa-exchange-alt"></i><span>Transact</span>
            </a>
            <div class="fab-container">
                <div class="fab" id="fabButton" onclick="window.location.href='transactions.php'">
                    <i class="fas fa-plus"></i>
                </div>
            </div>
            <a href="inventory.php" class="nav-item <?php echo $current_page == 'inventory' ? 'active' : ''; ?>">
                <i class="fas fa-boxes"></i><span>Stock</span>
            </a>
            <a href="settings.php" class="nav-item <?php echo $current_page == 'settings' ? 'active' : ''; ?>">
                <i class="fas fa-cog"></i><span>Settings</span>
            </a>
        </div>
    </div>

    <!-- Modern Chatbot - Centered, Full Width, Blur Background -->
    <div class="chat-container">
        <button class="chat-trigger" id="chatTrigger">
            <i class="fas fa-robot"></i>
            <span class="chat-pulse"></span>
        </button>
        
        <div class="chat-overlay" id="chatOverlay"></div>
        
        <div class="chat-window" id="chatWindow">
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="chat-header-text">
                        <h4>KITA-LOG Assistant</h4>
                        <p>Online • Ready to help</p>
                    </div>
                </div>
                <button class="chat-close" id="chatClose">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                <div class="message bot">
                    <div class="message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-bubble">
                        <div class="message-text">
                            👋 Hi! I'm your KITA-LOG assistant.<br>
                            I can help you with:
                        </div>
                        <div class="message-suggestions">
                            <button class="suggestion-chip" onclick="quickAsk('sales today')">📊 Today's Sales</button>
                            <button class="suggestion-chip" onclick="quickAsk('expenses this month')">💰 Monthly Expenses</button>
                            <button class="suggestion-chip" onclick="quickAsk('profit')">📈 Profit</button>
                            <button class="suggestion-chip" onclick="quickAsk('low stock')">⚠️ Low Stock</button>
                        </div>
                        <div class="message-time">Just now</div>
                    </div>
                </div>
            </div>
            
            <div class="chat-input-area">
                <div class="chat-input-wrapper">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Ask me anything..." onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <button class="chat-send" id="chatSend" onclick="sendChatMessage()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        // FAB direct redirect
        const fabButton = document.getElementById('fabButton');
        
        // ========== MODERN CHATBOT ==========
        const chatTrigger = document.getElementById('chatTrigger');
        const chatWindow = document.getElementById('chatWindow');
        const chatOverlay = document.getElementById('chatOverlay');
        const chatClose = document.getElementById('chatClose');
        const chatInput = document.getElementById('chatInput');
        const chatSend = document.getElementById('chatSend');
        const chatMessages = document.getElementById('chatMessages');
        
        let isChatOpen = false;
        
        function openChat() {
            chatWindow.classList.add('show');
            chatOverlay.classList.add('show');
            chatTrigger.style.display = 'none';
            isChatOpen = true;
            chatInput.focus();
            document.body.style.overflow = 'hidden';
        }
        
        function closeChat() {
            chatWindow.classList.remove('show');
            chatOverlay.classList.remove('show');
            chatTrigger.style.display = 'flex';
            isChatOpen = false;
            document.body.style.overflow = '';
        }
        
        chatTrigger.addEventListener('click', openChat);
        chatClose.addEventListener('click', closeChat);
        chatOverlay.addEventListener('click', closeChat);
        
        function addChatMessage(text, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
            
            if (isUser) {
                messageDiv.innerHTML = `
                    <div class="message-bubble user-bubble">
                        <div class="message-text">${escapeChatHtml(text)}</div>
                        <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div class="message-avatar user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                `;
            } else {
                messageDiv.innerHTML = `
                    <div class="message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-bubble">
                        <div class="message-text">${formatBotMessage(text)}</div>
                        <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                `;
            }
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        function formatBotMessage(text) {
            return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        
        function escapeChatHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function showTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'message bot typing-indicator-message';
            indicator.id = 'typingIndicator';
            indicator.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-bubble">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            chatMessages.appendChild(indicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        function hideTypingIndicator() {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) indicator.remove();
        }
        
        window.quickAsk = function(question) {
            chatInput.value = question;
            sendChatMessage();
        };
        
        async function sendChatMessage() {
            const message = chatInput.value.trim();
            if (!message) return;
            
            chatInput.value = '';
            chatInput.disabled = true;
            chatSend.disabled = true;
            
            addChatMessage(message, true);
            showTypingIndicator();
            
            try {
                const formData = new FormData();
                formData.append('message', message);
                const response = await fetch('ajax/chatbot_advanced.php', { method: 'POST', body: formData });
                const data = await response.json();
                hideTypingIndicator();
                
                if (data.success) {
                    addChatMessage(data.response);
                } else {
                    addChatMessage('Sorry, I had trouble understanding. Please try again.');
                }
            } catch (error) {
                hideTypingIndicator();
                addChatMessage('Sorry, there was an error. Please try again.');
            }
            
            chatInput.disabled = false;
            chatSend.disabled = false;
            chatInput.focus();
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isChatOpen) {
                closeChat();
            }
        });
    </script>
    
    <style>
        /* ========== MODERN CHATBOT STYLES - CENTERED, FULL WIDTH, BLUR ========== */
        .chat-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            z-index: 1000;
        }
        
        .chat-trigger {
            width: 56px;
            height: 56px;
            border-radius: 28px;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            border: none;
            box-shadow: 0 4px 16px rgba(102, 153, 204, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.2s;
        }
        
        .chat-trigger i {
            font-size: 1.4rem;
            color: white;
        }
        
        .chat-trigger:active {
            transform: scale(0.94);
        }
        
        .chat-pulse {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(102, 153, 204, 0.4);
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% {
                transform: scale(1);
                opacity: 0.6;
            }
            100% {
                transform: scale(1.3);
                opacity: 0;
            }
        }
        
        /* Blur Overlay */
        .chat-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            z-index: 1001;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .chat-overlay.show {
            display: block;
            animation: overlayFadeIn 0.3s ease forwards;
        }
        
        @keyframes overlayFadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        /* Chat Window - Centered, 80% width */
        .chat-window {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            width: 80%;
            max-width: 500px;
            height: 80%;
            max-height: 600px;
            background: var(--bg-card);
            border-radius: 28px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid var(--border-color);
            z-index: 1002;
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .chat-window.show {
            display: flex;
            animation: chatCenterIn 0.3s ease forwards;
        }
        
        @keyframes chatCenterIn {
            from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
        
        .chat-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }
        
        .chat-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .chat-avatar {
            width: 44px;
            height: 44px;
            background: rgba(255,255,255,0.2);
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .chat-avatar i {
            font-size: 1.3rem;
            color: white;
        }
        
        .chat-header-text h4 {
            font-size: 1rem;
            font-weight: 700;
            margin: 0;
            color: white;
        }
        
        .chat-header-text p {
            font-size: 0.7rem;
            margin: 2px 0 0;
            color: rgba(255,255,255,0.8);
        }
        
        .chat-close {
            width: 36px;
            height: 36px;
            border-radius: 18px;
            background: rgba(255,255,255,0.15);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            transition: all 0.2s;
        }
        
        .chat-close:active {
            transform: scale(0.92);
            background: rgba(255,255,255,0.25);
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: var(--bg-secondary);
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .message {
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        
        .message.user {
            justify-content: flex-end;
        }
        
        .message-avatar {
            width: 36px;
            height: 36px;
            border-radius: 18px;
            background: rgba(102, 153, 204, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .message-avatar i {
            font-size: 1rem;
            color: var(--primary);
        }
        
        .user-avatar {
            background: rgba(16, 185, 129, 0.1);
        }
        
        .user-avatar i {
            color: var(--success);
        }
        
        .message-bubble {
            max-width: 75%;
            padding: 12px 16px;
            border-radius: 20px;
            background: var(--bg-card);
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .user-bubble {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
        }
        
        .message-text {
            font-size: 0.9rem;
            line-height: 1.45;
        }
        
        .message-text strong {
            font-weight: 700;
        }
        
        .message-time {
            font-size: 0.6rem;
            margin-top: 8px;
            opacity: 0.6;
            text-align: right;
        }
        
        .user-bubble .message-time {
            color: rgba(255,255,255,0.7);
        }
        
        .message-suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
        }
        
        .suggestion-chip {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 30px;
            padding: 8px 14px;
            font-size: 0.75rem;
            color: var(--primary);
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .suggestion-chip:active {
            transform: scale(0.95);
            background: var(--primary);
            color: white;
        }
        
        .typing-dots {
            display: flex;
            gap: 5px;
            padding: 6px 0;
        }
        
        .typing-dots span {
            width: 8px;
            height: 8px;
            background: var(--text-secondary);
            border-radius: 50%;
            animation: typingBounce 1.4s infinite;
        }
        
        .typing-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typingBounce {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.4;
            }
            30% {
                transform: translateY(-6px);
                opacity: 1;
            }
        }
        
        .chat-input-area {
            padding: 16px 20px;
            background: var(--bg-card);
            border-top: 1px solid var(--border-color);
            flex-shrink: 0;
        }
        
        .chat-input-wrapper {
            display: flex;
            gap: 12px;
            align-items: center;
        }
        
        .chat-input {
            flex: 1;
            padding: 12px 18px;
            border: 1.5px solid var(--border-color);
            border-radius: 30px;
            font-size: 0.9rem;
            background: var(--bg-input);
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
        }
        
        .chat-input:focus {
            outline: none;
            border-color: var(--primary);
        }
        
        .chat-send {
            width: 46px;
            height: 46px;
            border-radius: 23px;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .chat-send i {
            font-size: 1.1rem;
            color: white;
        }
        
        .chat-send:active {
            transform: scale(0.94);
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .chat-window {
                width: 90%;
                height: 85%;
                max-height: none;
            }
            
            .chat-container {
                bottom: 100px;
                right: 16px;
            }
            
            .chat-trigger {
                width: 52px;
                height: 52px;
            }
            
            .chat-trigger i {
                font-size: 1.3rem;
            }
            
            .message-bubble {
                max-width: 85%;
            }
            
            .message-suggestions {
                gap: 8px;
            }
            
            .suggestion-chip {
                padding: 6px 12px;
                font-size: 0.7rem;
            }
        }
    </style>
</body>
</html>