import { prisma } from '../config/database.js';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export class UserModel {
  // Create a new user
  static async create(userData: CreateUserData) {
    try {
      const user = await prisma.user.create({
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        },
      });
      return user;
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  }
}