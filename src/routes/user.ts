import { Router } from 'express';
import UserController from '../controllers/UserController';
import { checkJwt, checkRole } from '../middlewares';
import { UserRole } from '../models/User';

const router = Router();

// ? User operations

router.get('/me', [checkJwt], UserController.whoami);

// ? Administration CRUD operations

/** Get all users */
router.get(
	'/',
	[checkJwt, checkRole([UserRole.ADMIN])],
	UserController.listAll,
);

/** Get one user */
router.get(
	'/:id([0-9]+)',
	[checkJwt, checkRole([UserRole.ADMIN])],
	UserController.getUser,
);

/** Create new user */
router.post(
	'/',
	[checkJwt, checkRole([UserRole.ADMIN])],
	UserController.createUser,
);

/** Edit one user */
router.patch(
	'/:id([0-9]+)',
	[checkJwt, checkRole([UserRole.ADMIN])],
	UserController.updateUser,
);

/** Delete one user */
router.delete(
	'/:id([0-9]+)',
	[checkJwt, checkRole([UserRole.ADMIN])],
	UserController.deleteUser,
);

export default router;
