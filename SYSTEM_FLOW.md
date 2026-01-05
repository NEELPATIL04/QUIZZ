# Git Quiz System - Complete Flow Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD                          │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Questions    │  │   Results    │  │ Team Management  │   │
│  │                │  │              │  │                  │   │
│  │ • Enable Q1    │  │ Rankings:    │  │ • Create Teams   │   │
│  │ • Set Current  │  │ 1. Team 3    │  │ • Initialize     │   │
│  │ • Show Answer  │  │ 2. Team 1    │  │                  │   │
│  └────────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │   PostgreSQL DB      │
                    │                      │
                    │ • Questions (Git)    │
                    │ • Teams & Answers    │
                    │ • Timing Data        │
                    │ • showAnswers flag   │
                    └──────────────────────┘
                               ↓
              ┌────────────────┴────────────────┐
              ↓                                  ↓
┌─────────────────────────┐       ┌─────────────────────────┐
│    TEAM INTERFACE       │       │   PRESENTER SCREEN      │
│                         │       │                         │
│ ┌─────────────────────┐ │       │ ┌─────────────────────┐ │
│ │     Story Panel     │ │       │ │   Current Question  │ │
│ │                     │ │       │ │                     │ │
│ │ John is a frontend  │ │       │ │ Q1: John's Journey  │ │
│ │ developer working   │ │       │ │ 100 points          │ │
│ │ on a web project... │ │       │ │                     │ │
│ └─────────────────────┘ │       │ │ [Story Display]     │ │
│                         │       │ └─────────────────────┘ │
│ ┌─────────────────────┐ │       │                         │
│ │  Git Bash Terminal  │ │       │ ┌─────────────────────┐ │
│ │                     │ │       │ │  Answer Section     │ │
│ │ $ git init         │ │       │ │  (When Revealed)    │ │
│ │ $ git add ...      │ │       │ │                     │ │
│ │ $ [drag here] ▊    │ │       │ │ 1. git log --oneline│ │
│ │                     │ │       │ │ 2. git show <id>    │ │
│ │ Timer: 02:34       │ │       │ │ 3. git push origin  │ │
│ └─────────────────────┘ │       │ │ ...                 │ │
│                         │       │ └─────────────────────┘ │
│ ┌─────────────────────┐ │       │                         │
│ │ Available Commands  │ │       │ Auto-updates every 3s   │
│ │ • git log --oneline │ │       └─────────────────────────┘
│ │ • git show <id>     │ │
│ │ • git push origin   │ │
│ └─────────────────────┘ │
│                         │
│   [Submit Answer]       │
└─────────────────────────┘
```

---

## 🔄 Quiz Lifecycle Flow

```
START
  │
  ├─► 1. ADMIN: Create Teams
  │        └─► Database: teams table populated
  │
  ├─► 2. ADMIN: Seed Git Question
  │        └─► Database: questions table + Git data
  │
  ├─► 3. ADMIN: Enable Question
  │        └─► Database: isEnabled = true
  │
  ├─► 4. ADMIN: Set as Current Question
  │        └─► Database: currentQuestionId = question.id
  │              │
  │              └─► PRESENTER: Shows question (auto-poll)
  │
  ├─► 5. TEAMS: Join & Start Quiz
  │        │
  │        ├─► Load question with:
  │        │   • Story
  │        │   • Completed commands (7)
  │        │   • Available commands (6)
  │        │
  │        ├─► Timer Starts (client-side)
  │        │
  │        ├─► Drag/Click Commands
  │        │   └─► Terminal shows Git output
  │        │
  │        └─► Submit Answer
  │            │
  │            ├─► Backend validates sequence
  │            ├─► Calculate points (correct = 100, incorrect = 0)
  │            ├─► Save timing (timeStarted, timeCompleted, timeTaken)
  │            └─► Update team score
  │
  ├─► 6. ADMIN: View Results
  │        └─► Rankings by score, then time
  │
  ├─► 7. ADMIN: Show Answers
  │        └─► Database: showAnswers = true
  │              │
  │              └─► PRESENTER: Reveals answer (auto-poll)
  │                    • Git terminal with all commands
  │                    • Numbered sequence list
  │
  └─► 8. ADMIN: Next Question
           └─► Repeat from step 4
