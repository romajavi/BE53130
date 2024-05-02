const { client } = require("../database");

const registerUser = async (req, res) => {
  try {
    console.log('Solicitud de registro recibida:', req.body);
    const { username, email, password, age } = req.body;

    // Verificación por si falta algún campo requerido
    if (!username || !email || !password || !age) {
      return res.status(400).json({ message: "Todos los campos son requeridos." });
    }

    // Verificación si el email ya está en uso
    const existingUser = await client.db().collection('users').findOne({ email });
    console.log('Usuario existente:', existingUser);

    if (existingUser) {
      return res.status(400).json({ message: "El email ya está en uso." });
    }

    // Crear un nuevo usuario
    const newUser = { username, email, password, age };
    await client.db().collection('users').insertOne(newUser);

    console.log('Nuevo usuario creado:', newUser);

    // Redirigir al usuario a la página de inicio de sesión
    res.redirect('/login');
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ message: "Error al registrar usuario." });
  }
};

module.exports = { registerUser };