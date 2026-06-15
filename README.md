# Multi-Tenant SaaS Platform

A full-stack multi-tenant SaaS application built with Django, React, FastAPI, PostgreSQL, Redis, RabbitMQ, and Celery. The platform supports tenant-isolated workspaces, role-based dashboards, project and meeting management, billing, chat, and a document Q&A workflow powered by an AI service.

## What It Does

- Multi-tenant architecture with tenant-specific schemas
- Role-based access for super admins, company admins, project managers, employees, and viewers
- Project management with tasks, deadlines, and reminders
- Meeting scheduling and reminders
- Chat and real-time app support
- Billing and payment integration
- Document upload and retrieval-augmented generation
- AI-backed document indexing and question answering
- Password reset and MFA-related auth flows

## Tech Stack

- Backend: Django, Django REST Framework, Channels, Celery
- AI service: FastAPI, LangChain, sentence-transformers, pgvector
- Frontend: React, Vite, React Router, Axios, Tailwind CSS
- Database: PostgreSQL with `pgvector`
- Messaging and async jobs: Redis, RabbitMQ
- File storage: Amazon S3

## Repository Layout

- `backend/multi_tenant` - Django API, tenant apps, auth, billing, chat, projects, meetings, documents
- `ai-service` - FastAPI service for document ingestion and RAG queries
- `frontend` - React application used by admins, managers, and employees
- `docker-compose.yml` - Local orchestration for the full stack

## Key Features

### Tenant and Auth

- Public and tenant-specific URL routing
- JWT auth with refresh cookies
- Subdomain-based tenant context in the frontend
- Optional MFA flow

### Operations

- Company and employee management
- Project dashboards and project details
- Meeting workflows and reminders
- Billing actions and payment handling

### AI and Documents

- Upload PDF documents into tenant-specific storage
- Chunk, embed, and index documents in PostgreSQL using vector search
- Ask tenant-scoped questions through a RAG endpoint
- Stream responses token-by-token from the AI service

## Prerequisites

- Docker and Docker Compose, or
- Python 3.11+ and Node.js 20+ for manual local setup

## Quick Start With Docker

1. Clone the repository.
2. Create a `.env` file in the project root.
3. Start the stack:

```bash
docker compose up --build
```

4. Open the apps:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- AI service: `http://localhost:8001`
- RabbitMQ UI: `http://localhost:15672`

## Environment Variables

### Root `.env`

These are consumed by `docker-compose.yml` and the backend/AI containers:

```env
DB_NAME=multi_tenant_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=postgres
DB_PORT=5432

SECRET_KEY=your_django_secret

REDIS_HOST=redis
REDIS_PORT=6379
CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//

AI_SERVICE_URL=http://ai-service:8000

GROK_API_KEY=your_grok_api_key
GEMINI_API_KEY=your_gemini_api_key

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@example.com
EMAIL_HOST_PASSWORD=your_email_password
DEFAULT_FROM_EMAIL=your_email@example.com

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret

AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_STORAGE_BUCKET_NAME=your_bucket
AWS_REGION_NAME=ap-south-2
```

### Frontend `.env`

The React app reads these values at build time:

```env
VITE_API_URL=https://your-backend-domain
VITE_RAG_URL=http://localhost:8001
```

If you are running locally with tenant subdomains, the frontend can also use the company name stored in local storage to build the tenant-specific backend URL.

## Local Development

### Backend

```bash
cd backend/multi_tenant
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### AI Service

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Background Services

The backend uses Celery for scheduled reminders and automated status updates. When running locally without Docker, make sure these services are available:

- PostgreSQL with `pgvector`
- Redis
- RabbitMQ
- Celery worker
- Celery beat

## Important Routes

### Frontend

- `/` - Landing page
- `/login` - Login
- `/signup` - Signup
- `/platform-admin` - Super admin dashboard
- `/company-dashboard` - Company admin dashboard
- `/project-manager-dashboard` - Project manager dashboard
- `/employee-dashboard` - Employee dashboard
- `/chat` - Chat page
- `/rag` - Document Q&A page
- `/meetings` - Meetings page

### Backend API

- `/api/auth/` - Auth and token routes
- `/api/projects/` - Projects
- `/api/chat/` - Chat
- `/api/meetings/` - Meetings
- `/api/documents/` - Documents and RAG document sync

### AI Service

- `POST /upload-document`
- `GET /documents`
- `DELETE /documents/{document_id}`
- `POST /query`
- `POST /query/stream`

## Testing

Backend tests use `pytest`:

```bash
cd backend/multi_tenant
pytest
```

## Notes

- The backend is configured for tenant-aware routing with `django-tenants`.
- Document Q&A uses tenant schema names so each company sees only its own data.
- The frontend stores auth state in `localStorage` and refreshes access tokens automatically when needed.
