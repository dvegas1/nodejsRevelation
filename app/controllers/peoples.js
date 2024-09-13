const model = require('../models/peoples')
const userRevelations = require('../models/userRevelations')
const { matchedData } = require('express-validator')
const utils = require('../middleware/utils')
const db = require('../middleware/db')
const { createHash } = require('crypto');
const uuid = require('uuid')
const auth = require('../middleware/auth')
const jwt = require('jsonwebtoken')

/*********************
 * Private functions *
 *********************/


/**
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */


function hash(string) {
  return createHash('sha256').update(string).digest('hex');
}

exports.createPeople_adm = async (req, res) => {
  // Gets locale from header 'Accept-Language'

  try {

    req = matchedData(req)

    console.info(`Registro  usuario: ${JSON.stringify(req)}`)

    const user = await db.existId__credentialuser(req.credentialuser, userRevelations)

    console.log("createPeople_adm:user:" + JSON.stringify(user))

    console.log("createPeople_adm:user.length:" + Object.keys(user).length)
    console.log("user._id:" + user._id)

    if (user._id == 'undefined') {
      res.status(422).json('El usuario no existe por favor validar e intentar de nuevo.')
    }

    let Jspeoples = { credentialuser: req.credentialuser, nombre: req.nombre, apellido: req.apellido }

    doesPeoplesExists = await peoples_exists(Jspeoples)

    console.log("Result people:[" + doesPeoplesExists + "]")

    if (doesPeoplesExists) {
      res.status(422).json({ code: 422, message: "El nombre: " + req.nombre + " y apellido: " + req.nombre + " ya se encuentran registrado." })
    } else {

      console.log("Creando invitado: " + JSON.stringify(req))

      res.status(201).json(await create_people(req))
    }

  } catch (error) {
    //res.status(422).json(error)
  }
}


const create_people = async req => {
  console.info(`Creando nuevo usuario: ${JSON.stringify(req)}`)

  return new Promise((resolve, reject) => {
    const New_people = new model({
      nombre: req.nombre,
      apellido: req.apellido,
      credentialuser: req.credentialuser,
      autorizeVote: req.autorizeVote,
      team: req.team,
      vote: req.vote
    })

    New_people.save((err, item) => {
      if (err) {
        console.error(`Error creando usuario:   ${JSON.stringify(err)}`)
        reject(utils.buildErrObject(422, "En estos momentos no podemos procesar su solicitud por favor intente de nuevo mas tarde1."))
      }
      resolve(item)
    })
  }).catch(function () {
    console.log("Promise Rejected");
  });
}





exports.getPeoples = async (req, res) => {
  let data = JSON.parse('{"docs":[],"totalDocs":0}')
  req = matchedData(req)
  console.log("Search credentialuser: " + req.credentialuser.trim())
  data.docs = await db.getPeoples(req.credentialuser, model)
  data.totalDocs = data.docs.length
  res.status(200).json(data)
}

exports.add_peoples = async (req, res) => {
  try {
    req = matchedData(req)

    const peoples = JSON.parse(req.peoples)

    console.log("req:" + JSON.stringify(req))

    req['peoples'] = peoples

    if (req.credentialuser != undefined) {
      const id = await utils.isIDGood(req.credentialuser._id)
      const user = await db.findIdUserCred(id, userRevelations)
      req['user'] = user
      console.log("***")
    }
    console.log("req:" + JSON.stringify(req))

    await findAndCreatePeoples(res, req)

  } catch (error) {
    console.error(error)
  }
}



exports.votePeople = async (req, res) => {
  try {
    await vote(res, req)
  } catch (error) {
    console.error(error)
    res.status(422).json(error)
  }
}

/**
 * Checks if a city already exists in database
 * @param {string} name - name of item
 */

