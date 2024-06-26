const express = require('express');
const router = express.Router();
const Message = require('../models/message.model');
const { isUser } = require('../middlewares/auth.middleware');


router.get('/', isUser, async (req, res) => {
  try {
    const messages = await Message.find().populate('user', 'first_name').lean();
    res.render('chat', { messages });
  } catch (error) {
    console.error('Error al obtener los mensajes:', error);
    res.render('chat', { messages: [] });
  }
});

module.exports = router;