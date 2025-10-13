import { Router } from 'express';
import { postLogin } from '../controllers/auth.controller';

const r = Router();
r.post('/login', postLogin);

export default r;
