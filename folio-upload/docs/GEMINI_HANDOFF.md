# Gemini Handoff — Folio

You are continuing a half-built MERN project. Read `docs/BLUEPRINT.md` first (vision, API, schema, design system), then this file. Finish the product incrementally, test each step, and keep to the established design and architecture.

## 1. What this is

**Folio** is a portfolio builder. A user registers, fills in a profile, projects and skills, and gets a public page at `/u/<username>`. Visitors can message them through a contact form. It is a university project for *Fullstack Development-I* (MERN), built by a 3rd-year student who must explain every route, model and middleware in a viva. Keep code readable and the dependency list short.

The finished product: everything in the blueprint's feature table at status Done **plus** all Planned items, deployed.

## 2. How the scaffold is organised

- `server/` Express + Mongoose, ES modules. `app.js` mounts routes; `routes/` hold handlers; `models/` hold schemas and validation; `middleware/` has `verifyToken`, `requireFields`, `logger`, 4-arg `errorHandler`; `utils/` has `AppError`, `asyncHandler`, `cleanUrl`, `cleanTags`.
- `client/` React + Vite. `api/client.js` is the only `fetch` caller. `AuthContext` holds `user`, `stats`, `login`, `register`, `logout`, `refresh`, `setUser`. Pages fetch their own data. Styling is one file, `src/index.css`, driven by CSS variables.
- Conventions already in force:
  - Handlers are wrapped in `asyncHandler`; failures are `throw new AppError(status, message)`; the global handler returns `{ message }`.
  - Protected queries always filter by `user: req.user._id`; other users' ids return 404.
  - Responses: lists as `{ projects }`, single as `{ project }`; deletes return 204.
  - Input is validated in the model (lengths, enums) and by `cleanUrl` / `cleanTags` in routes.
  - Client components show server messages through `<Notice type="error">`.

## 3. Already implemented

Register, login, JWT middleware, session restore and 401 auto-logout; profile editor with themes; projects CRUD; skills CRUD; public endpoint using virtual `.populate()`; public portfolio page with both themes; contact form and inbox (unread badge, mark read, delete); view counter; 404 page; responsive layout.

Verified: server files pass syntax check and the Express app boots and returns correct errors for missing fields, bad JSON, missing token and unknown routes; the client builds with `vite build`. **Not verified:** anything touching MongoDB (no database was available when this was written), and no automated tests exist. Run the manual checklist in §6 first and fix whatever breaks before adding features.

## 4. Remaining work, in order

Do these one at a time. Finish, test and commit each before starting the next.

