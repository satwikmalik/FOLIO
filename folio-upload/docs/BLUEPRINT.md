# Folio — Project Blueprint

## 1. Vision

**Folio** lets a student or early-career developer publish a portfolio page without writing a site. They sign up, fill in a profile, add projects and skills, and get a public page at `/u/<username>` they can put on a CV. Visitors can contact them through a form; messages land in a dashboard inbox.

- **Target users:** engineering students and juniors who need a presentable portfolio fast. A secondary audience is recruiters and classmates who view the pages.
- **Core experience:** register → fill in profile → add 2–3 projects and a few skills → share the link. First usable page in about ten minutes.
- **Context:** university project for Fullstack Development-I (MERN). Scope is deliberately manageable for one student, and every part maps to a syllabus experiment so it can be explained in the viva.

## 2. Features

Status: **Done** = in the scaffold and working. **Planned** = not built yet (see §9).

| Feature | Description | Status |
|---|---|---|
| Register / login | bcrypt password hashing, JWT (7 day expiry), session restored on reload, auto logout on 401 | Done |
| Profile editor | name, headline, location, bio, photo link, GitHub/LinkedIn/Twitter/website links, theme | Done |
| Projects CRUD | title, write-up, stack tags (max 8), live link, source link, screenshot link | Done |
| Skills CRUD | name + level (learning / comfortable / strong), level editable in place | Done |
| Public portfolio | `/u/:username`, no login, built with `.populate()`; hides empty sections | Done |
| Two themes | Vellum (light), Blueprint (dark); owner picks, public page applies | Done |
| Contact form + inbox | visitor form → `Message` doc; inbox with unread badge, mark read, delete | Done |
| View counter | incremented on each public fetch, shown on dashboard and page | Done |
| Explore page | `/explore`: list portfolios; regex search by name, filter by skill, sort, paginate with `.limit()/.skip()` | Planned |
| Project ordering | up/down controls, stored `order` field | Planned |
| Contact rate limit | `express-rate-limit` on the contact endpoint | Planned |
| Print / PDF resume | print stylesheet on the public page | Planned |
| Account settings | change password, delete account (cascade delete projects, skills, messages) | Planned |
| Deployment | Vercel (client), Render (server), MongoDB Atlas | Planned |

Not in scope: image upload (links only), social login, custom domains, analytics beyond the view count.

## 3. User journeys

**Owner**
1. `/` → Create your page → `/register` (username, email, password).
2. Lands on `/dashboard/profile`, fills fields, picks a theme, Save profile.
3. Projects → Add project → form → saved → list refreshes.
4. Skills → add name + level.
5. "View your page" opens `/u/<username>` in a new tab.
6. Inbox shows unread count in the sidebar; open, mark read or delete.

**Visitor**
1. Opens `/u/<username>`; the view counter increments.
2. Reads projects and skills; follows live/source/profile links.
3. Sends a message via the contact form; sees confirmation in place.

**Failure paths**
- Unknown username → "No page at /u/x" with a link to register.
- Expired or invalid token → client clears it and `ProtectedRoute` redirects to `/login`, returning the user to where they were after login.
- Validation errors → server returns `{ message }`; forms show it in a notice above the form.

## 4. Architecture and stack

```
React (Vite) SPA  ──fetch /api/*──▶  Express API  ──Mongoose──▶  MongoDB
  react-router-dom                   JWT middleware
  AuthContext                        requireFields, logger, error handler
```

- **Frontend:** React 18, Vite, react-router-dom 6, plain CSS with custom properties. No UI library, no state library.
- **Backend:** Node 18+, Express 4, Mongoose 8, bcryptjs, jsonwebtoken, cors, dotenv. ES modules.
- **Database:** MongoDB.
- **Auth:** `Authorization: Bearer <jwt>`, token in `localStorage` (key `folio_token`). Payload `{ sub: userId }`. Middleware loads the user on every protected request, so deleted accounts stop working immediately.
- **Dev wiring:** Vite proxies `/api` to `localhost:5000`. In production the client uses `VITE_API_URL` and the server restricts CORS with `CLIENT_ORIGIN`.
- **Integrations:** none required.

## 5. API

