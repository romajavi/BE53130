const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: String,
  email: { type: String, unique: true },
  age: Number,
  password: {
    type: String,
    required: true,
    minlength: 4
  },
  role: String,
  cart: {
    type: Schema.Types.ObjectId,
    ref: 'Cart'
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;