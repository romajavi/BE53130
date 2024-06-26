const userDAO = require('../daos/user.dao');
const UserDTO = require('../dtos/user.dto');

class UserRepository {
    async createUser(userData) {
        const user = await userDAO.createUser(userData);
        return new UserDTO(user);
    }

    async getUserById(id) {
        const user = await userDAO.getUserById(id);
        return user ? new UserDTO(user) : null;
    }

    async getUserByEmail(email) {
        const user = await userDAO.getUserByEmail(email);
        return user ? new UserDTO(user) : null;
    }

    async updateUser(id, userData) {
        const updatedUser = await userDAO.updateUser(id, userData);
        return updatedUser ? new UserDTO(updatedUser) : null;
    }

    async deleteUser(id) {
        const deletedUser = await userDAO.deleteUser(id);
        return deletedUser ? new UserDTO(deletedUser) : null;
    }
}

module.exports = new UserRepository();