All bodies are JSON. Errors are `{ "message": "..." }` with a matching status. Deletes return 204.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/register` | no | create account → `{ token, user }` (201) |
| POST | `/api/login` | no | → `{ token, user }` |
| GET | `/api/profile` | yes | `{ user, stats: { projects, skills, unread } }` |
| PUT | `/api/profile` | yes | update profile fields, links, theme |
| GET/POST | `/api/projects` | yes | list / create |
| PUT/DELETE | `/api/projects/:id` | yes | update / delete (owner only, else 404) |
| GET/POST | `/api/skills` | yes | list / create |
| PUT/DELETE | `/api/skills/:id` | yes | change level / delete |
| GET | `/api/messages` | yes | inbox, newest first |
| PATCH | `/api/messages/:id/read` | yes | mark read |
| DELETE | `/api/messages/:id` | yes | delete |
| GET | `/api/public/:username` | no | user + `projects` + `skills` via populate; increments views; email and hash excluded |
| POST | `/api/public/:username/contact` | no | create a message (201) |
| GET | `/api/health` | no | liveness |

Status codes in use: 200, 201, 204, 400 (validation), 401 (auth), 404, 409 (duplicate username/email), 500.

## 6. Data model

```
User ──< Project      (Project.user → User)
User ──< Skill        (Skill.user → User)
User ──< Message      (Message.user → User)
```

**User:** `username` (unique, lowercase, 3–20 of `a-z0-9_-`, reserved words blocked), `email` (unique), `passwordHash` (`select:false`), `name`, `headline`, `bio` (≤600), `location`, `avatarUrl`, `links{github,linkedin,twitter,website}`, `theme` (`vellum`|`blueprint`), `views`, timestamps. Virtual populate fields: `projects`, `skills`.

**Project:** `user`, `title` (required, ≤80), `description` (≤600), `tags[]`, `liveUrl`, `repoUrl`, `imageUrl`, timestamps.

**Skill:** `user`, `name` (≤40), `level` (`learning`|`comfortable`|`strong`), timestamps.

**Message:** `user` (recipient), `senderName`, `senderEmail`, `body` (≤2000), `read`, timestamps.

Rules: every protected query is scoped by `user: req.user._id`. URLs are accepted only if `http(s)`.

## 7. Folder structure

```
folio/
├─ README.md
├─ GEMINI_HANDOFF.md
├─ docs/BLUEPRINT.md
├─ server/
│  ├─ package.json, .env.example
│  └─ src/
│     ├─ index.js              load env, connect DB, listen
│     ├─ app.js                middleware + route mounting + error handlers
│     ├─ config/db.js          mongoose connection
│     ├─ models/               User, Project, Skill, Message
│     ├─ routes/               auth, profile, projects, skills, messages, public
│     ├─ middleware/           auth (verifyToken), validate (requireFields), logger, error
│     └─ utils/                AppError, asyncHandler, token, validators (cleanUrl, cleanTags, isEmail)
└─ client/
   ├─ package.json, vite.config.js, index.html, vercel.json, .env.example
   └─ src/
      ├─ main.jsx, App.jsx, index.css
      ├─ api/client.js         fetch wrapper, token store, ApiError
      ├─ context/AuthContext.jsx   user, stats, login/register/logout/refresh
      ├─ components/           ProtectedRoute, Field, Notice, ContactForm
      └─ pages/
         ├─ Landing, Login, Register, Portfolio (public), NotFound
         └─ dashboard/         DashboardLayout, ProfileEditor, ProjectsManager, SkillsManager, Inbox
```

Responsibilities: **routes** parse input and call models; **models** own validation rules; **middleware** handles auth, required fields, errors; **pages** own their data fetching; **components** are shared UI only; `api/client.js` is the only place that calls `fetch`.

## 8. Design system

**Concept.** A portfolio is one sheet of work. The public page is rendered as an engineering drawing sheet: a bordered sheet on a faint 24px grid, ruled sections, and a **title block** (a small table of owner, role, location, views, look) in the bottom-right corner. The title block is the single memorable device; everything else stays quiet.

**Themes**
| Token | Vellum (light, default) | Blueprint (dark) |
|---|---|---|
| `--page` (outside the sheet, carries the grid) | `#dce4e2` | `#0a2239` |
| `--paper` (the sheet) | `#f0f4f2` | `#0f2e4d` |
| `--ink` | `#1c2b39` | `#e6f0fa` |
| `--muted` | `#586873` | `#93b0cc` |
| `--soft` (hairlines) | `#c3cfd0` | `#2f5379` |
| `--accent` | `#1f5fbf` | `#ffd166` |

**Type.** Barlow Semi Condensed (UI, headings, labels; drafting-lettering feel) and Source Serif 4 (bio, project write-ups, messages). Sentence case everywhere. Scale: 13 / 14 / 16 / 19 / 24 / 30. Prose lines capped at 62ch.

**Layout.** Left-aligned. Dashboard: fixed 208px left rail with text navigation, content column max 820px. Public page: single 780px sheet; projects are ruled rows (write-up left, stack and links right); skills are a ruled two-column list with a three-square level indicator.

**Principles**
- Structure encodes information: rules separate records, the title block is data, level squares show level. No numbering, since none of the content is a sequence.
- Radius 2px, no shadows, no gradients. The only background pattern is the sheet grid.
- Motion: none beyond focus states and hover fills. Nothing animates on load.
- Buttons say what they do: "Save profile", "Add project", "Send message". Errors say what is wrong and how to fix it.
- Empty states tell the user what to do next.
- Keep it responsive to 360px; visible keyboard focus; dark theme must keep contrast.

## 9. Development phases

1. **Foundation (done):** server, models, auth, protected CRUD, public endpoint, client shell, routing.
2. **Core product (done):** dashboard editors, public page, themes, contact + inbox, view counter.
3. **Syllabus completeness (next):** Explore page with regex search, skill filter, sort, pagination (Experiment 8 hard); inbox pagination optional.
4. **Hardening:** contact rate limit, project ordering, account settings with cascade delete, owner views not counted, basic API tests.
5. **Polish and ship:** print stylesheet, accessibility pass, empty/error states review, deployment (Atlas, Render, Vercel), mini-project report.
