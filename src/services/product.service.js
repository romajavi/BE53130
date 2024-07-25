const Product = require('../models/product');
const productDao = require('../daos/product.dao');
const logger = require('../utils/logger');

class ProductManager {
    async addProduct({ title, description, price, img, code, stock, category, status = true, user }) {
        try {
            console.log('Intentando agregar producto con user:', user);
            if (!user) {
                throw new Error('Usuario no autenticado');
            }
            const newProduct = new Product({
                title,
                description,
                price,
                img,
                code,
                stock,
                category,
                status,
                owner: user.role === 'admin' ? 'admin' : user.email
            });
            console.log('Nuevo producto antes de guardar:', newProduct);
            await newProduct.save();
            console.log('Producto guardado exitosamente');
            return newProduct;
        } catch (error) {
            console.error('Error en addProduct:', error);
            logger.error('Error al agregar producto:', error.message);
            throw new Error('Error al agregar producto: ' + error.message);
        }
    }

    async getProducts(limit = 10, page = 1, sort, query) {
        try {
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sort === 'desc' ? { price: -1 } : sort === 'asc' ? { price: 1 } : undefined,
                lean: true,
                select: 'title description price img code stock category status owner'
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

            return {
                status: 'success',
                payload: result.docs,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                totalDocs: result.totalDocs
            };
        } catch (error) {
            logger.error('Error al obtener los productos:', error);
            throw new Error('Error al obtener los productos');
        }
    }

    async getProductById(id) {
        try {
            const product = await Product.findById(id).lean();
            if (!product) {
                logger.warn('Producto no encontrado');
                return null;
            }
            logger.debug('Producto obtenido por ID:', product);
            return product;
        } catch (error) {
            logger.error('Error al obtener producto por ID:', error.message);
            throw error;
        }
    }

    async updateProduct(id, updatedProduct) {
        try {
            const product = await Product.findByIdAndUpdate(id, updatedProduct, { new: true, runValidators: true }).lean();
            if (!product) {
                logger.warn('Producto no encontrado');
                return null;
            }
            logger.info('Producto actualizado correctamente');
            return product;
        } catch (error) {
            logger.error('Error al actualizar producto:', error.message);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const product = await Product.findByIdAndDelete(id).lean();
            if (!product) {
                logger.warn('Producto no encontrado');
                return null;
            }
            logger.info('Producto eliminado correctamente');
            return product;
        } catch (error) {
            logger.error('Error al eliminar producto:', error.message);
            throw error;
        }
    }
}

module.exports = ProductManager;