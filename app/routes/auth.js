const controller = require('../controllers/auth')
const controllerPerfil = require('../controllers/profile')

const validate = require('../controllers/auth.validate')
const validatePerfil = require('../controllers/profile.validate')

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
 * Auth routes
 */

/*
 * Register route
 */
router.post(
  '/register',
  trimRequest.all,
  validate.register,
  controller.register
)

router.post(
  '/registerRevelations',
  trimRequest.all,
  validate.register_revelations,
  controller.register_revelations
)

router.post(
  '/verifiRegisterEmail',
  trimRequest.all,
  validate.verifiRegisterEmail,
  controller.verifiRegisterEmail
)

/*
 * Verify route
 */
router.post('/verify', trimRequest.all, validate.verify, controller.verify)

/*
 * Forgot password route
 */
router.post(
  '/forgot',
  trimRequest.all,
  validate.forgotPassword,
  controller.forgotPassword
)

/*
 * Reset password route
 */
router.post(
  '/reset',
  trimRequest.all,
  validate.resetPassword,
  controller.resetPassword
)

/*
 * Get new refresh token
 */
router.get(
  '/token',
  requireAuth,
  AuthController.roleAuthorization(['user', 'admin']),
  trimRequest.all,
  controller.getRefreshToken
)

router.get(
  '/princeMoneyCrypto/:crypto',
  trimRequest.all,
  validate.getPrice_crypto,
  controller.getCripto
)
router.get('/testContract', trimRequest.all, controller.testContract)
/*
 * Login route
 */
router.post('/login', trimRequest.all, validate.login, controller.login)

router.post('/loginrevelations', trimRequest.all, validate.loginrevelations, controller.loginrevelations)

module.exports = router
