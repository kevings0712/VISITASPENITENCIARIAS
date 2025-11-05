import { Router } from 'express';
import { getVisits, postVisit, putVisit, deleteVisitCtrl} from '../controllers/visits.controller';
import { requireAuth } from '../middlewares/auth';


const r = Router();

r.use(requireAuth);

// /api/visits
r.get('/', getVisits);
r.post('/', postVisit);

// /api/visits/:id
r.put('/:id', putVisit);
r.delete('/:id', deleteVisitCtrl);

export default r;
