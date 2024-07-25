// Importaciones de módulos de terceros
const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const path = require("path");

// Inicialización de la aplicación
const app = express();

// Creación del servidor HTTP y Socket.io después de inicializar app
const http = require("http").Server(app);
const socketIo = require('socket.io');
const io = socketIo(http);

// Importaciones de módulos propios
const config = require('./config/config');
const ProductManager = require('./services/product.service.js');
const productManager = new ProductManager();
const Message = require('./models/message.model');
const User = require('./models/user.model');
const { authMiddleware, isUser, isAdmin } = require('./middlewares/auth.middleware');
const { sendMessage } = require('./controllers/chat.controller');
const { errorHandler } = require('./utils/errorHandler');
const logger = require('./utils/logger');
const loggerMiddleware = require('./middlewares/logger.middleware');
const swaggerDocs = require('./utils/swagger');

// Importaciones de rutas
const productsRouter = require("./routes/products.router.js");
const cartsRouter = require("./routes/carts.router.js");
const viewsRouter = require("./routes/views.router.js");
const registerRouter = require("./routes/register.router.js");
const loginRouter = require("./routes/login.router.js");
const chatRouter = require("./routes/chat.router.js");
const ordersRouter = require('./routes/orders.router');
const passwordRouter = require('./routes/password.router');
const usersRouter = require('./routes/users.router');

// Configuración de sesión
const sessionMiddleware = session({
  store: MongoStore.create({
    mongoUrl: config.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60,
  }),
  secret: 'mi-secreto',
  resave: false,
  saveUninitialized: false,
});

// Middleware de sesión y autenticación
app.use(sessionMiddleware);
app.use(loggerMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Configuración de estrategia de autenticación de GitHub
passport.use(new GitHubStrategy({
  clientID: config.GITHUB_CLIENT_ID,
  clientSecret: config.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:8080/login/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ githubId: profile.id });
    if (!user) {
      user = new User({
        githubId: profile.id,
        first_name: profile.displayName.split(' ')[0] || 'Usuario',
        email: profile.emails[0].value,
      });
      await user.save();
    }
    return done(null, user);
  } catch (error) {
    logger.error('Error en autenticación de GitHub:', error);
    return done(error);
  }
}));

// Serialización y deserialización de usuario
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Configuración de middleware
app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para usuario local
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Middleware de logging para login
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/login') {
    logger.debug('Recibida petición POST a /login');
    logger.debug('req.body:', req.body);
  }
  next();
});

// Configuración de Handlebars
app.engine('handlebars', engine({
  helpers: {
    formatDate: (date) => {
      return new Date(date).toLocaleString();
    },
    formatNumber: (number) => {
      return number.toFixed(2);
    },
    eq: function (a, b) {
      return a === b;
    },
    or: function () {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    },
    and: function () {
      return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
    }
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));

// Configuración de Swagger 
app.use('/api-docs', swaggerDocs.serve, swaggerDocs.setup);

// Configuración de vistas
app.set('view engine', 'handlebars');
app.set('views', './src/views');

// Configuración de rutas
app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/chat", authMiddleware, isUser, chatRouter);
app.use("/", viewsRouter);
app.use('/api/orders', ordersRouter);
app.use('/', passwordRouter);
app.use('/api/users', authMiddleware, usersRouter);

// Ruta de logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Error al cerrar sesión:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// Ruta de prueba de logger
app.get('/test-logger', (req, res) => {
  logger.error('log de error');
  logger.warn('log de advertencia');
  logger.info('log de información');
  logger.http('log de HTTP');
  logger.debug('log de depuración');
  res.send('Prueba del logger completa. Revisar la consola y los archivos de log.');
});

// Configuración de Socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.use((socket, next) => {
  if (socket.request.session && socket.request.session.user) {
    socket.user = socket.request.session.user;
    next();
  } else {
    next(new Error('Unauthorized'));
  }
});

// Manejo de eventos de Socket.io
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado. ID:', socket.id);
  console.log('Usuario autenticado:', socket.user);

  socket.on('getMessages', async () => {
    try {
      const messages = await Message.find().populate('user', 'first_name').sort({ timestamp: 1 });
      socket.emit('loadMessages', messages);
    } catch (error) {
      console.error('Error al obtener los mensajes:', error);
    }
  });

  socket.on('chatMessage', async (data) => {
    try {
      const user = await User.findById(data.userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      const message = new Message({
        user: user._id,
        message: data.message
      });
      await message.save();
      const populatedMessage = await Message.findById(message._id).populate('user', 'first_name');
      io.emit('message', populatedMessage);
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);
    }
  });

  socket.on('getProducts', async (params) => {
    try {
      const result = await productManager.getProducts(
        params.limit,
        params.page,
        params.sort,
        params.query
      );
      socket.emit('products', result);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      socket.emit('error', { message: 'Error al obtener productos' });
    }
  });

  socket.on('getProductDetails', async (productId) => {
    try {
      const product = await productManager.getProductById(productId);
      if (product) {
        socket.emit('productDetails', product);
      } else {
        socket.emit('error', { message: 'Producto no encontrado' });
      }
    } catch (error) {
      console.error('Error al obtener detalles del producto:', error);
      socket.emit('error', { message: 'Error al obtener detalles del producto' });
    }
  });

  socket.on('addProduct', async (product, callback) => {
    console.log('Solicitud para agregar producto recibida:', product);
    try {
      if (!socket.user) {
        throw new Error('Usuario no autenticado');
      }
      console.log('Usuario autenticado:', socket.user);
      const newProduct = await productManager.addProduct({ ...product, user: socket.user });
      console.log('Producto agregado:', newProduct);
      const updatedResult = await productManager.getProducts(10, 1);
      io.emit('products', updatedResult);
      socket.emit('productAdded', newProduct);
      if (callback) callback({ success: true, product: newProduct });
    } catch (error) {
      console.error('Error al agregar producto:', error);
      if (callback) callback({ success: false, error: error.message });
      socket.emit('error', { message: 'Error al agregar producto: ' + error.message });
    }
  });

  socket.on('updateProduct', async ({ id, ...productData }) => {
    try {
      await productManager.updateProduct(id, productData);
      const updatedResult = await productManager.getProducts(10, 1);
      io.emit('products', updatedResult);
      socket.emit('productUpdated');
    } catch (error) {
      logger.error('Error al actualizar producto:', error);
      socket.emit('error', { message: 'Error al actualizar producto' });
    }
  });

  socket.on('deleteProduct', async (productId) => {
    try {
      await productManager.deleteProduct(productId);
      const updatedResult = await productManager.getProducts(10, 1);
      io.emit('products', updatedResult);
      socket.emit('productDeleted');
    } catch (error) {
      logger.error('Error al eliminar producto:', error);
      socket.emit('error', { message: 'Error al eliminar producto' });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Cliente desconectado');
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en el servidor:', err);
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ error: message });
});

app.use(errorHandler);

// Inicialización del servidor
const PORT = config.PORT;
const db = require('./database');

db.once('open', () => {
  http.listen(PORT, () => {
    logger.info(`Servidor Express iniciado en el puerto: ${PORT}`);
  });
});

module.exports = app;