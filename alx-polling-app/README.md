# ALX Polly 🗳️

A secure and modern polling application built with **Next.js, Supabase, and Shadcn UI**.  
This project was part of ALX learning tasks and enhanced with AI-assisted development.  

---

## 🚀 Tech Stack
- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with JWT tokens
- **UI Components**: Shadcn UI, Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Security**: Row Level Security (RLS), Input sanitization, Rate limiting
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel-ready with CI/CD

---

## ✨ Features

### 🔐 Security Features
- **Server-side Authentication**: JWT token validation on all protected routes
- **Input Validation**: Zod schemas for type-safe data validation
- **XSS Prevention**: DOMPurify sanitization and React's automatic escaping
- **Rate Limiting**: Protection against spam and abuse
- **Row Level Security**: Database-level access control
- **Audit Logging**: Complete trail of user actions
- **Environment Security**: Proper secret management

### 🗳️ Polling Features
- **Create Polls**: Authenticated users can create polls with multiple options
- **Vote Management**: One vote per user per poll (enforced at DB level)
- **Real-time Results**: Live poll results and statistics
- **Poll Analytics**: Vote counts and participation metrics
- **QR Code Sharing**: Easy poll sharing via QR codes
- **Responsive Design**: Works on all devices

### 🛠️ Developer Features
- **Comprehensive Documentation**: JSDoc/TSDoc for all API endpoints
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Centralized error management
- **Health Checks**: System monitoring endpoints
- **CI/CD Pipeline**: Automated testing and deployment
- **Database Migrations**: Version-controlled schema changes

---

## ⚙️ Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone https://github.com/BethelHills/Alx-Polly.git
cd Alx-Polly
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key

# Application Configuration
NODE_ENV=development
```

### 4. Database Setup
Run the database migrations to set up your Supabase database:

```bash
# Apply all migrations
./scripts/setup-database.sh

# Or apply individual migrations
./scripts/apply-migration.sh migrations/001_add_unique_vote_constraint.sql
./scripts/apply-rls-migration.sh
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Coverage
```bash
npm run test:coverage
```

---

## 📚 API Documentation

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### `POST /api/polls`
Creates a new poll with authenticated user ownership.

**Request Body:**
```json
{
  "title": "What is your favorite programming language?",
  "description": "Optional description",
  "options": ["JavaScript", "TypeScript", "Python", "Rust"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Poll created successfully!",
  "pollId": "uuid",
  "poll": {
    "id": "uuid",
    "title": "What is your favorite programming language?",
    "description": "Optional description",
    "options": [...]
  }
}
```

#### `GET /api/polls`
Retrieves all active polls with vote counts.

**Response:**
```json
{
  "success": true,
  "polls": [
    {
      "id": "uuid",
      "title": "Poll title",
      "total_votes": 42,
      "options": [...]
    }
  ]
}
```

#### `POST /api/vote`
Submits a vote for a specific poll option.

**Request Body:**
```json
{
  "poll_id": "uuid",
  "option": "JavaScript"
}
```

#### `GET /api/health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "status": "up",
      "responseTime": 45
    }
  },
  "uptime": 3600
}
```

---

## 🔒 Security

This application implements multiple layers of security:

### Authentication & Authorization
- JWT token validation on all protected routes
- Server-side user verification
- Row Level Security (RLS) policies

### Input Validation & Sanitization
- Zod schemas for type-safe validation
- DOMPurify for HTML sanitization
- Request size limits

### Database Security
- Unique constraints to prevent duplicate votes
- RLS policies for data access control
- Audit logging for all critical actions

### Environment Security
- Secrets stored in environment variables
- `.env.local` excluded from version control
- GitHub Secrets for CI/CD

---

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE=your_production_service_role_key
NODE_ENV=production
```

---

## 📁 Project Structure

```
alx-polly/
├── src/
│   ├── app/
│   │   ├── api/                 # API routes
│   │   │   ├── polls/          # Poll management
│   │   │   ├── vote/           # Voting endpoints
│   │   │   └── health/         # Health checks
│   │   └── (pages)/            # Next.js pages
│   ├── lib/
│   │   ├── supabaseClient.ts   # Public Supabase client
│   │   ├── supabaseServerClient.ts # Server Supabase client
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── audit-logger.ts     # Audit logging utilities
│   │   └── error-handler.ts    # Centralized error handling
│   └── components/             # React components
├── migrations/                 # Database migrations
├── scripts/                   # Utility scripts
├── __tests__/                 # Test files
└── docs/                      # Documentation
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add JSDoc documentation for new functions
- Write tests for new features
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is part of ALX learning curriculum and is for educational purposes.

---

## 🙏 Acknowledgments

- **ALX** for the learning opportunity
- **Supabase** for the backend infrastructure
- **Vercel** for deployment platform
- **Shadcn UI** for beautiful components

---

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**Built with ❤️ by ALX students**