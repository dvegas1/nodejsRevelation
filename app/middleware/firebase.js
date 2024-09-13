/* eslint camelcase: ["error", {properties: "never"}]*/

const express = require('express')
const cors = require('cors')
const firebase = require('firebase-admin')
const app = express()
const path = require('path')
const uuid = require('uuid')
const utils = require('../middleware/utils')
const { matchedData } = require('express-validator')
const moment = require('moment')
const moments = moment()
const fs = require('fs')
const { createHash } = require('crypto')
const sha1 = require('sha1')

app.use(cors())

const namebucket = 'fir-gps-f49b1.appspot.com'
let bucket = ''

const serviceAccount = require('../../firebase/fir-gps-f49b1-firebase-adminsdk-ael2b-a0837aa7c5.json')
let tokenImg
let imgperfil = ''
let uploadPath
let id
let data
let namefile
const pathfile = './uploads/'
let newName = ''
const filetemp = pathfile + namefile
const errorImg = {
  error: 'error',
  msg: [],
  date: ''
}
let extFile = ''

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

const errors = {
  msg: [],
  date: '',
  rc: 0
}
const domain = 'http://192.168.6.103:3005/'
let loadfirebase = false

function initializeApp_() {
  if (!firebase.apps.length) {
    firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount),
      storageBucket: namebucket,
      databaseURL: 'https://fir-gps-f49b1.firebaseio.com'
    })

    bucket = firebase.storage().bucket(namebucket)
  } else {
    console.info('App firebase ya activa.')
  }
}

async function uploadFileFirebase(req, res) {
  try {
    console.log(` -*-Token image ${tokenImg}`)

    const metadata = {
      metadata: {
        // This line is very important. It's to create a download token.
        firebaseStorageDownloadTokens: tokenImg
      },
      contentType: 'image.*',
      cacheControl: 'public, max-age=31536000'
    }
    try {
      // Uploads a local file to the bucket
      const RspFirebase = bucket.upload(uploadPath, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        metadata
      })

      console.log(`Respuesta firebase ${JSON.stringify(RspFirebase)}`)
      console.log('Archivo guardado con exito.! ')
      loadfirebase = true
    } catch (error) {
      loadfirebase = false
      rsp.errors.message.push('No se logro cargar la imagen en firebase.')
      rsp.errors.rc = -1
      utils.handleError(res, rsp.errors)
    }
  } catch (error) {
    res.status(400).json(errorImg)
    console.error(
      `No se logro guardar la imagen para el usuario ${id}, ${error}`
    )
  }
}

function computeSHA256(lines) {
  const hash = createHash('sha256')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim() // remove leading/trailing whitespace
    if (line === '') {
      continue
    } // skip empty lines
    hash.write(line) // write a single line to the buffer
  }

  return hash.digest('base64') // returns hash as string
}

function existFile(req, file) {
  id = req.username
  console.log(`Validando que exista archivo: ${newName}`)
  fs.access(newName, fs.F_OK, err => {
    if (err) {
      return
    }
    tokenImg = generateTokenToImg(id)
    newName = pathfile + tokenImg
    imgperfil.name = tokenImg
    existFile(req, file)
  })
  return imgperfil.name
}

function getExtension(req) {
  let extension = ''
  try {
    extension = path.extname(req.files.imgperfil.name).toLowerCase()

    switch (extension) {
      case '.jpg':
        extFile = '.jpg'
        break
      case '.jpeg':
        extFile = '.jpeg'
        break
      case '.png':
        extFile = '.png'
        break
      default:
        console.error('Extension de archivo invalidad.')
        rsp.errors.message.push('Por favor seleccione una imagen validad.')
        rsp.errors.rc = -3
    }

    console.log(` extension ${extFile}`)
    console.log(` rsp ${JSON.stringify(rsp)}`)
  } catch (error) {
    console.error(`Extension de archivo invalidad. ${error}`)
    rsp.errors.message.push('Por favor seleccione una imagen validad.')
    rsp.errors.rc = -3
  }
}

function generateTokenToImg(id, req) {
  tokenImg = `${sha1(imgperfil.name)}-${sha1(
    imgperfil.name
  )}-${id}-${uuid.v4()}`
  return tokenImg
}

exports.loadPhotoSignup = (req, res) => {
  rsp.errors.message = []
  rsp.data.msg = []
  // console.log("tipo " + typeof(req))
  // console.log(Object.values(req.body));
  return new Promise((response, resolve, reject) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        // return res.status(400).send('Archivo no encontrado..');
        rsp.errors.message.push('Por favor seleccione una imagen validad.')
        rsp.errors.rc = -2
        response({ response: rsp })
        utils.handleError(res, rsp)
      }

      getExtension(req)

      if (rsp.errors.rc == -2 || rsp.errors.rc == -3) {
        response({ response: rsp })
        utils.handleError(res, rsp.errors)
      }
      console.log(` rsp1 ${JSON.stringify(rsp)}`)

      imgperfil = req.files.imgperfil

      req = matchedData(req)
      id = req.username

      imgperfil.name = generateTokenToImg(id, req)

      imgperfil.name = existFile(req, imgperfil.name)

      newName = pathfile + tokenImg

      uploadPath = pathfile + imgperfil.name

      console.log(` -*- Cargando archivo: ${newName}`)
      console.log(` -*- Tamano de archivo: ${imgperfil.size}`)
      console.log(` -*- Retative path img ${uploadPath}`)
      console.log(` -*- Username ${id}`)

      imgperfil.mv(uploadPath).then(err => {
        if (err) {
          console.error(`No se logro cargar la imagen en el servidor1. ${err}`)
          rsp.errors.rc = -2
          response({ response: rsp })
        }
      })

      initializeApp_(req, res)

      console.log('Imagen guardada en el servidor.')

      uploadFileFirebase(req, res)

      if (tokenImg != undefined && tokenImg != '' && loadfirebase) {
        console.log('Imagen guardanda con exito en firebase.')
        data = {
          iduser: id,
          url_img_gperfil: `https://firebasestorage.googleapis.com/v0/b/${namebucket}/o/${tokenImg}?alt=media&token=${tokenImg}`
        }
      } else {
        data = {
          iduser: id,
          url_img_gperfil: `http://192.168.6.103:3005/${uploadPath}`
        }
      }
      rsp.data = data
      console.log(`Response: ${JSON.stringify(rsp)}`)
      response({ response: rsp })
    } catch (error) {
      console.error(error)
      response({ response: rsp })
    }
  })
}
