const User = require('../models/user.model');

const registerUser = async (req, res) => {
  try {
    console.log('Solicitud de registro recibida:', req.body);
    const { username, email, password, age } = req.body;

    // Verificacion por si si falta algún campo requerido
    if (!username || !email || !password || !age) {
      return res.status(400).json({ message: "Todos los campos son requeridos." });
    }

    // Verificacion  si el email ya está en uso
    const existingUser = await User.findOne({ email });
    console.log('Usuario existente:', existingUser);

    if (existingUser) {
      return res.status(400).json({ message: "El email ya está en uso." });
    }

    // Para Crar un nuevo usuario
    const newUser = new User({ username, email, password, age });
    await newUser.save();

    console.log('Nuevo usuario creado:', newUser);

    // Redirigir al usuario a la pag de inicio de sesión
    res.redirect('/login');
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ message: "Error al registrar usuario." });
  }
};

module.exports = { registerUser };