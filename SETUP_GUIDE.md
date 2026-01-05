# Git Quiz Interactive System - Setup Guide

## 🎯 Overview

This interactive Git quiz system features:
- **Realistic Git Bash Terminal** with drag-and-drop command execution
- **Live Timer** tracking team completion times
- **Results Dashboard** with rankings based on score and time
- **Answer Reveal** functionality for presenters
- **Beautiful 3D UI** with gradients and animations

---

## 📋 Prerequisites

- Node.js (v18+)
- PostgreSQL database
- npm or yarn

---

## 🚀 Setup Instructions

### 1. Database Migration

First, update your database schema to include the new fields:

```bash
cd backend
npm run db:push
```

This will add:
- `questionType` enum (git_challenge, multiple_choice, text_answer)
- `story`, `availableCommands`, `completedCommands` fields to questions
- `timeStarted`, `timeCompleted`, `timeTaken` to team answers
- `showAnswers` flag to quiz config

### 2. Seed the Git Question

Create the first Git quiz question (John's Git Journey):

```bash
cd backend
npm run seed:git-question
```

You should see output like:
```
✅ Git Question Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Question #: 1
Type: git_challenge
Title: John's Git Journey
Points: 100
Completed Commands: 7
Available Commands: 6
Enabled: No
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Start the Servers

**Backend:**
```bash
cd backend
npm run dev
```
Server runs on http://localhost:5000

**Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

---

## 🎮 Usage Workflow

### Admin Flow

1. **Login** as admin at http://localhost:3000
   - Email: `admin@quizz.com`
   - Password: `Admin@123`

2. **Navigate to Questions** page
   - You'll see "Question 1: John's Git Journey"
   - Click the **Unlock** icon to enable the question

3. **Set as Current Question**
   - Click "Set as Current" button
   - This makes it visible to the presenter

4. **Control Answer Visibility**
   - Click **"Show Answers"** button to reveal answers on presenter screen
   - Click **"Hide Answers"** to hide them again

5. **View Results** (Super Admin only)
   - Navigate to **"Results"** page in sidebar
   - See live rankings, scores, and completion times
   - Rankings update automatically every 10 seconds

### Team Flow

1. **Join Quiz** at http://localhost:3000/quiz
   - Select team number
   - Click "Start Quiz"

2. **Complete Git Challenge**
   - Read John's story on the left
   - Drag commands from the available list to the Git Bash terminal
     OR click commands to execute them
   - Watch realistic Git output appear in terminal
   - Live timer shows elapsed time

3. **Submit Answer**
   - When all commands are executed in correct order
   - Click **"Submit Answer"**
   - See immediate feedback (correct/incorrect + points)

### Presenter Flow

1. **Open Presenter View** at http://localhost:3000/quiz/presenter
   - Large screen display for audience
   - Shows current question automatically
   - Displays John's story for Git challenge

2. **Answer Reveal**
   - When admin clicks "Show Answers"
   - Presenter screen shows:
     - Complete Git terminal with all commands
     - Numbered list of correct command sequence
   - Green badge shows "Answers Visible"

---

## 🎨 Key Features

### Git Bash Terminal
- **Realistic styling**: Dark background (#0C0C0C), colored prompts
- **Window controls**: Red, yellow, green buttons
- **Drag-and-drop**: Smooth animations and hover effects
- **Command output**: Simulated Git responses with commit IDs
- **Auto-scroll**: Terminal scrolls as commands execute

### Timer System
- Starts when question loads
- Shows MM:SS format
- Tracked per team per question
- Used for rankings (tiebreaker)

### Results Dashboard
- **Podium colors**: Gold (#1), Silver (#2), Bronze (#3)
- **Real-time updates**: Polls every 10 seconds
- **Detailed breakdown**: Per-question performance
- **Sorting**: Score (desc), then time (asc)

### Answer Reveal
- **Controlled by admin**: Single button toggle
- **Instant sync**: Presenter view updates in ~3 seconds
- **Visual terminal**: Shows complete command sequence
- **Numbered list**: Clear step-by-step breakdown

---

## 📊 Database Schema

### Questions Table (Updated)
```typescript
{
  id: uuid,
  questionNumber: integer,
  questionType: enum('git_challenge', 'multiple_choice', 'text_answer'),
  title: varchar(500),
  description: text,
  story: text,                      // NEW: For git_challenge
  availableCommands: text,          // NEW: JSON array
  completedCommands: text,          // NEW: JSON array
  correctAnswer: text,              // JSON array for git_challenge
  points: integer,
  isEnabled: boolean,
  createdAt: timestamp
}
```

### Team Answers Table (Updated)
```typescript
{
  id: uuid,
  teamId: uuid,
  questionId: uuid,
  answer: text,                     // JSON array for git_challenge
  isCorrect: boolean,
  pointsAwarded: integer,
  timeStarted: timestamp,           // NEW
  timeCompleted: timestamp,         // NEW
  timeTaken: integer,               // NEW: seconds
  submittedAt: timestamp
}
```

### Quiz Config Table (Updated)
```typescript
{
  id: uuid,
  ...existing fields,
  showAnswers: boolean,             // NEW: Controls answer reveal
  currentQuestionId: uuid,
  updatedAt: timestamp
}
```

---

## 🧪 Testing Checklist

### Backend
- [ ] Database migration successful (`npm run db:push`)
- [ ] Git question seeded (`npm run seed:git-question`)
- [ ] Server running without errors
- [ ] API endpoints responding:
  - `GET /api/quiz/questions` - Returns questions
  - `POST /api/public/answers` - Accepts timing data
  - `GET /api/quiz/results` - Returns rankings
  - `POST /api/quiz/toggle-show-answers` - Toggles answers

### Frontend - Admin
- [ ] Login successful
- [ ] Questions page shows Git question
- [ ] Can enable/disable question
- [ ] Can set as current question
- [ ] Show/Hide Answers button works
- [ ] Results page displays rankings

### Frontend - Team
- [ ] Can select team and join quiz
- [ ] Git terminal displays correctly
- [ ] Drag-and-drop works smoothly
- [ ] Click-to-execute works
- [ ] Commands show realistic Git output
- [ ] Timer counts up correctly
- [ ] Submit shows correct feedback
- [ ] Can't submit same question twice

### Frontend - Presenter
- [ ] Shows current question
- [ ] Displays story for Git challenge
- [ ] Answer badge shows correct state
- [ ] When answers shown:
  - [ ] Terminal displays all commands
  - [ ] Numbered list shows sequence
  - [ ] Green card appears with animation

---

## 🎯 Question Data Structure

The Git question uses this format:

```javascript
{
  questionNumber: 1,
  questionType: 'git_challenge',
  title: "John's Git Journey",
  story: "Multi-line story text...",

  // Already completed (shown in terminal)
  completedCommands: [
    "git init",
    "git add index.html",
    "git commit -m \"Add initial index.html\"",
    // ... 7 total
  ],

  // Available to drag/drop
  availableCommands: [
    "git log --oneline",
    "git show <commit-id>",
    "git push origin feature-branch",
    // ... 6 total
  ],

  // Correct sequence
  correctAnswer: [
    "git log --oneline",
    "git show <commit-id>",
    "git push origin feature-branch",
    "git checkout main",
    "git merge feature-branch",
    "git push origin main"
  ],

  points: 100
}
```

---

## 🔧 Troubleshooting

### Commands not appearing in terminal
- Check browser console for errors
- Verify question has `availableCommands` and `completedCommands` in JSON format
- Make sure question type is `git_challenge`

### Answer reveal not working
- Check admin clicked "Show Answers" button
- Verify presenter view is polling (every 3 seconds)
- Check `/api/public/config` endpoint returns `showAnswers: true`

### Timer not starting
- Verify question loads successfully
- Check `GitQuizInterface` component receives question prop
- Look for console errors in team view

### Results not showing
- Ensure teams have submitted answers
- Check `/api/quiz/results` endpoint
- Verify super_admin role for results page access

---

## 🎨 Customization

### Add More Git Questions

Create a new seeder file or modify `git-question.seeder.ts`:

```typescript
const newGitQuestion = {
  questionNumber: 2,
  questionType: 'git_challenge',
  title: 'Your New Git Challenge',
  story: 'Your story here...',
  availableCommands: JSON.stringify([/* commands */]),
  completedCommands: JSON.stringify([/* commands */]),
  correctAnswer: JSON.stringify([/* correct sequence */]),
  points: 50,
};
```

### Modify Git Output

Edit `GitQuizInterface.tsx`, function `generateGitOutput()`:

```typescript
if (lowerCmd === 'your-command') {
  return 'Your custom output';
}
```

### Change Terminal Colors

Edit `GitBashTerminal.tsx`:

```typescript
// Background
className="bg-[#0C0C0C]" // Change hex color

// Prompt colors
<span className="text-green-400"> // User
<span className="text-yellow-300"> // Path
<span className="text-pink-400"> // Branch
```

---

## 📝 API Endpoints

### Public (No Auth)
- `GET /api/public/teams` - Get all teams
- `GET /api/public/questions/enabled` - Get enabled questions
- `GET /api/public/questions/current` - Get current question
- `GET /api/public/config` - Get quiz config (for presenter)
- `POST /api/public/answers` - Submit answer with timing

### Admin (Auth Required)
- `GET /api/quiz/questions` - Get all questions
- `POST /api/quiz/questions` - Create question
- `PATCH /api/quiz/questions/:id/toggle` - Enable/disable
- `POST /api/quiz/current-question` - Set current
- `POST /api/quiz/toggle-show-answers` - Show/hide answers

### Super Admin Only
- `GET /api/quiz/results` - Get team rankings

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Teams can drag commands to terminal
✅ Terminal shows colored Git output
✅ Timer counts up during quiz
✅ Submit gives instant feedback
✅ Results page shows rankings
✅ Admin can reveal answers
✅ Presenter screen updates automatically
✅ Answer terminal appears with animation

---

## 📞 Support

If you encounter issues:

1. Check backend logs for errors
2. Check browser console in frontend
3. Verify database schema is up to date
4. Ensure all dependencies are installed
5. Check API responses in Network tab

---

**Created with Claude Code** 🤖
