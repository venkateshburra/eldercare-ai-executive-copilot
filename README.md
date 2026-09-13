# Eldercare AI Executive Copilot

Eldercare AI Executive Copilot is a senior-living operations platform for executive oversight, resident care reporting, staffing management, incident governance, medication monitoring, AI-assisted knowledge workflows, and role-based access control.

The application is organized as two independent projects:

- `frontend/`: React single-page application
- `backend/`: Node.js REST API with MongoDB persistence

## Live URLs

| Resource | URL |
| --- | --- |
| Frontend | https://eldercare-ai-executive-copilot.vercel.app/ |
| Backend API | https://eldercare-ai-executive-copilot.onrender.com |
| GitHub repository | https://github.com/venkateshburra/eldercare-ai-executive-copilot |

The backend API is mounted under `/api`. For example:

```text
https://eldercare-ai-executive-copilot.onrender.com/api
```

## Demo Login Accounts

Open the [deployed frontend login page](https://eldercare-ai-executive-copilot.vercel.app/) and use one of these accounts. The login form also provides 1-click demo account buttons.

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| Executive | `executive@silvercare.org` | `Password@123` | Full access to all 28 permissions and every module — Dashboard, Knowledge Search, Scenario Builder, Briefings & Decisions, Source-Cited AI Q&A, Sensitivity Analysis, Outcome Review, Reports & Analytics (all tabs), Notifications, Users & Roles management, Audit Logs & Settings |
| Business Analyst | `analyst@silvercare.org` | `Password@123` | Dashboard, Knowledge Search, Scenario Builder, Sensitivity Analysis, Briefings & Decisions (view only), Source-Cited AI Q&A, Reports & Analytics (Residents, Incidents, Medications tabs), Audit Logs, Notifications |
| Data Steward | `steward@silvercare.org` | `Password@123` | Dashboard, Knowledge Search, Source-Cited AI Q&A, Outcome Review (AI model review), Reports & Analytics (Residents tab), Audit Logs & Settings (view), Notifications |
| Department Head | `depthead@silvercare.org` | `Password@123` | Dashboard, Knowledge Search, Source-Cited AI Q&A, Briefings & Decisions (view + manage), Reports & Analytics (Residents, Staff, Incidents, Medications tabs), Notifications — full clinical operations: staffing, shifts, care plans, medications, activities, and incident management |

The Executive account has full organizational access. The remaining accounts can access only the modules and actions granted to their roles.

## Technology Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- Axios for HTTP requests
- React Router for navigation
- Recharts for analytics visualizations
- React Icons for interface icons
- React Hot Toast for notifications

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- JWT authentication
- bcryptjs password hashing
- Helmet security headers
- CORS
- Express rate limiting
- Google Gemini integration for AI features
- Zod validation utilities

### Hosting

- Frontend deployed on Vercel
- Backend deployed on Render
- MongoDB used as the application database

## Main Features

- Executive dashboard with operational metrics
- Resident roster and care information
- Staff directory and account management
- Incident tracking and status management
- Medication schedule monitoring
- Reports, filtering, record details, and CSV export
- Executive briefings and governed decisions
- Scenario and sensitivity analysis
- AI knowledge search and source-cited Q&A
- Role-based permissions and organization-scoped access
- Notifications, audit logs, and settings

## Project Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── .env
│   └── package.json
└── README.md
```

## Requirements

Install the following before starting local development:

- Node.js 18 or newer
- npm
- MongoDB, either locally or through MongoDB Atlas
- A Google Gemini API key if using the AI features

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/venkateshburra/eldercare-ai-executive-copilot.git
cd eldercare-ai-executive-copilot
```

### 2. Configure the backend

```bash
cd backend
npm install
copy .env.example .env
```

On macOS or Linux, use:

```bash
cp .env.example .env
```

Update `backend/.env` with your local values:

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/eldercare_copilot
JWT_SECRET=replace_with_a_strong_random_secret
JWT_EXPIRES_IN=1d
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The local API runs at:

```text
http://localhost:5000/api
```

To seed the database, run this from `backend/`:

```bash
npm run seed
```

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create or update `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The local frontend runs at:

```text
http://localhost:5173
```

## Frontend Commands

Run these commands from `frontend/`:

```bash
npm run dev       # Start Vite development server
npm run build     # Create production build
npm run lint      # Run Oxlint
npm run preview   # Preview the production build
```

## Backend Commands

Run these commands from `backend/`:

```bash
npm run dev       # Start the API with Nodemon
npm start         # Start the API normally
npm run seed      # Seed database data
npm test          # Placeholder test command
```

## API and Security Notes

- API requests use JWT authentication through the `Authorization: Bearer <token>` header.
- Data access is scoped to the authenticated organization.
- Role permissions control access to users, reports, incidents, decisions, medications, and other modules.
- Keep `JWT_SECRET`, `MONGO_URI`, and `GEMINI_API_KEY` private.
- Configure the backend CORS client URL to match the deployed frontend URL.
