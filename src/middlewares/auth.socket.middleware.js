const User = require('../models/user.model');

const authSocketMiddleware = async (socket, next) => {
    const user = socket.handshake.session.user;
    console.log("Usuario en sesión de socket:", user);

    if (user && user._id) {
        try {
            const dbUser = await User.findById(user._id);
            if (dbUser) {
                console.log("Usuario autenticado en socket:", dbUser.first_name);
                socket.request.user = dbUser;
                next();
            } else {
                console.log("Usuario no encontrado en la base de datos");
                next(new Error('Usuario no encontrado'));
            }
        } catch (error) {
            console.error('Error al obtener el usuario:', error);
            next(new Error('Error de autenticación'));
        }
    } else {
        console.log("Usuario no autenticado en socket");
        next(new Error('No autorizado'));
    }
};

module.exports = authSocketMiddleware;
