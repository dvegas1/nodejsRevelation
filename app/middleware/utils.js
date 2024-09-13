const mongoose = require('mongoose')
const requestIp = require('request-ip')
const { validationResult } = require('express-validator')
const winston = require('winston')
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format
const moment = require('moment')
const moments = moment()

const rsp = {
  errors: {
    message: [],
    date: moments.format(),
    rc: 0,
    code: 200
  },
  data: {
    msg: [],
    date: moments.format(),
    rc: 0
  }
}

const myFormat = printf(({ level, message, label, timestamp, format }) => {
  return `${timestamp} [${label}] ${level}: ${message} ${format}`
})

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    label({ label: 'INFO LABEL' }),
    timestamp(),
    winston.format.json(),
    myFormat
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'info.log', level: 'info' })
  ]
})

winston.loggers.add('info', {
  format: combine(
    label({ label: 'INFO LABEL' }),
    timestamp(),
    winston.format.json(),
    myFormat
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'info.log', level: 'info' })
  ]
})

winston.loggers.add('error', {
  format: combine(
    label({ label: 'ERROR LABEL' }),
    timestamp(),
    winston.format.json(),
    myFormat
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
})
winston.loggers.add('warn', {
  format: combine(
    label({ label: 'WARN LABEL' }),
    timestamp(),
    winston.format.json(),
    myFormat
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'warn.log', level: 'error' })
  ]
})

/**
 * Removes extension from file
 * @param {string} file - filename
 */
exports.removeExtensionFromFile = file => {
  return file
    .split('.')
    .slice(0, -1)
    .join('.')
    .toString()
}

/**
 * Gets IP from user
 * @param {*} req - request object
 */
exports.getIP = req => requestIp.getClientIp(req)

/**
 * Gets browser info from user
 * @param {*} req - request object
 */
exports.getBrowserInfo = req => req.headers['user-agent']

/**
 * Gets country from user using CloudFlare header 'cf-ipcountry'
 * @param {*} req - request object
 */
exports.getCountry = req =>
  req.headers['cf-ipcountry'] ? req.headers['cf-ipcountry'] : 'XX'

/**
 * Handles error by printing to console in development env and builds and sends an error response
 * @param {Object} res - response object
 * @param {Object} err - error object
 */
exports.handleError = (res, err) => {
  // Prints error in console
  if (process.env.NODE_ENV === 'development') {
    //  console.error(err)
    res.status(err.code).json({
      errors: {
        msg: err.message
      }
    })
  }
  // Sends error to user
  res.status(err.code).json({
    errors: {
      msg: err.message
    }
  })
}


/**
 * Builds error object
 * @param {number} code - error code
 * @param {string} message - error text
 */
exports.buildErrObject = (code, message) => {
  return {
    code,
    message
  }
}

/**
 * Builds error for validation files
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Object} next - next object
 */
exports.validationResult = (req, res, next) => {
  try {
    validationResult(req).throw()
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase()
    }
    return next()
  } catch (err) {
    console.log(
      `ERROR ${JSON.stringify(this.buildErrObject(422, err.array()))}`
    )
    return this.handleError(res, this.buildErrObject(422, err.array()))
  }
}

exports.validationResult = (req, res, next) => {
  try {
    validationResult(req).throw()
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase()
    }
    return next()
  } catch (err) {
    console.log(
      `ERROR ${JSON.stringify(this.buildErrObject(422, err.array()))}`
    )
    return this.handleError(res, this.buildErrObject(422, err.array()))
  }
}

/**
 * Builds success object
 * @param {string} message - success text
 */
exports.buildSuccObject = message => {
  return {
    msg: message
  }
}

/**
 * Checks if given ID is good for MongoDB
 * @param {string} id - id to check
 */
exports.isIDGood = async id => {
  return new Promise((resolve, reject) => {
    console.log(`Validando  _id: ${id}`)
    const goodID = mongoose.Types.ObjectId.isValid(id)
    return goodID
      ? resolve(id)
      : reject(this.buildErrObject(422, 'ID_MALFORMED'))
  })
}

/**
 * Item not found
 * @param {Object} err - error object
 * @param {Object} item - item result object
 * @param {Object} reject - reject object
 * @param {string} message - message
 */

 exports.isEmptyObject = (obj) => {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}


exports.itemNotFound = (err, item, reject, message) => {
  if (err) {
    reject(this.buildErrObject(422, err.message))
  }
  if (!item) {
    reject(this.buildErrObject(422, message))
  }
}

exports.itemNotFoundResolver = (err, item, resolve, message) => {
  if (err) {
    resolve(err.message)
  }
  if (!item) {
    resolve(err.message)
  }
}

exports.itemNotFound__ = (err, item, resolve, message) => {
  if (err) {
    resolve(false)
  }
  if (!item) {
    resolve(false)
  }

  if(item.length > 0){
    resolve(true)
  }

  
}

module.exports.log = function (msg) {
  info = function () {
    logger.ingo(` POR AQUI ${msg}`)
  }
}

/**
 * Item already exists
 * @param {Object} err - error object
 * @param {Object} item - item result object
 * @param {Object} reject - reject object
 * @param {string} message - message
 */
exports.itemAlreadyExists = (err, item, reject, message) => {
  if (err) {
    reject(this.buildErrObject(422, err.message))
  }
  if (item) {
    reject(this.buildErrObject(422, message))
  }
}

exports.itemAlreadyExists_resolver = (err, item, resolve, message) => {
    if (err || item == undefined || item == null) {
      resolve(false)
    }
    if (Object.keys(item).length > 0) {
      resolve(true)
    }else{
      resolve(false)
    }
 
}

exports.itemAlreadyExists_json = (err, item, resolve, message) => {
  if (err || item == undefined || item == null) {
    resolve(false)
  }
  if (Object.keys(item).length > 0) {
    resolve(item)
  }else{
    resolve(false)
  }

}
