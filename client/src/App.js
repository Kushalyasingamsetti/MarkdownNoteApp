import React, { useState, useEffect } from 'react';
import './App.css';
import Footer from './components/Footer';
import { marked } from 'marked';
import Navbar from './components/Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";



function App() {
  const [markdown, setMarkdown] = useState('');
  const [html, setHtml] = useState('');
  const [grammar, setGrammar] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [pinned, setPinned] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);
  const wordCount = markdown.trim().split(/\s+/).filter(word => word).length;
  const charCount = markdown.length;
  const [page, setPage] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);
  // const [tags, setTags] = useState("");

  const notesPerPage = 5;

  const convertMarkdown = async () => {
    const res = await fetch('http://localhost:5000/convert-markdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown })
    });
    const data = await res.json();
    setHtml(data.html);
  };

  const checkGrammar = async () => {
    const res = await fetch('http://localhost:5000/check-grammar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: markdown })
    });
    const data = await res.json();
    setGrammar(data.matches);
  };


  const saveNote = async () => {
    if (!title.trim() || !markdown.trim()) {
      alert("Please enter both title and content before saving.");
      return;
    }
    const noteData = {
  title,
  content: markdown,
  pinned,
  // tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
};

await axios.post("http://localhost:5000/notes", noteData);


    const payload = { title, content: markdown };

    if (editingId) {
      await fetch(`http://localhost:5000/notes/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setEditingId(null);
    } else {
      await fetch('http://localhost:5000/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: markdown,
          pinned: false, 
        }),
      });
    }

    setTitle('');
    setMarkdown('');
    fetchNotes();
    toast.success("Note saved!");
  };

  
const fetchNotes = async () => {
  try {
    const res = await fetch(`http://localhost:5000/notes?page=${page}&limit=${notesPerPage}`);
    const data = await res.json();

    setSavedNotes(Array.isArray(data.notes) ? data.notes : []); // safe fallback
    setTotalNotes(data.total || 0);
  } catch (err) {
    console.error("Failed to fetch notes:", err);
    setSavedNotes([]); // avoid undefined
  }
};


  const deleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    await fetch(`http://localhost:5000/notes/${id}`, { method: 'DELETE' });
    fetchNotes();
    toast.error("Note deleted!");
  };

  const editNote = (note) => {
    setTitle(note.title || '');
    setMarkdown(note.content);
    setEditingId(note._id);
  };

  const togglePin = async (id, currentPinStatus) => {
  try {
    const noteToUpdate = savedNotes.find(note => note._id === id);
    await fetch(`http://localhost:5000/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: noteToUpdate.title,
        content: noteToUpdate.content,
        pinned: !currentPinStatus
      })
    });
    fetchNotes(); // Refresh notes after pinning 
  } catch (err) {
    console.error("Failed to toggle pin:", err);
  }
};


  useEffect(() => {
    fetchNotes();
  }, [page]);

  const filteredNotes = savedNotes.filter(
    (note) =>
      (note.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
return (
  <div className={isDark ? 'bg-dark text-white' : 'bg-light text-dark'} style={{ minHeight: '100vh' }}>
    {/* ✅ Navbar */}
    <Navbar toggleTheme={toggleTheme} isDark={isDark} />

    {/* ✅ Main */}
    <div className="container py-4">
      <h1 className="text-center mb-4">📝 Markdown Note Editor</h1>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Enter note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="form-control mb-3"
        rows={10}
        placeholder="Write your markdown here..."
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
      />
      <div className="text-end text-muted mb-3">
        Words: {wordCount} | Characters: {charCount}
      </div>

      <div className="mb-4">
        <button className="btn btn-primary me-2" onClick={convertMarkdown}>Convert to HTML</button>
        <button className="btn btn-warning me-2" onClick={checkGrammar}>Check Grammar</button>
        <button className="btn btn-success" onClick={saveNote}>💾 Save Note</button>
      </div>

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <h4>🔍 Rendered HTML</h4>
      <div
        className={`border p-3 mb-4 ${isDark ? 'bg-secondary text-light' : 'bg-light'}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <h4>✍️ Grammar Suggestions</h4>
      <ul className="list-group mb-4">
        {grammar.length === 0 ? (
          <li className="list-group-item">No issues found!</li>
        ) : (
          grammar.map((match, idx) => (
            <li key={idx} className="list-group-item">{match.message}</li>
          ))
        )}
      </ul>

      <h4>📝 Saved Notes</h4>
      <ul className="list-group mb-5">
        {[...savedNotes]
          .sort((a, b) => b.pinned - a.pinned)
          .filter((note) =>
            (note.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (note.content || "").toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((note) => (
            <li key={note._id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-start">
                <div style={{ flex: 1 }}>
                  <h5>
                    {note.title || "Untitled"}
                    {note.pinned && <span className="badge bg-warning ms-2">📌</span>}
                  </h5>
                  <p>{note.content}</p>
                  <div className="text-muted">
                    <small>Saved: {new Date(note.createdAt).toLocaleString()}</small><br />
                    <small>Updated: {new Date(note.updatedAt).toLocaleString()}</small><br />
                    <small>Words: {note.content.trim().split(/\s+/).filter(Boolean).length}</small><br />
                    <small>Characters: {note.content ? note.content.length : 0}</small>
                  </div>

                  <a
                    className="btn btn-sm btn-outline-secondary mt-2"
                    // href={`http://localhost:5000/download/${note.title || 'Untitled'}.md`}
                    href={`http://localhost:5000/download/${note.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
                <div>
                  <button
                    className="btn btn-sm btn-info me-2"
                    onClick={() => togglePin(note._id, note.pinned)}
                  >
                    {note.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => editNote(note)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteNote(note._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
      </ul>
      <div className="d-flex justify-content-between mb-5">
  <button
    className="btn btn-outline-secondary"
    disabled={page === 1}
    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
  >
    ⬅️ Previous
  </button>
  <span className="align-self-center">Page {page}</span>
  <button
    className="btn btn-outline-secondary"
    disabled={page * notesPerPage >= totalNotes}
    onClick={() => setPage((prev) => prev + 1)}
  >
    Next ➡️
  </button>
</div>


      <h5 className="mt-4">Live Preview</h5>
      <div className="border p-3 mb-5" dangerouslySetInnerHTML={{ __html: marked.parse(markdown) }} />
    </div>

    {/* ✅ Footer */}
    <Footer />
    <ToastContainer position="top-right" autoClose={2000} />
  </div>
);

}

export default App;
