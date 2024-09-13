const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')

const winner = new mongoose.Schema(
  {
    winnerVerifid: {
      type: Boolean,
      default: false
    },
    nombre: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      default: false
    },
    apellido: {
      type: String,
      required: true
    },
    credentialuser: {
      type: String
    },
    autorizeVote: {
      type: Boolean,
      default: false
    },
    vote: {
      type: Boolean,
      default: false
    },
    team: {
      type: String
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)


winner.plugin(mongoosePaginate)
module.exports = mongoose.model('winner', winner)
