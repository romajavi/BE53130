const socket = io({
  transports: ['websocket'],
  upgrade: false,
  reconnection: false
});

async function addToCart(productId, quantity) {
  try {
    const response = await fetch('/api/carts/add-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error);
    }

    const data = await response.json();
    updateCartCounter(data.totalProducts);
    alert('Producto agregado al carrito exitosamente');
  } catch (error) {
    alert(error.message);
  }
}

function updateCartCounter(count) {
  const cartCounter = document.getElementById('cart-counter');
  if (cartCounter) {
    cartCounter.innerText = count;
  }
}

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

document.addEventListener('DOMContentLoaded', () => {
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.dataset.id;
      const quantityInput = button.closest('form').querySelector('input[name="quantity"]');
      const quantity = quantityInput ? quantityInput.value : 1;
      addToCart(productId, quantity);
    });
  });

  const purchaseButton = document.getElementById('finalize-purchase');
  if (purchaseButton) {
    purchaseButton.addEventListener('click', () => {
      const cartId = purchaseButton.dataset.cartId;
      processPurchase(cartId);
    });
  }

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

socket.on('connect', () => {
  console.log('Conectado al servidor');
  const params = getUrlParams();
  socket.emit('getProducts', params);
});

socket.on('products', (result) => {
  console.log('Productos recibidos:', result);
  updateProductList(result.payload);
  updatePagination(result);
});

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    page: params.get('page') || 1,
    limit: params.get('limit') || 10,
    sort: params.get('sort') || '',
    query: params.get('query') || ''
  };
}

function updateProductList(products) {
  const productList = document.getElementById('product-list');
  productList.innerHTML = '';
  products.forEach(product => {
    const productElement = document.createElement('div');
    productElement.innerHTML = `
          <h3>${product.title}</h3>
          <p>Precio: $${product.price}</p>
          <p>Stock: ${product.stock}</p>
          <button onclick="editProduct('${product._id}')">Editar</button>
          <button onclick="deleteProduct('${product._id}')">Eliminar</button>
      `;
    productList.appendChild(productElement);
  });
}

function updatePagination(result) {
  const paginationDiv = document.querySelector('.pagination');
  paginationDiv.innerHTML = `
      ${result.hasPrevPage ? `<a href="?page=${result.prevPage}">Anterior</a>` : ''}
      <span>Página ${result.page} de ${result.totalPages}</span>
      ${result.hasNextPage ? `<a href="?page=${result.nextPage}">Siguiente</a>` : ''}
  `;
}

function canEditDelete(product) {
  const userRole = '{{user.role}}';
  const userEmail = '{{user.email}}';
  return userRole === 'admin' || (userRole === 'premium' && product.owner === userEmail);
}