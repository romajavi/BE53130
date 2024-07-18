const User = require('../models/user.model');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendPasswordResetEmail } = require('../utils/mailer');
const logger = require('../utils/logger');

exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            logger.warn(`Intento de restablecimiento de contraseña para usuario no existente: ${email}`);
            return res.status(404).render('forgot-password', { error: 'Usuario no encontrado' });
        }
        
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiration = Date.now() + 3600000; // 1 hora

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiration;
        await user.save();

        const resetUrl = `http://${req.headers.host}/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.email, resetUrl);

        logger.info(`Correo de restablecimiento enviado a: ${email}`);
        res.render('forgot-password', { message: 'Se ha enviado un correo para restablecer la contraseña' });
    } catch (error) {
        logger.error('Error al solicitar restablecimiento de contraseña:', error);
        res.status(500).render('forgot-password', { error: 'Error al solicitar el restablecimiento de contraseña' });
    }
};

exports.renderResetPasswordForm = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            logger.warn(`Intento de uso de token de restablecimiento expirado o inválido: ${token}`);
            return res.render('reset-password-expired');
        }

        res.render('reset-password', { token });
    } catch (error) {
        logger.error('Error al renderizar formulario de restablecimiento:', error);
        res.status(500).render('error', { message: 'Error al procesar la solicitud' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            logger.warn(`Intento de restablecimiento de contraseña con token inválido: ${token}`);
            return res.render('reset-password-expired');
        }

        logger.debug(`Comparando nueva contraseña con la anterior para el usuario: ${user.email}`);
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            logger.warn(`Intento de restablecimiento con la misma contraseña: ${user.email}`);
            return res.status(400).render('reset-password', { 
                token, 
                error: 'La nueva contraseña no puede ser igual a la anterior' 
            });
        }

        logger.debug(`Hasheando nueva contraseña para el usuario: ${user.email}`);
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        logger.info(`Contraseña restablecida exitosamente para el usuario: ${user.email}`);
        res.render('login', { message: 'Contraseña restablecida exitosamente. Por favor, inicia sesión.' });
    } catch (error) {
        logger.error('Error al restablecer la contraseña:', error);
        res.status(500).render('reset-password', { 
            token: req.params.token, 
            error: 'Error al restablecer la contraseña' 
        });
    }
};