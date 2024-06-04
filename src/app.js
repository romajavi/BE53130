const express = require('express');
const { engine } = require('express-handlebars');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const config = require('./config/config');

// Importación de las rutas
const productsRouter = require("./routes/products.router.js");
const cartsRouter = require("./routes/carts.router.js");
const viewsRouter = require("./routes/views.router.js");
const registerRouter = require("./routes/register.router.js");
const loginRouter = require("./routes/login.router.js");
const chatRouter = require("./routes/chat.router.js");

// Middleware para inicializar sesiones
app.use(session({
  store: MongoStore.create({
    mongoUrl: config.MONGODB_URI, // Usar la variable de entorno MONGODB_URI desde config.js
    ttl: 14 * 24 * 60 * 60, // 14 dias de duracion de sesion
  }),
  secret: 'mi-secreto',
  resave: false,
  saveUninitialized: false,
}));

// Inicialización de Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Config. Passport
passport.use(new GitHubStrategy({
  clientID: "Ov23li5icwdaAon1zX0A",
  clientSecret: "026522e557223f62c8d94ae57b27135f7315a4ca",
  callbackURL: "http://localhost:8080/login/github/callback"
}, (accessToken, refreshToken, profile, done) => {
  // No se realiza ninguna acción adicional, solo se llama a `done` con el perfil de GitHub
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Ruta para iniciar sesión con GitHub
app.get('/login/github', passport.authenticate('github'));

// Ruta de callback para la autenticación de GitHub
app.get('/login/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  req.session.user = {
    id: req.user.id,
    displayName: req.user.displayName || req.user.username,
    username: req.user.username,
    photos: req.user.photos,
    provider: 'github'
  };

  res.redirect('/products');
});

// Configuración de las rutas
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

// Rutas
app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/chat", chatRouter);
app.use("/", viewsRouter);

// Ruta para cerrar sesión
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// Configuración de la conexión de socket.io
io.on('connection', (socket) => {
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
    } catch (error) {
      console.error('Error al agregar producto:', error);
    }
  });

  socket.on('eliminarProducto', async (productoId) => {
    try {
      await productManager.deleteProduct(productoId);
      const productos = await productManager.getProducts();
      io.emit('productos', productos.payload);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Un usuario se ha desconectado');
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Puerto
const PORT = config.PORT;

// Servidor HTTP
http.listen(PORT, () => {
  console.log(`Servidor Express iniciado en el puerto: ${PORT}`);
});
