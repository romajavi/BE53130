const User = require('../models/user.model');

const authSocketMiddleware = async (socket, next) => {
    const userEmail = decodeURIComponent(socket.handshake.headers.cookie.replace(/(?:(?:^|.*;\s*)userEmail\s*\=\s*([^;]*).*$)/, '$1'));
    console.log('Correo electrónico del usuario en la cookie (authSocketMiddleware):', userEmail);

    if (userEmail) {
        try {
            const user = await User.findOne({ email: userEmail });
            console.log('Usuario encontrado (authSocketMiddleware):', user);
            if (user) {
                socket.request.user = user;
                next();
            } else {
                console.log('Usuario no encontrado en la base de datos (authSocketMiddleware)');
                next(new Error('Usuario no autenticado'));
            }
        } catch (error) {
            console.error('Error al obtener el usuario (authSocketMiddleware):', error);
            next(new Error('Error al obtener el usuario'));
        }
    } else {
        console.log('No se encontró la cookie userEmail (authSocketMiddleware)');
        next(new Error('Usuario no autenticado'));
    }
};

module.exports = authSocketMiddleware;