const express = require('express');
const router = express.Router();
const ProductManager = require('../services/product.service');
const productManager = new ProductManager();
const CartManager = require('../services/cart.service');
const cartManager = new CartManager();
const { authMiddleware, isAdmin, isUser, isPremiumOrAdmin } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');
const User = require('../models/user.model');

router.get('/', (req, res) => {
    res.render('home');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/profile', authMiddleware, (req, res) => {
    res.render('profile', { user: req.user });
});

router.get('/products', authMiddleware, (req, res, next) => {
    if (req.user.role === 'admin') {
        return res.redirect('/realtimeproducts');
    }
    next();
}, async (req, res) => {
    try {
        const { limit = 5, page = 1, sort, query } = req.query;
        const result = await productManager.getProducts(limit, page, sort, query);

        const cart = await cartManager.getOrCreateCart(req.user._id);

        let totalProductsInCart = 0;
        if (cart && cart.products) {
            totalProductsInCart = cart.products.reduce((total, product) => total + product.quantity, 0);
        }

        res.render('products', {
            products: result.payload,
            user: req.user,
            cart,
            totalProductsInCart,
            pagination: {
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
            },
            limit
        });
    } catch (error) {
        logger.error('Error al obtener los productos:', error);
        res.status(500).render('error', { error: 'Error al cargar los productos' });
    }
});

router.get('/realtimeproducts', authMiddleware, isPremiumOrAdmin, async (req, res) => {
    try {
        console.log('Usuario en /realtimeproducts:', req.user);
        const { limit = 10, page = 1, sort, query } = req.query;
        const result = await productManager.getProducts(limit, page, sort, query);
        res.render('realtimeproducts', {
            productos: result.payload,
            pagination: {
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                totalDocs: result.totalDocs
            },
            user: req.user,
            limit
        });
    } catch (error) {
        logger.error('Error al obtener los productos:', error);
        res.status(500).render('error', { error: 'Error al cargar los productos' });
    }
});

router.get('/chat', authMiddleware, isUser, (req, res) => {
    res.render('chat', { user: req.user });
});

router.get('/carts/:cid', authMiddleware, async (req, res) => {
    try {
        const cart = await cartManager.getCartById(req.params.cid, req.user._id);
        if (!cart) {
            return res.status(404).render('error', { error: 'Carrito no encontrado' });
        }

        let totalPrice = 0;
        if (cart.products) {
            totalPrice = cart.products.reduce((total, item) => {
                return total + (item.product.price * item.quantity);
            }, 0);
        }

        res.render('cart', { cart, totalPrice, user: req.user });
    } catch (error) {
        logger.error('Error al obtener el carrito:', error);
        res.status(500).render('error', { error: 'Error al cargar el carrito' });
    }
});

router.get('/admin/users', authMiddleware, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}).lean();
        res.render('admin-users', { users, user: req.user });
    } catch (error) {
        logger.error('Error al cargar usuarios:', error);
        res.status(500).render('error', { error: 'Error al cargar usuarios' });
    }
});

module.exports = router;