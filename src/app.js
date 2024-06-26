const express = require('express');
const { engine } = require('express-handlebars');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});
const path = require("path");
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const config = require('./config/config');
const ProductManager = require('./services/product.service.js');
const productManager = new ProductManager();
const Message = require('./models/message.model');
const User = require('./models/user.model');
const bcrypt = require('bcrypt');
const sharedsession = require("express-socket.io-session");
const { authMiddleware, isUser, isAdmin } = require('./middlewares/auth.middleware');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

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
io.use(sharedsession(sessionMiddleware, {
  autoSave: true
}));

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

// Handlebars
app.engine('handlebars', engine({
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
io.use((socket, next) => {
  if (socket.request.session && socket.request.session.passport && socket.request.session.passport.user) {
    User.findById(socket.request.session.passport.user)
      .then(user => {
        if (user) {
          socket.request.user = user;
          next();
        } else {
          next(new Error('User not found'));
        }
      })
      .catch(err => next(err));
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  if (socket.request.user) {
    console.log('Usuario conectado:', socket.request.user.first_name);
    const user = socket.request.user;

    socket.emit('userDetails', { firstName: user.first_name });

    // Productos
    socket.on('getProducts', async () => {
      try {
        const productos = await productManager.getProducts(0);
        socket.emit('productos', productos.payload);
      } catch (error) {
        console.error('Error al obtener productos:', error);
        socket.emit('error', { message: 'Error al obtener productos' });
      }
    });

    // Verifica si el usuario es admin antes de permitir operaciones de productos
    socket.on('agregarProducto', async (producto) => {
      if (user.role === 'admin') {
        try {
          console.log("Recibida solicitud para agregar producto:", producto);
          const result = await productManager.addProduct(producto);
          if (result.status === 'success') {
            socket.emit('productoAgregado', 'Producto agregado exitosamente');
            const productos = await productManager.getProducts();
            io.emit('productos', productos.payload);
          } else {
            socket.emit('error', result);
          }
        } catch (error) {
          console.error('Error al agregar producto:', error);
          socket.emit('error', { status: 'error', message: 'Error al agregar producto', error: error.message });
        }
      } else {
        socket.emit('error', { status: 'error', message: 'No tienes permiso para realizar esta acción' });
      }
    });

    socket.on('eliminarProducto', async (productoId) => {
      if (user.role === 'admin') {
        try {
          await productManager.deleteProduct(productoId);
          socket.emit('productoEliminado', 'Producto eliminado exitosamente');
          const productos = await productManager.getProducts(0);
          io.emit('productos', productos.payload);
        } catch (error) {
          console.error('Error al eliminar producto:', error);
          socket.emit('error', { status: 'error', message: 'Error al eliminar producto', error: error.message });
        }
      } else {
        socket.emit('error', { status: 'error', message: 'No tienes permiso para realizar esta acción' });
      }
    });

    // Chat
    socket.on('getMessages', async () => {
      try {
        const messages = await Message.find().populate('user', 'first_name').lean();
        socket.emit('messageHistory', messages);
      } catch (error) {
        console.error('Error al obtener los mensajes:', error);
        socket.emit('error', { message: 'Error al obtener los mensajes' });
      }
    });

    socket.on('message', async (data) => {
      try {
        const newMessage = new Message({
          user: user._id,
          message: data.message,
        });
        await newMessage.save();
    
        const populatedMessage = await Message.findById(newMessage._id).populate('user', 'first_name');
        io.emit('message', { user: populatedMessage.user.first_name, message: data.message });
      } catch (error) {
        console.error('Error al guardar el mensaje:', error);
        socket.emit('error', { message: 'Error al guardar el mensaje' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Un usuario se ha desconectado');
    });
  } else {
    console.log('Conexión no autenticada');
    socket.disconnect(true);
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ error: message });
});

// Puerto
const PORT = config.PORT;
const db = require('./database');

db.once('open', () => {
  http.listen(PORT, () => {
    console.log(`Servidor Express iniciado en el puerto: ${PORT}`);
  });
});

module.exports = app;