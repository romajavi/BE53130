const Product = require('../models/product');
const productDao = require('../daos/product.dao');


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
            return newProduct;
        } catch (error) {
            console.error('Error al agregar producto:', error.message);
            throw new Error('Error al agregar producto: ' + error.message);
        }
    }

    async getProducts(limit = 10, page = 1, sort, query) {
        try {
            const options = {
                page: parseInt(page),
                limit: limit === 0 ? undefined : parseInt(limit), // Si limit es 0, no aplicamos límite
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
    
            console.log('Opciones de consulta:', options);
            console.log('Filtro de consulta:', queryFilter);
    
            const result = await Product.paginate(queryFilter, options);
    
            console.log('Resultado de la consulta:', result);
    
            return {
                status: 'success',
                payload: result.docs,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
            };
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
            const product = await Product.findByIdAndUpdate(id, updatedProduct, { new: true, runValidators: true }).lean();
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