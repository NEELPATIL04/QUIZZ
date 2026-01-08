import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

async function testConnection() {
    try {
        console.log('Testing DB connection...');
        const [q] = await db.select().from(questions).limit(1);
        if (!q) {
            console.log('No questions found, but DB connected.');
            return;
        }
        console.log('Found question:', q.title, q.id);

        console.log('Attempting update...');
        const [updated] = await db.update(questions)
            .set({ isEnabled: !q.isEnabled })
            .where(eq(questions.id, q.id))
            .returning();

        console.log('Update success:', updated ? 'Yes' : 'No');
        console.log('New Status:', updated?.isEnabled);

    } catch (err) {
        console.error('DB Error:', err);
    }
    process.exit(0);
}

testConnection();
