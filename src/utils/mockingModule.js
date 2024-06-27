const { faker } = require('@faker-js/faker');

function generateMockProduct() {
    return {
        _id: faker.database.mongodbObjectId(),
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        img: faker.image.url(),
        code: faker.string.alphanumeric(10),
        stock: faker.number.int({ min: 0, max: 100 }),
        category: faker.commerce.department(),
        status: faker.datatype.boolean()
    };
}

function generateMockProducts(count = 50) {
    return Array.from({ length: count }, generateMockProduct);
}

module.exports = { generateMockProducts };