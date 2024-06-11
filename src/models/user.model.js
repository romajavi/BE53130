const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: String,
  email: { type: String, unique: true },  // Agregamos unique: true
  age: Number,
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

module.exports = User;