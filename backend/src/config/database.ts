import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const testConnection = async () => {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};