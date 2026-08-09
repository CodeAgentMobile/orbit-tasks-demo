// Orbit Tasks UI — fetch + render. Intentionally small and readable:
// this file is where your agent will do most of its demo work.

const list = document.getElementById('task-list');
const emptyHint = document.getElementById('empty-hint');
const form = document.getElementById('new-task-form');
const titleInput = document.getElementById('new-task-title');
const dueInput = document.getElementById('new-task-due');

// Formats an ISO date (YYYY-MM-DD) for the Due chip.
function formatDue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function render(tasks) {
  list.innerHTML = '';
  emptyHint.hidden = tasks.length > 0;
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

    li.append(checkbox, title);

    if (task.due) {
      const due = document.createElement('span');
      due.className = 'due';
      due.textContent = `Due ${formatDue(task.due)}`;
      li.append(due);
    }

    list.append(li);
  }
}

async function load() {
  const res = await fetch('/api/tasks');
  render(await res.json());
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, due: dueInput.value || null }),
  });
  titleInput.value = '';
  dueInput.value = '';
  load();
});

load();
