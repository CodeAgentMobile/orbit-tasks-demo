// Orbit Tasks UI — fetch + render. Intentionally small and readable:
// this file is where your agent will do most of its demo work.

const list = document.getElementById('task-list');
const emptyHint = document.getElementById('empty-hint');
const form = document.getElementById('new-task-form');
const titleInput = document.getElementById('new-task-title');
const dueInput = document.getElementById('new-task-due');
const priorityInput = document.getElementById('new-task-priority');
const filters = document.getElementById('filters');
const progressLabel = document.getElementById('progress-label');
const progressPct = document.getElementById('progress-pct');
const progressBar = document.getElementById('progress-bar');
const themeToggle = document.getElementById('theme-toggle');

let allTasks = [];
let activeFilter = 'all';

// Formats an ISO date (YYYY-MM-DD) for the Due chip.
function formatDue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// True when a task's due date is in the past and it isn't done yet.
// Compares ISO strings (YYYY-MM-DD sorts lexically) to stay correct.
function isOverdue(task) {
  if (!task.due || task.done) return false;
  return task.due < new Date().toISOString().slice(0, 10);
}

function filtered(tasks) {
  if (activeFilter === 'active') return tasks.filter((t) => !t.done);
  if (activeFilter === 'done') return tasks.filter((t) => t.done);
  return tasks;
}

function updateProgress(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressLabel.textContent = `${done} of ${total} done`;
  progressPct.textContent = `${pct}%`;
  progressBar.style.width = `${pct}%`;
}

function render() {
  const tasks = filtered(allTasks);
  list.innerHTML = '';
  emptyHint.hidden = tasks.length > 0;
  updateProgress(allTasks);

  for (const task of tasks) {
    const li = document.createElement('li');
    li.className = task.done ? 'task done' : 'task';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: checkbox.checked }),
      });
      load();
    });

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = task.title;

    const chip = document.createElement('span');
    chip.className = `priority ${task.priority || 'med'}`;
    chip.textContent = (task.priority || 'med').toUpperCase();

    li.append(checkbox, title, chip);

    if (task.due) {
      const due = document.createElement('span');
      due.className = isOverdue(task) ? 'due overdue' : 'due';
      due.textContent = isOverdue(task) ? `Overdue ${formatDue(task.due)}` : `Due ${formatDue(task.due)}`;
      li.append(due);
    }

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'delete';
    del.setAttribute('aria-label', `Delete “${task.title}”`);
    del.textContent = '✕';
    del.addEventListener('click', async () => {
      li.classList.add('removing');
      await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      load();
    });
    li.append(del);

    list.append(li);
  }
}

async function load() {
  const res = await fetch('/api/tasks');
  allTasks = await res.json();
  render();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      due: dueInput.value || null,
      priority: priorityInput.value,
    }),
  });
  titleInput.value = '';
  dueInput.value = '';
  priorityInput.value = 'med';
  load();
});

filters.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter');
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  for (const f of filters.querySelectorAll('.filter')) {
    f.classList.toggle('active', f === btn);
  }
  render();
});

// ── Theme: remember the user's choice, default to their OS preference ──
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('orbit-theme', next);
  applyTheme(next);
});

const savedTheme = localStorage.getItem('orbit-theme');
applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

load();
