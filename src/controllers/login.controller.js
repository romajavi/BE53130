const User = require("../models/user.model");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el usuario existe en la base de datos
    const user = await User.findOne({ email }).lean();

    if (email === 'adminCoder@coder.com' && password === 'adminCod3r123') {
      // Usuario administrador
      req.session.user = {
        email: 'adminCoder@coder.com',
        role: 'admin',
      };
      return res.redirect('/products');
    }

    if (!user || user.password !== password) {
      return res.status(401).render('login', { error: 'Email o contraseña incorrectos.' });
    }

    // Guardar el usuario en la sesión
    req.session.user = user;
    console.log('Usuario autenticado:', req.session.user);

    res.redirect('/products');
  } catch (error) {
    if (error.name === 'MongooseTimeoutError') {
      console.error("Error de tiempo de espera al iniciar sesión:", error);
      res.status(500).render('login', { error: 'El servidor está tardando demasiado en responder. Por favor, intenta nuevamente más tarde.' });
    } else {
      console.error("Error al iniciar sesión:", error);
      res.status(500).render('login', { error: 'Error al iniciar sesión.' });
    }
  }
};

module.exports = { loginUser };