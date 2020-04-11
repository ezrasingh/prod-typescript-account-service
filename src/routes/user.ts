import { Router } from "express";
import UserController from "../controllers/UserController";
import { checkJwt } from "../middlewares/checkJwt";
import { checkRole } from "../middlewares/checkRole";

const router = Router();

/** Get all users */
router.get('/', [checkJwt, checkRole(["ADMIN"])], UserController.listAll);

/** Get one user */
router.get('/:id([0-9]+)', [checkJwt, checkRole(["ADMIN"])], UserController.getUser);

/** Create new user */
router.post('/', [checkJwt, checkRole(["ADMIN"])], UserController.createUser);

/** Edit one user */
router.patch('/:id([0-9]+)', [checkJwt, checkRole(["ADMIN"])], UserController.updateUser);

/** Delete one user */
router.delete('/:id([0-9]+', [checkJwt, checkRole(["ADMIN"])], UserController.deleteUser);

export default router;

