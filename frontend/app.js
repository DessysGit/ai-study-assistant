// ============================================
// AI STUDY ASSISTANT - FRONTEND JAVASCRIPT
// ============================================
// This file makes the webpage interactive!
// NOW INCLUDES CHAT FUNCTIONALITY!

// ==================================================
// STEP 1: GET REFERENCES TO HTML ELEMENTS
// ==================================================

// Existing elements
const fileInput = document.getElementById('fileInput');
const fileLabel = document.getElementById('fileLabel');
const generateButton = document.getElementById('generateButton');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const summaryContent = document.getElementById('summaryContent');
const errorDiv = document.getElementById('error');
const originalLength = document.getElementById('originalLength');
const summaryLength = document.getElementById('summaryLength');

// NEW: Chat elements
const startChatButton = document.getElementById('startChatButton');
const chatSection = document.getElementById('chatSection');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatButton = document.getElementById('sendChatButton');

// NEW: Global variable to store the extracted note text
// We need this so we can send it with each chat question
let currentNoteText = '';

// ==================================================
// STEP 2: LISTEN FOR FILE SELECTION
// ==================================================

fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    
    if (file) {
        fileLabel.textContent = `📄 ${file.name}`;
        fileLabel.classList.add('has-file');
        generateButton.disabled = false;
    } else {
        fileLabel.textContent = 'Choose a file (PDF, Word, PowerPoint, or Text)';
        fileLabel.classList.remove('has-file');
        generateButton.disabled = true;
    }
});

// ==================================================
// STEP 3: LISTEN FOR BUTTON CLICK (GENERATE SUMMARY)
// ==================================================

generateButton.addEventListener('click', async function() {
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Please select a file first!');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    hideAll();
    loading.classList.remove('hidden');
    
    try {
        const response = await fetch('http://localhost:5000/api/summarize', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            loading.classList.add('hidden');
            
            summaryContent.textContent = data.data.summary;
            originalLength.textContent = `Original: ${data.data.originalLength.toLocaleString()} characters`;
            summaryLength.textContent = `Summary: ${data.data.summaryLength.toLocaleString()} characters`;
            
            // NEW: Store the summary as note text for chat
            currentNoteText = data.data.summary;
            
            result.classList.remove('hidden');
            
        } else {
            loading.classList.add('hidden');
            showError(data.error || 'Failed to generate summary. Please try again.');
        }
        
    } catch (error) {
        console.error('Error:', error);
        loading.classList.add('hidden');
        showError('Could not connect to server. Make sure the backend is running on http://localhost:5000');
    }
});

// ==================================================
// STEP 4: NEW - LISTEN FOR "START CHAT" BUTTON
// ==================================================

startChatButton.addEventListener('click', async function() {
    // Check if we already have note text
    if (!currentNoteText) {
        showError('Please generate a summary first!');
        return;
    }
    
    // Show chat section
    chatSection.classList.remove('hidden');
    
    // Scroll to chat section
    chatSection.scrollIntoView({ behavior: 'smooth' });
    
    // Focus on input
    chatInput.focus();
    
    // Clear previous chat if any
    chatMessages.innerHTML = '<p style="color: #666; text-align: center;">Ask me anything about your notes!</p>';
});

// ==================================================
// STEP 5: NEW - LISTEN FOR SEND CHAT BUTTON
// ==================================================

sendChatButton.addEventListener('click', async function() {
    await sendChatMessage();
});

// Also allow pressing Enter to send message
chatInput.addEventListener('keypress', async function(event) {
    if (event.key === 'Enter') {
        await sendChatMessage();
    }
});

// ==================================================
// STEP 6: NEW - SEND CHAT MESSAGE FUNCTION
// ==================================================

async function sendChatMessage() {
    const question = chatInput.value.trim();
    
    // Validation: check if question is empty
    if (question.length === 0) {
        return; // Don't send empty messages
    }
    
    // Validation: check if we have note text
    if (!currentNoteText) {
        showError('Please generate a summary first before chatting!');
        return;
    }
    
    // Disable input while processing
    chatInput.disabled = true;
    sendChatButton.disabled = true;
    
    // Add user's question to chat
    addMessageToChat('user', question);
    
    // Clear input field
    chatInput.value = '';
    
    // Show loading indicator in chat
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-loading';
    loadingMsg.textContent = 'AI is thinking...';
    chatMessages.appendChild(loadingMsg);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        // Send to backend
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                noteText: currentNoteText,
                question: question
            })
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        loadingMsg.remove();
        
        if (response.ok && data.success) {
            // Add AI's answer to chat
            addMessageToChat('assistant', data.data.answer);
        } else {
            showError(data.error || 'Failed to get answer. Please try again.');
        }
        
    } catch (error) {
        console.error('Error:', error);
        loadingMsg.remove();
        showError('Could not connect to server.');
    } finally {
        // Re-enable input
        chatInput.disabled = false;
        sendChatButton.disabled = false;
        chatInput.focus();
    }
}

// ==================================================
// STEP 7: NEW - ADD MESSAGE TO CHAT DISPLAY
// ==================================================

function addMessageToChat(sender, text) {
    // Create message container
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    // Create sender label
    const senderLabel = document.createElement('div');
    senderLabel.className = 'message-sender';
    senderLabel.textContent = sender === 'user' ? 'You' : 'AI Assistant';
    
    // Create message content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    // Assemble message
    messageDiv.appendChild(senderLabel);
    messageDiv.appendChild(contentDiv);
    
    // Add to chat
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==================================================
// HELPER FUNCTIONS (unchanged)
// ==================================================

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    setTimeout(function() {
        errorDiv.classList.add('hidden');
    }, 5000);
}

function hideAll() {
    loading.classList.add('hidden');
    result.classList.add('hidden');
    errorDiv.classList.add('hidden');
    // Don't hide chat section - let it stay visible if already shown
}