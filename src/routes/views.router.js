const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware.js");
const ProductManager = require('../services/product.service.js');
const productManager = new ProductManager();
const CartManager = require("../services/cart.service.js"); 
const cartManager = new CartManager();

// Rutas que requieren autenticación
router.get('/profile', authMiddleware, async (req, res) => {
  res.render('profile', { user: req.session.user });
});

router.get('/carts/:cid', authMiddleware, async (req, res) => {
  const cartId = req.params.cid;
  try {
    const cart = await cartManager.getCarritoById(cartId);
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    res.render('cart', { products: cart.products, cartId });
  } catch (error) {
    console.error('Error al obtener el carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para cargar la página de inicio
router.get("/", (req, res) => {
  res.render("home");
});

// Ruta para cargar la página de chat
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
    res.render('products', { products, ...pagination, user: req.session.user });
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;