# 🎓 AI Study Assistant

An AI-powered tool that helps students study smarter by automatically summarizing their study notes using Google's Gemini AI.

**Upload your lecture notes (PDF, Word, PowerPoint, or Text) and get an instant AI-generated summary!**

---

## ✨ Features

- 📄 **Multiple file formats**: Supports PDF, Word (.docx), PowerPoint (.pptx), and text files
- 🤖 **AI-powered**: Uses Google's Gemini AI (completely free!)
- ⚡ **Fast processing**: Get summaries in seconds
- 🎨 **Beautiful UI**: Modern, responsive design that works on all devices
- 🔒 **Secure**: Files are processed and immediately deleted from the server
- 💯 **Free to use**: No credit card, no subscription, 100% free

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- A Google account (for free Gemini API key)

### Step 1: Get Your Free Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key (you'll need this in Step 3)

### Step 2: Install Dependencies

Open your terminal/command prompt and navigate to the backend folder:

```bash
cd backend
npm install
```

This will install all the required packages (Express, Gemini AI, file parsers, etc.)

### Step 3: Configure API Key

1. Open the `backend/.env` file
2. Paste your Gemini API key:

```
GEMINI_API_KEY=your_actual_api_key_here
PORT=5000
```

### Step 4: Start the Backend Server

Still in the backend folder, run:

```bash
npm run dev
```

You should see:
```
==========================================
🚀 AI Study Assistant Server Started!
==========================================
📡 Server running on: http://localhost:5000
==========================================
```

**Keep this terminal window open!** The server needs to keep running.

### Step 5: Open the Frontend

1. Open a **NEW** terminal/command prompt
2. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
3. Open `index.html` in your browser:
   - **Windows**: `start index.html`
   - **Mac**: `open index.html`
   - **Linux**: `xdg-open index.html`
   - Or just double-click the file

---

## 📖 How to Use

1. **Click** "Choose a file" or drag and drop your study notes
2. **Select** a PDF, Word, PowerPoint, or text file
3. **Click** "Generate Summary"
4. **Wait** a few seconds while AI analyzes your notes
5. **Read** your AI-generated summary!

---

## 📁 Project Structure

```
ai-study-assistant/
├── backend/                    # Server-side code
│   ├── server.js              # Main server file (heavily commented!)
│   ├── package.json           # Dependencies list
│   ├── .env                   # Your API key (DO NOT COMMIT!)
│   ├── .env.example           # Template for .env
│   ├── .gitignore            # Files to ignore in git
│   ├── uploads/               # Temporary file storage (auto-deleted)
│   └── README.md              # Backend documentation
│
├── frontend/                   # Client-side code
│   ├── index.html             # Main webpage
│   ├── styles.css             # Styling (makes it pretty!)
│   ├── app.js                 # JavaScript logic (heavily commented!)
│   └── (no dependencies!)     # Pure HTML/CSS/JS, no build needed!
│
└── README.md                   # This file!
```

---

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web server framework
- **Google Gemini AI** - AI for text summarization (FREE!)
- **Multer** - File upload handling
- **pdf-parse** - Extract text from PDFs
- **mammoth** - Extract text from Word documents
- **officeparser** - Extract text from PowerPoint presentations

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with animations
- **Vanilla JavaScript** - No frameworks, pure JS!

---

## 🎨 Supported File Types

| File Type | Extension | Max Size |
|-----------|-----------|----------|
| PDF | `.pdf` | 10MB |
| Word Document | `.docx` | 10MB |
| PowerPoint | `.pptx` | 10MB |
| Text File | `.txt` | 10MB |

**Note**: Older formats (.doc, .ppt) are not supported. Save as newer formats (.docx, .pptx).

---

## 🔧 Troubleshooting

### "Could not connect to server"
- ✅ Make sure backend is running (`npm run dev` in backend folder)
- ✅ Check that it's running on `http://localhost:5000`
- ✅ Look at the backend terminal for error messages

### "Invalid API key" or "API key not found"
- ✅ Make sure you added your Gemini API key to `.env` file
- ✅ Check there are no extra spaces around the API key
- ✅ Make sure the key is correct (generate a new one if needed)

### File upload fails
- ✅ Check file is under 10MB
- ✅ Check file extension is .pdf, .docx, .pptx, or .txt
- ✅ Make sure file is not corrupted (try opening it first)

### "Could not extract text from file"
- ✅ Make sure the file actually contains text (not just images)
- ✅ For scanned PDFs, the text needs to be selectable (OCR required)
- ✅ Try converting the file to a different format

---

## 🚀 Future Enhancements (Ideas for you to add!)

### Phase 2: Quiz Generation
- Generate multiple-choice questions from notes
- Test your knowledge instantly
- Track your quiz scores

### Phase 3: Flashcards
- Auto-generate flashcards from notes
- Spaced repetition system
- Export to Anki

### Phase 4: Chat with Your Notes
- Ask questions about your notes
- Get instant answers from AI
- Clarify confusing concepts

### Phase 5: User Accounts
- Save your summaries
- Track study progress
- Share notes with classmates

---

## 📚 Learning Resources

### Understanding the Code
Every file has extensive comments explaining:
- What each line does
- Why we do it that way
- How it connects to other parts

**Start here:**
1. Read `frontend/app.js` - See how the UI works
2. Read `backend/server.js` - See how the backend processes files
3. Try modifying the code and see what happens!

### Next Steps to Learn
1. **JavaScript Basics**: [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
2. **Node.js**: [Node.js Getting Started](https://nodejs.org/en/docs/guides/getting-started-guide/)
3. **Express.js**: [Express.js Guide](https://expressjs.com/en/starter/installing.html)
4. **APIs**: [Working with APIs](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Introduction)

---

## 🎯 What You Learned

By building this project, you now understand:

✅ **Full-stack development** - Frontend talks to backend
✅ **File handling** - Upload, process, delete files
✅ **API integration** - Call external services (Gemini AI)
✅ **Async JavaScript** - Promises, async/await
✅ **Error handling** - Try/catch blocks
✅ **Environment variables** - Keep secrets safe
✅ **User experience** - Loading states, error messages
✅ **Git workflow** - .gitignore, commits, pushes

---

## 🤝 Contributing

Want to add features? Here's how:

1. Fork this repository
2. Create a new branch (`git checkout -b feature/quiz-generation`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m "Add quiz generation feature"`)
6. Push to your fork (`git push origin feature/quiz-generation`)
7. Open a Pull Request

---

## 📝 License

MIT License - Feel free to use this for learning, portfolio, or commercial projects!

---

## 💡 Tips for Your Portfolio

When showcasing this project:

1. **Explain the problem**: Students struggle with long, dense study materials
2. **Your solution**: AI-powered summarization in seconds
3. **Technologies used**: Full-stack JavaScript, AI integration
4. **Your role**: Built from scratch, handled file processing, API integration
5. **Impact**: Helps students study more efficiently

**Add screenshots** of the app in action!

---

## 🙏 Acknowledgments

- Google for providing free Gemini AI API
- The open-source community for amazing packages
- You, for building this and learning!

---

## 📞 Need Help?

- Check the troubleshooting section above
- Read the comments in the code files
- Google the error message
- Ask on Stack Overflow
- Check the package documentation

---

**Built with ❤️ for students, by a student**

Start Date: [Add your date]
Status: ✅ MVP Complete - Working and ready to use!

Happy studying! 📚✨
