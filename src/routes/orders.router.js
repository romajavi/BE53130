const express = require('express');
const router = express.Router();
const CartManager = require('../services/cart.service');
const cartManager = new CartManager();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { isUser } = require('../middlewares/auth.middleware');

router.post('/create', authMiddleware, isUser, async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await cartManager.getOrCreateCart(userId);

        const result = await cartManager.processPurchase(cart._id, userId);

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
        console.error('Error al procesar la compra:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

module.exports = router;