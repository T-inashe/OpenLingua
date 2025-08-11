import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add Vite default port
  credentials: true
}));

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'OpenLingua API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/users', userRoutes);

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
export default app;