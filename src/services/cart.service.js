const Cart = require('../models/cart');
const cartDao = require('../daos/cart.dao');

class CartManager {
    async getOrCreateCart(userId) {
        let cart = await cartDao.getByUserId(userId);
        if (!cart) {
            cart = await this.createCart(userId);
        }
        return cart;
    }

    async createCart(userId) {
        try {
            const newCart = new Cart({ user: userId, products: [] });
            const cart = await newCart.save();
            return cart;
        } catch (error) {
            throw new Error("Error al crear el carrito: " + error.message);
        }
    }

    async getCartById(cartId, userId) {
        try {
            const cart = await cartDao.getById(cartId, userId);
            return cart;
        } catch (error) {
            throw error;
        }
    }

    async addProductToCart(cartId, productId, quantity) {
        const cart = await Cart.findById(cartId);
        if (!cart) {
            throw new Error('Carrito no encontrado');
        }

        const productIndex = cart.products.findIndex(item => item.product.toString() === productId);
        if (productIndex !== -1) {
            cart.products[productIndex].quantity += quantity;
        } else {
            cart.products.push({ product: productId, quantity });
        }

        return await cart.save();
    }
    async removeProductFromCart(cartId, productId) {
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error("Carrito no encontrado");
            }
            const productIndex = cart.products.findIndex(item => item.product.toString() === productId);
            if (productIndex !== -1) {
                cart.products.splice(productIndex, 1);
                await cart.save();
                return cart;
            } else {
                throw new Error("Producto no encontrado en el carrito");
            }
        } catch (error) {
            console.error("Error al eliminar producto del carrito:", error.message);
            throw error;
        }
    }

    async updateProductQuantity(cartId, productId, newQuantity, userId) {
        try {
            const cart = await this.getCartById(cartId, userId);
            if (!cart) {
                throw new Error("Carrito no encontrado");
            }
            const productIndex = cart.products.findIndex(item => item.product.toString() === productId);
            if (productIndex !== -1) {
                cart.products[productIndex].quantity = newQuantity;
            } else {
                cart.products.push({ product: productId, quantity: newQuantity });
            }
            await cart.save();
            return cart;
        } catch (error) {
            console.error("Error al actualizar la cantidad del producto en el carrito:", error.message);
            throw error;
        }
    }

    async emptyCart(cartId) {
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error("Carrito no encontrado");
            }
            cart.products = [];
            await cart.save();
            return cart;
        } catch (error) {
            console.error("Error al vaciar el carrito:", error.message);
            throw error;
        }
    }
}

module.exports = CartManager;