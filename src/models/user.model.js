const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: String,
    email: { type: String, unique: true, required: true },
    age: Number,
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['user', 'admin', 'premium'],
        default: 'user'
    },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});


const User = mongoose.model('User', userSchema);

module.exports = User;