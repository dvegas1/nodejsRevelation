/* eslint camelcase: ["error", {properties: "never"}]*/

const jwt = require('jsonwebtoken')
const User = require('../models/user')
const userRevelations = require('../models/userRevelations')
const cicles = require('../models/cicles')
const plans = require('../models/plans')
const Transfer = require('../models/transfer')
const model_payments = require('../models/payments')
const transactions = require('../models/transactions')
const UserAccess = require('../models/userAccess')
const ForgotPassword = require('../models/forgotPassword')
const utils = require('../middleware/utils')
const uuid = require('uuid')
const { addHours } = require('date-fns')
const { matchedData } = require('express-validator')
const auth = require('../middleware/auth')
const emailer = require('../middleware/emailer')
const mail = require('./mail')
const db = require('../middleware/db')
const { json } = require('body-parser')
const notifications = require('../models/notifications')
const { request } = require('gaxios')
const TronWeb = require('tronweb')
var User_TronWeb = ''
const trc20ContractAddress = 'TJcyBonav2oj7oDMuMARn2ANycKauxbZ3U' //contract address

const HOURS_TO_BLOCK = 2
const LOGIN_ATTEMPTS = 5

const updateProfileInDB = async (req, model, id) => {
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
        if (user) {
          resolve(user)
        } else {
          resolve({})
        }
      }
    )
  })
}


exports.verifiRegisterEmail = async (req, res) => {
  const JsonDataId = []
  var data = []
  req = matchedData(req)

  console.log(JSON.stringify(req))
  var existEmail = []

  if (req.email != undefined && req.email != '') {
    existEmail = await findUserEmail(req.email)

    if (existEmail != undefined && existEmail != '' && existEmail != null) {
      JsonDataId.push('existEmail', existEmail)
    } else {
      JsonDataId.push('invalidMailEmail', true)
    }
  }

  data = {
    existEmail: existEmail
  }
  console.log(`  data ${JSON.stringify(data)}`)
  res.status(200).json(data)
}

const generateToken = user => {
  // Gets expiration time
  const expiration =
    Math.floor(Date.now() / 1000) + 60 * process.env.JWT_EXPIRATION_IN_MINUTES

  // returns signed and encrypted token
  return auth.encrypt(
    jwt.sign(
      {
        data: {
          _id: user
        },
        exp: expiration
      },
      process.env.JWT_SECRET
    )
  )
}



/**
 * Creates an object with user info
 * @param {Object} req - request object
 */
const setUserInfo = req => {
  let user = {
    _id: req._id,
    credentialuser: req.credentialuser,
    name: req.name,
    role: req.role,
    email: req.email,
    iduser: req.iduser,
    cicles: req.cicles,
    username: req.username,
    paid: req.paid,
    verified: req.verified
  }
  // Adds verification for testing purposes
  if (process.env.NODE_ENV !== 'production') {
    user = {
      ...user,
      verification: req.verification
    }
  }
  return user
}


/**
 * Saves a new user access and then returns token
 * @param {Object} req - request object
 * @param {Object} user - user object
 */
const saveRevelationsUserAccessAndReturnToken = async (req, user) => {
  return new Promise((resolve, reject) => {

    const userAccess = new UserAccess({
      ip: utils.getIP(req),
      browser: utils.getBrowserInfo(req),
      country: utils.getCountry(req)
    })

    userAccess.save(err => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      const userInfo = setUserInfo(user)
      // Returns data with access token
      resolve({
        token: generateToken(user._id),
        user: userInfo
      })
    })
  })
}

/**
 * Saves a new user access and then returns token
 * @param {Object} req - request object
 * @param {Object} user - user object
 */
const saveUserAccessAndReturnToken = async (req, user) => {
  return new Promise((resolve, reject) => {

    const userAccess = new UserAccess({
      role: user.role,
      email: user.email,
      password: req.password,
      ip: utils.getIP(req),
      browser: utils.getBrowserInfo(req),
      country: utils.getCountry(req)
    })

    userAccess.save(err => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      const userInfo = setUserInfo(user)
      // Returns data with access token
      resolve({
        token: generateToken(user._id),
        user: userInfo
      })
    })
  })
}

/**
 * Blocks a user by setting blockExpires to the specified date based on constant HOURS_TO_BLOCK
 * @param {Object} user - user object
 */
