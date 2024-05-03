const express = require("express");
const router = express.Router();
const ProductManager = require('../controllers/product-manager');
const productManager = new ProductManager();
const CartManager = require("../controllers/cart-manager");
const cartManager = new CartManager();

// Ruta para cargar la página de inicio
router.get("/", (req, res) => {
  res.render("home");
});

// Ruta para cargar la página de chat
router.get("/chat", (req, res) => {
  res.render("chat");
});

router.get('/realtimeproducts', async (req, res) => {
  try {
    const productos = await productManager.getProducts();
    res.render('realtimeproducts', { productos: productos.payload });
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/products', async (req, res) => {
  const { page = 1 } = req.query;
  try {
    const { payload: products, ...pagination } = await productManager.getProducts(5, page);
    res.render('products', { products: products, ...pagination });
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para mostrar el carrito
router.get('/carts/:cid', async (req, res) => {
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

module.exports = router;