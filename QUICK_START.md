# Quick Start Guide - Git Quiz System

## 🚀 5-Minute Setup

### 1. Database Setup
```bash
cd backend
npm run db:push
npm run seed:git-question
```

### 2. Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Admin Setup
1. Go to http://localhost:3000
2. Login: `admin@quizz.com` / `Admin@123`
3. Navigate to **Questions**
4. Click **Unlock** icon for "John's Git Journey"
5. Click **"Set as Current"**

### 4. Open Presenter View
Open http://localhost:3000/quiz/presenter in a new window/screen

### 5. Teams Join
1. Go to http://localhost:3000/quiz
2. Select team number
3. Click "Start Quiz"
4. Drag commands to Git terminal
5. Click "Submit Answer"

---

## 🎮 Quick Controls

### Admin Controls
- **Enable Question**: Click unlock icon
- **Set Current**: Click "Set as Current" button
- **Show Answers**: Click "Show Answers" button (toggle)
- **View Results**: Click "Results" in sidebar

### Team Controls
- **Execute Command**: Drag OR click command
- **Submit**: Click "Submit Answer" button

### Presenter View
- **Auto-updates** every 3 seconds
- **Shows answers** when admin enables

---

## 📊 File Structure

```
backend/
├── src/
│   ├── controllers/quiz.controller.ts  ← Timing & results logic
│   ├── controllers/team.controller.ts  ← Answer validation
│   ├── db/schema/quiz.ts               ← Database schema
│   └── seeders/git-question.seeder.ts  ← Git quiz data

frontend/
├── app/
│   ├── dashboard/
│   │   ├── questions/page.tsx          ← Admin controls
│   │   └── results/page.tsx            ← Rankings
│   └── quiz/
│       ├── team/page.tsx               ← Team interface
│       └── presenter/page.tsx          ← Presenter view
├── components/
│   ├── GitBashTerminal.tsx             ← Terminal UI
│   └── GitQuizInterface.tsx            ← Quiz logic
└── lib/api.ts                          ← API calls
```

---

## ✅ Quick Test

1. Admin enables question ✓
2. Team sees Git terminal ✓
3. Team drags 6 commands ✓
4. Timer shows elapsed time ✓
5. Submit shows result ✓
6. Results page shows ranking ✓
7. Admin clicks "Show Answers" ✓
8. Presenter shows answer ✓

---

## 🎯 Key URLs

- **Login**: http://localhost:3000
- **Team Join**: http://localhost:3000/quiz
- **Presenter**: http://localhost:3000/quiz/presenter
- **Admin Questions**: http://localhost:3000/dashboard/questions
- **Results**: http://localhost:3000/dashboard/results

---

## 🔥 Pro Tips

1. **Multiple Teams**: Create teams in "Team Management" first
2. **Parallel Testing**: Open multiple incognito windows as different teams
3. **Answer Reveal**: Use during quiz review or after all teams submit
4. **Rankings**: Sorted by score first, then completion time
5. **Realistic Demo**: Project presenter view on big screen

---

## 🐛 Common Issues

**Q: Terminal not showing?**
- Check question type is `git_challenge`
- Verify `availableCommands` exists in database

**Q: Timer not working?**
- Check browser console for errors
- Refresh page

**Q: Answers not revealing?**
- Admin must click "Show Answers" button
- Wait 3 seconds for presenter to poll

**Q: No rankings?**
- Teams must submit answers first
- Check super_admin role for results page

---

**Need more help?** See SETUP_GUIDE.md for detailed documentation.
