# OpenLingua

**OpenLingua** is an open-source, community-driven language learning platform. Users can create, upload, and share language courses. It supports vocabulary drills, grammar lessons, pronunciation guides, and interactive activities, allowing learners to study any language — even rare or constructed ones — in a collaborative environment.

## Meet the Team

**Product Owner**  
- **Samuel Mba**

**Developers**  
- **Nhlamulo Delight Mabunda** – Backend & Frontend | BSc Computer Science (Wits)  
- **Bongumusa Makhubu** – Backend & Testing | BSc Computer Science (Wits)  
- **Tinashe Nganadange** – GitHub Facilitator & Fullstack | BSc Computer Science (Wits)  
- **Hluma Nziweni** – UI Designer, Frontend & Scrum Master | BSc Computer Science (Wits)  


## Technology Stack

- **React.js (Front-End):** Fast, interactive, and responsive UI.  
- **Node.js & Express.js (Back-End):** Handles routing, API creation, and data processing.  
- **SQL Database (Supabase):** Scalable, real-time data storage with authentication support.  
- **Prisma (ORM):** Simplifies database interactions and ensures type safety.  
- **Google Auth:** Secure OAuth 2.0 authentication via Google accounts.  
- **Lucide-React:** Lightweight and customizable icon library for UI clarity.  
- **Git:** Version control for collaboration, branching, and rollback.  
- **Taiga:** Agile project management with sprint tracking and Kanban boards.  
- **TypeScript:** Static typing for reliability and maintainability.  
- **Tailwind CSS:** Utility-first CSS framework for rapid, responsive design.  
- **Jest:** Testing framework for unit and integration tests with coverage reporting.  


## Development Setup

1. Clone the repository:  
   git clone https://github.com/T-inashe/OpenLingua.git
   cd OpenLingua
   cd frontend
   npm install
   npm run dev
2. Frontend setup:
   cd ../backend
  npm install
  cp .env.example .env   # or create manually
  npm run dev
3. Backend setup:
   
4. Verify setup:
   Frontend: http://localhost:5173
   Backend API: http://localhost:8080
   Health check: http://localhost:8080/health

## Git Workflow

### Branching & Commits
- All pull requests (PRs) must be reviewed by at least one team member.  
- No direct commits to `main`.  
- Merge workflow: `feature/* → dev → main` after testing.
- Commits Structure: "[meesage] [update] [sprint number]"

### Working on Features
1. Create a new branch:  
   git checkout -b feature/your-feature-name
2. Make your changes.
3. Run Tests
  cd frontend && npm test
  cd ../backend && npm test
4. If tests pass, commit and push changes:
   git add .
   git commit -m "Your commit message"
   git push
5. Create a pull request for review.

## Key Features

- **Course Creation:** Build and publish structured lessons (text, quizzes, audio, video, interactive tasks).  
- **Course Enrollment:** Browse and join courses with filtering and previews.  
- **Learner Dashboard:** Track progress, scores, and set learning goals.  
- **Review & Quiz Engine:** Spaced repetition, flashcards, and performance-based reviews.  
- **Community Contributions:** Rate courses, give feedback, and join events.  

## Project Management

We follow **Agile Scrum practices** managed via **Taiga**. Work is organized into sprints, with continuous feedback and team reviews to ensure iterative development and adaptability.


   
   

   
