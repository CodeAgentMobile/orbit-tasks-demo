// Orbit Tasks — zero-dependency demo server.
// Serves the static UI from ./public and a tiny in-memory JSON API.
// No npm install, no build step: `node server.js` and you're live.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ── In-memory task store (reseeds on restart — it's a playground) ──
let nextId = 4;
const tasks = [
  { id: 1, title: 'Review the landing page copy', due: '2026-08-14', done: false, priority: 'high' },
  { id: 2, title: 'Fix the flaky signup test', due: '2026-08-12', done: true, priority: 'med' },
  { id: 3, title: 'Draft the release notes', due: '2026-08-20', done: false, priority: 'low' },
];

const PRIORITIES = ['low', 'med', 'high'];
// Coerce any incoming priority to a known value, defaulting to 'med'.
function normalizePriority(value) {
  return PRIORITIES.includes(value) ? value : 'med';
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1e6) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // ── API ──
  if (url.pathname === '/api/tasks' && req.method === 'GET') {
    return sendJson(res, 200, tasks);
  }
  if (url.pathname === '/api/tasks' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      if (!body.title || typeof body.title !== 'string') {
        return sendJson(res, 400, { error: 'title is required' });
      }
      const task = {
        id: nextId++,
        title: body.title.slice(0, 200),
        due: typeof body.due === 'string' ? body.due : null,
        done: false,
        priority: normalizePriority(body.priority),
      };
      tasks.push(task);
      return sendJson(res, 201, task);
    } catch {
      return sendJson(res, 400, { error: 'invalid JSON body' });
    }
  }
  const idMatch = url.pathname.match(/^\/api\/tasks\/(\d+)$/);
  if (idMatch && req.method === 'PATCH') {
    const task = tasks.find((t) => t.id === Number(idMatch[1]));
    if (!task) return sendJson(res, 404, { error: 'not found' });
    try {
      const body = await readBody(req);
      if (typeof body.done === 'boolean') task.done = body.done;
      if (typeof body.title === 'string') task.title = body.title.slice(0, 200);
      if (PRIORITIES.includes(body.priority)) task.priority = body.priority;
      return sendJson(res, 200, task);
    } catch {
      return sendJson(res, 400, { error: 'invalid JSON body' });
    }
  }
  if (idMatch && req.method === 'DELETE') {
    const idx = tasks.findIndex((t) => t.id === Number(idMatch[1]));
    if (idx === -1) return sendJson(res, 404, { error: 'not found' });
    const [removed] = tasks.splice(idx, 1);
    return sendJson(res, 200, removed);
  }

  // ── Static files ──
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(PUBLIC_DIR, filePath);
  if (!full.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('forbidden');
  }
  fs.readFile(full, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Orbit Tasks listening on http://localhost:${PORT}`);
});
