const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('./logger');

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

const sendPurchaseConfirmationEmail = async (email, ticket, totalAmount) => {
    const mailOptions = {
        from: config.EMAIL_USER,
        to: email,
        subject: 'Confirmación de compra',
        html: `
      <h1>Gracias por tu compra</h1>
      <p>Tu ticket de compra: ${ticket.code}</p>
      <p>Monto total: $${totalAmount.toFixed(2)}</p>
      <p>Fecha de compra: ${ticket.purchase_datetime}</p>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info('Correo de confirmación enviado');
    } catch (error) {
        logger.error('Error al enviar correo de confirmación:', error);
    }
};

const sendPasswordResetEmail = async (email, resetUrl) => {
    const mailOptions = {
        from: config.EMAIL_USER,
        to: email,
        subject: 'Restablecimiento de Contraseña',
        html: `
            <h1>Restablecimiento de Contraseña</h1>
            <p>Has solicitado restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente enlace para continuar:</p>
            <a href="${resetUrl}">Restablecer Contraseña</a>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info('Correo de restablecimiento de contraseña enviado');
    } catch (error) {
        logger.error('Error al enviar correo de restablecimiento de contraseña:', error);
        throw error;
    }
};

module.exports = { sendPurchaseConfirmationEmail, sendPasswordResetEmail };