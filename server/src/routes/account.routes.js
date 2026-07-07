const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createAccountSchema } = require('../validations/transaction.validation');

router.use(authenticate);

router.get('/',     accountController.getAll);
router.get('/:id',  accountController.getById);
router.post('/', validate(createAccountSchema), accountController.create);

module.exports = router;
