# ▶️ Mini Video Platform

A small YouTube-inspired app: paste a YouTube link, catalog it, and let people like and comment on it — all backed by a real database.

**🔗 Live demo: [video-platform-ifxf.onrender.com](https://video-platform-ifxf.onrender.com)** (may take 30-50 seconds to load on first visit — free tier sleeps when idle. Note: the database resets on redeploys, so test data may not persist long-term.)

## What it does

- **Add videos** by pasting any YouTube URL (or a raw video ID)
- **Browse** a homepage grid with thumbnails, pulled automatically from YouTube
- **Watch** videos embedded directly on the page
- **Like** videos, with the count stored permanently
- **Comment** on videos, with full delete support
- **Edit and delete** videos entirely

This is full CRUD (Create, Read, Update, Delete) on real relational data — videos have many comments, and deleting a video cleans up its comments automatically.

## Tech stack

- **Backend:** Node.js + Express
- **Database:** SQLite (via Node's built-in `node:sqlite` module) — a real relational database that lives in a single file, no external account, service, or extra dependency needed
- **Frontend:** Vanilla HTML/CSS/JavaScript, single-page app style (no framework)

## Running it locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000` in your browser.

The database file (`data.db`) is created automatically on first run — no setup required.

## Why I built this

After building an AI-powered tool for my first project, I wanted to practice real CRUD fundamentals and working with relational data (a video "has many" comments) — the kind of thing most backend jobs actually involve day to day.

## Possible improvements

- User accounts, so likes/comments are tied to a real person instead of anonymous
- Pagination for the video grid once there are many videos
- Search and category filters
