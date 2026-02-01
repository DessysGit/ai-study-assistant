// ============================================
// AI STUDY ASSISTANT - MAIN SERVER FILE
// ============================================
// This file sets up the Express server and handles all the routes
// Think of it as the "brain" that receives requests and sends responses

// STEP 1: Import all the packages we need
// ----------------------------------------
const express = require('express');           // Web server framework
const cors = require('cors');                 // Allows frontend to communicate with backend
const dotenv = require('dotenv');             // Loads environment variables from .env file
const multer = require('multer');             // Handles file uploads
const fs = require('fs').promises;            // File system operations (reading/deleting files)
const path = require('path');                 // Helps work with file paths
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Google's Gemini AI

// File parsers - these help us read different file types
const pdfParse = require('pdf-parse');        // Reads PDF files
const mammoth = require('mammoth');           // Reads Word (.docx) files
const officeParser = require('officeparser'); // Reads PowerPoint (.pptx) files

// STEP 2: Load environment variables
// -----------------------------------
// This loads the API key from .env file so we don't expose it in code
dotenv.config();

// STEP 3: Create Express app
// ---------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// STEP 4: Initialize Gemini AI
// -----------------------------
// This creates a connection to Google's AI using your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// STEP 5: Middleware Setup
// -------------------------
// Middleware = functions that process requests before they reach your routes

app.use(cors());                    // Allow cross-origin requests (frontend can talk to backend)
app.use(express.json());            // Parse JSON data in request body
app.use(express.urlencoded({ extended: true })); // Parse form data

// STEP 6: Configure File Upload
// ------------------------------
// This tells multer where to save uploaded files and what to name them

const storage = multer.diskStorage({
  // Where to save files
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save in 'uploads' folder
  },
  // What to name the file
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-originalname.ext
    // Example: 1704123456789-lecture-notes.pdf
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, uniqueSuffix);
  }
});

// File filter - only allow specific file types
const fileFilter = (req, file, cb) => {
  // Allowed file extensions
  const allowedExtensions = ['.pdf', '.docx', '.pptx', '.txt'];
  
  // Allowed MIME types (what the browser says the file is)
  const allowedMimeTypes = [
    'application/pdf',                    // PDF
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint
    'text/plain'                          // Text files
  ];
  
  // Get file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  // Check if file is allowed
  if (allowedExtensions.includes(fileExtension) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // File is allowed
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, PPTX, and TXT files are allowed.'), false);
  }
};

// Create upload middleware with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// STEP 7: Helper Functions
// -------------------------
// These functions help us read different file types and extract text

/**
 * Reads a PDF file and extracts text from it
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
async function readPDF(filePath) {
  try {
    // Read the file as a buffer (raw binary data)
    const dataBuffer = await fs.readFile(filePath);
    
    // Parse the PDF and extract text
    const data = await pdfParse(dataBuffer);
    
    return data.text; // Return extracted text
  } catch (error) {
    console.error('Error reading PDF:', error);
    throw new Error('Failed to read PDF file');
  }
}

/**
 * Reads a Word document (.docx) and extracts text
 * @param {string} filePath - Path to the Word file
 * @returns {Promise<string>} - Extracted text content
 */
async function readWord(filePath) {
  try {
    // Read the file as a buffer
    const dataBuffer = await fs.readFile(filePath);
    
    // Extract text from Word document
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    
    return result.value; // Return extracted text
  } catch (error) {
    console.error('Error reading Word document:', error);
    throw new Error('Failed to read Word document');
  }
}

/**
 * Reads a PowerPoint file (.pptx) and extracts text
 * @param {string} filePath - Path to the PowerPoint file
 * @returns {Promise<string>} - Extracted text content
 */
async function readPowerPoint(filePath) {
  try {
    // officeParser can read various Office formats including PowerPoint
    const text = await officeParser.parseOfficeAsync(filePath);
    
    return text; // Return extracted text
  } catch (error) {
    console.error('Error reading PowerPoint:', error);
    throw new Error('Failed to read PowerPoint file');
  }
}

/**
 * Reads a text file
 * @param {string} filePath - Path to the text file
 * @returns {Promise<string>} - File content
 */
async function readTextFile(filePath) {
  try {
    // Read text file with UTF-8 encoding
    const text = await fs.readFile(filePath, 'utf-8');
    return text;
  } catch (error) {
    console.error('Error reading text file:', error);
    throw new Error('Failed to read text file');
  }
}

/**
 * Main function that reads any supported file type
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromFile(filePath) {
  // Get file extension to determine file type
  const extension = path.extname(filePath).toLowerCase();
  
  // Call appropriate function based on file type
  switch (extension) {
    case '.pdf':
      return await readPDF(filePath);
    case '.docx':
      return await readWord(filePath);
    case '.pptx':
      return await readPowerPoint(filePath);
    case '.txt':
      return await readTextFile(filePath);
    default:
      throw new Error('Unsupported file type');
  }
}

// STEP 8: API Routes
// ------------------
// These are the endpoints that the frontend will call

/**
 * Test route to check if server is running
 * GET http://localhost:5000/
 */
app.get('/', (req, res) => {
  res.json({
    message: 'AI Study Assistant API is running!',
    endpoints: {
      health: 'GET /',
      summarize: 'POST /api/summarize',
      quiz: 'POST /api/generate-quiz (coming soon)'
    }
  });
});

/**
 * Route to upload file and generate summary
 * POST http://localhost:5000/api/summarize
 * Expects: file upload with key 'file'
 */
app.post('/api/summarize', upload.single('file'), async (req, res) => {
  try {
    // VALIDATION: Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a file.'
      });
    }
    
    console.log('File uploaded:', req.file.filename);
    
    // STEP 1: Extract text from uploaded file
    const filePath = req.file.path;
    const extractedText = await extractTextFromFile(filePath);
    
    // Check if we got any text
    if (!extractedText || extractedText.trim().length === 0) {
      // Delete the uploaded file since we can't process it
      await fs.unlink(filePath);
      
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from file. File may be empty or corrupted.'
      });
    }
    
    console.log('Text extracted, length:', extractedText.length, 'characters');
    
    // STEP 2: Send text to Gemini AI for summarization
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create a prompt for the AI
    const prompt = `You are a helpful study assistant. Please provide a clear, concise summary of the following study notes. Focus on the main concepts, key points, and important details. Format the summary with bullet points for easy reading.

Study Notes:
${extractedText}

Summary:`;
    
    // Generate summary using AI
    console.log('Generating summary with Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    
    console.log('Summary generated successfully!');
    
    // STEP 3: Clean up - delete the uploaded file
    await fs.unlink(filePath);
    console.log('Temporary file deleted');
    
    // STEP 4: Send response to frontend
    res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        summary: summary,
        originalLength: extractedText.length,
        summaryLength: summary.length
      }
    });
    
  } catch (error) {
    console.error('Error in /api/summarize:', error);
    
    // If file was uploaded, delete it
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    // Send error response
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing your file'
    });
  }
});

// STEP 9: Start Server
// --------------------
app.listen(PORT, () => {
  console.log('==========================================');
  console.log('🚀 AI Study Assistant Server Started!');
  console.log('==========================================');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📂 Upload folder: ${path.join(__dirname, 'uploads')}`);
  console.log(`🤖 AI Model: Gemini Pro`);
  console.log('==========================================');
  console.log('Ready to help students study! 📚✨');
  console.log('==========================================\n');
});
