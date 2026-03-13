import { Router } from 'express';
import {
  createFamily,
  getMyFamily,
  inviteMember,
  acceptInvitation,
  getFamilyMembers,
  changeMemberRole,
  removeMember,
} from '../controllers/family.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createFamily);
router.get('/me', getMyFamily);
router.post('/:id/invite', inviteMember);
router.post('/invitations/:token/accept', acceptInvitation);
router.get('/:id/members', getFamilyMembers);
router.patch('/:id/members/:memberId/role', changeMemberRole);
router.delete('/:id/members/:memberId', removeMember);

export default router;