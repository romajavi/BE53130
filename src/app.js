const express = require('express');
const { engine } = require('express-handlebars');
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const exphbs = require("express-handlebars");
const path = require("path");

// Importar el archivo database.js
const { client } = require('./database.js');

// Importación de las rutas
const productsRouter = require("./routes/products.router.js");
const cartsRouter = require("./routes/carts.router.js");
const viewsRouter = require("./routes/views.router.js");
const registerRouter = require("./routes/register.router.js");
const loginRouter = require("./routes/login.router.js");
const chatRouter = require("./routes/chat.router.js");

// Importación del controlador de chat
const chatController = require("./controllers/chat.controller");

// Importación del ProductManager
const ProductManager = require("./controllers/product-manager");
const productManager = new ProductManager();

// Importación de CartManager
const CartManager = require("./controllers/cart-manager");
const cartManager = new CartManager();

// Configuración de la conexión a MongoDB Atlas
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Conexión exitosa a MongoDB Atlas');
    // Aquí puedes realizar operaciones con la base de datos
  } catch (error) {
    console.error('Error al conectar a MongoDB Atlas:', error);
  }
}

connectToDatabase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// CHandlebars
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

// la conexión de socket.io
io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  socket.on('agregarProducto', async (producto) => {
    try {
      await productManager.addProduct(producto);
      const productos = await productManager.getProducts();
      io.emit('productos', productos.payload);
    } catch (error) {
      console.error('Error al agregar producto:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Un usuario se ha desconectado');
  });
});

// Puerto
const PUERTO = process.env.PORT || 8080;

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Servidor HTTP
http.listen(PUERTO, () => {
  console.log(`Servidor Express iniciado en el puerto: ${PUERTO}`);
});