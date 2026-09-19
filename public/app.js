const homeView = document.getElementById('homeView');
const addView = document.getElementById('addView');
const detailView = document.getElementById('detailView');
const videoGrid = document.getElementById('videoGrid');
const emptyState = document.getElementById('emptyState');
const addForm = document.getElementById('addForm');
const addError = document.getElementById('addError');
const detailContent = document.getElementById('detailContent');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(dateStr) {
  const date = new Date(dateStr + 'Z');
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function switchView(view) {
  [homeView, addView, detailView].forEach((v) => v.classList.add('hidden'));
  view.classList.remove('hidden');
}

async function showHome() {
  switchView(homeView);
  const res = await fetch('/api/videos');
  const videos = await res.json();

  if (videos.length === 0) {
    videoGrid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  videoGrid.innerHTML = videos
    .map(
      (v) => `
    <div class="card" onclick="showDetail(${v.id})">
      <img src="https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg" alt="${escapeHtml(v.title)}" />
      <div class="card-body">
        <h3>${escapeHtml(v.title)}</h3>
        <div class="card-meta">👍 ${v.likes} · ${timeAgo(v.created_at)}</div>
      </div>
    </div>
  `
    )
    .join('');
}

function showAddForm() {
  addForm.reset();
  addError.textContent = '';
  switchView(addView);
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addError.textContent = '';

  const url = document.getElementById('addUrl').value;
  const title = document.getElementById('addTitle').value;
  const description = document.getElementById('addDescription').value;

  try {
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title, description }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    showHome();
  } catch (err) {
    addError.textContent = err.message;
  }
});

async function showDetail(id) {
  switchView(detailView);
  detailContent.innerHTML = '<p>Loading...</p>';

  const res = await fetch(`/api/videos/${id}`);
  if (!res.ok) {
    detailContent.innerHTML = '<p>Video not found.</p>';
    return;
  }
  const video = await res.json();
  renderDetail(video);
}

function renderDetail(video) {
  detailContent.innerHTML = `
    <div class="video-embed">
      <iframe src="https://www.youtube.com/embed/${video.youtube_id}" allowfullscreen></iframe>
    </div>
    <div class="detail-header">
      <div>
        <h2>${escapeHtml(video.title)}</h2>
      </div>
    </div>
    <p class="detail-desc">${escapeHtml(video.description || 'No description.')}</p>
    <div class="video-actions">
      <button class="like-btn" onclick="likeVideo(${video.id})">👍 Like (${video.likes})</button>
      <button class="secondary" onclick="deleteVideo(${video.id})">Delete Video</button>
    </div>

    <div class="comments-section">
      <h3>Comments (${video.comments.length})</h3>
      <form class="comment-form" onsubmit="addComment(event, ${video.id})">
        <input type="text" id="commentAuthor" placeholder="Your name (optional)" />
        <textarea id="commentText" placeholder="Add a comment..." required></textarea>
        <button type="submit" style="align-self:flex-start;">Post Comment</button>
      </form>
      <div id="commentsList">
        ${video.comments
          .map(
            (c) => `
          <div class="comment" id="comment-${c.id}">
            <div class="comment-author">${escapeHtml(c.author)}</div>
            <div class="comment-text">${escapeHtml(c.text)}</div>
            <div class="comment-time">${timeAgo(c.created_at)} · <button class="delete-link" onclick="deleteComment(${c.id}, ${video.id})">delete</button></div>
          </div>
        `
          )
          .join('') || '<p style="color: var(--muted);">No comments yet.</p>'}
      </div>
    </div>
  `;
}

async function likeVideo(id) {
  const res = await fetch(`/api/videos/${id}/like`, { method: 'POST' });
  const updated = await res.json();
  showDetail(id);
}

async function deleteVideo(id) {
  if (!confirm('Delete this video? This cannot be undone.')) return;
  await fetch(`/api/videos/${id}`, { method: 'DELETE' });
  showHome();
}

async function addComment(e, videoId) {
  e.preventDefault();
  const author = document.getElementById('commentAuthor').value;
  const text = document.getElementById('commentText').value;

  await fetch(`/api/videos/${videoId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, text }),
  });

  showDetail(videoId);
}

async function deleteComment(commentId, videoId) {
  await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
  showDetail(videoId);
}

// Initial load
showHome();
