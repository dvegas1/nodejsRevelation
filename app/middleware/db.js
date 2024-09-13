const { Error } = require('mongoose')
const {
  buildSuccObject,
  buildErrObject,
  itemNotFound
} = require('../middleware/utils')

/**
 * Builds sorting
 * @param {string} sort - field to sort from
 * @param {number} order - order for query (1,-1)
 */
const buildSort = (sort, order) => {
  const sortBy = {}
  sortBy[sort] = order
  return sortBy
}

/**
 * Hack for mongoose-paginate, removes 'id' from results
 * @param {Object} result - result object
 */
const cleanPaginationID = result => {
  result.docs.map(element => delete element.id)
  return result
}

/**
 * Builds initial options for query
 * @param {Object} query - query object
 */
const listInitOptions = async req => {
  return new Promise(resolve => {
    const order = req.query.order || -1
    const sort = req.query.sort || 'createdAt'
    const sortBy = buildSort(sort, order)
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 5
    const options = {
      sort: sortBy,
      lean: true,
      page,
      limit
    }
    resolve(options)
  })
}

module.exports = {
  /**
   * Checks the query string for filtering records
   * query.filter should be the text to search (string)
   * query.fields should be the fields to search into (array)
   * @param {Object} query - query object
   */
  async emailExists_user(email, model) {
    return new Promise((resolve, reject) => {
      model.findOne(
        {
          email
        },
        (err, item) => {
          if (item) {
            resolve(item)
          } else {
            resolve({})
          }
        }
      )
    })
  },
  async getcomponent(component, language, model) {
    return new Promise((resolve, reject) => {
      model.find(
        { $and: [{ component: component }, { language: language }] },
        '-updatedAt -createdAt',
        {
          sort: {
            id: 1
          }
        },
        (err, item) => {
          if (err) {
            itemNotFound(err, item, reject, 'NOT_FOUND')
          } else {
            resolve(item)
          }
        }
      )
    })
  },
  async findUser1(email, model) {
    return new Promise((resolve, reject) => {
      try {
        if (email != '') {
          model.findOne(
            {
              email
            },
            'password loginAttempts bqlockExpires name email role verified verification',
            (err, item) => {
              if (err) {
                resolve(null)
              }

              console.log('findUserdb: ' + item + ' email ' + email)
              resolve(item)
            }
          )
        }
      } catch (error) {
        console.log('findUser:error ' + JSON.stringify(error))
        resolve('')
      } finally {
      }
    })
  },
  async fin_trx_In(arr, iduser, model) {
    console.log('Inicio [fin_trx_In] ' + JSON.stringify(arr))
    return new Promise((resolve, reject) => {
      try {
        model.find(
          {
            $and: [
              {
                iduser: iduser
              },
              {
                transaction_id: {
                  $in: arr
                }
              }
            ]
          },
          '-updatedAt -createdAt',
          {
            sort: {
              id: 1
            }
          },
          (err, item) => {
            if (err) {
              resolve({})
            }
            if (item) {
              console.log('[fin_trx_In] ' + JSON.stringify(item))
              resolve(item)
            }
          }
        )
      } catch (error) {
        resolve({})
      }
    })
  },

  async find_TrxIdUser(iduser, transaction_id, model) {
    return new Promise((resolve, reject) => {
      try {
        model.find(
          {
            $and: [
              { iduser: iduser },
              { transaction_id: transaction_id },
              { verified: false }
            ]
          },
          '-updatedAt -createdAt',
          {
            sort: {
              id: 1
            }
          },
          (err, item) => {
            if (err) {
              resolve({})
            }
            if (item) {
              console.log('find_TrxIdUser ' + JSON.stringify(item))
              resolve(item)
            }
          }
        )
      } catch (error) {
        resolve({})
      }
    })
  },
  async findIdUser(iduser, model) {
    return new Promise((resolve, reject) => {
      try {
        if (iduser != '') {
          model.findOne(
            {
              iduser
            },
            'password loginAttempts bqlockExpires name email role verified verification',
            (err, item) => {
              if (err) {
                resolve()
              }
              if (item) {
                resolve(item)
              } else {
                console.log('No se enconro usuario:[iduser] = ' + iduser)
                resolve()
              }
            }
          )
        } else {
          resolve()
        }
      } catch (error) {
        console.log('findUser:error ' + JSON.stringify(error))
        resolve()
      } finally {
      }
    })
  },
  async existId__credentialuser(credentialuser, model) {
    return new Promise((resolve, reject) => {
      try {
        model.findOne(
          {
            credentialuser: credentialuser
          },
          '_id loginAttempts bqlockExpires role verified verification',
          (err, item) => {
            if (err) {
              resolve(true)
            }
            if (item) {
              console.log("existId__credentialuser:" + JSON.stringify(item))
              resolve(true)
            } else {
              console.log('Element no exist:' + credentialuser)
              resolve(false)
            }
          }
        )
      } catch (error) {
        console.log('findUser:error ' + JSON.stringify(error))
        itemNotFound(err, item, reject, 'Debe ingresarr su clave de acceso para continuar con esta operación.')

      }
    })
  },
  async findIdUserCred(credentialuser, model) {
    return new Promise((resolve, reject) => {
      try {
        model.findOne(
          {
            _id: credentialuser
          },
          '_id loginAttempts bqlockExpires role verified verification',
          (err, item) => {
            if (err) {
              resolve({})
            }
            if (item) {
              console.log("item1:" + JSON.stringify(item))
              resolve(item)
            } else {
              console.log('No se enconro usuario:[iduser] = ' + credentialuser)
              //  itemNotFound(err, item, reject, 'NOT_ID_CREDENTIAL')
              reject(buildErrObject(401, 'Debe ingresar su clave de acceso para continuar con esta operación.'))
            }
          }
        )
      } catch (error) {
        console.log('findUser:error ' + JSON.stringify(error))
        itemNotFound(err, item, reject, 'Debe ingresarr su clave de acceso para continuar con esta operación.')

      }
    })
  },
  async checkQueryString(query) {
    return new Promise((resolve, reject) => {
      try {
        if (
          typeof query.filter !== 'undefined' &&
          typeof query.fields !== 'undefined'
        ) {
          console.log(`Query filter: ${query.filter}`)

          const data = {
            $and: []
          }
          const array = []
          // Takes fields param and builds an array by splitting with ','
          const arrayFields = query.fields.split(',')
          // Adds SQL Like %word% with regex
          arrayFields.map(item => {
            array.push({
              [item]: {
                $regex: new RegExp(query.filter, 'i')
              }
            })
          })
          // Puts array result in data
          data.$and = array
          resolve(data)
        } else {
          resolve({})
        }
      } catch (err) {
        console.log(err.message)
        reject(buildErrObject(422, 'ERROR_WITH_FILTER'))
      }
    })
  },

  /**
   * Gets items from database
   * @param {Object} req - request object
   * @param {Object} query - query object
   */
  async getItems(req, model, query) {
    const options = await listInitOptions(req)
    return new Promise((resolve, reject) => {
      model.paginate(query, options, (err, items) => {
        if (err) {
          reject(buildErrObject(422, err.message))
        }
        resolve(cleanPaginationID(items))
      })
    })
  },
  async createNotify(req, model) {
    return new Promise((resolve, reject) => {
      const send_notifications = new model({
        message: req.message,
        read: req.read,
        interval: req.interval,
        icon: req.icon,
        color: req.color,
        email: req.email,
        iduser: req.iduser,
        code: req.code
      })

      send_notifications.save((err, item) => {
        if (err) {
          console.error(err)
          resolve({})
        }

        if (item) {
          resolve(item)
        }
      })
    })
  },
  async existId(id, model) {
    try {
      console.log('Buscando Id ' + id)
      return new Promise((resolve, reject) => {
        model.findOne(
          { $and: [{ _id: id }] },

          (err, item) => {
            if (err) {
              resolve(true)
            }
            if (item) {
              resolve(true)
            } else {
              resolve(false)
            }
          }
        )
      })
    } catch (error) {
      resolve(error)
    }
  },
  async existWinner(model) {
    return new Promise((resolve, reject) => {
      model.findOne(
        { $and: [{ winnerVerifid: true }] },

        (err, item) => {
          if (err) {
            resolve(true)
          }
          if (item) {
            resolve(true)
          } else {
            resolve(false)
          }
          console.log("winner:" + JSON.stringify(item))
        }
      )
    }).catch(function () {
      resolve(true)
    });

  },
  /**
   * Gets item from database by id
   * @param {string} id - item id
   * @param {string} user - item id

   */
  async getItemNotify(cicles, iduser, model) {
    return new Promise((resolve, reject) => {
      model.find(
        { $and: [{ cicles: cicles }, { iduser: iduser }] },
        '-updatedAt -createdAt',
        {
          sort: {
            createdAt: 1
          }
        },
        (err, item) => {
          if (err) {
            itemNotFound(err, item, reject, 'NOT_FOUND')
            resolve(item)
          } else {
            console.log(item)
            resolve(item)
          }
        }
      )
    })
  },
  async getPeoples(credentialuser_, model) {
    let data
    return new Promise((resolve, reject) => {
      model.find(
        {
          credentialuser: credentialuser_
        },
        '-updatedAt -createdAt',
        (err, item) => {
          if (err) {
            resolve({})
          }
          resolve(item)
        }
      ).limit(20)
    })
  },
  async getItem(ids, model, user) {
    return new Promise((resolve, reject) => {
      model.find(
        { $and: [{ _id: ids }, { idusuario: user }] },
        '-updatedAt -createdAt -blockExpires',
        {
          sort: {
            id: 1
          }
        },
        (err, item) => {
          if (err) {
            itemNotFound(err, item, reject, 'NOT_FOUND')
            resolve(item)
          } else {
            console.log(item)
            resolve(item)
          }
        }
      )
    })
  },
  async getUserRevelations(credentialuser, model) {
    return new Promise((resolve, reject) => {
      model.find(
        { credentialuser: credentialuser },
        req,
        (err, item) => {
          itemNotFound(err, item, reject, 'NOT_FOUND')
          resolve(item)
        }
      )
    })
  },
  async getItem(ids, model, user) {
    return new Promise((resolve, reject) => {
      model.find(
        { $and: [{ id: ids }, { idusuario: user }] },
        '-updatedAt -createdAt',
        {
          sort: {
            id: 1
          }
        },
        (err, item) => {
          if (err) {
            itemNotFound(err, item, reject, 'NOT_FOUND')
            resolve(item)
          } else {
            console.log(item)
            resolve(item)
          }
        }
      )
    })
  },
  async getItemTrx(id, model) {
    return new Promise((resolve, reject) => {
      model.findById(id, (err, item) => {
        itemNotFound(err, item, reject, 'NOT_FOUND')
        resolve(item)
        console.log('ITEMS: ' + JSON.stringify(item))
      })
    })
  },
  async getItemUser(id, model) {
    return new Promise((resolve, reject) => {
      model.findById(id, (err, item) => {
        itemNotFound(err, item, reject, 'NOT_FOUND')
        resolve(item)
      })
    })
  },
  /**
   * Creates a new item in database
   * @param {Object} req - request object
   */
  createItem(req, model) {
    return new Promise((resolve, reject) => {
      try {
        model.create(req, (err, item) => {
          if (err) {
            console.error(err)
            resolve({})
          }
          resolve(item)
        })
      } catch (error) {
        console.err(JSON.stringify(error))
      }
    })
  },
  async update(id, model, req) {
    return new Promise((resolve, reject) => {
      model.findByIdAndUpdate(
        { _id: id },
        req,
        {
          new: true,
          runValidators: true
        },
        (err, item) => {
          itemNotFound(err, item, reject, 'No se logro guardar su registro.')
          resolve(item)
        }
      )
    })
  },
  async updateNotify(cicles, iduser, model, req) {
    return new Promise((resolve, reject) => {
      model.findByIdAndUpdate(
        { cicles: cicles, iduser: iduser },
        req,
        {
          new: true,
          runValidators: true
        },
        (err, item) => {
          itemNotFound(err, item, reject, 'NOT_FOUND')
          resolve(item)
        }
      )
    })
  },
  async updateVotePeople(credentialuser, model, req) {
    return new Promise((resolve, reject) => {
      model.findOneAndUpdate(
        { credentialuser: credentialuser },
        req,
        {
          new: true,
          runValidators: true
        },
        (err, item) => {
          itemNotFound(err, item, reject, 'NOT_FOUND')
          resolve(item)
        }
      )
    })
  },
  async FindupdateConfig(req, model) {
    return new Promise((resolve, reject) => {
      model.findOneAndUpdate(
        { _id: req._id },
        req,
        {
          new: true,
          runValidators: true
        },
        (err, item) => {
          resolve(utils.itemAlreadyExists_resolver(err, item, resolve, 'No se logro actualizar la configuración.'))
        }
      )
    })
  },
  /**
   * Updates an item in database by id
   * @param {string} id - item id
   * @param {Object} req - request object
   */
  async updateItem(id, model, req) {
    return new Promise((resolve, reject) => {
      model.findByIdAndUpdate(
        { _id: id },
        req,
        {
          new: true,
          runValidators: true
        },
        (err, item) => {
          itemNotFound(err, item, reject, 'NOT_FOUND')
          resolve(item)
        }
      )
    })
  },
  async updateConfig(id, model, req) {
    return new Promise((resolve, reject) => {
      model.findByIdAndUpdate(
        { _id: id },
        req,
        {
          new: true,
          runValidators: true
        },
        (err, item) => {
          itemNotFound(err, item, reject, 'NOT_FOUND')
          resolve(item)
        }
      )
    })
  },
  async findOneAndUpdate(filter, updateDoc, options, model) {
    return new Promise((resolve, reject) => {
      model.findOneAndUpdate(filter, updateDoc, options, (err, item) => {
        itemNotFound(err, item, reject, 'NOT_FOUND')
        resolve(item)
      })
    })
  },

  /**
   * Deletes an item from database by id
   * @param {string} id - id of item
   */
  async deleteItem(id, model) {
    return new Promise((resolve, reject) => {
      model.findByIdAndRemove(id, (err, item) => {
        itemNotFound(err, item, reject, 'NOT_FOUND')
        resolve(buildSuccObject('DELETED'))
      })
    })
  },
  async deletePeople(req, model) {
    return new Promise((resolve, reject) => {
      model.findOneAndDelete({ $and: [{ _id: req.id }, { credentialuser: req.credentialuser }] }, (err, item) => {
        itemNotFound(err, item, reject, 'No se encontro el invitado a eliminar por favor validar.')
        resolve(buildSuccObject('DELETED'))
      })
    })
  }
}
