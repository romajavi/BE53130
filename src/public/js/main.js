// Configuración de Socket.IO para evitar reconexiones 
const socket = io({
  transports: ['websocket'],
  upgrade: false,
  reconnection: false
});

// Función para agregar un producto al carrito
async function addToCart(productId, quantity) {
  try {
    const response = await fetch('/api/carts/add-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Producto agregado al carrito');
      alert('Producto agregado al carrito exitosamente');
      updateCartCounter(result.cart.products.reduce((total, product) => total + product.quantity, 0));
    } else {
      throw new Error('Error al agregar el producto al carrito');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al agregar el producto al carrito.');
  }
}

function updateCartCounter(count) {
  const cartCounter = document.getElementById('cart-counter');
  if (cartCounter) {
    cartCounter.innerText = count;
  }
}

// Función para procesar la compra
async function processPurchase(cartId) {
  try {
    const response = await fetch(`/api/carts/${cartId}/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (result.status === 'success') {
      alert('Compra realizada con éxito');
      window.location.href = `/purchase-success?ticketId=${result.ticket._id}`;
    } else {
      alert('Error al procesar la compra: ' + result.message);
      window.location.href = `/purchase-failed?cartId=${cartId}`;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al procesar la compra.');
  }
}

// Evento que se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Agregar eventos a los botones "Agregar al carrito"
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.dataset.id;
      const quantityInput = button.closest('form').querySelector('input[name="quantity"]');
      const quantity = quantityInput ? quantityInput.value : 1;
      addToCart(productId, quantity);
    });
  });

  // Agregar evento al botón "Finalizar Compra"
  const purchaseButton = document.getElementById('finalize-purchase');
  if (purchaseButton) {
    purchaseButton.addEventListener('click', () => {
      const cartId = purchaseButton.dataset.cartId;
      processPurchase(cartId);
    });
  }

  // Manejo del chat (si estamos en la página de chat)
  if (window.location.pathname === '/chat') {
    const socket = io();
    const messageForm = document.getElementById("message-form");
    const messageInput = document.getElementById("message");
    const messageHistory = document.getElementById("message-history");

    messageForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = messageInput.value.trim();
      if (message !== "") {
        socket.emit("message", { message: message });
        messageInput.value = "";
      }
    });

    socket.on("message", (data) => {
      const messageElement = document.createElement("p");
      messageElement.textContent = `${data.user} dice: ${data.message}`;
      messageHistory.appendChild(messageElement);
      messageHistory.scrollTop = messageHistory.scrollHeight;
    });

    socket.on("messageHistory", (messages) => {
      messageHistory.innerHTML = '';
      messages.forEach((message) => {
        const messageElement = document.createElement("p");
        messageElement.textContent = `${message.user.first_name} dice: ${message.message}`;
        messageHistory.appendChild(messageElement);
      });
    });

    socket.emit("getMessages");
  }
});