```

---

## 🎯 Data Flow - Command Execution

```
TEAM DRAGS COMMAND
       ↓
  ┌─────────────────────────────────┐
  │   GitQuizInterface Component    │
  │                                 │
  │   handleCommandExecute()        │
  │   ├─► Add to executedCommands   │
  │   ├─► Generate Git output       │
  │   └─► Update terminal display   │
  └─────────────────────────────────┘
       ↓
  ┌─────────────────────────────────┐
  │   GitBashTerminal Component     │
  │                                 │
  │   • Animate command entry       │
  │   • Show colored output         │
  │   • Scroll to bottom            │
  └─────────────────────────────────┘
       ↓
TEAM CLICKS SUBMIT
       ↓
  ┌─────────────────────────────────┐
  │   Calculate Time Taken          │
  │   (endTime - startTime)         │
  └─────────────────────────────────┘
       ↓
  ┌─────────────────────────────────┐
  │   POST /api/public/answers      │
  │                                 │
  │   Body: {                       │
  │     teamNumber: 1,              │
  │     questionId: "uuid",         │
  │     answer: ["git log", ...],   │
  │     timeTaken: 154,             │
  │     timeStarted: "timestamp"    │
  │   }                             │
  └─────────────────────────────────┘
       ↓
  ┌─────────────────────────────────┐
  │   Backend Validation            │
  │                                 │
  │   if (questionType === 'git_   │
  │       challenge') {             │
  │     compare arrays in order     │
  │   }                             │
  │                                 │
  │   isCorrect = match?            │
  │   points = isCorrect ? 100 : 0  │
  └─────────────────────────────────┘
       ↓
  ┌─────────────────────────────────┐
  │   Save to Database              │
  │                                 │
  │   teamAnswers: {                │
  │     answer: JSON.stringify(),   │
  │     isCorrect,                  │
  │     pointsAwarded,              │
  │     timeStarted,                │
  │     timeCompleted,              │
  │     timeTaken: 154 seconds      │
  │   }                             │
  │                                 │
  │   teams.score += points         │
  └─────────────────────────────────┘
       ↓
  ┌─────────────────────────────────┐
  │   Return Result                 │
  │                                 │
  │   {                             │
  │     isCorrect: true,            │
  │     pointsAwarded: 100          │
  │   }                             │
  └─────────────────────────────────┘
       ↓
TEAM SEES FEEDBACK
  ✓ Correct! You earned 100 points!
  ⏱ Time Taken: 2:34
```

---

## 📊 Answer Reveal Flow

```
ADMIN DASHBOARD
  │
  ├─► Admin clicks "Show Answers" button
  │
  └─► POST /api/quiz/toggle-show-answers
           │
           └─► Body: { showAnswers: true }
                    ↓
              ┌──────────────────┐
              │   Database       │
              │                  │
              │   quiz_config:   │
              │   showAnswers ✓  │
              └──────────────────┘
                    ↓
           ┌────────┴────────┐
           ↓                 ↓
    TEAM SCREENS      PRESENTER SCREEN
    (No change)       (Polls every 3s)
                            ↓
                   GET /api/public/config
                            ↓
                   { showAnswers: true }
                            ↓
              ┌──────────────────────────┐
              │   Presenter UI Update    │
              │                          │
              │   1. Badge: "Answers     │
              │      Visible" (green)    │
              │                          │
              │   2. Show Answer Card:   │
              │      • Git Terminal      │
              │      • Command List      │
              │      • Fade-in animation │
              └──────────────────────────┘
                            ↓
              AUDIENCE SEES CORRECT ANSWER

─────────────────────────────────────────

ADMIN DASHBOARD
  │
  ├─► Admin clicks "Hide Answers" button
  │
  └─► POST /api/quiz/toggle-show-answers
           │
           └─► Body: { showAnswers: false }
                    ↓
              ┌──────────────────┐
              │   Database       │
              │                  │
              │   quiz_config:   │
              │   showAnswers ✗  │
              └──────────────────┘
                    ↓
              PRESENTER SCREEN
              (Polls every 3s)
                    ↓
              Answer card disappears
              Badge: "Answers Hidden" (gray)
