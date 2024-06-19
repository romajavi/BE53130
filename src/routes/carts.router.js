const express = require("express");
const router = express.Router();
const CartManager = require("../services/cart.service");
const cartManager = new CartManager();
const authMiddleware = require('../middlewares/auth.middleware');

// Para obtener los productos de un carrito por su ID
router.get('/:cid', authMiddleware, async (req, res) => {
  const cartId = req.params.cid;
  const userId = req.session.user._id;
  try {
    const cart = await cartManager.getCartById(cartId, userId);
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    res.json(cart);
  } catch (error) {
    console.error('Error al obtener el carrito por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Para agregar un producto a un carrito
router.post('/:cid/products', authMiddleware, async (req, res) => {
  const cartId = req.params.cid;
  const { productId, quantity } = req.body;
  const userId = req.session.user._id;

  try {
    const cart = await cartManager.addProductToCart(cartId, productId, parseInt(quantity, 10), userId);
    res.json({ message: 'Producto agregado al carrito', cart });
  } catch (error) {
    console.error('Error al agregar producto al carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:cid/products/:pid', authMiddleware, async (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const userId = req.session.user._id;
  try {
    const cart = await cartManager.removeProductFromCart(cartId, productId, userId);
    res.json(cart);
  } catch (error) {
    console.error('Error al eliminar producto del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:cid/products/:pid', authMiddleware, async (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const { quantity } = req.body;
  const userId = req.session.user._id;
  try {
    const cart = await cartManager.updateProductQuantity(cartId, productId, quantity, userId);
    res.json(cart);
  } catch (error) {
    console.error('Error al actualizar la cantidad del producto en el carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;