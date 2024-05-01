const Cart = require("../models/cart");

class CartManager {
  async cargarCarritos() {
    try {
      this.carts = await Cart.find();
    } catch (error) {
      console.log("Error al cargar los carritos: ", error);
      throw error;
    }
  }

  async crearCarrito() {
    try {
      const nuevoCarrito = new Cart({ products: [] });
      await nuevoCarrito.save();
      return nuevoCarrito;
    } catch (error) {
      console.log("Error al crear el carrito: ", error);
      throw error;
    }
  }

  async getCarritoById(carritoId) {
    try {
      return Cart.findById(carritoId).populate('products.product');
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
      carrito.products.push({ product: productoId, quantity });
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
        await carrito.save();
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
      // Verificar si nuevosProductos es un array
      if (!Array.isArray(nuevosProductos)) {
        throw new Error("Los nuevos productos deben ser un array");
      }
      // Verificar y formatear los nuevos productos
      const productosFormateados = nuevosProductos.map(item => ({
        product: item.product,
        quantity: item.quantity || 1
      }));
      carrito.products = productosFormateados;
      await carrito.save();
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
        await carrito.save();
        return carrito;
      } else {
        // Si el producto no existe en el carrito, agregarlo con la nueva cantidad
        const newProduct = {
          product: productoId,
          quantity: nuevaCantidad
        };
        carrito.products.push(newProduct);
        await carrito.save();
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
      await carrito.save();
      return carrito;
    } catch (error) {
      console.log("Error al vaciar el carrito: ", error);
      throw error;
    }
  }
}

module.exports = CartManager;