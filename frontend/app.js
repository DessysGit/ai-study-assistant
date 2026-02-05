// ============================================
// AI STUDY ASSISTANT - FRONTEND JAVASCRIPT
// ============================================
// This file makes the webpage interactive!
// ==================================================
// GET REFERENCES TO HTML ELEMENTS
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
const copyButton = document.getElementById('copyButton');
const exportButton = document.getElementById('exportButton');
const darkModeToggle = document.getElementById('darkModeToggle');

// Chat elements
const startChatButton = document.getElementById('startChatButton');
const chatSection = document.getElementById('chatSection');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatButton = document.getElementById('sendChatButton');

// Quiz elements
const generateQuizButton = document.getElementById('generateQuizButton');
const quizSection = document.getElementById('quizSection');
const quizContainer = document.getElementById('quizContainer');
const submitQuizButton = document.getElementById('submitQuizButton');
const quizResults = document.getElementById('quizResults');
const scoreDisplay = document.getElementById('scoreDisplay');
const answerReview = document.getElementById('answerReview');
const retakeQuizButton = document.getElementById('retakeQuizButton');

// Global variables
let currentNoteText = '';
let currentQuiz = null; // Will store the quiz questions
let userAnswers = {}; // Will store user's selected answers
let selectedFiles = []; // To store multiple selected files

// ==================================================
// LISTEN FOR FILE SELECTION
// ==================================================

fileInput.addEventListener('change', function() {
    // Get all selected files (could be multiple)
    const files = Array.from(fileInput.files);
    
    if (files.length > 0) {
        selectedFiles = files; // Store them
        
        // Update label to show count
        if (files.length === 1) {
            fileLabel.textContent = `📄 ${files[0].name}`;
        } else {
            fileLabel.textContent = `📄 ${files.length} files selected`;
        }
        
        fileLabel.classList.add('has-file');
        generateButton.disabled = false;
        
        // Show file list
        displayFileList(files);
    } else {
        selectedFiles = [];
        fileLabel.textContent = 'Choose files (PDF, Word, PowerPoint, or Text)';
        fileLabel.classList.remove('has-file');
        generateButton.disabled = true;
        hideFileList();
    }
});

// ==================================================
// LISTEN FOR BUTTON CLICK (GENERATE SUMMARY)
// ==================================================

// Display list of selected files
function displayFileList(files) {
    // Check if file list container exists, if not create it
    let fileListDiv = document.querySelector('.file-list');
    
    if (!fileListDiv) {
        // Create file list container
        fileListDiv = document.createElement('div');
        fileListDiv.className = 'file-list';
        
        // Insert it after the file label
        const uploadSection = document.querySelector('.upload-section');
        const generateBtn = document.getElementById('generateButton');
        uploadSection.insertBefore(fileListDiv, generateBtn);
    }
    
    // Build HTML for file list
    let html = '<div class="file-list-title">Selected Files:</div>';
    
    files.forEach((file, index) => {
        const sizeInKB = (file.size / 1024).toFixed(1);
        html += `
            <div class="file-item">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${sizeInKB} KB</span>
                <button class="file-remove" onclick="removeFile(${index})">Remove</button>
            </div>
        `;
    });
    
    fileListDiv.innerHTML = html;
    fileListDiv.classList.add('visible');
}

// Hide file list
function hideFileList() {
    const fileListDiv = document.querySelector('.file-list');
    if (fileListDiv) {
        fileListDiv.classList.remove('visible');
    }
}

// Remove a specific file from selection
function removeFile(index) {
    selectedFiles.splice(index, 1); // Remove from array
    
    if (selectedFiles.length > 0) {
        displayFileList(selectedFiles);
        
        // Update label
        if (selectedFiles.length === 1) {
            fileLabel.textContent = `📄 ${selectedFiles[0].name}`;
        } else {
            fileLabel.textContent = `📄 ${selectedFiles.length} files selected`;
        }
    } else {
        fileLabel.textContent = 'Choose files (PDF, Word, PowerPoint, or Text)';
        fileLabel.classList.remove('has-file');
        generateButton.disabled = true;
        hideFileList();
    }
}

// Make removeFile available globally
window.removeFile = removeFile;

