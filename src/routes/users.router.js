const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');

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

module.exports = router;