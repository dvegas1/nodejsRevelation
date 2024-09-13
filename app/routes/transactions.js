const controller = require('../controllers/transactions')
const validate = require('../controllers/transactions.validate')
//sconst AuthController = require('../controllers/auth')
const express = require('express')
const router = express.Router()
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})
const trimRequest = require('trim-request')

router.post(
  '/',
  trimRequest.all,
  validate.transaction,
  controller.insert_transaction_user
)
router.patch(
  '/:id',
  trimRequest.all,
  validate.updateItem,
  controller.updateItem
)

module.exports = router
