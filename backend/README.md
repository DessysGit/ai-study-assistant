# AI Study Assistant - Backend

## What This Does
This is the backend server for the AI Study Assistant. It:
1. Accepts file uploads (PDF, Word, PowerPoint, Text)
2. Extracts text from these files
3. Sends the text to Google's Gemini AI
4. Returns a summarized version to help you study

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Your Free Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### 3. Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Paste your Gemini API key in the `.env` file

```
GEMINI_API_KEY=your_actual_key_here
PORT=5000
```

### 4. Run the Server

Development mode (auto-restarts on changes):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start at: http://localhost:5000

## API Endpoints

### GET /
Test endpoint to check if server is running

### POST /api/summarize
Upload a file and get a summary

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (PDF, DOCX, PPTX, or TXT)

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "lecture-notes.pdf",
    "summary": "Summary of your notes...",
    "originalLength": 5000,
    "summaryLength": 500
  }
}
```

## File Support
- ✅ PDF files (.pdf)
- ✅ Word documents (.docx)
- ✅ PowerPoint presentations (.pptx)
- ✅ Text files (.txt)
- ❌ Images, videos, or other formats

## File Size Limit
Maximum file size: 10MB

## Tech Stack
- Node.js + Express
- Google Gemini AI (Free tier)
- Multer (file uploads)
- pdf-parse (PDF reading)
- mammoth (Word reading)
- officeparser (PowerPoint reading)