const blockUser = async user => {
  return new Promise((resolve, reject) => {
    user.blockExpires = addHours(new Date(), HOURS_TO_BLOCK)
    user.save((err, result) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      if (result) {
        resolve(utils.buildErrObject(409, 'BLOCKED_USER'))
      }
    })
  })
}

/**
 * Saves login attempts to dabatabse
 * @param {Object} user - user object
 */
const saveLoginAttemptsToDB = async user => {
  return new Promise((resolve, reject) => {
    user.save((err, result) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      if (result) {
        resolve(true)
      }
    })
  })
}

/**
 * Checks that login attempts are greater than specified in constant and also that blockexpires is less than now
 * @param {Object} user - user object
 */
const blockIsExpired = user =>
  user.loginAttempts > LOGIN_ATTEMPTS && user.blockExpires <= new Date()

/**
 *
 * @param {Object} user - user object.
 */
const checkLoginAttemptsAndBlockExpires = async user => {
  return new Promise((resolve, reject) => {
    // Let user try to login again after blockexpires, resets user loginAttempts
    if (blockIsExpired(user)) {
      user.loginAttempts = 0
      user.save((err, result) => {
        if (err) {
          reject(utils.buildErrObject(422, err.message))
        }
        if (result) {
          resolve(true)
        }
      })
    } else {
      // User is not blocked, check password (normal behaviour)
      resolve(true)
    }
  })
}

/**
 * Checks if blockExpires from user is greater than now
 * @param {Object} user - user object
 */
const userIsBlocked = async user => {
  return new Promise((resolve, reject) => {
    if (user.blockExpires > new Date()) {
      reject(utils.buildErrObject(409, 'BLOCKED_USER'))
    }
    resolve(true)
  })
}

const findUser = async email => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        email
      },
      'password loginAttempts blockExpires name username iduser plan paid wallet cicles email role verified verification',
      (err, item) => {
        utils.itemNotFound(err, item, reject, 'USER_DOES_NOT_EXIST')
        resolve(item)
      }
    )
  })
}
const findUserrevelations = async (credentialuser, User) => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        credentialuser: credentialuser
      },
      (err, item) => {
        utils.itemNotFound(err, item, reject, 'Clave de acceso invalido.')
        resolve(item)
      }
    )
  })
}

const findUserEmail = async email => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        email
      },
      'position charged cicles paid email',
      (err, item) => {
        if (err) {
          resolve({})
        }
        resolve(item)
      }
    )
  })
}

const findUser_username = async username => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        username
      },
      'position charged cicles paid email',
      (err, item) => {
        if (err) {
          resolve({})
        } else {
          resolve(item)
        }
      }
    )
  })
}

exports.getItems = async (req, res) => {
  try {
    const query = await db.checkQueryString(req.query)
    res.status(200).json(await db.getItems(req, model, query))
  } catch (error) {
    utils.handleError(res, error)
  }
}

const elementsExists = async (value, user) => {
  return new Promise((resolve, reject) => {
    user.find(
      { $and: [{ value }] },
      '-updatedAt -createdAt',
      {
        sort: {
          id: 1
        }
      },
      (err, item) => {
        if (err) {
          resolve(false)
          reject(utils.buildErrObject(422, err.message))
        } else {
          // resolve(false)
          console.log(item)
          resolve(item)
        }
      }
    )
  })
}

const usernameExist = async (username, model) => {
  return new Promise((resolve, reject) => {
    model.findOne(
      {
        username: {
          $ne: username
        }
      },
      (err, item) => {
        //   utils.itemAlreadyExists(err, item, reject, 'CITY_ALREADY_EXISTS')
        resolve(item)
      }
    )
  })
}

/**
 * Finds user by ID
 * @param {string} id - user´s id
 */
const findUserById = async userId => {
  return new Promise((resolve, reject) => {
    User.findById(userId, (err, item) => {
      utils.itemNotFound(err, item, reject, 'USER_DOES_NOT_EXIST')
      resolve(item)
    })
  })
}

/**
 * Adds one attempt to loginAttempts, then compares loginAttempts with the constant LOGIN_ATTEMPTS, if is less returns wrong password, else returns blockUser function
 * @param {Object} user - user object
 */
const passwordsDoNotMatch = async user => {
  user.loginAttempts += 1
  await saveLoginAttemptsToDB(user)
  return new Promise((resolve, reject) => {
    if (user.loginAttempts <= LOGIN_ATTEMPTS) {
      resolve(utils.buildErrObject(409, 'WRONG_PASSWORD'))
    } else {
      resolve(blockUser(user))
    }
    reject(utils.buildErrObject(422, 'ERROR'))
  })
}

