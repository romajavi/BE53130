const express = require('express');
const router = express.Router();
const CartManager = require('../services/cart.service');
const cartManager = new CartManager();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { isUser } = require('../middlewares/auth.middleware');

// get para pagina de orden
router.post('/create', authMiddleware, isUser, async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await cartManager.getOrCreateCart(userId);

        const result = await cartManager.processPurchase(cart._id, userId);

        if (result.success) {
            res.render('purchase-success', {
                ticket: result.ticket,
                failedProducts: result.failedProducts
            });
        } else {
            res.render('purchase-failed', {
                failedProducts: result.failedProducts,
                cartId: cart._id
            });
        }
    } catch (error) {
        console.error('Error al procesar la compra:', error);
        res.status(500).render('error', { message: 'Error interno del servidor' });
    }
});

module.exports = router;