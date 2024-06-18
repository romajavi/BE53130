const express = require('express');
const router = express.Router();
const productDao = require('../daos/product.dao');

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            lean: true
        };
        const result = await Product.paginate({}, options);
        res.render('products', {
            products: result.docs,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            totalPages: result.totalPages,
            limit: limit
        });
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;



// const express = require("express");
// const router = express.Router();
// const ProductManager = require("../services/product.service");
// const productManager = new ProductManager();

// // Para todos los productos
// router.get('/', async (req, res) => {
//   const { limit = 10, page = 1, sort, query } = req.query;
//   try {
//     const response = await productManager.getProducts(limit, page, sort, query);
//     res.render('products', { products: response.payload, ...response });
//   } catch (error) {
//     console.error('Error al obtener los productos:', error);
//     res.status(500).json({ error: 'Error interno del servidor' });
//   }
// });

// // Para un producto por su ID
// router.get("/:pid", async (req, res) => {
//   const productId = req.params.pid;
//   try {
//     const product = await productManager.getProductById(productId);
//     if (!product) {
//       return res.status(404).json({ error: "Producto no encontrado" });
//     }
//     res.json(product);
//   } catch (error) {
//     console.error("Error al obtener el producto por ID:", error.message);
//     res.status(500).json({ error: "Error interno del servidor" });
//   }
// });

// module.exports = router;