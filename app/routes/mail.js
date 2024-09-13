const controller = require('../controllers/mail')
const validate = require('../controllers/mail.validate')
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

/*
 * Get items route
 */
router.post(
  '/sendMailsignup',
  requireAuth,
  validate.sendMail,
  AuthController.roleAuthorization(['admin', 'user', 'store']),
  trimRequest.all,
  controller.sendMailregister
)

module.exports = router
