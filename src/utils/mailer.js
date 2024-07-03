const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');


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

module.exports = { sendPurchaseConfirmationEmail };