import { Router } from "express";
import AuthController from "../controllers/AuthController";
import { checkJwt } from "../middlewares/checkJwt";

const router = Router();

/** Login route */
router.post('/login', AuthController.login);

router.post('/register', AuthController.register);

/** Change password */
router.post('/change-password', [checkJwt], AuthController.changePassword);

export default router;
