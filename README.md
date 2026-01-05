# Quizz Application

A secure quiz application with role-based authentication built with Next.js, Node.js, Express, Drizzle ORM, and PostgreSQL.

## Features

- Secure authentication with bcrypt password hashing (12 rounds)
- JWT-based session management
- Role-based access control (Super Admin, Admin, User)
- Beautiful UI with shadcn/ui components
- User management system
- PostgreSQL database with Drizzle ORM

## Project Structure

```
quizz/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── seeders/
│   │   └── utils/
│   └── package.json
└── frontend/         # Next.js 15 + TypeScript
    ├── app/
    ├── components/
    ├── lib/
    └── package.json
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE quizz;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate and push database schema
npm run db:push

# Seed super admin user
npm run seed:admin

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Default Credentials

After running the seeder, you can login with:

- **Email:** admin@quizz.com
- **Password:** Admin@123

**IMPORTANT:** Change the password after first login!

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:welcome%40123@localhost:5432/quizz
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
PORT=5000
NODE_ENV=development
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users (Protected - Admin/Super Admin only)

- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `DELETE /api/users/:id` - Delete user

## Security Features

1. **Password Security**
   - Bcrypt hashing with 12 salt rounds
   - Password complexity requirements

2. **JWT Authentication**
   - HTTP-only cookies
   - 7-day token expiration
   - Secure flag in production

3. **SQL Injection Prevention**
   - Drizzle ORM with parameterized queries

4. **Role-Based Access Control**
   - Three user roles: super_admin, admin, user
   - Middleware-based authorization

5. **No Known Vulnerabilities**
   - Latest stable versions of all dependencies
   - Regular security audits recommended

## Database Schema

### Users Table

```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique, Not Null)
- password (VARCHAR, Not Null, Hashed)
- firstName (VARCHAR, Not Null)
- lastName (VARCHAR, Not Null)
- role (ENUM: super_admin, admin, user)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

## Available Scripts

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio
- `npm run seed:admin` - Seed super admin user

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Technology Stack

### Backend
- Node.js
- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL
- bcryptjs
- jsonwebtoken

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI

## Production Deployment

1. Update environment variables for production
2. Change `JWT_SECRET` to a strong random string
3. Enable HTTPS
4. Set `NODE_ENV=production`
5. Use a production-grade PostgreSQL instance
6. Enable rate limiting
7. Configure CORS properly

## License

ISC
