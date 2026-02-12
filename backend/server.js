// ============================================
// AI STUDY ASSISTANT - MAIN SERVER FILE
// ============================================
// This file sets up the Express server and handles all the routes

// Import all the packages we need
// ----------------------------------------
const express = require('express');           // Web server framework
const cors = require('cors');                 // Allows frontend to communicate with backend
const dotenv = require('dotenv');             // Loads environment variables from .env file
const multer = require('multer');             // Handles file uploads
const fs = require('fs').promises;            // File system operations (reading/deleting files)
const path = require('path');                 // Helps work with file paths
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Google's Gemini AI
const Groq = require('groq-sdk'); // Groq AI

// File parsers - these help us read different file types
const pdfParse = require('pdf-parse');        // Reads PDF files
const mammoth = require('mammoth');           // Reads Word (.docx) files
const officeParser = require('officeparser'); // Reads PowerPoint (.pptx) files

// Simple in-memory rate limiting with automatic cleanup
// Good for single-instance deployments (Render free tier, etc.)

const requestCounts = new Map();
const RATE_LIMIT = 50; // Max requests per hour per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup old entries every 5 minutes

// Cleanup old entries periodically to prevent memory leak
setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [ip, userData] of requestCounts.entries()) {
        // Remove entries older than the rate window
        if (now > userData.resetTime) {
            requestCounts.delete(ip);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} old rate limit entries`);
        console.log(`📊 Active IPs being tracked: ${requestCounts.size}`);
    }
}, CLEANUP_INTERVAL);

// Middleware to check rate limits
function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    
    // Get or create user data
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { 
            count: 1, 
            resetTime: now + RATE_WINDOW,
            firstRequest: now
        });
        return next();
    }
    
    const userData = requestCounts.get(ip);
    
    // Reset if window expired
    if (now > userData.resetTime) {
        requestCounts.set(ip, { 
            count: 1, 
            resetTime: now + RATE_WINDOW,
            firstRequest: now
        });
        return next();
    }
    
    // Check if over limit
    if (userData.count >= RATE_LIMIT) {
        const resetIn = Math.ceil((userData.resetTime - now) / 1000 / 60); // minutes
        console.log(`⚠️ Rate limit exceeded for IP: ${ip}`);
        return res.status(429).json({
            success: false,
            error: `Rate limit exceeded. Please try again in ${resetIn} minutes.`,
            retryAfter: resetIn
        });
    }
    
    // Increment count
    userData.count++;
    
    // Optional: Log high usage
    if (userData.count > RATE_LIMIT * 0.8) {
        console.log(`📊 IP ${ip} has used ${userData.count}/${RATE_LIMIT} requests`);
    }
    
    next();
}

// Add rate limit info to response headers
function addRateLimitHeaders(req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userData = requestCounts.get(ip);
    
    if (userData) {
        res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - userData.count));
        res.setHeader('X-RateLimit-Reset', new Date(userData.resetTime).toISOString());
    }
    
    next();
}

// Load environment variables
// -----------------------------------
// This loads the API key from .env file so we don't expose it in code
dotenv.config();

// Create Express app
// ---------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize AI Models
// -----------------------------
// Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Groq AI (backup)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Middleware Setup
// -------------------------
// Middleware = functions that process requests before they reach routes

app.use(cors());                    // Allow cross-origin requests (frontend can talk to backend)
app.use(express.json());            // Parse JSON data in request body
app.use(express.urlencoded({ extended: true })); // Parse form data

// Apply rate limiting to all routes
app.use(rateLimitMiddleware);
app.use(addRateLimitHeaders);

// Configure File Upload
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

// Helper Functions
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

/**
 * Smart AI function that tries Gemini first, falls back to Groq if quota exceeded
 * @param {string} prompt - The prompt to send to AI
 * @returns {Promise<string>} - AI response text
 */
async function generateAIResponse(prompt) {
  // Try Gemini first
  try {
    console.log('Trying Gemini AI...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log('✅ Gemini succeeded');
    return response.text();
  } catch (geminiError) {
    console.log('⚠️ Gemini failed:', geminiError.message);
    
    // Check if it's a quota error
    if (geminiError.message.includes('quota') || 
        geminiError.message.includes('429') ||
        geminiError.message.includes('rate limit')) {
      
      console.log('🔄 Quota exceeded, switching to Groq...');
      
      // Try Groq as backup
      try {
        const groqResponse = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          model: "llama-3.3-70b-versatile", // Fast and good quality
          temperature: 0.7,
          max_tokens: 2048
        });
        
        console.log('✅ Groq succeeded');
        return groqResponse.choices[0].message.content;
        
      } catch (groqError) {
        console.error('❌ Groq also failed:', groqError.message);
        throw new Error('Both AI services are unavailable. Please try again later.');
      }
      
    } else {
      // Not a quota error, re-throw original error
      throw geminiError;
    }
  }
}

// API Routes
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
      chat: 'POST /api/chat'
    }
  });
});

/**
 * Route to upload file and generate summary
 * POST http://localhost:5000/api/summarize
 * Expects: file upload with key 'file'
 */
app.post('/api/summarize', upload.array('files', 10), async (req, res) => {
  try {
    // VALIDATION: Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded. Please upload at least one file.'
      });
    }
    
    console.log('Files uploaded:', req.files.length);
    
    // STEP 1: Extract text from ALL uploaded files
    let combinedText = '';
    
    for (const file of req.files) {
      console.log('Processing:', file.filename);
      const filePath = file.path;
      const extractedText = await extractTextFromFile(filePath);
      
      // Add file separator
      combinedText += `\n\n=== ${file.originalname} ===\n\n`;
      combinedText += extractedText;
    }
    
    // Check if we got any text
    if (!combinedText || combinedText.trim().length === 0) {
      // Delete the uploaded files since we can't process them
      for (const file of req.files) {
        await fs.unlink(file.path);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from file. File may be empty or corrupted.'
      });
    }
    
    console.log('Text combined, length:', combinedText.length, 'characters');
    
    // STEP 2: Send text to AI for summarization (auto-switches between models)
    const prompt = `You are a helpful study assistant. Please provide a clear, concise summary of the following study notes. Focus on the main concepts, key points, and important details. Format the summary with bullet points for easy reading.

Study Notes:
${combinedText}

Summary:`;
    
    // Generate summary using smart AI function (tries Gemini, falls back to Groq)
    console.log('Generating summary...');
    const summary = await generateAIResponse(prompt);
    console.log('Summary generated successfully!');
    
    // STEP 3: Clean up - delete the uploaded file
    for (const file of req.files) {
      await fs.unlink(file.path);
    }
    console.log('Temporary files deleted');
    
    // STEP 4: Send response to frontend
    res.json({
      success: true,
      data: {
        filename: req.files.map(f => f.originalname).join(', '),
        filesCount: req.files.length,
        summary: summary,
        originalLength: combinedText.length,
        summaryLength: summary.length
      }
    });
    
  } catch (error) {
    console.error('Error in /api/summarize:', error);
    
    // If files were uploaded, delete them
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }
    
    // Send error response
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing your file'
    });
  }
});

// Routes to chat notes
app.post('/api/chat', async (req, res) => {
  try {
    // VALIDATION: Check if we have both noteText and question
    const { noteText, question } = req.body;
  
  if (!noteText || !question) {
    return res.status(400).json({
      success: false,
      error: 'Both noteText and question are required.'
    });
  }

  // Check if question is not empty
  if (question.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Question cannot be empty.'
    });
  }

  console.log("Chat request received");
  console.log('Question:', question);
  console.log('Note text length:', noteText.length, 'characters');

  // STEP 1: Send question and context to AI (auto-switches between models)
  const prompt = `You are a helpful study assistant. A student has uploaded their study notes and has a question about them.

Study Notes:
${noteText}

Student's Question:
${question}

Instructions:
- Answer the questions based only on the information in the study notes above
- If the answer is not in the notes, say "I don't see that information in your notes, but..." and provide general help
- Be clear, concise and educational
- Use examples from the notes when relevant
- Format your response for easy reading

Answer:`;

  // Generate answer using smart AI function (tries Gemini, falls back to Groq)
  console.log('Generating answer...');
  const answer = await generateAIResponse(prompt);
  console.log('Answer generated successfully!');

  // STEP 2: Send response to frontend
  res.json({
    success: true,
    data: {
      question: question,
      answer: answer
    }
  });

} catch (error) {
  console.error('Error in /api/chat:', error)

  // Send error request
  res.status(500).json({
    success: false,
    error: error.message || 'An error occurred while processing your question'
  });
}
});

// Route to generate quiz questions from notes
app.post('/api/generate-quiz', async (req, res) => {
  try {
    // VALIDATION: Check if we have noteText
    const { noteText } = req.body;

    if (!noteText) {
      return res.status(400).json({
        success: false,
        error: 'noteText is required.'
      });
    }

    console.log('Quiz generation request received');
    console.log('Note text length:', noteText.length, 'characters');

    // STEP 1: Send to AI to generate quiz (auto-switches between models)
    const prompt = `You are a helpful study assistant. Generate a multiple choice quiz based on the following study notes.

Study Notes:
${noteText}

Instructions:
- Generate 5 multiple choice questions that test understanding of the key concepts
- Each question should have 4 options (A, B, C, D)
- Only ONE option should be correct
- Questions should cover different topics from the notes
- Make questions challenging but fair

IMPORTANT: Respond ONLY with valid JSON in this exact format, no markdown, no code blocks, no extra text:

{
  "questions": [
    {
      "question": "What is the main concept?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}

The correctAnswer is the index (0, 1, 2, or 3) of the correct option.

Generate the quiz now:`;
    
    // Generate quiz using smart AI function (tries Gemini, falls back to Groq)
    console.log('Generating quiz...');
    let quizText = await generateAIResponse(prompt);

// Clean up the response - remove markdown code blocks if present
quizText = quizText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

console.log('Quiz generated, parsing JSON...');

// Parse the JSON
const quizData = JSON.parse(quizText);

// Validate the quiz structure
if (!quizData.questions || !Array.isArray(quizData.questions)) {
  throw new Error('Invalid quiz format received from AI');
}
console.log('Quiz generated successfully!', quizData.questions.length, 'questions');

// Send response to frontend
res.json({
  success: true,
  data: quizData
});
  } catch (error) {
    console.error('Error in /api/generate-quiz:', error);

    // Send error message
    res.status(500).json({
      success:false,
      error: error.message || 'An error occurred while generating quiz'
    });
  }
});

// Start Server
// --------------------
app.listen(PORT, () => {
  console.log('🚀 AI Study Assistant Server Started!');
  console.log('Ready to help students study! 📚✨');
});
