const validation = require('../libs/unalib');

describe('Pruebas Unitarias de una-lib', () => {

    test('Debe validar correctamente una URL de imagen', () => {
        expect(validation.is_valid_url_image('https://picsum.photos/200/300')).toBe(false);
        expect(validation.is_valid_url_image('https://misitio.com/foto.jpg')).toBe(true);
        expect(validation.is_valid_url_image('https://misitio.com/archivo.pdf')).toBe(false);
    });

    test('Debe validar correctamente una URL de video de YouTube', () => {
        expect(validation.is_valid_yt_video('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
        expect(validation.is_valid_yt_video('https://vimeo.com/123456')).toBe(false);
    });

    test('Debe transformar un enlace de imagen a etiqueta HTML <img>', () => {
        const mensaje = JSON.stringify({ mensaje: 'https://misitio.com/foto.jpg' });
        const resultado = validation.validateMessage(mensaje);
        expect(resultado).toContain('<img src=');
        expect(resultado).toContain('https://misitio.com/foto.jpg');
    });

    test('Debe prevenir Inyección de Scripts (XSS) y limpiar el mensaje', () => {
        const mensajeMalicioso = JSON.stringify({ mensaje: '<script>alert("xss")</script>' });
        const resultado = validation.validateMessage(mensajeMalicioso);
        
        // Verificamos que las etiquetas script ya no estén
        expect(resultado).not.toContain('<script>');
        expect(resultado).not.toContain('alert');
    });

});
