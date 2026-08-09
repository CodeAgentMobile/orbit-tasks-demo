# Orbit Tasks — your CodeAgent demo playground

A tiny task tracker built with **zero dependencies** (pure Node.js) so your
agent can start working on it instantly — no install step, nothing to
configure.

This repo exists for one thing: **seeing your AI agent work on real code,
from your phone.**

## Try these (in order)

1. **Get a tour** — ask:
   > What does this project do? Give me a quick tour.

2. **Find the bug** — the "Due" column shows every date one day early.
   Ask:
   > Users report due dates show one day early. Find and fix the bug.

3. **Ship a feature** — ask:
   > Add a priority field (low/med/high) to tasks — API and UI.

4. **See it live** — tap **Preview** to run the app and watch your changes
   render in the built-in browser.

## Run it

```bash
node server.js
# → http://localhost:3000
```

No `npm install`. No build. The API keeps tasks in memory (restarting
resets the seed data — that's fine for a playground).

## Layout

```
server.js          HTTP server + JSON API (GET/POST/PATCH /api/tasks)
public/index.html  UI shell
public/app.js      Fetch + render logic (the due-date bug lives here)
public/style.css   Styles
```

Have fun — anything you break, the agent can fix. That's the point.
