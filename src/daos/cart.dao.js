const Cart = require('../models/cart');
const Product = require('../models/product');

const create = async () => {
    const cart = new Cart();
    return await cart.save();
};

const getById = async (cartId, userId) => {
    try {
        let cart;
        if (cartId) {
            cart = await Cart.findOne({ _id: cartId, user: userId }).populate('products.product');
        } else {
            cart = await Cart.findOne({ user: userId }).populate('products.product');
        }
        if (!cart) {
            return null; // Retornar null si no se encuentra el carrito
        }
        return cart;
    } catch (error) {
        throw new Error(`Error al obtener el carrito: ${error.message}`);
    }
};

const getByUserId = async (userId) => {
    try {
        const cart = await Cart.findOne({ user: userId }).populate('products.product');
        return cart;
    } catch (error) {
        throw new Error(`Error al obtener el carrito por userId: ${error.message}`);
    }
};

const addProduct = async (cartId, productId) => {
    const cart = await Cart.findById(cartId);
    cart.products.push({ product: productId });
    return await cart.save();
};

const removeProduct = async (cartId, productId) => {
    const cart = await Cart.findById(cartId);
    cart.products = cart.products.filter(p => p.product.toString() !== productId);
    return await cart.save();
};

const updateById = async (id, updateData) => {
    return await Cart.findByIdAndUpdate(id, updateData, { new: true });
};

const updateProductQuantity = async (cartId, productId, quantity) => {
    const cart = await Cart.findById(cartId);
    const product = cart.products.find(p => p.product.toString() === productId);
    if (product) {
        product.quantity = quantity;
        return await cart.save();
    }
    throw new Error('Product not found in cart');
};

const emptyCart = async (cartId) => {
    const cart = await Cart.findById(cartId);
    cart.products = [];
    return await cart.save();
};

module.exports = {
    create,
    getById,
    getByUserId,
    addProduct,
    removeProduct,
    updateById,
    updateProductQuantity,
    emptyCart
};