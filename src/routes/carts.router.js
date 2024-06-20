const express = require("express");
const router = express.Router();
const CartManager = require("../services/cart.service");
const cartManager = new CartManager();
const authMiddleware = require('../middlewares/auth.middleware');
const User = require('../models/user.model');
const Cart = require('../models/cart');

// Para obtener los productos de un carrito por su ID
router.get('/:cid', authMiddleware, async (req, res) => {
  const cartId = req.params.cid;
  const userId = req.user._id;
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
router.post('/add-product', authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;

  try {
    // Buscar el carrito del usuario
    let cart = await Cart.findOne({ user: userId });

    // Si el carrito no existe, crear uno nuevo
    if (!cart) {
      cart = await cartManager.createCart(userId);
    }

    // Agregar el producto al carrito
    await cartManager.addProductToCart(cart._id, productId, quantity);

    res.json({ message: 'Producto agregado al carrito' });
  } catch (error) {
    console.error('Error al agregar producto al carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


router.put('/:cid/products/:pid', authMiddleware, async (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const { quantity } = req.body;
  const userId = req.user._id;
  try {
    const cart = await cartManager.updateProductQuantity(cartId, productId, quantity, userId);
    res.json(cart);
  } catch (error) {
    console.error('Error al actualizar la cantidad del producto en el carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:cid/products/:pid', authMiddleware, async (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  try {
    await cartManager.removeProductFromCart(cartId, productId);
    res.sendStatus(204); // Envía una respuesta de éxito sin contenido
  } catch (error) {
    console.error('Error al eliminar producto del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/:cid/empty', authMiddleware, async (req, res) => {
  const cartId = req.params.cid;
  try {
    await cartManager.emptyCart(cartId);
    res.redirect(`/carts/${cartId}`);
  } catch (error) {
    console.error('Error al vaciar el carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;