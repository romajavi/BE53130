const express = require("express");
const router = express.Router();
const CartManager = require("../services/cart.service");
const cartManager = new CartManager();
const ticketService = require("../services/ticket.service");

// Para obtener el cartId desde la sesión
router.get('/get-cart-id', (req, res) => {
  const cartId = req.session.cartId;
  if (cartId) {
    res.json({ cartId });
  } else {
    res.status(404).json({ error: 'ID de carrito no encontrado en la sesión' });
  }
});

// Para crear un nuevo carrito
router.post("/", async (req, res) => {
  try {
    const userEmail = req.user.email; // Obtener el correo electrónico del usuario desde la sesión o el token de autenticación
    const newCart = await cartManager.crearCarrito(userEmail);
    res.status(201).json(newCart);
  } catch (error) {
    console.error("Error al crear el carrito:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Para obtener los productos de un carrito por su ID
router.get('/:cid', async (req, res) => {
  const cartId = req.params.cid;
  const userEmail = req.user.email;
  try {
    const cart = await cartManager.getCarritoById(cartId, userEmail);
    if (!cart) {
      return res.status(404).render('error', { message: 'Carrito no encontrado' });
    }
    res.render('cart', { cart });
  } catch (error) {
    console.error('Error al obtener el carrito por ID:', error);
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

// Para agregar un producto a un carrito
router.post('/:cid/products/:pid', async (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const { quantity } = req.body;
  try {
    const cart = await cartManager.agregarProductoAlCarrito(cartId, productId, quantity);
    res.json(cart);
  } catch (error) {
    console.error('Error al agregar producto al carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:cid/products/:pid', async (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  try {
    const cart = await cartManager.eliminarProductoDelCarrito(cartId, productId);
    res.json(cart);
  } catch (error) {
    console.error('Error al eliminar producto del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:cid/products/:pid', async (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const { quantity } = req.body;
  try {
    const cart = await cartManager.actualizarCantidadDeProducto(cartId, productId, quantity);
    res.json(cart);
  } catch (error) {
    console.error('Error al actualizar la cantidad del producto en el carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/:cid/purchase', async (req, res) => {
  const cartId = req.params.cid;
  const userEmail = req.user.email; // Obtener el correo electrónico del usuario desde la sesión o el token de autenticación
  try {
    const { ticket, unprocessedProducts } = await cartManager.finalizarCompra(cartId, userEmail);
    res.json({ message: 'Compra finalizada', ticket, unprocessedProducts });
  } catch (error) {
    console.error('Error al finalizar la compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
