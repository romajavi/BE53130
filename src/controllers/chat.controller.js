const Message = require('../models/message.model');

const sendMessage = async (data) => {
  try {
    const message = new Message({
      user: data.user,
      message: data.message,
    });
    await message.save();
    console.log('Mensaje guardado en la base de datos');
  } catch (error) {
    console.error('Error al guardar el mensaje en la base de datos:', error);
  }
};

module.exports = {
  sendMessage,
};