generateButton.addEventListener('click', async function() {
    if (selectedFiles.length === 0) {
        showError('Please select at least one file first!');
        return;
    }
    
    const formData = new FormData();
    
    // Append all selected files
    selectedFiles.forEach((file, index) => {
        formData.append('files', file); // Note: 'files' plural
    });
    
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
            
            // Store the summary as note text for chat and quiz
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
// CHAT FUNCTIONALITY (existing)
// ==================================================

startChatButton.addEventListener('click', async function() {
    if (!currentNoteText) {
        showError('Please generate a summary first!');
        return;
    }
    
    chatSection.classList.remove('hidden');
    chatSection.scrollIntoView({ behavior: 'smooth' });
    chatInput.focus();
    chatMessages.innerHTML = '<p style="color: #666; text-align: center;">Ask me anything about your notes!</p>';
});

sendChatButton.addEventListener('click', async function() {
    await sendChatMessage();
});

chatInput.addEventListener('keypress', async function(event) {
    if (event.key === 'Enter') {
        await sendChatMessage();
    }
});

async function sendChatMessage() {
    const question = chatInput.value.trim();
    
    if (question.length === 0) {
        return;
    }
    
    if (!currentNoteText) {
        showError('Please generate a summary first before chatting!');
        return;
    }
    
    chatInput.disabled = true;
    sendChatButton.disabled = true;
    
    addMessageToChat('user', question);
    chatInput.value = '';
    
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-loading';
    loadingMsg.textContent = 'AI is thinking...';
    chatMessages.appendChild(loadingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
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
        loadingMsg.remove();
        
        if (response.ok && data.success) {
            addMessageToChat('assistant', data.data.answer);
        } else {
            showError(data.error || 'Failed to get answer. Please try again.');
        }
        
    } catch (error) {
        console.error('Error:', error);
        loadingMsg.remove();
        showError('Could not connect to server.');
    } finally {
        chatInput.disabled = false;
        sendChatButton.disabled = false;
        chatInput.focus();
    }
}

function addMessageToChat(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const senderLabel = document.createElement('div');
    senderLabel.className = 'message-sender';
    senderLabel.textContent = sender === 'user' ? 'You' : 'AI Assistant';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(senderLabel);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==================================================
// QUIZ FUNCTIONALITY
// ==================================================

// Listen for "Generate Quiz" button
generateQuizButton.addEventListener('click', async function() {
    if (!currentNoteText) {
        showError('Please generate a summary first!');
        return;
    }
    
    // Show loading
    loading.classList.remove('hidden');
    
    try {
        // Call backend to generate quiz
        const response = await fetch('http://localhost:5000/api/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                noteText: currentNoteText
            })
        });
        
        const data = await response.json();
        
        loading.classList.add('hidden');
        
        if (response.ok && data.success) {
            // Store the quiz data
            currentQuiz = data.data.questions;
            
            // Reset user answers
            userAnswers = {};
            
            // Display the quiz
            displayQuiz(currentQuiz);
            
            // Show quiz section
            quizSection.classList.remove('hidden');
            quizSection.scrollIntoView({ behavior: 'smooth' });
            
        } else {
            showError(data.error || 'Failed to generate quiz. Please try again.');
        }
        
    } catch (error) {
        console.error('Error:', error);
        loading.classList.add('hidden');
        showError('Could not connect to server.');
    }
});

// Display quiz questions on the page
function displayQuiz(questions) {
    // Clear previous quiz
    quizContainer.innerHTML = '';
    quizResults.classList.add('hidden');
    submitQuizButton.classList.remove('hidden');
    
    // Create HTML for each question
    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-question';
        
        // Question number and text
        questionDiv.innerHTML = `
            <div class="question-number">Question ${index + 1} of ${questions.length}</div>
            <div class="question-text">${q.question}</div>
            <div class="quiz-options">
                ${q.options.map((option, optionIndex) => `
                    <div class="quiz-option" onclick="selectOption(${index}, ${optionIndex})">
                        <input 
                            type="radio" 
                            name="question-${index}" 
                            id="q${index}-opt${optionIndex}"
                            value="${optionIndex}"
                        />
                        <label for="q${index}-opt${optionIndex}">
                            ${String.fromCharCode(65 + optionIndex)}. ${option}
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
        
        quizContainer.appendChild(questionDiv);
    });
}

// Handle option selection
function selectOption(questionIndex, optionIndex) {
    // Store the user's answer
    userAnswers[questionIndex] = optionIndex;
    
    // Update UI to show selection
    const questionDiv = quizContainer.children[questionIndex];
    const options = questionDiv.querySelectorAll('.quiz-option');
    
    // Remove 'selected' class from all options
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Add 'selected' class to chosen option
    options[optionIndex].classList.add('selected');
    
    // Check the radio button
    const radio = document.getElementById(`q${questionIndex}-opt${optionIndex}`);
    radio.checked = true;
}

