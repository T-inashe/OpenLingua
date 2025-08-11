// src/test-import.ts
console.log('Testing import...');
import { testConnection } from './config/database.js';
console.log('Import successful!', typeof testConnection);