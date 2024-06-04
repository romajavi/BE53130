const express = require("express");
const router = express.Router();
const CartManager = require("../services/cart.service");
const cartManager = new CartManager();

// Para crear un nuevo carrito
router.post("/", async (req, res) => {
  try {
    const newCart = await cartManager.crearCarrito();
    res.status(201).json(newCart);
  } catch (error) {
    console.error("Error al crear el carrito:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Para productos de un carrito por su ID
router.get('/:cid', async (req, res) => {
  const cartId = req.params.cid;
  try {
    const cart = await cartManager.getCarritoById(cartId);
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

module.exports = router;