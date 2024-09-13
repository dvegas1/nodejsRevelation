const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')
const i18n = require('i18n')
const User = require('../models/user')
const { itemAlreadyExists } = require('../middleware/utils')
const path = require('path')
const fs = require('fs')
const handlebars = require('handlebars')
const mailController = require('../controllers/mail')

/**
 * Sends email
 * @param {Object} data - data
 * @param {boolean} callback - callback
 */
let filePath
let mailOptions

const asdasdasdasd = async (data, callback) => {
  filePath = '../../../template/demo.hbs' // Path of an email template.

  const readHTMLFile = (path, callback) => {
    fs.readFile(path, { encoding: 'utf-8' }, (err, html) => {
      if (err) {
        console.log(` readHTMLFile: ${err}`)
        callback(err)
      } else {
        callback(null, html)
      }
    })
  }

  const auth = {
    auth: {
      // eslint-disable-next-line camelcase
      api_key: process.env.EMAIL_SMTP_API_MAILGUN,
      domain: process.env.EMAIL_SMTP_DOMAIN_MAILGUN
    }
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'darwinvegas1@gmail.com',
      pass: 'mirna2045.' // naturally, replace both with your real credentials or an application-specific password
    }
  })

  readHTMLFile(path.join(__dirname + filePath), (err, html) => {
    const template = handlebars.compile(html)
    const htmlToSend = template(data)
    mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: `${data.user.name} <${data.user.email}>`,
      subject: data.subject,
      html: htmlToSend
    }
    // Send email with mailOptions created above.
    transporter.sendMailregister(mailOptions, (error, response) => {
      if (error) {
        reject(error)
      }
      resolve(response)
    })
  })
  /*
   const mailOptions1 = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: `${data.user.name} <${data.user.email}>`,
    subject: data.subject,
    html: data.htmlMessage
  }

  transporter.sendMail(mailOptions, err => {
    if (err) {
      return callback(false)
    }
    return callback(true)
  })*/
}

/**
 * Prepares to send email
 * @param {string} user - user object
 * @param {string} subject - subject
 * @param {string} htmlMessage - html message
 */
const prepareToSendEmail = (data) => {
  if (process.env.NODE_ENV === 'production') {
    sendMailregister(data, (messageSent) =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`)
    )
  } else if (process.env.NODE_ENV === 'development') {
    sendMailregister(data, (messageSent) =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`)
    )
  }
  console.log(data)
}

module.exports = {
  /**
   * Checks User model if user with an specific email exists
   * @param {string} email - user email
   */
  async emailExists(email) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          email
        },
        (err, item) => {
          itemAlreadyExists(err, item, reject, 'EMAIL_ALREADY_EXISTS')
          resolve(false)
        }
      )
    })
  },

  /**
   * Checks User model if user with an specific email exists but excluding user id
   * @param {string} id - user id
   * @param {string} email - user email
   */

  async emailExistsExcludingMyself(id, email) {
    return new Promise((resolve, reject) => {
      User.findOne(
        {
          email,
          _id: {
            $ne: id
          }
        },
        (err, item) => {
          itemAlreadyExists(err, item, reject, 'EMAIL_ALREADY_EXISTS')
          resolve(false)
        }
      )
    })
  },

  /**
   * Sends registration email
   * @param {string} locale - locale
   * @param {Object} user - user object
   */
  async sendRegistrationEmailMessage1(locale, user) {
    i18n.setLocale(locale)
    const subject = i18n.__('registration.SUBJECT')
    const htmlMessage = i18n.__(
      'registration.MESSAGE',
      `${user.firstname} ${user.firstsurname}`,
      process.env.FRONTEND_URL,
      user.verification
    )
    prepareToSendEmail(user, subject, htmlMessage)
  },
  async sendRegistrationEmailMessage(locale, user) {
    i18n.setLocale(locale)
    const subject = i18n.__('registration.SUBJECT')

    const data = {
      user,
      url: process.env.FRONTEND_URL,
      subject,
      key: 'register'
    }

    const htmlMessage = i18n.__(
      'registration.MESSAGE',
      `${user.firstname} ${user.firstsurname}`,
      process.env.FRONTEND_URL,
      user.verification
    )
    //  prepareToSendEmail(user, subject, htmlMessage)
    prepareToSendEmail(data)
  },

  /**
   * Sends reset password email
   * @param {string} locale - locale
   * @param {Object} user - user object
   */
  async sendResetPasswordEmailMessage(locale, user) {
    i18n.setLocale(locale)
    const subject = i18n.__('forgotPassword.SUBJECT')
    const htmlMessage = i18n.__(
      'forgotPassword.MESSAGE',
      user.email,
      process.env.FRONTEND_URL,
      user.verification
    )
    prepareToSendEmail(user, subject, htmlMessage)
  }
}
