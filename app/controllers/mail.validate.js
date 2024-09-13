/* eslint camelcase: ["error", {properties: "never"}]*/

const { validationResult } = require('../middleware/utils')
const validator = require('validator')
const { check } = require('express-validator')

/**
 * Validates update profile request
 */
exports.sendMail = [
  check('_id'),
  (req, res, next) => {
    validationResult(req, res, next)
  }
]
