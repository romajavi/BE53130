const Product = require('../models/product');
const { ObjectId } = require('mongodb');

class ProductManager {
    async addProduct({ title, description, price, img, code, stock, category, status = true }) {
        try {
            console.log("Intentando agregar producto:", { title, description, price, img, code, stock, category, status });
            const newProduct = new Product({
                title,
                description,
                price,
                img,
                code,
                stock,
                category,
                status
            });
            await newProduct.save();
            console.log('Producto agregado correctamente:', newProduct);
            return { status: 'success', message: 'Producto agregado correctamente', product: newProduct };
        } catch (error) {
            console.error('Error al agregar producto:', error.message);
            return { status: 'error', message: 'Error al agregar producto', error: error.message };
        }
    }

    async getProducts(limit = 10, page = 1, sort, query) {
        try {
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sort === 'desc' ? { price: -1 } : sort === 'asc' ? { price: 1 } : undefined,
                lean: true
            };
    
            let queryFilter = {};
            if (query) {
                queryFilter = {
                    $or: [
                        { category: { $regex: query, $options: 'i' } },
                        { status: query === 'true' },
                    ],
                };
            }
    
            const result = await Product.paginate(queryFilter, options);
    
            const response = {
                status: 'success',
                payload: result.docs,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
            };
    
            return response;
        } catch (error) {
            console.error('Error al obtener los productos:', error);
            throw new Error('Error al obtener los productos');
        }
    }

    async getProductById(id) {
        try {
            const product = await Product.findById(id).lean();
            if (!product) {
                console.log('Producto no encontrado');
                return null;
            }
            console.log('Producto obtenido por ID:', product);
            return product;
        } catch (error) {
            console.error('Error al obtener producto por ID:', error.message);
            throw error;
        }
    }

    async updateProduct(id, updatedProduct) {
        try {
            const product = await Product.findByIdAndUpdate(id, updatedProduct, { new: true }).lean();
            if (!product) {
                console.log('Producto no encontrado');
                return null;
            }
            console.log('Producto actualizado correctamente');
            return product;
        } catch (error) {
            console.error('Error al actualizar producto:', error.message);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const product = await Product.findByIdAndDelete(id).lean();
            if (!product) {
                console.log('Producto no encontrado');
                return null;
            }
            console.log('Producto eliminado correctamente');
            return product;
        } catch (error) {
            console.error('Error al eliminar producto:', error.message);
            throw error;
        }
    }
}

module.exports = ProductManager;