const Cart = require('../models/cart');
const { ObjectId } = require('mongodb');

class CartManager {
    async crearCarrito() {
        try {
            const nuevoCarrito = new Cart({ products: [] });
            await nuevoCarrito.save();
            return nuevoCarrito;
        } catch (error) {
            console.error("Error al crear el carrito:", error.message);
            throw error;
        }
    }

    async getCarritoById(carritoId) {
        try {
            const carrito = await Cart.findById(carritoId).populate('products.product').lean();
            return carrito;
        } catch (error) {
            console.error("Error al obtener el carrito por ID:", error.message);
            throw error;
        }
    }

    async agregarProductoAlCarrito(carritoId, productoId, quantity = 1) {
        try {
            const carrito = await Cart.findById(carritoId);
            if (!carrito) {
                throw new Error("Carrito no encontrado");
            }
            const productoIndex = carrito.products.findIndex(item => item.product.toString() === productoId);
            if (productoIndex !== -1) {
                carrito.products[productoIndex].quantity += quantity;
            } else {
                carrito.products.push({ product: productoId, quantity });
            }
            await carrito.save();
            return carrito;
        } catch (error) {
            console.error("Error al agregar producto al carrito:", error.message);
            throw error;
        }
    }

    async eliminarProductoDelCarrito(carritoId, productoId) {
        try {
            const carrito = await Cart.findById(carritoId);
            if (!carrito) {
                throw new Error("Carrito no encontrado");
            }
            const productoIndex = carrito.products.findIndex(item => item.product.toString() === productoId);
            if (productoIndex !== -1) {
                carrito.products.splice(productoIndex, 1);
                await carrito.save();
                return carrito;
            } else {
                throw new Error("Producto no encontrado en el carrito");
            }
        } catch (error) {
            console.error("Error al eliminar producto del carrito:", error.message);
            throw error;
        }
    }

    async actualizarCantidadDeProducto(carritoId, productoId, nuevaCantidad) {
        try {
            const carrito = await Cart.findById(carritoId);
            if (!carrito) {
                throw new Error("Carrito no encontrado");
            }
            const productoIndex = carrito.products.findIndex(item => item.product.toString() === productoId);
            if (productoIndex !== -1) {
                carrito.products[productoIndex].quantity = nuevaCantidad;
            } else {
                carrito.products.push({ product: productoId, quantity: nuevaCantidad });
            }
            await carrito.save();
            return carrito;
        } catch (error) {
            console.error("Error al actualizar la cantidad del producto en el carrito:", error.message);
            throw error;
        }
    }

    async vaciarCarrito(carritoId) {
        try {
            const carrito = await Cart.findById(carritoId);
            if (!carrito) {
                throw new Error("Carrito no encontrado");
            }
            carrito.products = [];
            await carrito.save();
            return carrito;
        } catch (error) {
            console.error("Error al vaciar el carrito:", error.message);
            throw error;
        }
    }
}

module.exports = CartManager;
