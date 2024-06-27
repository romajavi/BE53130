const Message = require('../models/message.model');

exports.renderChat = async (req, res) => {
    try {
        const messages = await Message.find().populate('user', 'first_name').lean();
        res.render('chat', { messages, user: req.user });
    } catch (error) {
        console.error('Error al obtener los mensajes:', error);
        res.status(500).render('error', { error: 'Error al cargar el chat' });
    }
};

const sendMessage = async (data) => {
    try {
        const message = new Message({
            user: data.userId,
            message: data.message,
            timestamp: new Date(),
        });
        await message.save();
        return message;
    } catch (error) {
        console.error('Error al guardar el mensaje en la base de datos:', error);
        throw error;
    }
};

module.exports = {
    sendMessage,
};