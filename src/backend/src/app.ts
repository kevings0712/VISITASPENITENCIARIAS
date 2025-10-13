import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(express.json());
app.use(cors({ origin: (process.env.CORS_ORIGIN?.split(',') || '*') as any }));

app.get('/api/health', (_req, res) => {
  res.json({ ok:true, service:'visicontrol-api', db_time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

export default app;


