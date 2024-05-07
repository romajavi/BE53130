const express = require('express');
const { engine } = require('express-handlebars');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require("http").Server(app);
const io = require("socket.io")(http);
const exphbs = require("express-handlebars");
const path = require("path");
const mongoose = require('./database.js');
const authMiddleware = require('./middlewares/auth.middleware.js');

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
    await mongoose.connect(mongoose.connection.getClient().s.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conexión exitosa a MongoDB Atlas');
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

// Handlebars
app.engine('handlebars', engine({
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));
app.set('view engine', 'handlebars');
app.set('views', './src/views');

// Configuración de sesiones
app.use(session({
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://admin:1234@cluster0.rcj2pgu.mongodb.net/test?retryWrites=true&w=majority',
    ttl: 14 * 24 * 60 * 60, // 14 días de duración de la sesión
  }),
  secret: 'mi-secreto',
  resave: false,
  saveUninitialized: false,
}));

// Rutas
app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/chat", chatRouter);
app.use("/", viewsRouter);

// Ruta para cerrar sesión
app.get("/logout", (req, res) => {
  console.log('Cerrando sesión...');
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.clearCookie('connect.sid'); // Limpia la cookie de sesión
    console.log('Sesión cerrada exitosamente.');
    res.redirect('/login');
  });
});

// Configuración de la conexión de socket.io
io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  socket.on('getProducts', async () => {
    try {
      const productos = await productManager.getProducts(0); 
      socket.emit('productos', productos.payload);
    } catch (error) {
      console.error('Error al obtener los productos:', error);
    }
  });

  socket.on('agregarProducto', async (producto) => {
    try {
      await productManager.addProduct(producto);
      const productos = await productManager.getProducts();
      io.emit('productos', productos.payload);
      console.log('Producto agregado:', producto);
    } catch (error) {
      console.error('Error al agregar producto:', error);
    }
  });

  socket.on('eliminarProducto', async (productoId) => {
    try {
      await productManager.deleteProduct(productoId);
      const productos = await productManager.getProducts();
      io.emit('productos', productos.payload);
      console.log('Producto eliminado:', productoId);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
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