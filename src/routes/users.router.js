const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

// Nueva ruta GET para obtener todos los usuarios
router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, 'first_name email role');
        res.json(users);
    } catch (error) {
        logger.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

router.put('/premium/:uid', authMiddleware, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        user.role = user.role === 'user' ? 'premium' : 'user';
        await user.save();

        res.json({ message: 'Rol de usuario actualizado', newRole: user.role });
    } catch (error) {
        logger.error('Error al actualizar el rol del usuario:', error);
        res.status(500).json({ message: 'Error al actualizar el rol del usuario' });
    }
});

// Mover la ruta para eliminar usuarios inactivos antes de la ruta con parámetro
router.delete('/inactive', authMiddleware, isAdmin, async (req, res) => {
    try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const inactiveUsers = await User.find({ last_connection: { $lt: thirtyMinutesAgo } });

        if (inactiveUsers.length === 0) {
            return res.json({ message: 'No hay usuarios inactivos para eliminar' });
        }

        for (const user of inactiveUsers) {
            await User.findByIdAndDelete(user._id);
            await sendInactivityEmail(user.email);
        }

        res.json({ message: `${inactiveUsers.length} usuarios inactivos eliminados` });
    } catch (error) {
        logger.error('Error al eliminar usuarios inactivos:', error);
        res.status(500).json({ message: 'Error al eliminar usuarios inactivos' });
    }
});


// ruta para eliminar usuario desde el admin
router.delete('/:uid', authMiddleware, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.uid);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        logger.error('Error al eliminar el usuario:', error);
        res.status(500).json({ message: 'Error al eliminar el usuario' });
    }
});

const sendInactivityEmail = async (email) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: config.EMAIL_USER,
        to: email,
        subject: 'Cuenta eliminada por inactividad',
        html: `
            <h1>Tu cuenta ha sido eliminada</h1>
            <p>Estimado usuario,</p>
            <p>Lamentamos informarte que tu cuenta ha sido eliminada debido a inactividad. No has iniciado sesión en los últimos 30 minutos.</p>
            <p>Si crees que esto es un error o deseas volver a crear una cuenta, por favor visita nuestro sitio web.</p>
            <p>Gracias por tu comprensión.</p>
            <p>Atentamente,</p>
            <p>El equipo de PetXpress</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Correo de eliminación por inactividad enviado a ${email}`);
    } catch (error) {
        logger.error('Error al enviar correo de eliminación por inactividad:', error);
    }
};

module.exports = router;