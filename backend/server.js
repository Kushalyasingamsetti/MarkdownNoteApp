const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const marked = require("marked");
const axios = require("axios");
const mongoose = require("mongoose");
const Note = require("./models/Note");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.error("MongoDB Error:", err));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Base route
app.get("/", (req, res) => {
  res.send("Markdown Note-Taking API is running...");
});

// Upload route
// app.post("/upload", upload.single("file"), (req, res) => {
//   if (!req.file) return res.status(400).json({ message: "No file uploaded" });
//   res.json({ message: "File uploaded successfully", filePath: `/uploads/${req.file.filename}` });
// });

const notesDir = path.join(__dirname, "notes");
if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir);
}

// Save note to file system
app.post("/save-note", (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) return res.status(400).json({ message: "Filename and content required" });

  const filePath = path.join(__dirname, "notes", `${filename}.md`);
  fs.writeFile(filePath, content, (err) => {
    if (err) return res.status(500).json({ message: "Error saving note" });
    res.json({ message: "Note saved successfully", filePath });
  });
});

// Convert Markdown
app.post("/convert-markdown", (req, res) => {
  const { markdown } = req.body;
  if (!markdown) return res.status(400).json({ message: "Markdown is required" });

  try {
    const html = marked.parse(markdown);
    res.json({ html });
  } catch {
    res.status(500).json({ message: "Error converting markdown to HTML" });
  }
});

// Check grammar
app.post("/check-grammar", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Text is required" });

  try {
    const response = await axios.post("https://api.languagetoolplus.com/v2/check", null, {
      params: { text, language: "en-US" },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    res.json(response.data);
  } catch (err) {
    console.error("Grammar check error:", err.message);
    res.status(500).json({ message: "Failed to check grammar" });
  }
});

// Create a new note (MongoDB)
app.post("/notes", async (req, res) => {
  const { title, content, pinned} = req.body;
  if (!title || !content) return res.status(400).json({ message: "Title and content required" });

  try {
    const note = new Note({ title, content, pinned: pinned || false  });
    await note.save();
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase(); // avoid invalid file names
    const filePath = path.join(__dirname, "notes", `${safeTitle}.md`);
    fs.writeFileSync(filePath, content);
    res.status(201).json({ message: "Note saved", note });
  } catch {
    res.status(500).json({ message: "Failed to save note" });
  }
});

// Get paginated notes (MongoDB)
app.get("/notes", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  try {
    const notes = await Note.find()
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Note.countDocuments();
    res.json({ notes, total });
  } catch {
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

// Read notes from file system
app.get("/fs-notes", (req, res) => {
  const notesDir = path.join(__dirname, "notes");
  fs.readdir(notesDir, (err, files) => {
    if (err) return res.status(500).json({ message: "Failed to read notes folder" });
    const markdownFiles = files.filter(file => file.endsWith(".md"));
    res.json({ notes: markdownFiles });
  });
});

app.get("/note/:filename", (req, res) => {
  const filePath = path.join(__dirname, "notes", req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Note not found" });

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ message: "Error reading note" });
    res.json({ filename: req.params.filename, content: data });
  });
});

app.get("/note-html/:filename", (req, res) => {
  const filePath = path.join(__dirname, "notes", req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Note not found" });

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ message: "Error reading file" });
    const htmlContent = marked.parse(data);
    res.send(htmlContent);
  });
});



app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "notes", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.download(filePath);
});


// Update note
app.put("/notes/:id", async (req, res) => {
  const { title, content, pinned } = req.body;

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, pinned },
      { new: true }
    );
    if (!updatedNote) return res.status(404).json({ message: "Note not found" });
    res.json(updatedNote);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
});

// Delete note
app.delete("/notes/:id", async (req, res) => {
  try {
    const result = await Note.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
