/* eslint-disable camelcase */
const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const testShema = new mongoose.Schema(
  {
    id_test: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    user: {
      type: String,
      required: true
    },
    name_test: {
      type: String,
      required: true
    },
    lastModified: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

testShema.plugin(mongoosePaginate)
module.exports = mongoose.model('configuration_test', testShema)
