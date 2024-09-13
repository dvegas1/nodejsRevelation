const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')
const notifications = new mongoose.Schema(
  {
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: 'EMAIL_IS_NOT_VALID'
      },
      lowercase: true,
      required: true
    },
    code: {
      type: Number,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      required: true
    },
    interval: {
      type: Number,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    transaction_id: {
      type: String
    },
    iduser: {
      type: String,
      required: true
    },
    cicles: {
      type: String
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

notifications.plugin(mongoosePaginate)
module.exports = mongoose.model('notifications', notifications)
