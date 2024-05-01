const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

//  esquema del producto
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  img: String,
  code: { type: String, required: true, unique: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  status: { type: Boolean, default: true },
  thumbnails: [String]
});

productSchema.plugin(mongoosePaginate);

// modelo Product a partir del esquema
const Product = mongoose.model('Product', productSchema);

class ProductManager {
  async addProduct({ title, description, price, img, code, stock, category, thumbnails }) {
    try {
      const newProduct = new Product({
        title,
        description,
        price,
        img,
        code,
        stock,
        category,
        thumbnails
      });
      await newProduct.save();
      console.log('Producto agregado correctamente');
      return newProduct;
    } catch (error) {
      console.error('Error al agregar producto:', error.message);
      throw error;
    }
  }

  async getProducts(limit = 10, page = 1, sort, query) {
    try {
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sort === 'desc' ? { price: -1 } : sort === 'asc' ? { price: 1 } : undefined,
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
        prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}&limit=${limit}&sort=${sort}&query=${query}` : null,
        nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}&limit=${limit}&sort=${sort}&query=${query}` : null,
      };
  
      return response;
    } catch (error) {
      console.error('Error al obtener los productos:', error);
      throw new Error('Error al obtener los productos');
    }
  }

  async getProductById(id) {
    try {
      const product = await Product.findById(id);
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
      const product = await Product.findByIdAndUpdate(id, updatedProduct, { new: true });
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
      const product = await Product.findByIdAndDelete(id);
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