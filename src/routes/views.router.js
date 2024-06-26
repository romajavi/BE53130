const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth.middleware.js");
const ProductManager = require('../services/product.service.js');
const productManager = new ProductManager();
const CartManager = require("../services/cart.service.js");
const cartManager = new CartManager();
const User = require('../models/user.model'); // Importar el modelo User
const Cart = require('../models/cart'); // Importar el modelo Cart
const UserDTO = require('../dtos/user.dto');
const { isAdmin } = require('../middlewares/auth.middleware.js');



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

router.get('/current', authMiddleware, (req, res) => {
  const userDTO = new UserDTO(req.user);
  res.json(userDTO);
});



router.get("/", (req, res) => {
  res.render("home");
});

router.get("/chat", authMiddleware, async (req, res) => {
  res.render("chat");
});

router.get('/realtimeproducts', authMiddleware, isAdmin, async (req, res) => {
  try {
    const result = await productManager.getProducts();
    res.render('realtimeproducts', { 
      productos: result.payload,
      user: req.user
    });
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/products', authMiddleware, async (req, res) => {
  const { page = 1, limit = 5 } = req.query;
  try {
    const result = await productManager.getProducts(limit, page);
    
    let user;
    if (req.user._id === 'admin') {
      user = req.user;
    } else {
      user = await User.findById(req.user._id);
    }

    let cart;
    if (user._id !== 'admin') {
      cart = await Cart.findOne({ user: user._id }).populate('products.product');
    }

    res.render('products', { 
      products: result.payload, 
      pagination: {
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        totalPages: result.totalPages,
        totalDocs: result.totalDocs
      },
      limit,
      user,
      cart
    });
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;