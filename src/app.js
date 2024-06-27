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

// importación de las rutas
const productsRouter = require("./routes/products.router.js");
const cartsRouter = require("./routes/carts.router.js");
const viewsRouter = require("./routes/views.router.js");
const registerRouter = require("./routes/register.router.js");
const loginRouter = require("./routes/login.router.js");
const chatRouter = require("./routes/chat.router.js");
const ordersRouter = require('./routes/orders.router');

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

// Inici. Passport.js
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GitHubStrategy({
  clientID: "Ov23li5icwdaAon1zX0A",
  clientSecret: "026522e557223f62c8d94ae57b27135f7315a4ca",
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
    console.error('Error en la estrategia de autenticación de GitHub:', error);
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
    console.log('Recibida petición POST a /login');
    console.log('req.body:', req.body);
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

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  //para chat
  socket.on('chatMessage', async (msg) => {
    console.log('Mensaje recibido:', msg); // dep
    try {
      const { userId, message } = msg;
      if (!userId) {
        throw new Error('UserId no proporcionado');
      }
      console.log('Buscando usuario con ID:', userId); // dep
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      console.log('Usuario encontrado:', user); // dep
      const savedMessage = await Message.create({
        user: user._id,
        message: message
      });
      const populatedMessage = await Message.findById(savedMessage._id).populate('user', 'first_name');
      io.emit('message', {
        user: populatedMessage.user.first_name,
        message: populatedMessage.message
      });
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);
    }
  });

  socket.on('getMessages', async () => {
    try {
      const messages = await Message.find().populate('user', 'first_name').sort({ timestamp: 1 });
      socket.emit('loadMessages', messages);
    } catch (error) {
      console.error('Error al obtener los mensajes:', error);
    }
  });


  //para productos en tiempo real
  socket.on('getProducts', async () => {
    try {
        const result = await productManager.getProducts(0);
        socket.emit('products', result.payload);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        socket.emit('products', []);
    }
});

socket.on('addProduct', async (product) => {
    try {
        await productManager.addProduct(product);
        const updatedResult = await productManager.getProducts(0);
        io.emit('products', updatedResult.payload);
    } catch (error) {
        console.error('Error al agregar producto:', error);
    }
});

socket.on('updateProduct', async ({ id, ...productData }) => {
    try {
        await productManager.updateProduct(id, productData);
        const updatedResult = await productManager.getProducts(0);
        io.emit('products', updatedResult.payload);
    } catch (error) {
        console.error('Error al actualizar producto:', error);
    }
});

socket.on('deleteProduct', async (productId) => {
    try {
        await productManager.deleteProduct(productId);
        const updatedResult = await productManager.getProducts(0);
        io.emit('products', updatedResult.payload);
    } catch (error) {
        console.error('Error al eliminar producto:', error);
    }
});

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ error: message });
});

// milddeware errores
app.use(errorHandler);

// Puerto
const PORT = config.PORT;
const db = require('./database');

db.once('open', () => {
  http.listen(PORT, () => {
    console.log(`Servidor Express iniciado en el puerto: ${PORT}`);
  });
});

module.exports = app;