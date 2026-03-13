import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import indexRoutes from './routes/index.routes';
import swaggerSpec from '../docs/swagger';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { globalRateLimiter } from './middleware/rateLimit.middleware';
import { notFoundMiddleware } from './middleware/notFound.middleware';
import { errorMiddleware } from './middleware/error.middleware';

dotenv.config();

const app = express();

app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(requestIdMiddleware);
app.use(globalRateLimiter);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs/openapi.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use('/', indexRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;