import express from 'express';
import { UserController } from '../controllers/userController.js';

const router = express.Router();

// User routes
router.post('/', UserController.createUser);

// Explicit default export
export { router as default };