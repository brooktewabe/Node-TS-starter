import express, { RequestHandler } from 'express';
import { authController } from '../../controllers/auth.controller.ts';
import { createUserSchema } from '../../validations/user.validation.ts';
import { forgotPassword,resetSchema, changePassword} from '../../validations/auth.validation.ts'
import { loginSchema  } from '../../validations/auth.validation.ts';
import { validate } from '../../lib/validate.ts';
import { auth } from '../../lib/auth.ts';
import { authorization } from '../../lib/authorization.ts';
import { authLimiter } from '../../lib/rateLimiter.ts';

const router = express.Router();

// router.get('/healthcheck',authController.healthcheck )
router.post(
  '/create', 
  auth(),
  authorization('create user') as RequestHandler,
  validate(createUserSchema),
  authController.create as RequestHandler ,
);

router.post(
  '/login',
  validate(loginSchema),
  authLimiter,
  authController.login as RequestHandler,
);
router.post(
  '/check',
  authLimiter,
  authController.checkUser as RequestHandler,
);

router.patch(
  '/update-profile',
  auth(),
  authController.updateProfile as RequestHandler
);
router.patch(
  '/update-user/:userId',
  auth(), 
  authorization('update user') as RequestHandler,
  authController.updateUserByAdmin as RequestHandler
);
router.post(
  '/verify-otp',
  authController.verifyOtp,
);
router.post(
  '/verify-and-login',
  authController.verifyOtpAndLogin,
);
router.post(
  '/reset',
  validate(resetSchema),
  authController.resetPassword as RequestHandler,
);
router.post(
  '/resend-otp',
  authController.resendOtp as RequestHandler,
);
router.post(
  '/forgot-password',
  validate(forgotPassword),
  authController.forgotPassword
)

router.patch(
  '/change-password',
  auth(),
  validate(changePassword),
  authController.changePassword
);

router.patch(
  '/change-status',
  auth(), 
  authorization('update user') as RequestHandler,
  authController.toggleAccountStatus as RequestHandler
);

router.get(
  '/all-users',
  // setNewTokenHeader,
  auth(),
  authorization('get users') as RequestHandler,
  authController.getUsers  as RequestHandler,
)

router.patch(
  '/soft-delete',
  auth(),
  authController.deleteUser as RequestHandler
)

router.get(
  '/recent/log', 
  auth(), 
  authController.getRecentLogs
);

export default router;
