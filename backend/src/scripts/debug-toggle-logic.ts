
import { enableBidRoundInternal, disableBidRoundInternal } from '../controllers/mcq.controller';
import { db } from '../db';
import { quizConfig, mcqTimerState } from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const qId = '8edc3042-4597-432b-bd01-46362c96067c'; // Q15

    console.log('--- TESTING ENABLE ---');
    await enableBidRoundInternal(qId);

    const [config1] = await db.select().from(quizConfig).limit(1);
    const [timer1] = await db.select().from(mcqTimerState).where(eq(mcqTimerState.questionId, qId));

    console.log('QuizConfig.isBidQuestionActive:', config1?.isBidQuestionActive);
    console.log('QuizConfig.currentQuestionId:', config1?.currentQuestionId);
    console.log('Timer.bidRoundEnabled:', timer1?.bidRoundEnabled);

    if (config1?.isBidQuestionActive && timer1?.bidRoundEnabled) {
        console.log('SUCCESS: Enable worked.');
    } else {
        console.log('FAILURE: Enable failed.');
    }

    console.log('\n--- TESTING DISABLE ---');
    await disableBidRoundInternal(qId);

    const [config2] = await db.select().from(quizConfig).limit(1);
    const [timer2] = await db.select().from(mcqTimerState).where(eq(mcqTimerState.questionId, qId));

    console.log('QuizConfig.isBidQuestionActive:', config2?.isBidQuestionActive);
    console.log('Timer.bidRoundEnabled:', timer2?.bidRoundEnabled);

    if (!config2?.isBidQuestionActive && !timer2?.bidRoundEnabled) {
        console.log('SUCCESS: Disable worked.');
    } else {
        console.log('FAILURE: Disable failed.');
    }

    process.exit(0);
}

main().catch(console.error);
