import { db } from '../db';
import { users } from '../db/schema';
import { hashPassword } from '../utils/auth';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function seedRegularAdmin() {
  try {
    const adminEmail = 'regularadmin@quizz.com';

    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail));

    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log('Email:', adminEmail);
      process.exit(0);
    }

    const hashedPassword = await hashPassword('RegularAdmin@123');

    const [newAdmin] = await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Regular',
      lastName: 'Admin',
      role: 'admin',
    }).returning();

    console.log('Regular Admin created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password: RegularAdmin@123');
    console.log('Role:', newAdmin.role);
    console.log('\nPlease change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedRegularAdmin();
