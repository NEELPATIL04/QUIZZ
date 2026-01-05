import { Router } from 'express';
import { getAllUsers, createUser, deleteUser } from '../controllers/users.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// User management - super_admin only
router.use(authenticate);
router.use(authorize('super_admin'));

router.get('/', getAllUsers);
router.post('/', createUser);
router.delete('/:id', deleteUser);

export default router;
