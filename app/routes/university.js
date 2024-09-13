const controller = require('../controllers/university/university')
const validate = require('../controllers/university/university.validate')
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
  '/mision/all',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  controller.getAllItems
)

router.get(
  '/mision',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  controller.getItems
)

router.get('/anonymous/mision/', trimRequest.all, controller.getItems)

/*
 * Create new item route
 */
router.post(
  '/mision',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.createMisionItem,
  controller.createItem
)

/*
 * Get item route
 */
router.get(
  '/mision/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.getMisionItem,
  controller.getItem
)

/*
 * Update item route
 */
router.patch(
  '/mision/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.updateMisionItem,
  controller.updateItem
)

/*
 * Delete item route
 */
router.delete(
  '/mision/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.deleteMisionItem,
  controller.deleteItem
)

module.exports = router
