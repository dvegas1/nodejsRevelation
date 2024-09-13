const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const imgperfildefault = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)
imgperfildefault.plugin(mongoosePaginate)
module.exports = mongoose.model('imgperfildefault', imgperfildefault)
