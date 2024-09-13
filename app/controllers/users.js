const model = require('../models/user')
const userRevelations = require('../models/userRevelations')
const plans = require('../models/plans')
const modelimgperfildefault = require('../models/imageperfil')
const cicles = require('../models/cicles')
const transfer = require('../models/transfer')
const transactions = require('../models/transactions')
const notifications = require('../models/notifications')
const uuid = require('uuid')
const { matchedData } = require('express-validator')
const utils = require('../middleware/utils')
const db = require('../middleware/db')
const emailer = require('../middleware/emailer')
const firebase = require('../middleware/firebase')
const { gmail } = require('googleapis/build/src/apis/gmail')

/*********************
 * Private functions *
 *********************/

const getNotifyEmail = async (email, model) => {
  return new Promise((resolve, reject) => {
    model.find(
      {
        email
      },
      '-_id -updatedAt -createdAt',
      (err, notifications) => {
        if (err) {
          resolve({})
        }
        resolve(notifications)
      }
    )
  })
}

exports.getNotifyEmail = async (req, res) => {
  var reqTemp = matchedData(req)
  var query = await db.checkQueryString(req.query)

  if (JSON.stringify(query) == '{}') {
    query = {
      $and: [{ email: reqTemp.email }]
    }
  } else {
    query.$and.push({ email: reqTemp.email })
  }
  res.status(200).json(await db.getItems(req, notifications, query))
}

exports.getNotifyEmail1 = async (req, res) => {
  req = matchedData(req)
  console.info(`Obteniendo notifications: ${JSON.stringify(req)}`)

  res.status(200).json(await getNotifyEmail(req.email, notifications))
}

exports.SendNotifications = async (req, res) => {
  req = matchedData(req)
  console.info(`Enviando notifications: ${JSON.stringify(req)}`)
  const responseNotify = await db.createNotify(req, notifications)
  console.info(`Response responseNotify: ${JSON.stringify(responseNotify)}`)

  if (Object.keys(responseNotify).length === 0) {
    res.status(402).json(responseNotify)
  }

  res.status(201).json(responseNotify)
}

exports.DataStaticsCicles = async (req, res) => {
  try {
    //  const JsonDataId = []
    // const data = []

    const json = {}
    req = matchedData(req)

    const User = await findEmail(req.email, model)
    const findPlans_User = await findPlans(User[0].plan, plans)
    const ciclesUsr = await findEmail(req.email, cicles)
    const FindUser = await findEmailOne(req.email, model)

    const findTransationSearch = await findTrasanction(
      FindUser.iduser,
      transactions
    )
    const findTransferSearch = await findTransfer(req.email, transfer)

    console.log(
      'Buscando estadistica de usuario [DataStaticsCicles]: ' +
        req.email +
        ' iduser[' +
        FindUser.iduser +
        ']'
    )

    json['findPlans_User'] = findPlans_User
    json['user'] = User
    json['ciclesUsr'] = ciclesUsr
    json['findTransationSearch'] = findTransationSearch
    json['findTransferSearch'] = findTransferSearch

    //const allamodemodelcities = await getAllItemsFromDB(modelcities)

    // JsonDataId.push('ciclesUsr', ciclesUsr)
    // JsonDataId.push('allcountries', allamodelcountries)
    // JsonDataId.push('allcities', allamodemodelcities)

    // data.push('data', JsonDataId)
    //  console.log(`  ciclesUsr ${JSON.stringify(ciclesUsr)}`)
    // console.log(`  FindUser ${JSON.stringify(FindUser)}`)

    /*   console.log("  modelcities "  +  JSON.stringify(alladminstates))
     console.log("  allamodelcountries "  +  JSON.stringify(allamodelcountries))
     console.log("  allamodemodelcities "  +  JSON.stringify(allamodemodelcities))
     console.log("  JsonDataId "  +  JSON.stringify(JsonDataId.alladminstates))*/
    console.log('/Fin de estadisticas del: ' + req.email)
    console.log('')
    console.log('')
    console.log('')
    console.log('')

    res.status(200).json(json)
  } catch (error) {
    utils.handleError(res, error)
  }
}

const findTrasanction = async (iduser, model) => {
  return new Promise((resolve, reiduserject) => {
    model.find(
      {
        iduser
      },
      (err, user) => {
        if (err) {
          resolve({})
        }
        resolve(user)
      }
    )
  })
}

