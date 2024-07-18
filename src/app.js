const express = require('express');
const { engine } = require('express-handlebars');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require("http").Server(app);
const socketIo = require('socket.io');
const io = socketIo(http);
const path = require("path");
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const config = require('./config/config');
const ProductManager = require('./services/product.service.js');
const productManager = new ProductManager();
const Message = require('./models/message.model');
const User = require('./models/user.model');
const bcrypt = require('bcrypt');
const { authMiddleware, isUser, isAdmin } = require('./middlewares/auth.middleware');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const { sendMessage } = require('./controllers/chat.controller');
const { errorHandler } = require('./utils/errorHandler');

// logger y el middleware de logger
const logger = require('./utils/logger');
const loggerMiddleware = require('./middlewares/logger.middleware');

// importación de las rutas
const productsRouter = require("./routes/products.router.js");
const cartsRouter = require("./routes/carts.router.js");
const viewsRouter = require("./routes/views.router.js");
const registerRouter = require("./routes/register.router.js");
const loginRouter = require("./routes/login.router.js");
const chatRouter = require("./routes/chat.router.js");
const ordersRouter = require('./routes/orders.router');
const passwordRouter = require('./routes/password.router');
const usersRouter = require('./routes/users.router');

// Middleware de inicializacion de sesiones
const sessionMiddleware = session({
  store: MongoStore.create({
    mongoUrl: config.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60,
  }),
  secret: 'mi-secreto',
  resave: false,
  saveUninitialized: false,
});

app.use(sessionMiddleware);

// para agregar el middleware de logger
app.use(loggerMiddleware);

// Inicialización Passport.js
app.use(passport.initialize());
app.use(passport.session());

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

// Config. de rutas
app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para depurar peticiones POST a /login
app.use((req, res, next) => {
  res.locals.user = req.user; // Agrega el usuario a las variables locales de la respuesta
  next();
});

app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/login') {
    logger.debug('Recibida petición POST a /login');
    logger.debug('req.body:', req.body);
  }
  next();
});

// Handlebars con helpers
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
    }
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));
app.set('view engine', 'handlebars');
app.set('views', './src/views');

// rutas
app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/chat", authMiddleware, isUser, chatRouter);
app.use("/", viewsRouter);
app.use('/api/orders', ordersRouter);
app.use('/', passwordRouter);
app.use('/api/users', authMiddleware, usersRouter);


app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Error al cerrar sesión:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// endpoint para probar el logger
app.get('/test-logger', (req, res) => {
  logger.error('log de error');
  logger.warn('log de advertencia');
  logger.info('log de información');
  logger.http('log de HTTP');
  logger.debug('log de depuración');
  res.send('Prueba del logger completa. Revisar la consola y los archivos de log.');
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
  logger.info('Nuevo cliente conectado');

  // para chat
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

  // para productos en tiempo real
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

  socket.on('addProduct', async (product) => {
    try {
      const newProduct = await productManager.addProduct(product);
      const updatedResult = await productManager.getProducts(10, 1);
      io.emit('products', updatedResult);
      socket.emit('productAdded', newProduct);
    } catch (error) {
      logger.error('Error al agregar producto:', error);
      socket.emit('error', { message: 'Error al agregar producto' });
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

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error en el servidor:', err);
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ error: message });
});

// middleware errores
app.use(errorHandler);

// Puerto
const PORT = config.PORT;
const db = require('./database');

db.once('open', () => {
  http.listen(PORT, () => {
    logger.info(`Servidor Express iniciado en el puerto: ${PORT}`);
  });
});

module.exports = app;