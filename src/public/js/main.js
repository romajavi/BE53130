const socket = io();

if (window.location.pathname === '/products' || window.location.pathname === '/realtimeproducts') {
  socket.on('productos', (productos) => {
    const contenedorProductos = document.getElementById('contenedorProductos');
    contenedorProductos.innerHTML = '';

    productos.forEach((producto) => {
      const productoElement = document.createElement('div');
      productoElement.classList.add('product-card');
      productoElement.innerHTML = `
        <h3>${producto.title}</h3>
        <p>${producto.description}</p>
        <p>Precio: $${producto.price}</p>
        <p>Categoría: ${producto.category}</p>
        <p>Stock: ${producto.stock}</p>
        <input type="number" class="quantity-input" data-id="${producto._id}" value="1" min="1" max="${producto.stock}">
        <button class="add-to-cart" data-id="${producto._id}">Agregar al carrito</button>
      `;
      contenedorProductos.appendChild(productoElement);
    });
  });

  const agregarAlCarritoButtons = document.querySelectorAll('.add-to-cart');
  agregarAlCarritoButtons.forEach(button => {
    button.addEventListener('click', () => {
      const productoId = button.dataset.id;
      const cantidad = document.querySelector(`.quantity-input[data-id="${productoId}"]`).value;
      addToCart(productoId, cantidad);
    });
  });
}

async function addToCart(productId, quantity) {
  let cartId = localStorage.getItem('cartId');
  if (!cartId) {
    const response = await fetch('/api/carts', { method: 'POST' });
    const data = await response.json();
    cartId = data._id;
    localStorage.setItem('cartId', cartId);
  }

  const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });

  if (response.ok) {
    console.log('Producto agregado al carrito');
    alert('Producto agregado al carrito exitosamente');
  } else {
    console.error('Error al agregar el producto al carrito');
    alert('Error al agregar el producto al carrito.');
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const btnEnviar = document.getElementById('btnEnviar');
  if (btnEnviar) {
    btnEnviar.addEventListener('click', () => {
      agregarProducto();
    });
  }
});

const agregarProducto = () => {
  const producto = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    price: parseFloat(document.getElementById("price").value),
    img: document.getElementById("img").value,
    code: document.getElementById("code").value,
    stock: parseInt(document.getElementById("stock").value),
    category: document.getElementById("category").value,
    status: document.getElementById("status").value === "true"
  };
  console.log("Enviando solicitud para agregar producto:", producto);
  socket.emit("agregarProducto", producto);
};

// Manejo del chat
if (window.location.pathname === '/chat') {
  let userFirstName;

  // Recibir detalles del usuario
  socket.on("userDetails", (data) => {
    userFirstName = data.firstName;
  });

  document.getElementById("message-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const messageInput = document.getElementById("message");
    const message = messageInput.value.trim();
    if (message !== "") {
      socket.emit("message", { message: message });
      messageInput.value = "";
    }
  });

  socket.on("message", (data) => {
    const messageElement = document.createElement("p");
    messageElement.textContent = `${data.user.first_name} dice: ${data.message}`;
    messageHistory.appendChild(messageElement);
    messageHistory.scrollTop = messageHistory.scrollHeight;
  });

  socket.on("messageHistory", (messages) => {
    const messageHistory = document.getElementById("message-history");
    messages.forEach((message) => {
      const messageElement = document.createElement("p");
      messageElement.textContent = `${message.user.first_name} dice: ${message.message}`;
      messageHistory.appendChild(messageElement);
    });
  });

  // Solicitar historial de mensajes al conectarse
  socket.on("connect", () => {
    socket.emit("getMessages");
  });
}