1. **Smoke test the whole app against a real MongoDB** (§6). Fix defects.
2. **Explore page.** Server: `GET /api/public?q=&skill=&sort=&page=&limit=` returning `{ users, page, pages, total }`. Use a regex search on name/username (escape user input), filter by skill name via the `Skill` collection, sort by `views` or newest, paginate with `.limit()` / `.skip()`, `.populate()` skills, exclude email and hash. Mount it so `/api/public/:username` still works. Client: `/explore` page with search box, skill filter, sort select and Previous/Next. Add an "Explore" link on the landing page. Presentation: a ruled list of rows (name, headline, top skills, link), not a grid of cards.
3. **Contact rate limit.** Add `express-rate-limit` to `POST /api/public/:username/contact` (e.g. 5 per hour per IP). Return a readable 429 message.
4. **Owner views not counted.** Skip the increment when a valid token for that user is sent, or add a `?preview=1` flag used by "View your page". Also avoid double counts from React StrictMode in dev.
5. **Project ordering.** Add `order` to `Project`, sort by it, add Up/Down buttons in `ProjectsManager` and a `PUT /api/projects/reorder` endpoint (or swap via two updates). The public page must respect it.
6. **Account settings.** Page `/dashboard/account`: change password (verify the current one) and delete account. Delete must remove the user's projects, skills and messages. Require typing the username to confirm.
7. **Inbox pagination** (`limit`/`skip`, "Load more").
8. **Print stylesheet** for `/u/:username` so Print → Save as PDF gives a clean one-page resume: hide contact form and credit, keep the title block, force Vellum colors.
9. **Tests (optional).** `supertest` + `mongodb-memory-server` for auth, project ownership and the public endpoint. Dev dependencies only.
10. **Deployment.** MongoDB Atlas; server on Render (`npm start`, set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`); client on Vercel (root `client`, set `VITE_API_URL`; `vercel.json` already rewrites to `index.html`). Update `README.md` with the live URLs.
11. **Final pass:** keyboard and screen-reader check, 360px layout, both themes' contrast, copy review (§5), and a short `docs/VIVA_NOTES.md` mapping each file to a syllabus experiment (Exp 3 routing → `App.jsx`, `ProtectedRoute`; Exp 6 middleware → `server/src/middleware`; Exp 7 → `routes/auth.js`, `middleware/auth.js`; Exp 8 → models, `routes/public.js`; Exp 9 → dashboard pages).

## 5. Rules you must keep

**Design (non-negotiable).** The look is "engineering drawing sheet": bordered sheet on a faint grid, ruled sections, a title block table, level squares. Do not introduce:
- gradients, shadows, glassmorphism, emoji or icon-library decoration;
- card grids, pill buttons, large radii (keep 2px), oversized headings (public name is 30px);
- all-caps labels, eyebrow text above headings, numbered markers on non-sequential content, arrows on button text;
- animation on load, scroll reveals, hover lifts.

Add colour only through the CSS variables in `index.css`. Fonts stay Barlow Semi Condensed (UI) and Source Serif 4 (prose). New UI reuses existing classes (`.field`, `.btn`, `.items`, `.notice`, `.panel`) before adding new ones. Copy: sentence case, plain verbs, buttons name the action ("Save profile"), errors say what is wrong and what to do, empty states say what to do next.

**Code.**
- No new dependency unless a feature needs it (allowed: `express-rate-limit`, `supertest`, `mongodb-memory-server`). No TypeScript, Redux, UI kits, axios or CSS frameworks.
- Keep files small and single-purpose. Do not add comments that restate code; comment only the non-obvious *why*.
- Never ship a control that does nothing. If a feature is unfinished, leave it out of the UI.
- Never return `passwordHash` or `email` from public endpoints.
- Keep `.env.example` files in sync with any new variable.
- Do not invent features outside the blueprint. If something is ambiguous, pick the simplest option and note it in the README.

## 6. Run and test

```bash
cd server && cp .env.example .env   # set MONGODB_URI and JWT_SECRET
npm install && npm run dev          # API on :5000
cd client && npm install && npm run dev   # app on :5173
```

Manual checklist (run after every feature):
1. `GET http://localhost:5000/api/health` → `{ "ok": true }`.
2. Register `asha` / `asha@example.com` / 8+ char password → lands on Profile. Re-register the same username → "That username is already taken."
3. Edit profile, pick Blueprint, Save. Refresh: values persist.
4. Add a project with a bad link (`abc`) → error shown. Fix → appears in list. Edit, then delete.
5. Add skills at each level; change a level.
6. Open `/u/asha` in a private window: sections render, theme applies, view count increases.
7. Send a message from the public page; the Inbox badge shows 1 after refresh; mark read; delete.
8. Log out; `/dashboard` redirects to `/login` and returns you after login.
9. Open `/u/nobody` → friendly not-found.
10. `cd client && npm run build` succeeds.

Curl sanity check for auth:
```bash
curl -s -X POST localhost:5000/api/login -H 'Content-Type: application/json' \
  -d '{"email":"asha@example.com","password":"yourpassword"}'
```

## 7. Decisions to preserve

- JWT in `localStorage` (simple, adequate for a coursework project); revisit only if asked.
- Theme values are `vellum` and `blueprint`; they exist in the User enum, `ProfileEditor` and the CSS. Change all three together.
- Public page data comes from virtual populate (`User.virtual('projects'|'skills')`), because the syllabus requires `.populate()`.
- `timestamps: false` on the view-count update keeps `updatedAt` meaningful.
- Images are links, not uploads, to avoid storage and security scope.
