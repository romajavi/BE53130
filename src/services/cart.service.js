const Cart = require('../models/cart');


class CartManager {
    async crearCarrito(userId) {
        try {
            const nuevoCarrito = new Cart({ user: userId, products: [] });
            await nuevoCarrito.save();
            return nuevoCarrito;
        } catch (error) {
            throw new Error("Error al crear el carrito: " + error.message);
        }
    }

    async getCarritoById(cartId, userId) {
        try {
            const carrito = await Cart.findOne({ _id: cartId, user: userId }).populate('products.product');
            return carrito;
        } catch (error) {
            throw new Error("Error al obtener el carrito por ID: " + error.message);
        }
    }

    async agregarProductoAlCarrito(cartId, productId, quantity = 1) {
        try {
            const carrito = await Cart.findById(cartId);
            if (!carrito) {
                throw new Error("Carrito no encontrado");
            }
            const productoIndex = carrito.products.findIndex(item => item.product.toString() === productId);
            if (productoIndex !== -1) {
                carrito.products[productoIndex].quantity += quantity;
            } else {
                carrito.products.push({ product: productId, quantity });
            }
            await carrito.save();
            return carrito;
        } catch (error) {
            throw new Error("Error al agregar producto al carrito: " + error.message);
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

    async finalizarCompra(cartId, userEmail) {
        try {
            const carrito = await Cart.findOne({ _id: cartId, user: userEmail }).populate('products.product');
            if (!carrito) {
                throw new Error("Carrito no encontrado");
            }

            const unprocessedProducts = [];
            let totalAmount = 0;

            for (const item of carrito.products) {
                const product = await Product.findById(item.product._id);
                if (product.stock >= item.quantity) {
                    product.stock -= item.quantity;
                    await product.save();
                    totalAmount += item.product.price * item.quantity;
                } else {
                    unprocessedProducts.push(item.product._id);
                }
            }

            const ticket = await ticketService.createTicket({
                amount: totalAmount,
                purchaser: userEmail,
            });

            carrito.products = carrito.products.filter(item => unprocessedProducts.includes(item.product._id));
            await carrito.save();

            return { ticket, unprocessedProducts };
        } catch (error) {
            throw new Error("Error al finalizar la compra: " + error.message);
        }
    }



}

module.exports = CartManager;
