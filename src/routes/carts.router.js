const express = require("express");
const router = express.Router();
const CartManager = require("../services/cart.service");
const cartManager = new CartManager();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { isUser } = require('../middlewares/auth.middleware');
const ticketService = require('../services/ticket.service');

// GET /api/carts/:cid
router.get('/:cid', authMiddleware, (req, res, next) => {
    const cartId = req.params.cid;
    const userId = req.user._id;
    cartManager.getCartById(cartId, userId)
        .then(cart => {
            if (!cart) {
                return res.status(404).json({ error: 'Carrito no encontrado' });
            }
            res.json(cart);
        })
        .catch(error => {
            console.error('Error al obtener el carrito por ID:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        });
});

// POST /api/carts/add-product
router.post('/add-product', authMiddleware, isUser, async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    try {
        const cart = await cartManager.addProductToCart(userId, productId, quantity);
        res.json({ message: 'Producto agregado al carrito', cart });
    } catch (error) {
        console.error('Error al agregar producto al carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/carts/:cid/products/:pid
router.put('/:cid/products/:pid', authMiddleware, isUser, async (req, res) => {
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

// DELETE /api/carts/:cid/products/:pid
router.delete('/:cid/products/:pid', authMiddleware, isUser, async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    try {
        await cartManager.removeProductFromCart(cartId, productId);
        res.sendStatus(204);
    } catch (error) {
        console.error('Error al eliminar producto del carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/carts/:cid/empty
router.post('/:cid/empty', authMiddleware, isUser, async (req, res) => {
    const cartId = req.params.cid;
    try {
        await cartManager.emptyCart(cartId);
        res.json({ message: 'Carrito vaciado correctamente' });
    } catch (error) {
        console.error('Error al vaciar el carrito:', error);
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
            res.render('purchase-success', {
                ticket: result.ticket,
                failedProducts: result.failedProducts
            });
        } else {
            res.render('purchase-failed', {
                failedProducts: result.failedProducts
            });
        }
    } catch (error) {
        console.error('Error al procesar la compra:', error);
        res.status(500).render('error', { message: 'Error interno del servidor' });
    }
});

module.exports = router;