/**
 * Registers a new user in database
 * @param {Object} req - request object
 */
const registerUser = async req => {
  console.info(`Registrando nuevo usuario: ${JSON.stringify(req)}`)

  return new Promise((resolve, reject) => {
    const user = new User({
      username: req.username,
      email: req.email,
      password: req.password,
      verification: uuid.v4()
    })

    user.save((err, item) => {
      if (err) {
        console.log(`Error registrando usuario:   ${JSON.stringify(err)}`)

        reject(utils.buildErrObject(422, err.message))
      }
      resolve(item)
    })
  })
}



const register_clicles = async (req, ciclesP) => {
  req = matchedData(req)

  console.info('Registrando cicles user: ' + JSON.stringify(req))

  return new Promise((resolve, reject) => {
    const ciclesReg = new cicles({
      cicles: ciclesP,
      email: req.email,
      planName: req.selectPlan.name,
      plan_priceUsd: req.selectPlan.planselect,
      plan_priceTron: req.selectPlan.plan_prince_tron
    })

    ciclesReg.save((err, item) => {
      if (err) {
        console.log(`Error registrando cicles:   ${JSON.stringify(err)}`)
        resolve({})
      }
      resolve(item)
    })
  })
}

const verificationTransfer = async id => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        hash: id,
        validat: false
      },
      (err, user) => {
        if (user) {
          resolve(true)
        } else {
          resolve(false)
        }
      }
    )
  })
}

exports.registerTransfer = async (req, res) => {
  // Gets locale from header 'Accept-Language'
  try {
    req = matchedData(req)

    const verificExist = await verificationTransfer(req.hash)
    if (!verificExist) {
      const notify = {
        message:
          'Usted ha recibido un pago, el codigo de transaccion es ' + req.hash,
        read: false,
        interval: 50000,
        icon: 'paid',
        color: 'SUCCESS',
        email: req.from_iduser,
        code: 0
      }

      await db.createNotify(notify, notifications)

      res.status(201).json(await insert_transfer(req))
    }
  } catch (error) {
    res.status(402).json(error)
  }
}

const insert_transfer = async req => {
  console.info(`Registrando nueva trx: ${JSON.stringify(req)}`)

  const user = await findUser(req.from_iduser)

  return new Promise((resolve, reject) => {
    const transfer = new Transfer({
      iduser: req.iduser,
      from_iduser: req.from_iduser,
      cicles: user.cicles,
      hash: req.hash,
      timestamp: req.timestamp,
      ownerAddress: req.ownerAddress,
      toAddress: req.toAddress,
      confirmed: req.confirmed,
      revert: req.revert,
      contractRet: req.contractRet,
      contractData: req.contractData,
      cost: req.cost,
      validat: req.validat
    })

    transfer.save((err, item) => {
      if (err) {
        console.log(`Error registrando usuario:   ${JSON.stringify(err)}`)

        reject(utils.buildErrObject(422, err.message))
      }
      resolve(item)
    })
  })
}

/**
 * Builds the registration token
 * @param {Object} item - user object that contains created id
 * @param {Object} userInfo - user object
 */
const returnRegisterToken = (item, userInfo) => {
  if (process.env.NODE_ENV !== 'production') {
    userInfo.verification = item.verification
  }
  const data = {
    token: generateToken(item._id),
    user: userInfo
  }
  return data
}

/**
 * Checks if verification id exists for user
 * @param {string} id - verification id
 */
const verificationExists = async id => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        verification: id,
        verified: false
      },
      (err, user) => {
        if (err) {
          resolve({})
        }
        if (user) {
          resolve(user)
        }
      }
    )
  })
}

/**
 * Verifies an user
 * @param {Object} user - user object
 */
const verifyUser = async user => {
  return new Promise((resolve, reject) => {
    user.verified = true
    user.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      resolve({
        email: item.email,
        verified: item.verified
      })
    })
  })
}

/**
 * Marks a request to reset password as used
 * @param {Object} req - request object
 * @param {Object} forgot - forgot object
 */
