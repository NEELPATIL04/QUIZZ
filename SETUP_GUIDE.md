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

### PowerShell "Script execution disabled" error
If you see `npm : File ... cannot be loaded because running scripts is disabled on this system`:
1. Open PowerShell as Administrator (optional but recommended)
2. Run this command to allow local scripts:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
3. Type `Y` to confirm.
4. Try `npm run dev` again.

Alternatively, use Command Prompt (`cmd`) instead of PowerShell, or run:
```bash
cmd /c npm run dev
```

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

## 🎰 BID ROUND SETUP & TESTING GUIDE

### Current Status
✅ **Backend**: Fixed to ensure only ONE bid round question is enabled at a time
✅ **Frontend**: Fixed auto-sync interference and instructions page logic

### Quick Start for Bid Rounds

#### 1. Initial Database Setup
Run this script to disable all bid rounds and start fresh:
```bash
cd backend
npx tsx src/scripts/disable-all-bid-rounds.ts
```

#### 2. Check Bid Round States
```bash
cd backend
npx tsx src/scripts/check-bid-timer-states.ts
```

### Testing the Bid Round Functionality

#### Test Scenario 1: Initial Navigation to Bid Round
1. Navigate to question 14 (the question before bid rounds)
2. Click "Next Question" → Should show **Instructions Page** for Q15
3. Instructions page should have **NO navigation buttons**
4. In admin panel, click "Enable Bid Round" for Q15
5. Frontend should auto-refresh and show **Q15 actual question**
6. Question should have "Next Question →" and "← Exit Bid Round" buttons

#### Test Scenario 2: Navigate Within Bid Round
1. From Q15 (enabled), click "Next Question →"
2. Should show **Instructions Page** for Q16
3. In admin panel, click "Enable Bid Round" for Q16
4. Frontend should show **Q16 actual question**
5. **IMPORTANT**: Q15 should automatically be disabled (verify in database)
6. Navigate back to Q15 → Should show **Instructions** again

#### Test Scenario 3: Navigate to Last Bid Round Question (Q17)
1. Navigate to Q16, then click "Next Question →"
2. Should show **Instructions Page** for Q17 (no timer state exists yet)
3. In admin panel, enable Q17
4. Should show Q17 actual question
5. Should have "Exit Bid Round →" and "← Previous" buttons

#### Test Scenario 4: Exit Bid Round
1. From Q15 (first bid round question), click "← Exit Bid Round"
2. Should go back to Q14 (the question before bid round)
3. From Q17 (last bid round question), click "Exit Bid Round →"
4. Should go to Q18 (the question after bid round)

#### Test Scenario 5: Disable During Bid Round
1. Enable and navigate to Q15
2. In admin panel, click "Disable Bid Round" for Q15
3. Frontend should refresh and show **Instructions Page**
4. Re-enable Q15 from admin panel
5. Should return to Q15 actual question

### Key Changes Made

#### Backend Changes
**File**: [backend/src/controllers/mcq.controller.ts:32-82](backend/src/controllers/mcq.controller.ts#L32-L82)

Added to `enableBidRoundInternal()` function:
```typescript
// CRITICAL: First, disable ALL other bid round questions to ensure only ONE is active
await db
  .update(mcqTimerState)
  .set({
    bidRoundEnabled: false,
    updatedAt: new Date(),
  });
```

This ensures mutual exclusion - only one bid round question is enabled at any time.

#### Frontend Changes

**1. Disable Auto-Sync for Bid Round Questions**
**File**: [frontend/app/quiz/team/page.tsx:117-128](frontend/app/quiz/team/page.tsx#L117-L128)

Modified the polling mechanism to NOT auto-sync when on a bid round question:
```typescript
// CRITICAL FIX: Don't auto-sync if we're on a bid round question
// Let the user navigate bid rounds manually
const currentQ = currentQuestions[currentQuestionIndexRef.current];
const isBidRound = currentQ && currentQ.questionType === 'mcq_bidding';

// Only auto-sync if NOT on a bid round question
if (!isBidRound) {
  setCurrentQuestionIndex((prev) => {
    if (prev !== index) return index;
    return prev;
  });
}
```

**2. Fixed Instructions Page Logic**
**File**: [frontend/app/quiz/team/page.tsx:552-557](frontend/app/quiz/team/page.tsx#L552-L557)

Updated to show instructions when:
- Timer state doesn't exist yet (never enabled), OR
- Timer state exists for this question AND is disabled

```typescript
const shouldShowInstructions = currentQuestion.questionType === 'mcq_bidding' && (
  // Case 1: No timer state at all (never enabled) - show instructions
  !mcqTimerState ||
  // Case 2: Timer state exists, matches this question, and is disabled
  (mcqTimerState.questionId === currentQuestion.id && !mcqTimerState.bidRoundEnabled)
);
```

### Expected Database Behavior

**Rule**: Only ONE bid round enabled at a time

When you enable Q16, the backend automatically disables Q15 and Q17. This ensures:
- No conflicts between multiple enabled bid rounds
- Clean navigation flow
- No jumping between questions

**Timer State Records**:
- Q15: Has timer state (enabled/disabled based on admin action)
- Q16: Has timer state (enabled/disabled based on admin action)
- Q17: May not have timer state initially (shows instructions until first enable)

### Troubleshooting Bid Rounds

#### Issue: Questions keep jumping back to Q15
**Cause**: Auto-sync was interfering with manual navigation
**Fix**: Now disabled for bid round questions ✅

#### Issue: Q17 shows loading spinner forever
**Cause**: No timer state exists yet, and frontend was waiting for it
**Fix**: Now shows instructions when timer state doesn't exist ✅

#### Issue: Multiple bid rounds enabled simultaneously
**Cause**: Backend wasn't disabling other questions when enabling one
**Fix**: Backend now disables ALL others before enabling one ✅

#### Issue: Instructions not showing for disabled questions
**Cause**: Logic only checked if timer state existed AND was disabled
**Fix**: Now also shows instructions when timer state doesn't exist ✅

### Navigation Flow
```
Q14 (Regular) → Next → Q15 (Instructions) → Enable → Q15 (Question)
Q15 (Question) → Next → Q16 (Instructions) → Enable → Q16 (Question)
Q16 (Question) → Next → Q17 (Instructions) → Enable → Q17 (Question)
Q17 (Question) → Exit → Q18 (Regular)
```

### Exit Button Behavior
- **First Question (Q15)**: "← Exit Bid Round" goes back to Q14
- **Middle Questions (Q16)**: "Next →" and "← Previous" buttons
- **Last Question (Q17)**: "Exit Bid Round →" goes forward to Q18

### Success Criteria

✅ Instructions page shows for all disabled bid round questions
✅ No navigation buttons on instructions page
✅ Enabling from admin panel shows the actual question
✅ Only one bid round question is enabled at a time in database
✅ Navigation doesn't jump back to Q15 automatically
✅ Can navigate freely between bid rounds (seeing instructions or questions based on state)
✅ Exit buttons work correctly from first and last questions
✅ Re-enabling after disable returns to the last active question

---

**Created with Claude Code** 🤖
