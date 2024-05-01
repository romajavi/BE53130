const express = require('express');
const { engine } = require('express-handlebars');
const mongoose = require("mongoose");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const exphbs = require("express-handlebars");
const path = require("path");

// Importacion de las rutas
const productsRouter = require("./routes/products.router.js");
const cartsRouter = require("./routes/carts.router.js");
const viewsRouter = require("./routes/views.router.js");
const registerRouter = require("./routes/register.router.js");
const loginRouter = require("./routes/login.router.js");
const chatRouter = require("./routes/chat.router.js");

// Importacion del controlador de chat
const chatController = require("./controllers/chat.controller");

// Importacion del ProductManager
const ProductManager = require("./controllers/product-manager");
const productManager = new ProductManager();

// Importacion de CartManager
const CartManager = require("./controllers/cart-manager");
const cartManager = new CartManager();

// Configuración de Mongoose y conexion a la base de datos
mongoose
  .connect("mongodb://localhost:27017/proyecto", {})
  .then(() => console.log("Conexión a MongoDB establecida"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuracion para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuramos Handlebars
app.engine('handlebars', engine({
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));
app.set('view engine', 'handlebars');
app.set('views', './src/views');

// Rutas
app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/chat", chatRouter);
app.use("/", viewsRouter);

// Configuramos la conexión de socket.io
io.on('connection', (socket) => {
  console.log('Un cliente conectado');

  // Para enviar la lista de productos al cliente cuando se establece la conexión
  productManager.getProducts()
    .then((productos) => {
      socket.emit('productos', productos.payload);
    })
    .catch((error) => {
      console.error('Error al obtener productos:', error.message);
    });

  // Para Manejar el evento de mensaje enviado por el cliente
  socket.on('message', async (data) => {
    console.log('Mensaje recibido:', data)
        await chatController.sendMessage(data);
    io.emit('message', data);
  });

  // Para Manejar el evento de agregar producto
  socket.on('agregarProducto', async (producto) => {
    try {
      const productos = await productManager.getProducts();
      io.emit('productos', productos.payload);
    } catch (error) {
      console.error('Error al agregar producto:', error.message);
    }
  });

  // Para Manejar el evento de eliminar producto
  socket.on('eliminarProducto', async (productId) => {
    try {
      await productManager.deleteProduct(productId);
      const productos = await productManager.getProducts();
      io.emit('productos', productos.payload);
    } catch (error) {
      console.error('Error al eliminar producto:', error.message);
    }
  });
});

// puerto
const PUERTO = process.env.PORT || 8080;

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// servidor HTTP
http.listen(PUERTO, () => {
  console.log(`Servidor Express iniciado en el puerto: ${PUERTO}`);
  console.log("Rutas registradas correctamente:");
  app._router.stack.forEach((route) => {
    if (route.route && route.route.path) {
      console.log(route.route.path);
    }
  });
});