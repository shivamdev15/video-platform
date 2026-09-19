// server.js
// Backend for the Mini Video Platform.
// Full CRUD on videos, plus likes and comments backed by a real SQLite database.

const express = require('express');
const cors = require('cors');
const db = require('./db');
const { extractYouTubeId } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ---------- VIDEOS ----------

// List all videos, newest first.
app.get('/api/videos', (req, res) => {
  const videos = db
    .prepare('SELECT * FROM videos ORDER BY created_at DESC')
    .all();
  res.json(videos);
});

// Get a single video with its comments.
app.get('/api/videos/:id', (req, res) => {
  const video = db
    .prepare('SELECT * FROM videos WHERE id = ?')
    .get(req.params.id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  const comments = db
    .prepare('SELECT * FROM comments WHERE video_id = ? ORDER BY created_at ASC')
    .all(req.params.id);

  res.json({ ...video, comments });
});

// Create a video from a pasted YouTube link (or raw ID).
app.post('/api/videos', (req, res) => {
  const { title, description, url } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  const youtubeId = extractYouTubeId(url);
  if (!youtubeId) {
    return res.status(400).json({ error: 'Could not find a valid YouTube video in that link.' });
  }

  const result = db
    .prepare('INSERT INTO videos (title, description, youtube_id) VALUES (?, ?, ?)')
    .run(title.trim(), (description || '').trim(), youtubeId);

  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(video);
});

// Edit a video's title/description.
app.put('/api/videos/:id', (req, res) => {
  const { title, description } = req.body;
  const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Video not found.' });
  }
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  db.prepare('UPDATE videos SET title = ?, description = ? WHERE id = ?')
    .run(title.trim(), (description || '').trim(), req.params.id);

  const updated = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete a video (comments cascade automatically).
app.delete('/api/videos/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Like a video.
app.post('/api/videos/:id/like', (req, res) => {
  const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  db.prepare('UPDATE videos SET likes = likes + 1 WHERE id = ?').run(req.params.id);
  const updated = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ---------- COMMENTS ----------

// Add a comment to a video.
app.post('/api/videos/:id/comments', (req, res) => {
  const { author, text } = req.body;
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found.' });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  const result = db
    .prepare('INSERT INTO comments (video_id, author, text) VALUES (?, ?, ?)')
    .run(req.params.id, (author || 'Anonymous').trim(), text.trim());

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(comment);
});

// Delete a comment.
app.delete('/api/comments/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Comment not found.' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Mini Video Platform running on http://localhost:${PORT}`);
});
