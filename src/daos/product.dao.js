const Cart = require('../models/cart');
const Product = require('../models/product');

const create = async (productData) => {
    const product = new Product(productData);
    return await product.save();
};

const getAll = async () => {
    return await Product.find({});
};

const getById = async (id) => {
    return await Product.findById(id);
};

const updateById = async (id, updateData) => {
    return await Product.findByIdAndUpdate(id, updateData, { new: true });
};

const deleteById = async (id) => {
    return await Product.findByIdAndDelete(id);
};

module.exports = {
    create,
    getAll,
    getById,
    updateById,
    deleteById
};