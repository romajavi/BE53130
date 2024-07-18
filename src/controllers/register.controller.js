const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const CartManager = require('../services/cart.service');
const cartManager = new CartManager();
const logger = require('../utils/logger');

const registerUser = async (req, res) => {
  try {
    const { first_name, last_name, email, age, password } = req.body;

    if (!first_name || !last_name || !email || !age || !password) {
      return res.status(400).json({ message: "Todos los campos son requeridos." });
    }

    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está en uso." });
    }

    logger.debug(`Intentando hashear la contraseña: ${password}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    logger.debug(`Contraseña hasheada: ${hashedPassword}`);

    const newUser = new User({
      first_name,
      last_name,
      email,
      age,
      password: hashedPassword,
      role: 'user'
    });
    await newUser.save();
    logger.info(`Usuario registrado: ${email}`);

    const newCart = await cartManager.createCart(newUser._id);
    const cartId = newCart._id.toString();

    await User.findByIdAndUpdate(newUser._id, { cartId });

    res.redirect('/login');
  } catch (error) {
    logger.error("Error al registrar usuario:", error);
    res.status(500).json({ message: "Error al registrar usuario." });
  }
};

module.exports = { registerUser };