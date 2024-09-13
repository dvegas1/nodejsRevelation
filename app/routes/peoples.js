const controller = require('../controllers/peoples')
const validate = require('../controllers/peoples.validate')
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

router.get(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  controller.getItems
)


router.get(
  '/:credentialuser',
  trimRequest.all,
  validate.getPeoples,
  controller.getPeoples
)

router.post(
  '/createPeople/',
  trimRequest.all,
  validate.createPeople_Adm,
  controller.createPeople_adm
)


router.post(
  '/add_peoples/',
  trimRequest.all,
  validate.add_peoples,
  controller.add_peoples
)

router.patch(
  '/vote/:id',
  requireAuth,
  AuthController.roleAuthorization(['user', 'admin']),
  trimRequest.all,
  validate.votePeople,
  controller.votePeople
)

router.patch(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  validate.updatePeople,
  controller.updatePeople
)

router.patch(
  '/edit__adm/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.updatePeople_adm,
  controller.updatePeople_adm
)
router.delete(
  '/delete_adm/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.deleteItem_adm,
  controller.deleteItem_adm
)

router.delete(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['user','admin']),
  trimRequest.all,
  validate.deleteItem,
  controller.deleteItem
)

router.post(
  '/deletePeople/:id',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  validate.deleteItem,
  controller.deleteItem
)

module.exports = router
