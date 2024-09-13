const controller = require('../controllers/config')
const validate = require('../controllers/config.validate')
const AuthController = require('../controllers/auth')
const express = require('express')
const router = express.Router()
require('../../config/passport')
const passport = require('passport')
const requireAuth = passport.authenticate('jwt', {
  session: false
})
const trimRequest = require('trim-request')


router.get(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  controller.getItems
)

router.get('/all',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  controller.getAllItems)


router.post(
  '/:id',
  trimRequest.all,
  validate.teams_winner,
  controller.updateItem
)

router.post(
  '/',
  trimRequest.all,
  validate.createItem,
  controller.createItem
)



/*
router.get(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.getItem,
  controller.getItem
)
*/
/*
 * Update item route
 */
module.exports = router
