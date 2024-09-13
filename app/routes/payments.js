const controller = require('../controllers/payments')
const validate = require('../controllers/payments.validate')
const AuthController = require('../controllers/auth')
const express = require('express')
const router = express.Router()
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})
const trimRequest = require('trim-request')

/*
 * Cities routes
 */

/*
 * Get all items route
 */
router.get('/all', controller.getAllItems)

router.post(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['admin', 'user']),
  trimRequest.all,
  validate.createItem,
  controller.createItem
)

module.exports = router
