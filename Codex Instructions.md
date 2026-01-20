# Codex Instructions

Use this file to capture project-specific guidance for working on the Math Game repo (how to run it locally, coding conventions, folder structure, and any do/don't rules).

## Quick Notes
- Primary entry point: `index.html`

## Instructions: Add Home Menu + Question Set Pipeline

Goal: Add a home menu screen that lets students pick between:
- `7th grade questions` (use the existing question set already implemented)
- `7th advanced` (not implemented yet, but must have a pipeline ready)
- `ISAT` (not implemented yet, but must have a pipeline ready)

### UX Requirements
- Home menu is the first screen shown on load.
- When a student selects a question set, persist the selection in `localStorage` and route into the existing game UI.
- Provide a way to return to the home menu from the game UI (e.g., a `Home` button in the sidebar/topbar).
- For not-yet-implemented sets (`7th advanced`, `ISAT`):
  - They should be selectable.
  - If their data file is missing, show a clear message like: "Coming soon" and keep the student on the home menu (do not crash).

### Data / Pipeline Requirements (Questions)
Create a stable mechanism for loading different question pools without rewriting game logic.

1) Define question set keys and files:
- `grade7` -> `data/questions_grade7.json` (this should contain the current 200 Rational Number Arithmetic questions)
- `grade7_advanced` -> `data/questions_grade7_advanced.json` (placeholder file can exist but may contain an empty list)
- `isat` -> `data/questions_isat.json` (placeholder file can exist but may contain an empty list)

2) JSON schema must match current loader expectations:
```
{
  "unit": "string",
  "questions": [
    { "id": "...", "prompt": "...", "type": "mcq|short", ... }
  ]
}
```

3) Loader behavior:
- Refactor `loadQuestions()` in `main.js` to accept a path (or a set key) instead of hardcoding `data/questions.json`.
- If the selected file fails to load/parse OR has `questions.length === 0`:
  - Show "Coming soon" (or "No questions available") on the home menu.
  - Do not fall back silently to the wrong set.
  - Do not start the session/game until a valid pool is loaded.

4) State:
- Add `state.selectedQuestionSet` (string key).
- Add `SAVE_KEY` fields (or a new key) to persist the selected set, e.g. `arcade_free_throw.question_set`.
- On init:
  - Read saved set; default to `grade7`.
  - Do not auto-start the game; show home menu.

### UI Requirements (HTML)
- Home menu UI should be code-generated in `main.js` (no hand-authored markup required beyond an optional mount point).
- Preferred: add a simple mount point in `index.html`, e.g. `<div id="home-menu"></div>`, and generate all menu contents (title, buttons, status message) into it at runtime.
- Buttons/IDs to generate:
  - `#set-grade7`
  - `#set-grade7-advanced`
  - `#set-isat`
- Also generate a status message area: `#home-status` (used for "Coming soon" / load errors).
- Wrap the existing game UI in a container such as `#game-screen` so you can toggle visibility with `hidden`.

### Styling Requirements (CSS)
- Home menu should be centered, readable, and match the existing UI style.
- Keep changes minimal; prefer reusing existing button styles.

### JS Wiring (main.js)
- Add functions:
  - `showHomeMenu(message?)` (shows home, hides game)
  - `showGameScreen()` (hides home, shows game)
  - `setQuestionSet(key)` (persists selection, attempts to load its questions, routes accordingly)
- Update `init()`:
  - Load progress.
  - Show home menu.
  - Do not pre-load questions for the game until a set is chosen (or load default set but still show home).
- Ensure existing question modal and gameplay work unchanged once a valid pool is loaded.

### Acceptance Checklist
- On page load, home menu appears and game UI is hidden.
- Selecting `7th grade questions` loads the current pool and lets the student play normally.
- Selecting `7th advanced` or `ISAT` shows a friendly "Coming soon" message if their file is missing/empty, and the app stays on the home menu.
- Selection persists across refreshes.
- A `Home` button returns to the home menu without breaking the app.

## TODO
- Add run instructions (server/port, build steps if any)
- Add coding/style conventions (HTML/CSS/JS)
- Add testing/verification checklist
