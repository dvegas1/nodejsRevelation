/* eslint camelcase: ["error", {properties: "never"}]*/

const model = require('../models/user')
const utils = require('../middleware/utils')
const { matchedData } = require('express-validator')
const auth = require('../middleware/auth')
const express = require('express')
const firebase = require('../middleware/firebase')
const app = express()
const path = require('path')
const db = require('../middleware/db')

const responseImgperfil = {}

let dddd
/*********************
 * Private functions *
 *********************/

/**
 * Gets profile from database by id
 * @param {string} id - user id
 */
const getProfileFromDB = async id => {
  return new Promise((resolve, reject) => {
    model.findById(id, '-_id -updatedAt -createdAt', (err, user) => {
      utils.itemNotFound(err, user, reject, 'NOT_FOUND')
      resolve(user)
    })
  })
}

/**
 * Updates profile in database
 * @param {Object} req - request object
 * @param {string} id - user id
 */
const updateProfileInDB = async (req, id) => {
  console.log(`Actualizando datos de perfil:   ${JSON.stringify(req)}`)

  return new Promise((resolve, reject) => {
    model.findByIdAndUpdate(
      id,
      req,
      {
        new: true,
        runValidators: true,
        select: '-role -_id -updatedAt -createdAt'
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, 'NOT_FOUND')
        resolve(user)
      }
    )
  })
}

/**
 * Finds user by id
 * @param {string} email - user id
 */
const findUser = async id => {
  return new Promise((resolve, reject) => {
    model.findById(id, 'password email', (err, user) => {
      utils.itemNotFound(err, user, reject, 'USER_DOES_NOT_EXIST')
      resolve(user)
    })
  })
}

/**
 * Build passwords do not match object
 * @param {Object} user - user object
 */
const passwordsDoNotMatch = async () => {
  return new Promise(resolve => {
    resolve(utils.buildErrObject(409, 'WRONG_PASSWORD'))
  })
}

/**
 * Changes password in database
 * @param {string} id - user id
 * @param {Object} req - request object
 */
const changePasswordInDB = async (id, req) => {
  return new Promise((resolve, reject) => {
    model.findById(id, '+password', (err, user) => {
      utils.itemNotFound(err, user, reject, 'NOT_FOUND')

      // Assigns new password to user
      user.password = req.newPassword

      // Saves in DB
      user.save(error => {
        if (err) {
          reject(utils.buildErrObject(422, error.message))
        }
        resolve(utils.buildSuccObject('PASSWORD_CHANGED'))
      })
    })
  })
}

/********************
 * Public functions *
 ********************/

/**
 * Get profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getProfile = async (req, res) => {
  try {
    const id = await utils.isIDGood(req.user._id)

    console.log(`Obteniendo datos de perfil: ${JSON.stringify(req.user)}`)

    res.status(200).json(await getProfileFromDB(id))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Update profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateProfile = async (req, res) => {
  try {
    const id = await utils.isIDGood(req.user._id)
    req = matchedData(req)

    console.log(
      `[${id}]` + ` Actualizando perfil de User/Store ${JSON.stringify(req)}`
    )

    res.status(200).json(await updateProfileInDB(req, id))
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.regperfilimagenUser = async (req, res) => {
  try {
    let imgurl = ''
    let RsploadPhotoSignup = ''
    await firebase
      .loadPhotoSignup(req, res)
      .then(obj => {
        console.log(obj.response)
        imgurl = obj.response.data.url_img_gperfil
        RsploadPhotoSignup = obj.response

        if (
          RsploadPhotoSignup.error.rc == -3 ||
          RsploadPhotoSignup.error.rc == -2
        ) {
          utils.handleError(res, RsploadPhotoSignup.error)
        }

        return imgurl
      })
      .then(obj => {
        try {
          const options = {
            upsert: true,
            new: true,
            runValidators: true
          }

          const filter = { _id: id }
          const updateDoc = {
            $set: {
              imgperfil: imgurl
            }
          }
          const user = new model({
            username: req.username,
            imgperfil: imgurl
          })

          return new Promise((resolve, reject) => {
            model.findOneAndUpdate(filter, updateDoc, options, (err, user) => {
              utils.itemNotFound(err, user, reject, 'NOT_FOUND')
              resolve(user)
              res.status(200).json(user)
            })
          })
        } catch (error) {
          utils.handleError(res, error)
        }
      })
  } catch (error) {
    console.error(`error ${error}`)
    utils.handleError(res, error)
    res.status(500).json(error)
  }
}

exports.regperfilimagen = async (req, res) => {
  try {
    let imgurl = ''
    const id = await utils.isIDGood(req.user._id)
    if (id != null || id == undefined || id == undefined) {
      let RsploadPhotoSignup = ''
      await firebase
        .loadPhotoSignup(req, res)
        .then(obj => {
          console.log(obj.response)
          imgurl = obj.response.data.url_img_gperfil
          RsploadPhotoSignup = obj.response
          console.log(`Rsp imgPerfil: ${JSON.stringify(RsploadPhotoSignup)}`)
          //   utils.handleError(res, RsploadPhotoSignup.error)
          // res.status(500).json(RsploadPhotoSignup.errors)

          if (
            RsploadPhotoSignup.errors.rc == -3 ||
            RsploadPhotoSignup.errors.rc == -2
          ) {
            utils.handleError(res, RsploadPhotoSignup.errors)
            console.log(JSON.stringify(RsploadPhotoSignup.errors))
          }
          res.status(200).json(RsploadPhotoSignup)

          return imgurl
        })
        .then(obj => {
          try {
            const options = {
              upsert: true,
              new: true,
              runValidators: true
            }

            const filter = { _id: id }
            const updateDoc = {
              $set: {
                imgperfil: imgurl
              }
            }
            const user = new model({
              username: req.username,
              imgperfil: imgurl
            })

            return new Promise((resolve, reject) => {
              model.findOneAndUpdate(
                filter,
                updateDoc,
                options,
                (err, user) => {
                  utils.itemNotFound(err, user, reject, 'NOT_FOUND')
                  resolve(user)
                }
              )
            })
          } catch (error) {
            utils.handleError(res, error)
          }
        })
    } else {
      return res.status(403).send('User is not authorized')
    }
  } catch (error) {
    console.error(`error ${error}`)
    utils.handleError(res, error)
    res.status(500).json(error)
  }
}

/**
 * Change password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.changePassword = async (req, res) => {
  try {
    const id = await utils.isIDGood(req.user._id)
    const user = await findUser(id)
    req = matchedData(req)
    const isPasswordMatch = await auth.checkPassword(req.oldPassword, user)
    if (!isPasswordMatch) {
      utils.handleError(res, await passwordsDoNotMatch())
    } else {
      // all ok, proceed to change password
      res.status(200).json(await changePasswordInDB(id, req))
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}
