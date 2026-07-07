const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const auditLog = require('../middleware/auditLog');
const { transferSchema } = require('../validations/transaction.validation');

router.use(authenticate);

router.post('/transfer', validate(transferSchema), auditLog('TRANSFER'), transactionController.transfer);
router.get('/',    transactionController.getAll);
router.get('/:id', transactionController.getById);

module.exports = router;
