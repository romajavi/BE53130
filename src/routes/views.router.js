const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware.js");
const ProductManager = require('../services/product.service.js');
const productManager = new ProductManager();
const CartManager = require("../services/cart.service.js");
const cartManager = new CartManager();
const User = require('../models/user.model'); // Importar el modelo User
const Cart = require('../models/cart'); // Importar el modelo Cart

// Rutas que requieren autenticación
router.get('/profile', authMiddleware, async (req, res) => {
  res.render('profile', { user: req.user });
});

router.get('/carts/:cid', authMiddleware, async (req, res) => {
  const cartId = req.params.cid;
  try {
    const cart = await Cart.findById(cartId).populate('products.product');
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    const totalPrice = cart.products.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    res.render('cart', { cart, totalPrice });
  } catch (error) {
    console.error('Error al obtener el carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get("/", (req, res) => {
  res.render("home");
});

router.get("/chat", authMiddleware, async (req, res) => {
  res.render("chat");
});

router.get('/realtimeproducts', authMiddleware, async (req, res) => {
  try {
    const productos = await productManager.getProducts();
    res.render('realtimeproducts', { productos: productos.payload });
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/products', authMiddleware, async (req, res) => {
  const { page = 1 } = req.query;
  try {
    const { payload: products, ...pagination } = await productManager.getProducts(5, page);
    const userId = req.user._id;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('products.product');

    res.render('products', { products, ...pagination, user: req.user, cart });
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;