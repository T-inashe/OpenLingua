import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Language Learning API is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is healthy'
  });
});

export default app;