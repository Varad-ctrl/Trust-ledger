const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiary.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { addBeneficiarySchema } = require('../validations/transaction.validation');

router.use(authenticate);

router.get('/',     beneficiaryController.getAll);
router.post('/', validate(addBeneficiarySchema), beneficiaryController.create);
router.delete('/:id', beneficiaryController.delete);

module.exports = router;
