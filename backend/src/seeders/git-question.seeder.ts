import { db } from '../db';
import { questions } from '../db/schema/quiz';

const gitQuizData = {
  questionNumber: 1,
  questionType: 'git_challenge' as const,
  title: 'John\'s Git Journey',
  description: 'Help John complete his Git workflow for the web project',
  story: `John is a frontend developer working on a web project and uses Git for version control.

He initializes a Git repository for the project.

He creates the main webpage file index.html and commits it.

While improving the UI, John updates index.html and commits the change with the message "Update UI in index.html".

Later, John adds three files—style.css, app.js, and about.html—to introduce styling, JavaScript functionality, and an additional page, and commits them together.

Before pushing his work, John wants to check the commit history, locate the commit "Update UI in index.html", and see exactly what changes were made in index.html.

After reviewing the changes, John pushes his branch to the remote repository and merges it into the main branch.`,

  availableCommands: JSON.stringify([
    'git log --oneline',
    'git show <commit-id>',
    'git push origin feature-branch',
    'git checkout main',
    'git merge feature-branch',
    'git push origin main'
  ]),

  completedCommands: JSON.stringify([
    'git init',
    'git add index.html',
    'git commit -m "Add initial index.html"',
    'git add index.html',
    'git commit -m "Update UI in index.html"',
    'git add style.css app.js about.html',
    'git commit -m "Add styling, script, and about page"'
  ]),

  correctAnswer: JSON.stringify([
    'git log --oneline',
    'git show <commit-id>',
    'git push origin feature-branch',
    'git checkout main',
    'git merge feature-branch',
    'git push origin main'
  ]),

  points: 100,
  isEnabled: false, // Admin will enable when ready
};

async function seedGitQuestion() {
  try {
    console.log('Starting Git question seeder...');

    // Check if question already exists
    const existingQuestion = await db
      .select()
      .from(questions)
      .where(eq(questions.questionNumber, gitQuizData.questionNumber))
      .limit(1);

    if (existingQuestion.length > 0) {
      console.log('Git question already exists. Updating...');
      await db
        .update(questions)
        .set(gitQuizData)
        .where(eq(questions.questionNumber, gitQuizData.questionNumber));
      console.log('Git question updated successfully!');
    } else {
      console.log('Creating new Git question...');
      await db.insert(questions).values(gitQuizData);
      console.log('Git question created successfully!');
    }

    console.log('\n✅ Git Question Details:');
    console.log('━'.repeat(50));
    console.log(`Question #: ${gitQuizData.questionNumber}`);
    console.log(`Type: ${gitQuizData.questionType}`);
    console.log(`Title: ${gitQuizData.title}`);
    console.log(`Points: ${gitQuizData.points}`);
    console.log(`Completed Commands: ${JSON.parse(gitQuizData.completedCommands).length}`);
    console.log(`Available Commands: ${JSON.parse(gitQuizData.availableCommands).length}`);
    console.log(`Enabled: ${gitQuizData.isEnabled ? 'Yes' : 'No'}`);
    console.log('━'.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Git question:', error);
    process.exit(1);
  }
}

// Import eq from drizzle-orm
import { eq } from 'drizzle-orm';

seedGitQuestion();
