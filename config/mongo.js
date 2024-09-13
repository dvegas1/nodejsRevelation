const mongoose = require('mongoose')
const DB_URL_LOCAL = process.env.MONGO_URI
const DB_URL_NUBE = process.env.DB_CLOUD_MONGODB

const loadModels = require('../app/models')
let dbStatus = ''

module.exports = () => {
  const connect = (DBSERVE) => {
    mongoose.Promise = global.Promise

    mongoose.connect(
      DB_URL_NUBE,
      {
        keepAlive: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
      },
      (err) => {
        if (err) {
          dbStatus = `*    Error connecting to DB: ${err}\n****************************\n`
        }
        dbStatus = `*    DB Connection: OK\n****************************\n`
        if (process.env.NODE_ENV !== 'test') {
          // Prints initialization
          console.log('****************************')
          console.log(`*    Starting Server/Iniciando servidor   ${DBSERVE}`)
          console.log(`*    Port: ${process.env.PORT || 3002}`)
          console.log(`*    NODE_ENV: ${process.env.NODE_ENV}`)
          console.log(`*    Database: MongoDB `, DB_URL_NUBE)
          console.log(dbStatus)
        }
      }
    )
    mongoose.set('useCreateIndex', true)
    mongoose.set('useFindAndModify', false)
  }
  connect(DB_URL_NUBE)

  mongoose.connection.on('error', console.log)
  mongoose.connection.on('disconnected', connect)

  loadModels()
}
