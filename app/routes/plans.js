const controller = require('../controllers/plans')
const validate = require('../controllers/plans.validate')
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

/*
 * Get items route
 */
router.get('/', controller.getItems)

/*
 * Create new item route
 */
router.post(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['admin', 'user']),
  trimRequest.all,
  validate.createItem,
  controller.createItem
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

/*
 * Update item route
 */
router.patch(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin', 'user']),
  trimRequest.all,
  validate.updateItem,
  controller.updateItem
)

/*
 * Delete item route
 */
router.delete(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin', 'user']),
  trimRequest.all,
  validate.deleteItem,
  controller.deleteItem
)

module.exports = router
