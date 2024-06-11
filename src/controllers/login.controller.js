const bcrypt = require('bcrypt');
const User = require("../models/user.model");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Datos enviados:', { email, password });

    // usuario adminCoder
    if (email === 'adminCoder@coder.com' && password === 'adminCod3r123') {
      req.session.user = {
        email: 'adminCoder@coder.com',
        role: 'admin',
      };
      return res.redirect('/products');
    }


    const user = await User.findOne({ email: email }).exec();
    console.log('Usuario encontrado:', user);

    if (!user) {
      return res.status(401).render('login', { error: 'Email o contraseña incorrectos.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).render('login', { error: 'Email o contraseña incorrectos.' });
    }

    req.session.user = user;
    console.log('Usuario autenticado:', req.session.user);

    res.redirect('/products'); 
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).render('login', { error: 'Error al iniciar sesión.' });
  }
};

module.exports = { loginUser };



