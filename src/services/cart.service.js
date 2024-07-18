const Cart = require('../models/cart');
const cartDao = require('../daos/cart.dao');
const ticketService = require('./ticket.service');
const User = require('../models/user.model');
const Product = require('../models/product');
const { sendPurchaseConfirmationEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

class CartManager {
    async getOrCreateCart(userId) {
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, products: [] });
            await cart.save();
        }
        return cart;
    }

    async addProductToCart(userId, productId, quantity) {
        const cart = await this.getOrCreateCart(userId);
        const user = await User.findById(userId);
        const product = await Product.findById(productId);

        if (user.role === 'premium' && product.owner === user.email) {
            throw new Error('No puedes agregar tu propio producto al carrito');
        }

        const productIndex = cart.products.findIndex(item => item.product.toString() === productId);
        if (productIndex !== -1) {
            cart.products[productIndex].quantity += parseInt(quantity);
        } else {
            cart.products.push({ product: productId, quantity: parseInt(quantity) });
        }

        await cart.save();
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
            const cart = await Cart.findOne({ _id: cartId, user: userId }).populate({
                path: 'products.product',
                select: 'title description price img code stock category status owner'
            });
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
            return cart;
        } catch (error) {
            logger.error('Error al obtener el carrito por ID:', error);
            throw error;
        }
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

    async processPurchase(cartId, userId) {
        const cart = await Cart.findById(cartId).populate('products.product');
        if (!cart) {
            throw new Error('Carrito no encontrado');
        }

        let totalAmount = 0;
        const failedProducts = [];
        const successfulProducts = [];

        for (const item of cart.products) {
            const product = item.product;
            if (product.stock >= item.quantity) {
                product.stock -= item.quantity;
                await product.save();
                totalAmount += product.price * item.quantity;
                successfulProducts.push(item);
            } else {
                failedProducts.push({
                    product: item.product._id,
                    quantity: item.quantity,
                    availableStock: product.stock
                });
            }
        }

        if (successfulProducts.length > 0) {
            const ticket = await ticketService.createTicket({
                amount: totalAmount,
                purchaser: userId
            });

            // Actualizar el carrito con los productos fallidos
            cart.products = failedProducts.map(item => ({
                product: item.product,
                quantity: item.quantity - item.availableStock
            }));
            await cart.save();

            const user = await User.findById(userId);
            await sendPurchaseConfirmationEmail(user.email, ticket, totalAmount);

            return {
                success: true,
                ticket,
                failedProducts
            };
        } else {
            return {
                success: false,
                failedProducts
            };
        }
    }
}

module.exports = CartManager;