// Listen for submit quiz button
submitQuizButton.addEventListener('click', function() {
    // Check if all questions are answered
    if (Object.keys(userAnswers).length < currentQuiz.length) {
        showError('Please answer all questions before submitting!');
        return;
    }
    
    // Calculate score
    let correctCount = 0;
    currentQuiz.forEach((q, index) => {
        if (userAnswers[index] === q.correctAnswer) {
            correctCount++;
        }
    });
    
    const score = correctCount;
    const total = currentQuiz.length;
    const percentage = Math.round((score / total) * 100);
    
    // Show results
    displayResults(score, total, percentage);
});

// Display quiz results
function displayResults(score, total, percentage) {
    // Hide submit button
    submitQuizButton.classList.add('hidden');
    
    // Show results section
    quizResults.classList.remove('hidden');
    
    // Display score
    let message = '';
    if (percentage >= 80) {
        message = 'Excellent work! 🎉';
    } else if (percentage >= 60) {
        message = 'Good job! 👍';
    } else {
        message = 'Keep studying! 📚';
    }
    
    scoreDisplay.innerHTML = `
        <div class="score">${score}/${total}</div>
        <div class="message">${message} (${percentage}%)</div>
    `;
    
    // Display answer review
    answerReview.innerHTML = '';
    
    currentQuiz.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === q.correctAnswer;
        
        const reviewDiv = document.createElement('div');
        reviewDiv.className = `review-question ${isCorrect ? 'correct' : 'incorrect'}`;
        
        reviewDiv.innerHTML = `
            <div class="review-header">
                <span class="review-icon">${isCorrect ? '✅' : '❌'}</span>
                <span class="question-number">Question ${index + 1}</span>
            </div>
            <div class="review-question-text">${q.question}</div>
            <div class="review-answer correct-answer">
                ✓ Correct Answer: ${String.fromCharCode(65 + q.correctAnswer)}. ${q.options[q.correctAnswer]}
            </div>
            ${!isCorrect ? `
                <div class="review-answer your-answer">
                    ✗ Your Answer: ${String.fromCharCode(65 + userAnswer)}. ${q.options[userAnswer]}
                </div>
            ` : ''}
        `;
        
        answerReview.appendChild(reviewDiv);
    });
    
    // Scroll to results
    quizResults.scrollIntoView({ behavior: 'smooth' });
}

// Listen for retake quiz button
retakeQuizButton.addEventListener('click', function() {
    // Reset answers
    userAnswers = {};
    
    // Redisplay the quiz
    displayQuiz(currentQuiz);
    
    // Scroll to top of quiz
    quizSection.scrollIntoView({ behavior: 'smooth' });
});

// ==================================================
// HELPER FUNCTIONS
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
}

// ==================================================
// EXPORT & COPY FEATURES
// ==================================================

// Copy summary to clipboard
copyButton.addEventListener('click', async function() {
    const summaryText = summaryContent.textContent;
    
    if (!summaryText) {
        showError('No summary to copy!');
        return;
    }
    
    try {
        // Use Clipboard API
        await navigator.clipboard.writeText(summaryText);
        
        // Show success feedback
        const originalText = copyButton.textContent;
        copyButton.textContent = '✅ Copied!';
        copyButton.classList.add('copied');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.classList.remove('copied');
        }, 2000);
        
    } catch (error) {
        console.error('Copy failed:', error);
        showError('Failed to copy. Please select and copy manually.');
    }
});

// Download summary as text file
exportButton.addEventListener('click', function() {
    const summaryText = summaryContent.textContent;
    
    if (!summaryText) {
        showError('No summary to download!');
        return;
    }
    
    // Create a blob (file in memory)
    const blob = new Blob([summaryText], { type: 'text/plain' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    a.download = `study-notes-summary-${timestamp}.txt`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show feedback
    const originalText = exportButton.textContent;
    exportButton.textContent = '✅ Downloaded!';
    
    setTimeout(() => {
        exportButton.textContent = originalText;
    }, 2000);
});

// ==================================================
// DARK MODE TOGGLE
// ==================================================

// Check if user has dark mode preference saved
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️';
}

// Toggle dark mode
darkModeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    
    // Update button icon
    if (document.body.classList.contains('dark-mode')) {
        darkModeToggle.textContent = '☀️';
        localStorage.setItem('darkMode', 'enabled');
    } else {
        darkModeToggle.textContent = '🌙';
        localStorage.setItem('darkMode', 'disabled');
    }
});

// IMPORTANT: Make selectOption available globally for onclick handlers
window.selectOption = selectOption;