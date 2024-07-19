const express = require('express');
const router = express.Router();
const ProductManager = require('../services/product.service');
const productManager = new ProductManager();
const { authMiddleware, isPremiumOrAdmin } = require('../middlewares/auth.middleware');
const { generateMockProducts } = require('../utils/mockingModule');
const { CustomError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// GET /api/products/mockingproducts (sin autenticación)
router.get('/mockingproducts', (req, res) => {
    const mockProducts = generateMockProducts();
    res.json(mockProducts);
});

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;
        const result = await productManager.getProducts(limit, page, sort, query);

        const productsWithImages = result.payload.map(product => ({
            ...product,
            img: product.img || '/path/to/default/image.jpg' // imagen por defecto si no hay una
        }));
        res.json({ ...result, payload: productsWithImages });
    } catch (error) {
        logger.error('Error al obtener los productos:', error);
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
        logger.error('Error al obtener el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/products
router.post('/', authMiddleware, isPremiumOrAdmin, async (req, res, next) => {
    try {
        const productData = req.body;
        if (!req.user) {
            throw new Error('Usuario no autenticado');
        }
        productData.owner = req.user.role === 'admin' ? 'admin' : req.user.email;
        const newProduct = await productManager.addProduct(productData);
        res.status(201).json(newProduct);
    } catch (error) {
        logger.error('Error al agregar producto:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/products/:pid
router.put('/:pid', authMiddleware, isPremiumOrAdmin, async (req, res) => {
    try {
        const product = await productManager.getProductById(req.params.pid);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        if (req.user.role === 'premium' && product.owner !== req.user.email) {
            return res.status(403).json({ error: 'No tienes permiso para modificar este producto' });
        }
        const updatedProduct = await productManager.updateProduct(req.params.pid, req.body);
        res.json(updatedProduct);
    } catch (error) {
        logger.error('Error al actualizar el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE /api/products/:pid
router.delete('/:pid', authMiddleware, isPremiumOrAdmin, async (req, res) => {
    try {
        const product = await productManager.getProductById(req.params.pid);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        if (req.user.role === 'premium' && product.owner !== req.user.email) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este producto' });
        }
        await productManager.deleteProduct(req.params.pid);
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        logger.error('Error al eliminar el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;