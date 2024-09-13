const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')

const config = new mongoose.Schema(
  {
    teams_winner: {
      type: String,
      default: ''
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)


config.plugin(mongoosePaginate)
module.exports = mongoose.model('config', config)
