
import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq } from 'drizzle-orm';

async function repro() {
    console.log('Starting repro...');
    const QID = '4cac20cc-1149-4e5e-bc5a-959b2232e656';

    // 1. Fetch current data
    const [qHelper] = await db.select().from(questions).where(eq(questions.id, QID));
    console.log('Current Options:', qHelper?.options);

    // 2. Perform Update via fetch (mocking the API call)
    // We cannot easily use fetch against localhost:5000 if auth is required without a valid token.
    // However, I can DIRECTLY call the controller function if I mock req/res? 
    // No, better to test the full stack if possible.
    // But I don't have a token.

    // Alternative: Validate database update directly using the logic I wrote.
    // This replicates the controller logic exactly.

    const payloadOptions = JSON.stringify([
        { key: 'A', text: 'Repro Option A' },
        { key: 'B', text: 'Repro Option B' }
    ]);

    console.log('Payload Options (String):', payloadOptions);

    // Logic from controller
    let optionsString: string | undefined = undefined;
    const options = payloadOptions; // Simulate receiving string from body

    if (options) {
        if (typeof options === 'string') {
            try {
                const parsed = JSON.parse(options);
                if (typeof parsed === 'string') {
                    optionsString = parsed;
                } else {
                    optionsString = options;
                }
            } catch (e) {
                optionsString = options;
            }
        } else {
            optionsString = JSON.stringify(options);
        }
    }

    console.log('Processed optionsString:', optionsString);

    // 3. direct DB update
    await db.update(questions)
        .set({ options: optionsString, title: 'Repro Title Update' })
        .where(eq(questions.id, QID));

    console.log('Update done.');

    // 4. Verify
    const [qAfter] = await db.select().from(questions).where(eq(questions.id, QID));
    console.log('After Options:', qAfter?.options);

    process.exit(0);
}

repro();
