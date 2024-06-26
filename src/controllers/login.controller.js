const bcrypt = require('bcrypt');
const User = require("../models/user.model");
const CartManager = require('../services/cart.service');
const cartManager = new CartManager();
const Cart = require('../models/cart');

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Datos enviados:', { email, password });

    // usuario adminCoder
    if (email === 'adminCoder@coder.com' && password === 'adminCod3r123') {
      req.session.user = {
        _id: 'admin',
        email: 'adminCoder@coder.com',
        role: 'admin',
        first_name: 'Admin'
      };

      res.cookie('userEmail', 'adminCoder@coder.com', { httpOnly: true, maxAge: 3600000 });
      console.log('Usuario admin autenticado:', req.session.user);
      return res.redirect('/realtimeproducts');
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).render('login', { error: 'Usuario no encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).render('login', { error: 'Contraseña incorrecta.' });
    }

    req.session.user = user;
    res.cookie('userEmail', user.email, { httpOnly: true, maxAge: 3600000 });
    console.log('Usuario autenticado:', req.session.user);

    let cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      cart = await cartManager.createCart(user._id);
    }
    req.session.cartId = cart._id.toString();
    res.locals.cartId = cart._id.toString();
    console.log('CartId almacenado en la sesión:', req.session.cartId);

    res.redirect('/products');
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).render('login', { error: 'Error al iniciar sesión.' });
  }
};

module.exports = { loginUser };