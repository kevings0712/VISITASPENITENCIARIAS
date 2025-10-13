import { Router } from 'express';
import { getVisits, postVisit } from '../controllers/visits.controller';
import { requireAuth } from '../middlewares/auth';

const r = Router();

r.get('/', requireAuth, getVisits);
r.post('/', requireAuth, postVisit);

export default r;
