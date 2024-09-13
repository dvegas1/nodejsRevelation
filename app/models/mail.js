const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const MailSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)
MailSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('Mail', MailSchema)
