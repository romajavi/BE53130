const express = require("express");
const router = express.Router();
const ProductManager = require("../controllers/product-manager");
const productManager = new ProductManager();

// Para todos los productos
router.get('/', async (req, res) => {
    const { limit, page, sort, query } = req.query;
    try {
        const response = await productManager.getProducts(limit, page, sort, query);
        res.json(response);
        } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Para un producto por su ID
router.get("/:pid", async (req, res) => {
    const productId = req.params.pid;
    try {
        const product = await productManager.getProductById(productId);
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(product);
    } catch (error) {
        console.error("Error al obtener el producto por ID:", error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Para un nuevo producto
router.post("/", async (req, res) => {
    const productData = req.body;
    try {
        await productManager.addProduct(productData);
        res.status(201).json({ message: "Producto agregado correctamente" });
    } catch (error) {
        console.error("Error al agregar producto:", error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Para Actualizar un producto por su ID
router.put("/:pid", async (req, res) => {
    const productId = req.params.pid;
    const updatedProduct = req.body;
    try {
        const product = await productManager.updateProduct(productId, updatedProduct);
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(product);
    } catch (error) {
        console.error("Error al actualizar producto:", error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Para eliminar un producto por su id
router.delete("/:pid", async (req, res) => {
    const productId = req.params.pid;
    try {
        const deletedProduct = await productManager.deleteProduct(productId);
        if (!deletedProduct) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar producto:", error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;