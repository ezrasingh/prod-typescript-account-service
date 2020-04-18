import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { checkJwt } from '../middlewares';

const router = Router();

/** Login route */
router.post('/login', AuthController.login);

/** Register an account */
router.post('/register', AuthController.register);

/** Refresh auth token */
router.get('/refresh', [checkJwt], AuthController.refreshToken);

/** Change password */
router.post('/change-password', [checkJwt], AuthController.changePassword);

export default router;
