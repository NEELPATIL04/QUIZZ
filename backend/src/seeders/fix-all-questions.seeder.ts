import { db } from '../db';
import { questions } from '../db/schema';
import { eq, asc, sql } from 'drizzle-orm';

export async function fixAllQuestions() {
  try {
    console.log('🔄 Fixing all questions and ensuring correct order (Master Fix)...\n');

    // 1. Fetch all questions
    const allQuestions = await db.select().from(questions).orderBy(asc(questions.questionNumber));

    // 2. Helper to find question by fuzzy match
    const findQ = (type: string, titlePartial?: string) => {
      return allQuestions.find(q =>
        q.questionType === type &&
        (!titlePartial || q.title.toLowerCase().includes(titlePartial.toLowerCase()))
      );
    };

    // 3. Define the Desired Sequence
    // We map the descriptions/types to the specific slots 1-17.
    const targets = [
      { num: 1, type: 'git_challenge', titleKey: 'Git' },
      { num: 2, type: 'html_css_challenge', titleKey: 'Bottom Right' },
      { num: 3, type: 'js_engine_challenge', titleKey: 'Engine' },
      { num: 4, type: 'broken_html_challenge', titleKey: 'Layout' },
      { num: 5, type: 'true_false_drag_drop', titleKey: 'Async' },
      // Q6: Image Overlay (CSS Stacking)
      { num: 6, type: 'html_css_challenge', titleKey: 'Stacking' },
      { num: 7, type: 'multiple_choice', titleKey: 'Map' },
      { num: 8, type: 'multiple_choice', titleKey: 'Loop' },
      { num: 9, type: 'multiple_choice', titleKey: 'Execution Order - Part 1' },
      { num: 10, type: 'multiple_choice', titleKey: 'Execution Order - Part 2' },

      // MCQ Bids - Special handling (sort by number usually, but let's try title if possible or just type)
      // Actually we have Titles: "Execution Sequence" (Q11 target?) and "Call Stack" (Q12 target?)
      { num: 11, type: 'mcq_bidding', titleKey: 'Execution Sequence' },
      { num: 12, type: 'mcq_bidding', titleKey: 'Call Stack' },

      { num: 13, type: 'match_following', titleKey: 'Frontend' },
      { num: 14, type: 'multiple_choice', titleKey: 'Promise Execution Flow' }, // Async Multi
      { num: 15, type: 'multiple_choice', titleKey: 'Transform' },
      { num: 16, type: 'multiple_choice', titleKey: 'Perfect Centering' },
      { num: 17, type: 'multiple_choice', titleKey: 'Navbar Layout' }
    ];

    console.log('--- Applying Order (Safe Mode + Cleanup) ---');

    console.log('1. Shifting ALL questions to temporary negative IDs...');
    for (const [index, q] of allQuestions.entries()) {
      await db.update(questions)
        .set({ questionNumber: -50000 - index })
        .where(eq(questions.id, q.id));
    }

    // Refetch to get negative IDs
    const shiftedQuestions = await db.select().from(questions);

    console.log('2. Assigning correct numbers and removing duplicates...');

    for (const target of targets) {
      // Find candidates
      const candidates = shiftedQuestions.filter(q =>
        q.questionType === target.type &&
        q.title.toLowerCase().includes(target.titleKey.toLowerCase())
      );

      if (candidates.length === 0) {
        console.log(`❌ Missing Q${target.num} (${target.titleKey})`);
        continue;
      }

      // Pick winner (first one)
      const winner = candidates[0];
      await db.update(questions)
        .set({ questionNumber: target.num })
        .where(eq(questions.id, winner.id));

      console.log(`✅ Assigned Q${target.num}: "${winner.title}"`);

      // Delete losers
      if (candidates.length > 1) {
        const losers = candidates.slice(1);
        console.log(`   🗑️  Deleting ${losers.length} duplicate(s) for Q${target.num}...`);
        for (const loser of losers) {
          await db.delete(questions).where(eq(questions.id, loser.id));
        }
      }
    }

    // 3. Cleanup any remaining negatives (questions not in our target list)
    const leftovers = await db.select().from(questions).where(sql`question_number < 0`);
    if (leftovers.length > 0) {
      console.log(`\n⚠️  Deleting ${leftovers.length} unmapped/leftover questions:`);
      for (const l of leftovers) {
        console.log(`   🗑️  ID: ${l.id} (${l.title})`);
        await db.delete(questions).where(eq(questions.id, l.id));
      }
    }

    console.log('\n✨ Sequence Fix & Cleanup Complete!');
    console.log('Total Questions should now be: ' + targets.length);

  } catch (error) {
    console.error('Error fixing questions:', error);
    throw error;
  }
}

if (require.main === module) {
  fixAllQuestions().then(() => process.exit(0)).catch(() => process.exit(1));
}