```

---

## 🏆 Results Calculation Flow

```
GET /api/quiz/results (Super Admin)
           ↓
  ┌─────────────────────────────────┐
  │   Fetch All Teams               │
  │   • Team 1, 2, 3, ...           │
  └─────────────────────────────────┘
           ↓
  ┌─────────────────────────────────┐
  │   For Each Team:                │
  │                                 │
  │   1. Get all team_answers       │
  │   2. Sum pointsAwarded → score  │
  │   3. Sum timeTaken → totalTime  │
  └─────────────────────────────────┘
           ↓
  ┌─────────────────────────────────┐
  │   Sort Teams:                   │
  │                                 │
  │   Primary: score DESC           │
  │   Secondary: totalTime ASC      │
  │                                 │
  │   Example:                      │
  │   Team 3: 100pts, 2:15 → Rank 1 │
  │   Team 1: 100pts, 2:45 → Rank 2 │
  │   Team 2:   0pts, 1:30 → Rank 3 │
  └─────────────────────────────────┘
           ↓
  ┌─────────────────────────────────┐
  │   Add Metadata:                 │
  │                                 │
  │   results.map((r, idx) => ({    │
  │     ...r,                       │
  │     rank: idx + 1,              │
  │     answers: [...],             │
  │   }))                           │
  └─────────────────────────────────┘
           ↓
  ┌─────────────────────────────────┐
  │   Return Ranked Results         │
  │                                 │
  │   [                             │
  │     {                           │
  │       rank: 1,                  │
  │       teamNumber: 3,            │
  │       score: 100,               │
  │       totalTimeTaken: 135,      │
  │       answers: [...]            │
  │     },                          │
  │     ...                         │
  │   ]                             │
  └─────────────────────────────────┘
           ↓
     RESULTS DASHBOARD
      • Trophy icons
      • Podium colors
      • Detailed breakdown
```

---

## 🔐 Role-Based Access

```
┌──────────────────┐
│   SUPER ADMIN    │
├──────────────────┤
│ ✓ Dashboard      │
│ ✓ Users          │
│ ✓ Team Mgmt      │
│ ✓ Questions      │
│ ✓ Results ⭐     │
│ ✓ All Controls   │
└──────────────────┘

┌──────────────────┐
│      ADMIN       │
├──────────────────┤
│ ✗ Dashboard      │
│ ✗ Users          │
│ ✗ Team Mgmt      │
│ ✓ Questions      │
│ ✗ Results        │
│ ✓ Show Answers   │
│ ✓ Set Current Q  │
└──────────────────┘

┌──────────────────┐
│      TEAMS       │
├──────────────────┤
│ No Login         │
│ ✓ Join Quiz      │
│ ✓ Answer Qs      │
│ ✓ See Feedback   │
│ ✗ Admin Access   │
└──────────────────┘

┌──────────────────┐
│    PRESENTER     │
├──────────────────┤
│ No Login         │
│ ✓ View Current Q │
│ ✓ See Answers    │
│   (when shown)   │
│ ✗ Edit Anything  │
└──────────────────┘
```

---

## 🎨 Component Hierarchy

```
App
├── Login Page
│
├── Dashboard (Auth Required)
│   ├── Layout + Sidebar
│   │   ├── Dashboard (Super Admin)
│   │   ├── Users (Super Admin)
│   │   ├── Team Management (Super Admin)
│   │   ├── Questions (Admin + Super Admin)
│   │   │   ├── Question List
│   │   │   ├── Show/Hide Answers Button
│   │   │   └── Set Current Button
│   │   └── Results (Super Admin)
│   │       ├── Leaderboard Table
│   │       └── Detailed Results
│   │
│
├── Quiz (Public)
│   ├── Team Selection
│   └── Team Quiz Page
│       ├── Regular Question (text_answer)
│       │   └── Input + Submit
│       └── Git Challenge (git_challenge)
│           └── GitQuizInterface
│               ├── Story Panel
│               ├── GitBashTerminal
│               │   ├── Available Commands
│               │   └── Terminal Display
│               ├── Timer
│               └── Submit Button
│
└── Presenter (Public)
    ├── Current Question Display
    └── Answer Section (conditional)
        ├── GitBashTerminal (readonly)
        └── Command Sequence List
```

---

**System designed for scalability and real-time interaction!** 🚀