const markResetPasswordAsUsed = async (req, forgot) => {
  return new Promise((resolve, reject) => {
    forgot.used = true
    forgot.ipChanged = utils.getIP(req)
    forgot.browserChanged = utils.getBrowserInfo(req)
    forgot.countryChanged = utils.getCountry(req)
    forgot.save((err, item) => {
      utils.itemNotFound(err, item, reject, 'NOT_FOUND')
      resolve(utils.buildSuccObject('PASSWORD_CHANGED'))
    })
  })
}

/**
 * Updates a user password in database
 * @param {string} password - new password
 * @param {Object} user - user object
 */
const updatePassword = async (password, user) => {
  return new Promise((resolve, reject) => {
    user.password = password
    user.save((err, item) => {
      utils.itemNotFound(err, item, reject, 'NOT_FOUND')
      resolve(item)
    })
  })
}

/**
 * Finds user by email to reset password
 * @param {string} email - user email
 */
const findUserToResetPassword = async email => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        email
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, 'NOT_FOUND')
        resolve(user)
      }
    )
  })
}

/**
 * Checks if a forgot password verification exists
 * @param {string} id - verification id
 */
const findForgotPassword = async id => {
  return new Promise((resolve, reject) => {
    ForgotPassword.findOne(
      {
        verification: id,
        used: false
      },
      (err, item) => {
        utils.itemNotFound(err, item, reject, 'NOT_FOUND_OR_ALREADY_USED')
        resolve(item)
      }
    )
  })
}

/**
 * Creates a new password forgot
 * @param {Object} req - request object
 */
const saveForgotPassword = async req => {
  return new Promise((resolve, reject) => {
    const forgot = new ForgotPassword({
      email: req.body.email,
      verification: uuid.v4(),
      ipRequest: utils.getIP(req),
      browserRequest: utils.getBrowserInfo(req),
      countryRequest: utils.getCountry(req)
    })
    forgot.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      resolve(item)
    })
  })
}

/**
 * Builds an object with created forgot password object, if env is development or testing exposes the verification
 * @param {Object} item - created forgot password object
 */
const forgotPasswordResponse = item => {
  let data = {
    msg: 'RESET_EMAIL_SENT',
    email: item.email
  }
  if (process.env.NODE_ENV !== 'production') {
    data = {
      ...data,
      verification: item.verification
    }
  }
  return data
}

/**
 * Checks against user if has quested role
 * @param {Object} data - data object
 * @param {*} next - next callback
 */
const checkPermissions = async (data, next) => {
  return new Promise((resolve, reject) => {
    console.log("checkPermissions:" + JSON.stringify(data))
    userRevelations.findById(data.id, (err, result) => {
      console.log("checkPermissions:result:" + JSON.stringify(result))
      utils.itemNotFound(err, result, reject, 'NOT_FOUND')
      if (data.roles.indexOf(result.role) > -1) {
        return resolve(next())
      }
      return reject(utils.buildErrObject(401, 'UNAUTHORIZED'))
    })
  })
}

/**
 * Gets user id from token
 * @param {string} token - Encrypted and encoded token
 */
const getUserIdFromToken = async token => {
  return new Promise((resolve, reject) => {
    // Decrypts, verifies and decode token
    jwt.verify(auth.decrypt(token), process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(utils.buildErrObject(409, 'BAD_TOKEN'))
      }
      resolve(decoded.data._id)
    })
  })
}
/**
 * Login function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.loginRevelations = async (req, res) => {
  try {
    const data = matchedData(req)
    const user = await findUser(data.email)
    await userIsBlocked(user)
    await checkLoginAttemptsAndBlockExpires(user)
    const isPasswordMatch = await auth.checkPassword(data.password, user)
    if (!isPasswordMatch) {
      utils.handleError(res, await passwordsDoNotMatch(user))
    } else {
      // all ok, register access and return token
      user.loginAttempts = 0
      await saveLoginAttemptsToDB(user)
      res.status(200).json(await saveRevelationsUserAccessAndReturnToken(req, user))
    }
  } catch (error) {
    console.error(error)

    utils.handleError(res, error)
  }
}

/********************
 * Public functions *
 ********************/

