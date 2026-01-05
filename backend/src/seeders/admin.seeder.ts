import { db } from '../db';
import { users } from '../db/schema';
import { hashPassword } from '../utils/auth';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function seedSuperAdmin() {
  try {
    const superAdminEmail = 'admin@quizz.com';

    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, superAdminEmail));

    if (existingAdmin) {
      console.log('Super admin already exists!');
      console.log('Email:', superAdminEmail);
      process.exit(0);
    }

    const hashedPassword = await hashPassword('Admin@123');

    const [newAdmin] = await db.insert(users).values({
      email: superAdminEmail,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
    }).returning();

    console.log('Super admin created successfully!');
    console.log('Email:', superAdminEmail);
    console.log('Password: Admin@123');
    console.log('Role:', newAdmin.role);
    console.log('\nPlease change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();
