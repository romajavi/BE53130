const Product = require('../models/product');
const productDao = require('../daos/product.dao');
const logger = require('../utils/logger');



class ProductManager {
    async addProduct({ title, description, price, img, code, stock, category, status = true }) {
        try {
            logger.debug("Intentando agregar producto:", { title, description, price, img, code, stock, category, status });
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
            logger.info('Producto agregado correctamente:', newProduct);
            return { success: true, product: newProduct };
        } catch (error) {
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
                select: 'title description price img code stock category status' // Asegúrate de incluir 'img'
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
                console.log('Producto no encontrado');
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
                console.log('Producto no encontrado');
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