/**
 * Login function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.login = async (req, res) => {
  try {
    const data = matchedData(req)
    const user = await findUser(data.email)
    await userIsBlocked(user)
    await checkLoginAttemptsAndBlockExpires(user)
    const isPasswordMatch = await auth.checkPassword(data.password, user)
    if (!isPasswordMatch) {
      utils.handleError(res, await passwordsDoNotMatch(user))
    } else {
      // all ok, register access and return token
      user.loginAttempts = 0
      await saveLoginAttemptsToDB(user)
      res.status(200).json(await saveUserAccessAndReturnToken(req, user))
    }
  } catch (error) {
    console.error(error)
    utils.handleError(res, error)
  }
}

exports.loginrevelations = async (req, res) => {
  try {
    const data = matchedData(req)
    const user = await findUserrevelations(data.credentialuser, userRevelations)
    await userIsBlocked(user)
    await checkLoginAttemptsAndBlockExpires(user)
    // all ok, register access and return token
    user.loginAttempts = 0
    await saveLoginAttemptsToDB(user)

    const resultToken = await saveUserAccessAndReturnToken(req, user)

    console.log("Result token:" + resultToken)
    res.status(200).json(resultToken)

  } catch (error) {
    console.error(error)

    utils.handleError(res, error)
  }
}

const getlastPosition_user = async () => {
  try {
    const lastPositiion = await latestPosition()
    console.log('Consulta de ultima posicion: ' + JSON.stringify(lastPositiion))
    return lastPositiion
  } catch (error) { }
}

/**
 * Register function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

exports.register_revelations = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    req = matchedData(req)

    const doesuserRevelations = await db.getUserRevelations(req.credentialuser, userRevelations)

    if (!doesuserRevelations) {
      //      delete req.rif
      const item = await registerUserRevelations(req)

      const userInfo = setUserInfo(item)
      const response = returnRegisterToken(item, userInfo)
      //    emailer.sendRegistrationEmailMessage(locale, item)
      //  mail.sendMailregister(req, res)

      const notify = {
        message: 'Excelente gracias por registrarse en Ruleta Tron.',
        read: false,
        interval: 50000,
        icon: 'info',
        color: 'SUCCESS',
        email: req.email,
        iduser: req.iduser,
        cicles: req.cicles,
        code: 0
      }

      console.log('Enviando notificacion a nuevo usuario: ')

      try {
        await db.createNotify(notify, notifications)
        console.log('Gracias.')
      } catch (error) {
        console.error('Error al enviar notificacion a usuario nuevo.')
      }
      res.status(201).json(response)
    }
  } catch (error) {
    res.status(422).json(error)
  }
}

exports.register = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    req = matchedData(req)

    const doesEmailExists = await emailer.emailExists(req.email)
    if (!doesEmailExists) {
      //      delete req.rif
      const item = await registerUser(req)

      await db.createItem(req, model_payments)

      const userInfo = setUserInfo(item)
      const response = returnRegisterToken(item, userInfo)
      //    emailer.sendRegistrationEmailMessage(locale, item)
      //  mail.sendMailregister(req, res)

      res.status(201).json(response)
    }
  } catch (error) {
    res.status(422).json(error)
  }
}
const elementPayments_Exists = async (cicle, emails) => {
  return new Promise((resolve, reject) => {
    model_payments.find(
      { $and: [{ cicles: cicle }, { email: emails }] },
      '-updatedAt -createdAt',
      {
        sort: {
          id: 1
        }
      },
      (err, item) => {
        if (err) {
          console.error('errordv ' + JSON.stringify(err))
          reject(utils.buildErrObject(422, err.message))
        } else {
          utils.itemAlreadyExists(
            err,
            item[0],
            reject,
            'ELEMENTS_ALREADY_EXISTS'
          )
          resolve(false)
        }
      }
    )
  })
}

exports.getLastPosUser = async (req, res) => {
  try {
    const id = await utils.isIDGood(req.user._id)

    console.log(`Obteniendo datos de perfil: ${JSON.stringify(req.user)}`)

    res.status(200).json(await getProfileFromDB(id))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Verify function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.verify = async (req, res) => {
  try {
    req = matchedData(req)
    const user = await verificationExists(req.id)
    res.status(200).json(await verifyUser(user))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Forgot password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.forgotPassword = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    const locale = req.getLocale()
    const data = matchedData(req)
    await findUser(data.email)
    const item = await saveForgotPassword(req)
    emailer.sendResetPasswordEmailMessage(locale, item)
    res.status(200).json(forgotPasswordResponse(item))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Reset password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.resetPassword = async (req, res) => {
  try {
    const data = matchedData(req)
    const forgotPassword = await findForgotPassword(data.id)
    const user = await findUserToResetPassword(forgotPassword.email)
    await updatePassword(data.password, user)
    const result = await markResetPasswordAsUsed(req, forgotPassword)
    res.status(200).json(result)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Refresh token function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */

