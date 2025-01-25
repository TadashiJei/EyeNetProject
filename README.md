# EyeNet Project

EyeNet is a comprehensive eye care management system that combines modern web technologies with healthcare functionality to provide an efficient platform for eye care professionals and patients.

## Project Structure

The project is organized into two main components:

- `backend`: Node.js/Express backend with TypeScript
- `frontend`: Next.js frontend application with modern UI/UX

## Features

- 🔐 Secure Authentication System
- 👤 User Management
- 📊 Patient Records Management
- 📅 Appointment Scheduling
- 💊 Prescription Management
- 📱 Responsive Design
- 🎨 Modern UI/UX

## Tech Stack

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM

### Frontend
- Next.js 13+
- React
- TypeScript
- Tailwind CSS
- NextAuth.js
- Shadcn UI Components

## Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/TadashiJei/EyeNetProject.git
   cd EyeNetProject
   ```

2. Backend Setup:
   ```bash
   cd eyenet/backend
   npm install
   cp .env.example .env   # Configure your environment variables
   npm run dev
   ```

3. Frontend Setup:
   ```bash
   cd eyenet/frontend
   npm install
   cp .env.example .env.local   # Configure your environment variables
   npm run dev
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Environment Variables

### Backend (.env)
```
DATABASE_URL=
JWT_SECRET=
PORT=5000
```

### Frontend (.env.local)
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Documentation

Detailed documentation can be found in the `/documentations` directory, including:
- API Documentation
- Database Schema
- User Guides
- Development Guidelines

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Link: [https://github.com/TadashiJei/EyeNetProject](https://github.com/TadashiJei/EyeNetProject)
