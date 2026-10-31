const { io } = require("socket.io-client");
const httpServer = require("../../server"); // Importamos el servidor
const port = 3002; // Usamos otro puerto para no chocar con el que ya tienes corriendo

// Variables para el cliente y el servidor de prueba
let clientSocket;
let serverInstance;

beforeAll((done) => {
  // Levantamos el servidor en el puerto 3002 solo para las pruebas
  serverInstance = httpServer.listen(port, () => {
    // Una vez arriba, conectamos al cliente
    clientSocket = io(`http://localhost:${port}`, {
      path: "/api/socket-io/socket.io",
      transports: ["websocket"],
      forceNew: true,
    });
    clientSocket.on("connect", done); // Esperamos a que conecte
  });
});

afterAll(() => {
  // Cerramos todo al terminar
  clientSocket.close();
  serverInstance.close();
});

describe("Pruebas de Integración con Socket.IO", () => {
  
  test("El backend acepta y procesa una URL de imagen válida", (done) => {
    const mensajePrueba = JSON.stringify({ mensaje: "https://picsum.photos/200/300" });
    
    // Escuchamos la respuesta del servidor
    clientSocket.once("Evento-Mensaje-Server", (respuesta) => {
      // Verificamos que el backend llamó a una-lib y transformó la URL en una etiqueta <img>
      expect(respuesta).toContain("<img src=");
      expect(respuesta).toContain("picsum.photos");
      done();
    });

    // Enviamos el mensaje
    clientSocket.emit("Evento-Mensaje-Server", mensajePrueba);
  });

  test("El backend previene el XSS y limpia el script", (done) => {
    const mensajeXSS = JSON.stringify({ mensaje: "<script>alert('xss')</script>" });
    
    clientSocket.once("Evento-Mensaje-Server", (respuesta) => {
      // Verificamos que el backend limpió el script
      expect(respuesta).not.toContain("<script>");
      expect(respuesta).not.toContain("alert");
      done();
    });

    clientSocket.emit("Evento-Mensaje-Server", mensajeXSS);
  });

});
