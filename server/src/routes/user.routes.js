'use strict';

/**
 * User Routes
 *
 * Protected (any authenticated user):
 *   GET  /api/users/profile
 *   PUT  /api/users/profile
 *
 * Admin only:
 *   GET  /api/users              (paginated user list)
 */

const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const validate     = require('../middleware/validate');
const { updateProfileSchema } = require('../validations/auth.validation');
const { ROLES }   = require('../constants');

// All user routes require a valid access token
router.use(authenticate);

router.get('/profile', ctrl.getProfile);
router.put('/profile', validate(updateProfileSchema), ctrl.updateProfile);

// Admin-only: authorize checks req.user.role === 'ADMIN'
router.get('/', authorize(ROLES.ADMIN), ctrl.getAllUsers);

module.exports = router;