const findTransfer = async (from_iduser, model) => {
  return new Promise((resolve, reject) => {
    model.find(
      {
        from_iduser
      },
      (err, user) => {
        if (err) {
          resolve({})
        }
        resolve(user)
      }
    )
  })
}
const findEmailOne = async (email, model) => {
  return new Promise((resolve, reject) => {
    model.findOne(
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

const findPlans = async (name, model) => {
  return new Promise((resolve, reject) => {
    model.find(
      {
        name
      },
      (err, user) => {
        utils.itemNotFound(err, user, reject, 'NOT_FOUND')
        resolve(user)
      }
    )
  })
}

const findEmail = async (email, model) => {
  return new Promise((resolve, reject) => {
    model.find(
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

const createItem = async req => {
  console.info(`Creando nuevo usuario: ${JSON.stringify(req)}`)
  return new Promise((resolve, reject) => {
    const credentialuser = new userRevelations({
      role: req.role,
      credentialuser: req.credentialuser,
      verification: uuid.v4()
    })
    credentialuser.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      resolve(item.toObject())
    })
  })
}

const createItemimgPerfil = async req => {
  console.info(`Registrando nueva imagen perfil: ${JSON.stringify(req)}`)
  return new Promise((resolve, reject) => {
    const modlimgPerfil = new modelimgperfildefault({
      url: req.url,
      verification: uuid.v4()
    })
    modlimgPerfil.save((err, item) => {
      if (err) {
        reject(utils.buildErrObject(422, err.message))
      }
      resolve(item.toObject())
    })
  })
}

/********************
 * Public functions *
 ********************/

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItems = async (req, res) => {
  try {
    const query = await db.checkQueryString(req.query)
    res.status(200).json(await db.getItems(req, userRevelations, query))
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.getmgperfilDefault = async (req, res) => {
  try {
    const query = await db.checkQueryString(req.query)
    res.status(200).json(await db.getItems(req, modelimgperfildefault, query))
  } catch (error) {
    utils.handleError(res, error)
  }
}
/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await utils.isIDGood(req.id)
    res.status(200).json(await db.getItem(id, model))
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.getIteName = async (req, res) => {
  try {
    req = matchedData(req)
    const name = await utils.isIDGood(req.name)
    res.status(200).json(await db.getItem(name, model))
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await utils.isIDGood(req.id)
    const existId = await db.existId(id, userRevelations)

    if (existId) {
      res.status(200).json(await db.updateItem(id, userRevelations, req))
    }else{
      res.status(404).json('No se encontro el registro.')
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.uptNotify = async (req, res) => {
  try {
    req = matchedData(req)

    req.read = true
    const id = await utils.isIDGood(req.id)
    const existId = await db.existId(id, notifications)
    if (existId) {
      res.status(200).json(await db.updateItem(id, notifications, req))
    } else {
      res.status(402).json('No se logro actualizar la notificacion.')
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
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


const existUsr_Revelations = async (credentialuser, User) => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        credentialuser: credentialuser
      },
      (err, item) => {
        console.log("JSON:ITEM:" + JSON.stringify(item))
        if (err) {
          resolve(true)
        }
        if (item) {
          resolve(false)
        }
        resolve(false)
      }
    )
  })
}

exports.createItem = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    req = matchedData(req)
    console.info(`Registro  usuario: ${JSON.stringify(req)}`)
    const user = await existUsr_Revelations(req.credentialuser, userRevelations)
    if (!user) {
      const item = await createItem(req)
      res.status(201).json(item)
    }
  } catch (error) {
    utils.handleError(res, error)
  }
}
exports.createImgperfilDefault = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount),
      databaseURL: 'https://fir-gps-f49b1.firebaseio.com'
    })

    const locale = req.getLocale()
    req = matchedData(req)
    console.info(`Registro de image de perfil default: ${JSON.stringify(req)}`)

    const item = await createItemimgPerfil(req)
    emailer.sendRegistrationEmailMessage(locale, item)
    res.status(201).json(item)
  } catch (error) {
    utils.handleError(res, error)
  }
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Incorrect file')
    error.code = 'INCORRECT_FILETYPE'
    return cb(error, false)
  }
  cb(null, true)
}
exports.regperfilimagen = async (req, res) => {
  try {
    //   const rspFirebaseImage =

    firebase.loadPhotoSignup(req, res).then(obj => {
      console.log(obj)
      return res.status(200).json(obj)
    })
    console.log('Carga de imagen perfil finalizada.')
    // console.log(' rspFirebaseImage ' + JSON.stringify(res)
  } catch (error) {
    console.error(`error ${error}`)
    utils.handleError(res, error)
  }
}

/**
 * Delete item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.deleteItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await utils.isIDGood(req.id)
    res.status(200).json(await db.deleteItem(id, userRevelations))
  } catch (error) {
    utils.handleError(res, error)
  }
}