exports.getCripto = async (req, res) => {
  try {
    req = matchedData(req)
    const response = await request({
      url: 'https://api.binance.com/api/v3/avgPrice?symbol=' + req.crypto
    })
    console.log(
      'Obteniend precio de cryptomoneda ' + JSON.stringify(response.data)
    )
    res.status(200).json(response.data)
  } catch (error) {
    res.status(200).json({ mins: 5, price: '--' })
  }
}

const set_tronweb = async () => {
  return new Promise((resolve, reject) => {
    console.log('Iniciando tronweb')
    const HttpProvider = TronWeb.providers.HttpProvider

    const VUE_APP_FULLNODE = 'https://api.shasta.trongrid.io'
    const VUE_APP_EVENTSERVER = 'https://api.shasta.trongrid.io'
    const VUE_APP_SOLIDITYNODE = 'https://api.shasta.trongrid.io'

    const fullNode = new HttpProvider(VUE_APP_FULLNODE)
    const solidityNode = new HttpProvider(VUE_APP_SOLIDITYNODE)
    const eventServer = new HttpProvider(VUE_APP_EVENTSERVER)

    //   const privateKey = 'your private key'

    User_TronWeb = new TronWeb(
      fullNode,
      solidityNode,
      eventServer,
      'b026fb706779b320973fb92303d58f966e0cd79894ce85a6c0a11bd0e65e87cd'
    )

    console.log('usertronweb ' + User_TronWeb)

    resolve(User_TronWeb)
  })
}

async function triggerSmartContract() {
  try {
    console.log(' iniciando triggers')
    const options = {
      feeLimit: 1000000000,
      callValue: 50
    }

    const parameters = [
      {
        type: 'string',
        value:
          'ed343f6f07269c96f162e7bf11a49c02a3f9aa9e5197df8ea68bae3c11682cab'
      },
      { type: 'uint', value: 12345 }
    ]
    const issuerAddress = User_TronWeb.defaultAddress.base58

    const functionSelector =
      'buyItem(uint256 _id,string _iduser,int256 _operation)'

    let transactionObject = await User_TronWeb.transactionBuilder.triggerSmartContract(
      trc20ContractAddress,
      functionSelector,
      options,
      parameters,
      User_TronWeb.address.toHex(issuerAddress)
    )

    if (!transactionObject.result || !transactionObject.result.result)
      return console.error('Unknown error: ' + txJson, null, 2)

    // Signing the transaction
    const signedTransaction = await User_TronWeb.trx.sign(
      transactionObject.transaction
    )

    if (!signedTransaction.signature) {
      return console.error('Transaction was not signed properly')
    }

    // Broadcasting the transaction
    const broadcast = await User_TronWeb.trx.sendRawTransaction(
      signedTransaction
    )
    console.log(`broadcast: ${broadcast}`)
  } catch (e) {
    return console.error(e)
  }
}

async function triggerSmartContract_DV() {
  try {
    let contract = await User_TronWeb.contract().at(trc20ContractAddress)
    //Use call to execute a pure or view smart contract method.
    // These methods do not modify the blockchain, do not cost anything to execute and are also not broadcasted to the network.
    let result = await contract.checkItemsTotal().send({
      callValue: 0
    })

    console.log('result: ', result)
  } catch (error) {
    console.error('trigger smart contract error', error)
  }
}

exports.testContract = async (req, res) => {
  console.log('test para smart contract ')

  const usertronweb = await set_tronweb()

  await triggerSmartContract()

  res.status(200).json('tronweb Iniciado')
}

exports.getRefreshToken = async (req, res) => {
  try {
    const tokenEncrypted = req.headers.authorization
      .replace('Bearer ', '')
      .trim()
    let userId = await getUserIdFromToken(tokenEncrypted)
    userId = await utils.isIDGood(userId)
    const user = await findUserById(userId)
    const token = await saveUserAccessAndReturnToken(req, user)
    // Removes user info from response
    delete token.user
    res.status(200).json(token)
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Roles authorization function called by route
 * @param {Array} roles - roles specified on the route
 */
exports.roleAuthorization = roles => async (req, res, next) => {
  try {
    const data = {
      id: req.user._id,
      roles
    }
    await checkPermissions(data, next)
  } catch (error) {
    utils.handleError(res, error)
  }
}
