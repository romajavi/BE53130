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
        email: 'adminCoder@coder.com',
        role: 'admin',
      };

      let cart = await Cart.findOne({ user: 'adminCoder@coder.com' });
      if (!cart) {
        cart = await cartManager.crearCarrito('adminCoder@coder.com');
      }
      req.session.cartId = cart._id.toString();
      res.locals.cartId = cart._id.toString();
      console.log('CartId almacenado en la sesión:', req.session.cartId);

      return res.redirect('/products');
    }

    const user = await User.findOne({ email: email }).exec();
    console.log('Usuario encontrado:', user);

    if (!user) {
      return res.status(401).render('login', { error: 'Email o contraseña incorrectos.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).render('login', { error: 'Email o contraseña incorrectos.' });
    }

    req.session.user = user;
    res.cookie('userEmail', user.email, { httpOnly: true, maxAge: 3600000 });
    console.log('Usuario autenticado:', req.session.user);

    let cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      cart = await cartManager.crearCarrito(user._id);
    }
    req.session.cartId = cart._id.toString();
    res.locals.cartId = cart._id.toString();
    console.log('CartId almacenado en la sesión:', req.session.cartId);

    res.redirect('/profile');
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).render('login', { error: 'Error al iniciar sesión.' });
  }
};

module.exports = { loginUser };