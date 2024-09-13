const controller = require('../controllers/users')
const validate = require('../controllers/users.validate')
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

router.get('/imgperfildefault', trimRequest.all, controller.getmgperfilDefault)


router.patch(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.updateItem,
  controller.updateItem
)

router.post(
  '/',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.createUser,
  controller.createItem
)



router.get(
  '/DataStaticsCicles',
  trimRequest.all,
  validate.DataStaticsCicles,
  controller.DataStaticsCicles
)
router.get(
  '/getNotifyEmail',
  requireAuth,
  AuthController.roleAuthorization(['admin', 'user']),
  trimRequest.all,
  validate.getNotifyEmail,
  controller.getNotifyEmail
)
/*
 * Create new item route
 */
router.post(
  '/imgperfildefault',
  // requireAuth,
  // AuthController.roleAuthorization(['admin','user']),
  trimRequest.all,
  validate.urldefaultperfil,
  controller.createImgperfilDefault
)
router.post(
  '/notifications',
  requireAuth,
  AuthController.roleAuthorization(['user']),
  trimRequest.all,
  validate.send_notifications,
  controller.SendNotifications
)

/*
 * Create new item route
 */
/*
router.post(
  '/',
  // requireAuth,
  // AuthController.roleAuthorization(['admin','user']),
  trimRequest.all,
  validate.urldefaultperfil,
  controller.createImgperfilDefault
)*/

router.post(
  '/uploadPhotoPerfilsignum',
  trimRequest.all,
  validate.filePerfil,
  controller.regperfilimagen
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


/*
 * Delete item route
 */
router.delete(
  '/:id',
  requireAuth,
  AuthController.roleAuthorization(['admin']),
  trimRequest.all,
  validate.deleteItem,
  controller.deleteItem
)


module.exports = router
