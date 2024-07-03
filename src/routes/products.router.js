const express = require('express');
const router = express.Router();
const ProductManager = require('../services/product.service');
const productManager = new ProductManager();
const { authMiddleware, isAdmin, isUser } = require('../middlewares/auth.middleware');
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
        // Asegúrate de que cada producto tenga el campo img
        const productsWithImages = result.payload.map(product => ({
            ...product,
            img: product.img || '/path/to/default/image.jpg' // Proporciona una imagen por defecto si no hay una
        }));
        res.json({...result, payload: productsWithImages});
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
router.post('/', async (req, res, next) => {
    try {
        const { title, description, price, img, code, stock, category, status } = req.body;

        if (!title || !price) {
            throw new CustomError('Title and price are required', 400, {
                required: {
                    title: 'string',
                    price: 'number'
                }
            });
        }

        const newProduct = await productManager.addProduct({
            title,
            description,
            price,
            img,
            code,
            stock,
            category,
            status
        });

        res.status(201).json(newProduct);
    } catch (error) {
        next(error);
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
        logger.error('Error al actualizar el producto:', error);
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
        logger.error('Error al eliminar el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;