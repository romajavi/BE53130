const express = require("express");
const router = express.Router();
const CartManager = require("../services/cart.service");
const cartManager = new CartManager();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { isUser } = require('../middlewares/auth.middleware');
const ticketService = require('../services/ticket.service');
const logger = require('../utils/logger');

// GET /api/carts/:cid
router.get('/:cid', authMiddleware, async (req, res) => {
    try {
        const cartId = req.params.cid;
        const userId = req.user._id;
        const cart = await cartManager.getCartById(cartId, userId);
        if (!cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }
        // Asegúrate de que los productos del carrito tengan todos sus campos, incluida la imagen
        const populatedCart = await cart.populate('products.product');
        res.json(populatedCart);
    } catch (error) {
        logger.error('Error al obtener el carrito por ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/carts/add-product
router.post('/add-product', authMiddleware, isUser, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user._id;
        const cart = await cartManager.addProductToCart(userId, productId, quantity);
        res.json({ message: 'Producto agregado al carrito', cart });
    } catch (error) {
        logger.error('Error al agregar producto al carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/carts/:cid/products/:pid
router.put('/:cid/products/:pid', authMiddleware, isUser, async (req, res) => {
    try {
        const { cid: cartId, pid: productId } = req.params;
        const { quantity } = req.body;
        const userId = req.user._id;
        const cart = await cartManager.updateProductQuantity(cartId, productId, quantity, userId);
        res.json(cart);
    } catch (error) {
        logger.error('Error al actualizar la cantidad del producto en el carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE /api/carts/:cid/products/:pid
router.delete('/:cid/products/:pid', authMiddleware, isUser, async (req, res) => {
    try {
        const { cid: cartId, pid: productId } = req.params;
        await cartManager.removeProductFromCart(cartId, productId);
        res.sendStatus(204);
    } catch (error) {
        logger.error('Error al eliminar producto del carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/carts/:cid/purchase
router.post('/:cid/purchase', authMiddleware, isUser, async (req, res) => {
    try {
        const cartId = req.params.cid;
        const userId = req.user._id;
        const result = await cartManager.processPurchase(cartId, userId);
        if (result.success) {
            res.json({
                status: 'success',
                message: 'Compra realizada con éxito',
                ticket: result.ticket,
                failedProducts: result.failedProducts
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: 'No se pudo procesar la compra',
                failedProducts: result.failedProducts
            });
        }
    } catch (error) {
        logger.error('Error al procesar la compra:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

// POST para vaciar el carrito
router.post('/:cid/empty', authMiddleware, isUser, async (req, res) => {
    try {
        const cartId = req.params.cid;
        await cartManager.emptyCart(cartId);
        res.redirect(`/carts/${cartId}`);
    } catch (error) {
        logger.error('Error al vaciar el carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});





module.exports = router;