const express = require('express');
const router = express.Router();
const ProductManager = require('../services/product.service');
const productManager = new ProductManager();
const { authMiddleware, isAdmin, isUser } = require('../middlewares/auth.middleware');



// Mideware para redirigir usuarios no autorizados
router.use((req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador." });
    }
});

// GET /api/products
router.get('/', isUser, async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;
        const result = await productManager.getProducts(limit, page, sort, query);
        res.json(result);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/products/:pid
router.get('/:pid', async (req, res) => {
    try {
        const product = await productManager.getProductById(req.params.pid);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/products
router.post('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const newProduct = await productManager.addProduct(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/products/:pid
router.put('/:pid', authMiddleware, isAdmin, async (req, res) => {
    try {
        const updatedProduct = await productManager.updateProduct(req.params.pid, req.body);
        if (updatedProduct) {
            res.json(updatedProduct);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE /api/products/:pid
router.delete('/:pid', authMiddleware, isAdmin, async (req, res) => {
    try {
        const deletedProduct = await productManager.deleteProduct(req.params.pid);
        if (deletedProduct) {
            res.json({ message: 'Producto eliminado correctamente' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;