async function findAndCreatePeoples(res, req) {
  let __id = ''
  let result = JSON.parse('{"not_exist":[],"exist":[],"create":[],"responseUser":[],"peoples":[],"credentialuser":""}')
  let data = JSON.parse('{"docs":[],"totalDocs":0}')
  let create_people = {}
  let newPeople = false


  if (req.user == undefined) {
    await Promise.all(req.peoples.map(async (people) => {
      var random = people.nombre + Math.round(Math.random() * 5 + 1 * 3 + 100)
      __id = __id + hash(random)
    }));
    console.log("__id: " + __id)
  } else {
    console.log("____id: " + __id)
    __id = req.credentialuser.credentialuser
  }

  let doesPeoplesExists = {}

  console.log("req.peoples:" + JSON.stringify(req.peoples))
  await Promise.all(req.peoples.map(async (people) => {
    people['credentialuser'] = __id

    if (req.credentialuser == undefined) {
      doesPeoplesExists = false
    } else {
      console.log("Search people: " + JSON.stringify(people))
      doesPeoplesExists = await peoples_exists(people)
    }

    console.log("Result people:[" + doesPeoplesExists + "]")

    if (!doesPeoplesExists) {
      console.log("Creating people...")

      console.log("Agregando credentialuser:" + __id)
      create_people = await db.createItem(people, model)
      console.log("Result:" + JSON.stringify(create_people))
      result['not_exist'].push(people)
      result['create'].push(create_people)
      result['credentialuser'] = __id
    } else {
      result['exist'].push(people)
      res.status(423).json(utils.buildErrObject(423, 'Invitado ' + people.nombre + ' ' + people.apellido + ', ya existe.'))
    }
    
  }));


  console.log("Search credentialuser: " + __id.trim())


  if (result['create'].length > 0) {
    console.log("Create lenght: " + result['create'].length)
    if (req.user == undefined) {
      create_people['role'] = 'user'
      const item = await registerUserRevelations(create_people)
      console.log("Registro de usuario: " + JSON.stringify(item))
      const userInfo = setUserInfoRevelations(item)
      const response = returnRegisterToken(item, userInfo)
      result['responseUser'] = response
      newPeople = true

      data.docs = result['create']
      data.totalDocs = result['create'].length
      console.log("Registros:" + JSON.stringify(data.docs))

    } else {
      console.log("Buscando registros...")
      console.log("Search credentialuser: " + __id.trim())
      data.docs = await db.getPeoples(__id, model)
      data.totalDocs = data.docs.length
      console.log("Registros:" + JSON.stringify(data.docs))
      newPeople = false
    }

    result['peoples'] = data

    if (newPeople) {
      res.status(201).json(result)
    } else {
      res.status(200).json(result)
    }



  } else {
    res.status(422).json(result)
  }
}

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

