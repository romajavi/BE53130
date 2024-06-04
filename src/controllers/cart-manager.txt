const Cart = require('../models/cart');
const { ObjectId } = require('mongodb');

class CartManager {
  async cargarCarritos() {
    try {
      this.carts = await client.db().collection('carts').find().toArray();
    } catch (error) {
      console.log("Error al cargar los carritos: ", error);
      throw error;
    }
  }

  async crearCarrito() {
    try {
      const nuevoCarrito = { products: [] };
      const carrito = await Cart.create(nuevoCarrito);
      return carrito;
    } catch (error) {
      console.log("Error al crear el carrito: ", error);
      throw error;
    }
  }

  async getCarritoById(carritoId) {
    try {
      return await Cart.findById(carritoId).lean();
    } catch (error) {
      console.log("Error al obtener el carrito por ID: ", error);
      throw error;
    }
  }

  async agregarProductoAlCarrito(carritoId, productoId, quantity = 1) {
    try {
      const carrito = await Cart.findById(carritoId);
      if (!carrito) {
        throw new Error("Carrito no encontrado");
      }
      const productoIndex = carrito.products.findIndex(item => item.product.toString() === productoId);
      if (productoIndex !== -1) {
        carrito.products[productoIndex].quantity += quantity;
      } else {
        carrito.products.push({ product: productoId, quantity });
      }
      await carrito.save();
      return carrito;
    } catch (error) {
      console.log("Error al agregar producto al carrito: ", error);
      throw error;
    }
  }

  async eliminarProductoDelCarrito(carritoId, productoId) {
    try {
      const carrito = await this.getCarritoById(carritoId);
      if (!carrito) {
        throw new Error("Carrito no encontrado");
      }

      const productoIndex = carrito.products.findIndex(item => item.product.toString() === productoId);
      if (productoIndex !== -1) {
        carrito.products.splice(productoIndex, 1);
        await client.db().collection('carts').updateOne({ _id: new ObjectId(carritoId) }, { $set: carrito });
        return carrito;
      } else {
        throw new Error("Producto no encontrado en el carrito");
      }
    } catch (error) {
      console.log("Error al eliminar producto del carrito: ", error);
      throw error;
    }
  }

  async actualizarCarrito(carritoId, nuevosProductos) {
    try {
      const carrito = await this.getCarritoById(carritoId);
      if (!carrito) {
        throw new Error("Carrito no encontrado");
      }

      if (!Array.isArray(nuevosProductos)) {
        throw new Error("Los nuevos productos deben ser un array");
      }

      const productosFormateados = nuevosProductos.map(item => ({
        product: item.product,
        quantity: item.quantity || 1
      }));
      carrito.products = productosFormateados;
      await client.db().collection('carts').updateOne({ _id: new ObjectId(carritoId) }, { $set: carrito });
      return carrito;
    } catch (error) {
      console.log("Error al actualizar el carrito: ", error);
      throw error;
    }
  }

  async actualizarCantidadDeProducto(carritoId, productoId, nuevaCantidad) {
    try {
      const carrito = await this.getCarritoById(carritoId);
      if (!carrito) {
        throw new Error("Carrito no encontrado");
      }

      const productoIndex = carrito.products.findIndex(item => item.product.toString() === productoId);
      if (productoIndex !== -1) {
        carrito.products[productoIndex].quantity = nuevaCantidad;
        await client.db().collection('carts').updateOne({ _id: new ObjectId(carritoId) }, { $set: carrito });
        return carrito;
      } else {

        const newProduct = {
          product: productoId,
          quantity: nuevaCantidad
        };
        carrito.products.push(newProduct);
        await client.db().collection('carts').updateOne({ _id: new ObjectId(carritoId) }, { $set: carrito });
        return carrito;
      }
    } catch (error) {
      console.log("Error al actualizar la cantidad del producto en el carrito: ", error);
      throw error;
    }
  }
  
  async vaciarCarrito(carritoId) {
    try {
      const carrito = await this.getCarritoById(carritoId);
      if (!carrito) {
        throw new Error("Carrito no encontrado");
      }
      carrito.products = [];
      await client.db().collection('carts').updateOne({ _id: new ObjectId(carritoId) }, { $set: carrito });
      return carrito;
    } catch (error) {
      console.log("Error al vaciar el carrito: ", error);
      throw error;
    }
  }
}

module.exports = CartManager;