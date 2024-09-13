/* eslint camelcase: ["error", {properties: "never"}]*/

const model = require('../models/mail')
const { matchedData } = require('express-validator')
const utils = require('../middleware/utils')
const db = require('../middleware/db')
const nodemailer = require('nodemailer')
const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const path = require('path')
const handlebars = require('handlebars')
const i18n = require('i18n')
const { google } = require('googleapis')
const OAuth2 = google.auth.OAuth2
const moment = require('moment')
const moments = moment()
const controllerProfile = require('../controllers/profile')

let filePath
let htmlToSend
let emailTransporterDefault
const response = {
  errors: {
    message: [],
    date: moments.format(),
    rc: 0,
    code: 422
  },
  data: {
    msg: [],
    date: moments.format(),
    rc: 0,
    code: 200
  }
}

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

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )
  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  })
  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.error('ERROR Failed to create access token')
        reject('Failed to create access token')
      }
      resolve(token)
    })
  })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL,
      accessToken,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN
    }
  })

  return transporter
}

const sendEmail = async emailOptions => {
  emailTransporterDefault = await createTransporter()
  await emailTransporterDefault.sendMail(emailOptions)
}

exports.sendMailregister = async (req, res) => {
  const rsp = response

  const dataTemp = {
    msg_txt:
      'Para confirmar registro como usuario, por favor dele clic al siguiente botón: ',
    name: req.firstsurname + ' ' + req.firstsurname,
    message: 'Gracias por utilizar nuestros servicios !!.',
    url: process.env.FRONTEND_URL + 'verify/' + req.verification
  }

  filePath = '../../../template/register.html' // Path of an email template.

  readHTMLFile(path.join(__dirname + filePath), (err, html) => {
    const template = handlebars.compile(html)
    htmlToSend = template(dataTemp)

    // console.log(` html: ${html}`)
    //  console.log(` htmlToSend: ${htmlToSend}`)

    try {
      const info = sendEmail({
        subject: 'Registro de usuario',
        text: 'Hello world?', // plain text body
        html: htmlToSend,
        to: 'darwinvegas1@gmail.com',
        from: process.env.EMAIL
      })

      rsp.data.msg = 'Correo enviado con exito.'

      console.log('Message sent: %s', info.messageId)
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))

      return res.status(200).json(rsp)
    } catch (error) {
      console.log(JSON.stringify(rsp))
      rsp.errors.message = 'Error al enviar el correo ${error}'
      rsp.errors.rc = -1
      rsp.errors.code = 422
      return res.status(200).json(rsp.errors)
    }
  })
}

/**
 * Gets all items from database
 */
const getAllItemsFromDB = async () => {
  return new Promise((resolve, reject) => {
    model.find(
      {},
      '-updatedAt -createdAt',
      {
        sort: {
          name: 1
        }
      },
      (err, items) => {
        if (err) {
          reject(utils.buildErrObject(422, err.message))
        }
        resolve(items)
      }
    )
  })
}
