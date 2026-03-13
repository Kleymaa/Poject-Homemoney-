import { Router } from 'express';
import { health, ready } from '../controllers/health.controller';

const router = Router();

router.get('/', health);
router.get('/ready', ready);

export default router;