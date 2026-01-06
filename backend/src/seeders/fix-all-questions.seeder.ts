import { db } from '../db';
import { questions } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

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
    // We map the descriptions/types to the specific slots 1-13.
    const desiredSequence = [
      { num: 1, type: 'git_challenge', titleHint: 'Git' },
      { num: 2, type: 'html_css_challenge', titleHint: 'CSS' }, // usually "CSS Card Stacking"
      { num: 3, type: 'js_engine_challenge', titleHint: 'Engine' },
      { num: 4, type: 'broken_html_challenge', titleHint: 'Layout' },
      { num: 5, type: 'true_false_drag_drop', titleHint: 'Async' },
      { num: 6, type: 'image_overlay', titleHint: 'Overlay' }, // Wait, verify type name
      { num: 7, type: 'multiple_choice', titleHint: 'Map' },
      { num: 8, type: 'multiple_choice', titleHint: 'Loop' },
      { num: 9, type: 'multiple_choice', titleHint: 'Execution Order' }, // Async 1
      { num: 10, type: 'multiple_choice', titleHint: 'Part 2' }, // Async 2
      { num: 11, type: 'mcq_bidding', titleHint: '' }, // Just first bid q
      { num: 12, type: 'mcq_bidding', titleHint: '' }, // Second bid q
      { num: 13, type: 'match_following', titleHint: 'Frontend' }
    ];

    // NOTE: Image Overlay type might be different. In fix-all original it checked:
    // "q.questionNumber === 6 && q.questionType === 'html_css_challenge'"
    // So Q6 is ALSO 'html_css_challenge' but distinct from Q2?
    // Let's rely on Title or existing ID if possible.

    console.log('--- Analyzing Questions ---');

    // Identify specific questions
    const qGit = findQ('git_challenge');
    const qHtmlCss1 = allQuestions.find(q => q.questionType === 'html_css_challenge' && q.title.includes('Stacking')); // Q2
    const qJsEngine = findQ('js_engine_challenge');
    const qBroken = findQ('broken_html_challenge');
    const qTrueFalse = findQ('true_false_drag_drop');

    // Q6: Image Overlay. If it was overwritten, we might not find it by title if title changed.
    // If it was overwritten by "JS Map", then "Image Overlay" is gone.
    // We might need to RE-INSERT it if missing.
    // Let's assume for a moment it might be missing.

    const qImageOverlay = allQuestions.find(q => q.questionType === 'html_css_challenge' && q.title.includes('Overlay'));
    const qJsMap = allQuestions.find(q => q.questionType === 'multiple_choice' && q.title.includes('Map'));
    const qJsLoop = allQuestions.find(q => q.questionType === 'multiple_choice' && q.title.includes('Loop'));
    const qAsync1 = allQuestions.find(q => q.questionType === 'multiple_choice' && q.title.includes('Execution Order - Part 1'));
    const qAsync2 = allQuestions.find(q => q.questionType === 'multiple_choice' && q.title.includes('Execution Order - Part 2'));

    const mcqBidding = allQuestions.filter(q => q.questionType === 'mcq_bidding').sort((a, b) => a.questionNumber - b.questionNumber);

    const qMatch = findQ('match_following');

    // MAPPING
    const updates: { id: string, num: number }[] = [];

    if (qGit) updates.push({ id: qGit.id, num: 1 });
    if (qHtmlCss1) updates.push({ id: qHtmlCss1.id, num: 2 });
    if (qJsEngine) updates.push({ id: qJsEngine.id, num: 3 });
    if (qBroken) updates.push({ id: qBroken.id, num: 4 });
    if (qTrueFalse) updates.push({ id: qTrueFalse.id, num: 5 });

    if (qImageOverlay) {
      updates.push({ id: qImageOverlay.id, num: 6 });
    } else {
      console.log("❌ Q6 (Image Overlay) seems missing. It might have been overwritten.");
      // We probably need to re-seed it.
      // For now, let's just log it.
    }

    if (qJsMap) updates.push({ id: qJsMap.id, num: 7 });
    if (qJsLoop) updates.push({ id: qJsLoop.id, num: 8 });
    if (qAsync1) updates.push({ id: qAsync1.id, num: 9 });
    if (qAsync2) updates.push({ id: qAsync2.id, num: 10 });

    if (mcqBidding.length > 0) updates.push({ id: mcqBidding[0].id, num: 11 });
    if (mcqBidding.length > 1) updates.push({ id: mcqBidding[1].id, num: 12 });

    if (qMatch) updates.push({ id: qMatch.id, num: 13 });

    // EXECUTE UPDATES
    console.log('--- Applying Order ---');
    for (const update of updates) {
      // Check if currently occupied to avoid unique constraint errors?
      // Best to move everything to temporary negative numbers first, then to correct positive numbers?
      // Or just strict update.
      // Let's try direct update. If collision, we might fail.
      // Safer: 
      // 1. Update target ID to target Num. 
      // If another Q has target Num, swap? 
      // Simplest: Update all to distinct high numbers first?
    }

    // Actually, let's just do it one by one and hope `questionNumber` isn't unique constraint (it usually is or should be).
    // If it is unique, we must be careful.

    // Better strategy:
    // 1. Set all target questions to negative of their target number (e.g. -1, -2).
    // 2. Then set them to positive.

    for (const update of updates) {
      await db.update(questions)
        .set({ questionNumber: -update.num })
        .where(eq(questions.id, update.id));
    }

    for (const update of updates) {
      await db.update(questions)
        .set({ questionNumber: update.num })
        .where(eq(questions.id, update.id));
      console.log(`✅ Assigned Q${update.num} to ${update.id}`);
    }

    console.log('\n✨ Sequence Fix Complete!');
    console.log('Please checking for missing questions manually if Q6 is absent.');

  } catch (error) {
    console.error('Error fixing questions:', error);
    throw error;
  }
}

if (require.main === module) {
  fixAllQuestions().then(() => process.exit(0)).catch(() => process.exit(1));
}
