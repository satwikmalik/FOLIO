# Folio

A MERN portfolio builder for students and early-career developers. Users sign up, add their profile, projects and skills, and get a public page at `/u/<username>` with a contact form and a view counter.

Built for the Fullstack Development-I course (MERN).

## Features

- Register and login (bcrypt + JWT), session restored on reload
- Dashboard: profile editor, projects CRUD (with ordering), skills CRUD (learning / comfortable / strong), inbox
- Public portfolio page with Vellum (light) and Blueprint (dark) themes
- Contact form on each page; messages go to the owner's inbox
- Explore page with search, skill filter, sort and pagination
- Print-friendly page for saving a CV as PDF
- Account settings: change password, delete account

## Tech stack

- Frontend: React 18, Vite, React Router, plain CSS
- Backend: Node.js, Express 4, Mongoose 8
- Database: MongoDB Atlas
- Auth: JWT, bcryptjs

## Run locally

Needs Node 18+ and a MongoDB Atlas database.

1. Clone the repo and open the folder.
2. Start the server:

   ```bash
   cd server
   cp .env.example .env      # then fill in MONGODB_URI and JWT_SECRET
   npm install
   npm run seed              # optional: adds 3 demo portfolios
   npm run dev               # http://localhost:5000
   ```

3. In a second terminal, start the client:

   ```bash
   cd client
   npm install
   npm run dev               # http://localhost:5173
   ```

On Windows, if `cp` does not work, copy `.env.example` to `.env` by hand.

## Environment variables

`server/.env`

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string, ending in `/folio` |
| `JWT_SECRET` | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_ORIGIN` | Allowed frontend origin in production (empty in development) |

`client/.env` is optional. `VITE_API_URL` is only needed when the API is deployed on a different address.

## Project structure

```
folio/
├─ server/src
│  ├─ models/        User, Project, Skill, Message
│  ├─ routes/        auth, profile, projects, skills, messages, public
│  ├─ middleware/    JWT check, required fields, logger, error handler
│  ├─ utils/         helpers and validators
│  └─ seed.js        demo portfolios
├─ client/src
│  ├─ pages/         public pages and dashboard
│  ├─ components/    shared UI
│  ├─ context/       auth state
│  └─ api/           fetch wrapper
└─ docs/BLUEPRINT.md design and architecture notes
```

## API overview

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/register`, `/api/login` | no | create account, log in |
| GET, PUT | `/api/profile` | yes | read and edit profile |
| CRUD | `/api/projects`, `/api/skills` | yes | manage projects and skills |
| GET, PATCH, DELETE | `/api/messages` | yes | inbox |
| GET | `/api/public` | no | Explore list (search, skill filter, sort, pagination) |
| GET | `/api/public/:username` | no | public portfolio (populates projects and skills) |
| POST | `/api/public/:username/contact` | no | send a message to the owner |

## Tests

```bash
cd server
npm test
```
