const User = require('../models/user.model');

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verificar si el usuario existe en la base de datos
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      // Si las credenciales son invalidas renderizar la vista de inicio de sesión con un mensaje de error
      return res.status(401).render('login', { error: 'Nombre de usuario o contraseña incorrectos.' });
    }

    // Si las credenciales son validas renderizar la vista de inicio de sesión exitoso
    res.render('login-exitoso', { username: user.username });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    // Si ocurre un error inesperado, renderizar la vista de inicio de sesión con un mensaje de error
    res.status(500).render('login', { error: 'Error al iniciar sesión.' });
  }
};

module.exports = { loginUser };