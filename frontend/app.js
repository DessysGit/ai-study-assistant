// ============================================
// AI STUDY ASSISTANT - FRONTEND JAVASCRIPT
// ============================================
// This file makes the webpage interactive!
// It handles: file selection, uploading to backend, showing results

// ==================================================
// STEP 1: GET REFERENCES TO HTML ELEMENTS
// ==================================================
// Think of this like giving nicknames to elements on the page
// so we can easily control them with JavaScript

// Get the file input element (where user selects file)
const fileInput = document.getElementById('fileInput');

// Get the label that shows "Choose a file..."
const fileLabel = document.getElementById('fileLabel');

// Get the "Generate Summary" button
const generateButton = document.getElementById('generateButton');

// Get the loading spinner div (shows while processing)
const loading = document.getElementById('loading');

// Get the result section (shows the summary)
const result = document.getElementById('result');

// Get the div where we'll put the actual summary text
const summaryContent = document.getElementById('summaryContent');

// Get the error div (shows if something goes wrong)
const errorDiv = document.getElementById('error');

// Get the elements that show statistics
const originalLength = document.getElementById('originalLength');
const summaryLength = document.getElementById('summaryLength');

// ==================================================
// STEP 2: LISTEN FOR FILE SELECTION
// ==================================================
// This code runs whenever the user selects a file

// addEventListener = "do something when this event happens"
// 'change' = the event that fires when file selection changes
fileInput.addEventListener('change', function() {
    // function() = the code to run when event happens
    
    // Get the file that the user selected
    // files[0] = first file (we only allow one file at a time)
    const file = fileInput.files[0];
    
    // Check if a file was actually selected (user might have canceled)
    if (file) {
        // If yes, update the label to show the file name
        fileLabel.textContent = `📄 ${file.name}`;
        
        // Add a CSS class to make the label green (shows file is selected)
        fileLabel.classList.add('has-file');
        
        // Enable the "Generate Summary" button (remove disabled attribute)
        generateButton.disabled = false;
    } else {
        // If no file selected, reset everything
        fileLabel.textContent = 'Choose a file (PDF, Word, PowerPoint, or Text)';
        fileLabel.classList.remove('has-file');
        generateButton.disabled = true;
    }
});

// ==================================================
// STEP 3: LISTEN FOR BUTTON CLICK
// ==================================================
// This code runs when user clicks "Generate Summary" button

// 'click' = the event that fires when button is clicked
// async = this function will use 'await' for asynchronous operations
generateButton.addEventListener('click', async function() {
    // Get the selected file
    const file = fileInput.files[0];
    
    // Safety check: make sure file exists
    if (!file) {
        showError('Please select a file first!');
        return; // Stop here, don't continue
    }
    
    // PREPARE THE FILE FOR UPLOAD
    // FormData is a special object for sending files to a server
    const formData = new FormData();
    
    // Add the file to FormData with key 'file' (backend expects this key)
    formData.append('file', file);
    
    // SHOW LOADING, HIDE OTHER SECTIONS
    hideAll(); // Hide any previous results or errors
    loading.classList.remove('hidden'); // Show the loading spinner
    
    try {
        // TRY BLOCK: Code that might fail goes here
        // If it fails, the CATCH block will run instead
        
        // SEND FILE TO BACKEND
        // fetch() = JavaScript function to make HTTP requests
        // await = wait for this to complete before moving to next line
        const response = await fetch('http://localhost:5000/api/summarize', {
            method: 'POST',  // POST = we're sending data to the server
            body: formData   // The file we're sending
        });
        
        // CONVERT RESPONSE TO JSON
        // Backend sends JSON, we need to parse it into a JavaScript object
        const data = await response.json();
        
        // CHECK IF REQUEST WAS SUCCESSFUL
        if (response.ok && data.success) {
            // SUCCESS! Show the summary
            
            // Hide loading spinner
            loading.classList.add('hidden');
            
            // Put the summary text into the summaryContent div
            summaryContent.textContent = data.data.summary;
            
            // Show statistics about the summary
            originalLength.textContent = `Original: ${data.data.originalLength.toLocaleString()} characters`;
            summaryLength.textContent = `Summary: ${data.data.summaryLength.toLocaleString()} characters`;
            
            // Show the result section (remove 'hidden' class)
            result.classList.remove('hidden');
            
        } else {
            // FAILURE! Backend responded but something went wrong
            // Hide loading
            loading.classList.add('hidden');
            
            // Show error message from backend
            showError(data.error || 'Failed to generate summary. Please try again.');
        }
        
    } catch (error) {
        // CATCH BLOCK: Runs if anything in TRY block fails
        // This handles network errors, server being down, etc.
        
        console.error('Error:', error); // Log error to browser console (for debugging)
        
        // Hide loading
        loading.classList.add('hidden');
        
        // Show user-friendly error message
        showError('Could not connect to server. Make sure the backend is running on http://localhost:5000');
    }
});

// ==================================================
// HELPER FUNCTIONS
// ==================================================
// These are reusable functions we can call from anywhere

/**
 * Shows an error message to the user
 * @param {string} message - The error message to display
 */
function showError(message) {
    // Put the error message into the error div
    errorDiv.textContent = message;
    
    // Show the error div (remove 'hidden' class)
    errorDiv.classList.remove('hidden');
    
    // Auto-hide error after 5 seconds
    setTimeout(function() {
        errorDiv.classList.add('hidden');
    }, 5000); // 5000 milliseconds = 5 seconds
}

/**
 * Hides all result sections (loading, result, error)
 * Call this before showing new content
 */
function hideAll() {
    // Add 'hidden' class to all these elements
    loading.classList.add('hidden');
    result.classList.add('hidden');
    errorDiv.classList.add('hidden');
}
