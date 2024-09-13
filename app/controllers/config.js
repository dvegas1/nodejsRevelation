const model = require('../models/config')
const { matchedData } = require('express-validator')
const utils = require('../middleware/utils')
const db = require('../middleware/db')

/*********************
 * Private functions *
 *********************/

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

const existIdConfig = async (id) => {
  return new Promise((resolve, reject) => {
    model.findOne(
      {
        _id: {
          $ne: id
        }
      },
      (err, item) => {
        if (err) {
          console.error(err)
          resolve(false)
        }
        if (item) {
          console.info(item)
          resolve(item)
        }


      }
    )
  })
}


const ExistIdConfig = async id => {
  return new Promise((resolve, reject) => {
    model.findById(id, (err, item) => {
      utils.itemAlreadyExists(err, item, resolve, 'El elemento no existe.')
      resolve(item)
    })
  }).catch(function (error) {
    console.log("Promise Rejected:" + error);
  });
}

/**
 * Checks if a city already exists in database
 * @param {string} name - name of item
 */
const ConfigExists = async id => {
  return new Promise((resolve, reject) => {
    model.findOne(
      {
        id
      },
      (err, item) => {
        resolve(utils.itemAlreadyExists_resolver(err, item, reject, 'CITY_ALREADY_EXISTS'))
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
          teams_winner: 1
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

exports.getIdText = async (req, res) => {
  try {
    req = matchedData(req)

    console.log("Buscando idTExt: " + req.idtext + " Idioma:" + req.lenguage)
    console.log(JSON.stringify(req.headers));



    res.status(200).json(await db.getIdText(req.idtext, req.lenguage, model))
  } catch (error) {
    utils.handleError(res, error)
  }
}
exports.getcomponent = async (req, res) => {
  req = matchedData(req)

  console.log("Buscando component: " + req.component + " Idioma:" + req.lenguage)

  res.status(200).json(await db.getcomponent(req.component, req.lenguage, model))

}
/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateItem = async (req, res) => {
  req = matchedData(req)

  const id = await utils.isIDGood(req.id)

  console.log('Request:' + JSON.stringify(req))

  const ExistIdConfig = await ConfigExistsExcludingItself(id)
  console.log("ExistIdConfig:" + ExistIdConfig)

  if (ExistIdConfig) {
    console.log(`Actualizando config: ${JSON.stringify(req)}`)
    res.status(200).json(await db.updateConfig(id, model, req))
  } else {
    res.status(422).json('El elemento no existe.')
  }
}

const ConfigExistsExcludingItself = async (id) => {
  return new Promise((resolve, reject) => {
    model.findOne(
      { $and: [{ _id: id }] },
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
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.createItem = async (req, res) => {
  try {
    req = matchedData(req)

    console.log(`Validando para crear o actualizar config:${JSON.stringify(req)}`)

    res.status(201).json(await db.createItem(req, model))

  } catch (error) {
    console.error(error)
    res.status(422).json(error)
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
    res.status(200).json(await db.deleteItem(id, model))
  } catch (error) {
    utils.handleError(res, error)
  }
}
