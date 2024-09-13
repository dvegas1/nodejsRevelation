const controller = require('../controllers/winner')
const validate = require('../controllers/winner.validate')
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
 * Users routes
 */

/*
 * Get items route
 */
router.get(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  controller.getItems
)

router.post(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  controller.search_winner
)

router.delete(
  '/delete_adm/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.deleteItem_adm,
  controller.deleteItem_adm
)

router.patch(
  '/:id/confirm_winner',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.confirmWinner,
  controller.confimr_winner
)

router.post(
  '/notifications',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.send_notifications,
  controller.SendNotifications
)


/*
 * Get item route
 */
router.get(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin', 'user']),
  trimRequest.all,
  validate.getItem,
  controller.getItem
)

router.delete(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.deleteItem,
  controller.deleteItem
)


module.exports = router
