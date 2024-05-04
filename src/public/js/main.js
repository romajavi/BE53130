const socket = io();

if (window.location.pathname === '/products') {
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
        <input type="number" class="quantity-input" value="1" min="1" max="${producto.stock}" data-id="${producto._id}">
        <button class="add-to-cart" data-id="${producto._id}">Agregar al carrito</button>
      `;
      contenedorProductos.appendChild(productoElement);
    });

    const agregarAlCarritoButtons = document.querySelectorAll('.add-to-cart');
    agregarAlCarritoButtons.forEach(button => {
      button.addEventListener('click', () => {
        const productoId = button.dataset.id;
        const cantidad = document.querySelector(`.quantity-input[data-id="${productoId}"]`).value;
        addToCart(productoId, cantidad);
      });
    });
  });
}

function addToCart(productId, quantity) {
  fetch('/api/carts', {
    method: 'POST',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al crear el carrito');
      }
      return response.json();
    })
    .then(data => {
      const cartId = data._id;
      return fetch(`/api/carts/${cartId}/products/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al agregar el producto al carrito');
      }
      return response.json();
    })
    .then(data => {
      console.log('Producto agregado al carrito:', data);
      alert('Producto agregado al carrito exitosamente');
    })
    .catch(error => {
      console.error('Error al agregar el producto al carrito:', error);
      alert('Error al agregar el producto al carrito. Por favor, intenta nuevamente.');
    });
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
    price: document.getElementById("price").value,
    img: document.getElementById("img").value,
    code: document.getElementById("code").value,
    stock: document.getElementById("stock").value,
    category: document.getElementById("category").value,
    status: document.getElementById("status").value === "true"
  };
  console.log("Enviando solicitud para agregar producto:", producto);
  socket.emit("agregarProducto", producto);
};

socket.on("message", (data) => {
  const log = document.getElementById("messagesLogs");
  if (log) {
    log.innerHTML += `${data.user} dice: ${data.message} <br>`;
    console.log("Mensaje recibido:", data);
  }
});