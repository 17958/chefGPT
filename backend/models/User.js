const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'yumsters'
});

module.exports = mongoose.model('User', userSchema);

