const socket = io();

socket.on("productos", (data) => {
  console.log("Productos recibidos:", data); // Verificar productos recibidos
  renderProductos(data);
});

//Función para renderizar el listado de productos
const renderProductos = (productos) => {
  const contenedorProductos = document.getElementById("contenedorProductos");
  contenedorProductos.innerHTML = "";

  productos.forEach(item => {
    const card = document.createElement("div");
    card.innerHTML = `
      <p> ID: ${item._id} </p>
      <p> Titulo:  ${item.title} </p>
      <p> Precio: ${item.price} </p>
      <button data-id="${item._id}" class="btnEliminar"> Eliminar producto </button>
      <button data-id="${item._id}" class="btnAgregarAlCarrito"> Agregar al carrito </button>
    `;
    contenedorProductos.appendChild(card);

    //Agregamos el evento al botón de eliminar producto
    card.querySelector(".btnEliminar").addEventListener("click", (event) => {
      const productId = item._id; // Obtén el ID del producto del objeto 'item'
      console.log("Producto a eliminar:", productId); // Verificar ID del producto a eliminar
      eliminarProducto(productId);
    });

    //Agregamos el evento al botón de agregar al carrito
    card.querySelector(".btnAgregarAlCarrito").addEventListener("click", (event) => {
      const productId = item._id; // Obtén el ID del producto del objeto 'item'
      console.log("Producto a agregar al carrito:", productId); // Verificar ID del producto a agregar al carrito
      addToCart(productId);
    });
  });
};

//Eliminar producto
const eliminarProducto = (id) => {
  console.log("Enviando solicitud para eliminar producto:", id); // Verificar ID del producto a eliminar
  socket.emit("eliminarProducto", id);
};

//Agregar producto
document.getElementById("btnEnviar").addEventListener("click", () => {
  agregarProducto();
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
  console.log("Enviando solicitud para agregar producto:", producto); // Verificar datos del producto a agregar
  socket.emit("agregarProducto", producto);
};

// Listener de mensajes del chat
socket.on("message", (data) => {
  const log = document.getElementById("messagesLogs");
  log.innerHTML += `${data.user} dice: ${data.message} <br>`;
  console.log("Mensaje recibido:", data); // Verificar mensaje recibido
});

// Función para agregar un producto al carrito
function addToCart(productId) {
    fetch('/api/carritos', {
      method: 'POST',
    })
      .then(response => response.json())
      .then(data => {
        const cartId = data._id;
        addProductToCart(cartId, productId);
      })
      .catch(error => {
        console.error('Error al crear el carrito:', error);
      });
  }
  
  function addProductToCart(cartId, productId) {
    fetch(`/api/carritos/${cartId}/productos/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity: 1 }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Producto agregado al carrito:', data);
        // Opcionalmente, mostrar un mensaje de éxito al usuario
      })
      .catch(error => {
        console.error('Error al agregar el producto al carrito:', error);
      });
  }