const setUserInfoRevelations = req => {
  let user = {
    _id: req._id,
    role: req.role,
    credentialuser: req.credentialuser,
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

const setUserInfo = req => {
  let user = {
    _id: req._id,
    name: req.name,
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




const registerUserRevelations = async req => {
  console.info(`Registrando nuevo usuario: ${JSON.stringify(req)}`)

  return new Promise((resolve, reject) => {
    const user = new userRevelations({
      credentialuser: req.credentialuser,
      role: req.role,
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

async function vote(res, req) {

  req = matchedData(req)
  console.log(`Realizando votación People: ${JSON.stringify(req)}`)
  const id = await utils.isIDGood(req.id)
  req["id"] = id

  const doesPeopleIdExists = await PeopleExistsExcludingItself(req)

  console.log("doesPeopleIdExists:[" + doesPeopleIdExists + "]")
  const data = { vote: true, team: req.team, credentialuser: req.credentialuser, autorizeVote: false }

  if (doesPeopleIdExists) {
    res.status(200).json(await db.updateItem(id, model, data))
  } else {
    res.status(423).json(utils.buildErrObject(422, 'Invitado no existe por favor validar é intentar nuevamente.'))
  }
}

const peoples_exists = req => {
  return new Promise((resolve) => {

    if (req.credentialuser != undefined) {
      model.find(
        {
          $and: [
            { nombre: req.nombre },
            { apellido: req.apellido },
            { credentialuser: req.credentialuser }
          ]
        },
        (err, item) => {

          if (err) {
            reject(utils.buildErrObject(422, err.message))
          }
          resolve(utils.itemAlreadyExists_resolver(err, item, resolve, 'PEOPLE_ALREADY_EXISTS'))
        }
      )
    } else {
      model.find(
        {
          $and: [
            { nombre: req.nombre },
            { apellido: req.apellido }
          ]
        },
        (err, item) => {
          resolve(utils.itemAlreadyExists_resolver(err, item, resolve, 'PEOPLE_ALREADY_EXISTS'))
        }
      )

    }



  })
}


/**
 * Checks if a city already exists excluding itself
 * @param {string} id - id of item
 * @param {string} name - name of item
 */
const cityExistsExcludingItself = async (id, name) => {
  return new Promise((resolve, reject) => {
    model.findOne(
      {
        name,
        _id: {
          $ne: id
        }
      },
      (err, item) => {
        utils.itemAlreadyExists(err, item, reject, 'CITY_ALREADY_EXISTS')
        resolve(false)
      }
    )
  })
}

const PeopleExistsExcludingItself_adm = async (id) => {
  return new Promise((resolve, reject) => {
    model.findOne(
      {
        _id: {
          $ne: id
        }
      },
      (err, item) => {
        if (item) {
          resolve(true)
        } else {
          res.status(423).json(utils.buildErrObject(423, 'Invitado no existe.'))
        }
      }
    )
  })
}
const PeopleExistsExcludingItself = async (req) => {
  return new Promise((resolve, reject) => {
    model.findOne(
      { $and: [{ _id: req.id }, { credentialuser: req.credentialuser }] },
      (err, item) => {
        if (item) {
          resolve(true)
        } else {
          resolve(false)
        }
      }
    )
  })
}

const dasdasdadsExistLf = async (id) => {
  return new Promise((resolve, reject) => {
    model.findOne(
      {
        _id: {
          $ne: id
        }
      },
      (err, item) => {
        if (item) {
          resolve(true)
        } else {
          resolve(false)
        }
      }
    )
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

/********************
 * Public functions *
 ********************/

/**
 * Get all items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getAllItems = async (req, res) => {
  try {
    res.status(200).json(await getAllItemsFromDB())
  } catch (error) {
    utils.handleError(res, error)
  }
}

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItems = async (req, res) => {
  try {
    const query = await db.checkQueryString(req.query)
    res.status(200).json(await db.getItems(req, model, query))
  } catch (error) {
    utils.handleError(res, error)
  }
}




/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updatePeople = async (req, res) => {
  try {
    req = matchedData(req)

    console.log(`Actualizando People: ${JSON.stringify(req)}`)

    const id = await utils.isIDGood(req.id)

    req["id"] = id

    let people = [{ "nombre": req.nombre, "apellido": req.apellido, "credentialuser": req.credentialuser }]

    let doesPeoplesExists = await peoples_exists(people)

    console.log("Result people:[" + doesPeoplesExists + "]")

    if (!doesPeoplesExists) {
      const doesPeopleIdExists = await PeopleExistsExcludingItself(req)

      console.log("doesPeopleIdExists:[" + doesPeopleIdExists + "]")

      if (doesPeopleIdExists) {
        res.status(200).json(await db.updateItem(id, model, req))
      } else {
        res.status(422).json('El invitado no se encuentra registrado por favor validar.')
      }

    }
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.updatePeople_adm = async (req, res) => {
  try {
    req = matchedData(req)

    console.log(`Edit People: ${JSON.stringify(req)}`)

    const id = await utils.isIDGood(req.id)

    let people = [{ "nombre": req.nombre, "apellido": req.apellido, "credentialuser": req.credentialuser }]

    let doesPeoplesExists = await peoples_exists(people)

    console.log("Result people:[" + doesPeoplesExists + "]")

    if (!doesPeoplesExists) {
      const doesPeopleIdExists = await PeopleExistsExcludingItself_adm(id)

      console.log("doesPeopleIdExists:[" + doesPeopleIdExists + "]")

      if (doesPeopleIdExists) {
        res.status(200).json(await db.updateItem(id, model, req))
      }
    }
  } catch (error) {
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
    console.log("JSON: " + JSON.stringify(req))
    const id = await utils.isIDGood(req.id)
    req["id"] = id

    console.log("ELIMINAR: " + JSON.stringify(req))


    res.status(200).json(await db.deletePeople(req, model))
  } catch (error) {
    utils.handleError(res, error)
  }
}

exports.deleteItem_adm = async (req, res) => {
  try {
    req = matchedData(req)
    console.log("JSON: " + JSON.stringify(req))
    const id = await utils.isIDGood(req.id)
    res.status(200).json(await db.deleteItem(id, model))
  } catch (error) {
    utils.handleError(res, error)
  }
}
