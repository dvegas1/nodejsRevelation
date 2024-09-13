const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const peoples = new mongoose.Schema(
  {
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
peoples.plugin(mongoosePaginate)
module.exports = mongoose.model('peoples', peoples)
