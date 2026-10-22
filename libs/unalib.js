// modulo una-lib
module.exports = {

    is_valid_phone: function (phone) {
      var isValid = false;
      var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;
      try {
        isValid = re.test(phone);
      } catch (e) {
        console.log(e);
      } finally {
        return isValid;
      }
    },
  
    is_valid_url_image: function (url) {
      var isValid = false;
var re = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|bmp|webp)|(picsum\.photos|imgur\.com|unsplash\.com)/i;
      try {
        isValid = re.test(url);
      } catch (e) {
        console.log(e);
      } finally {
        return isValid;
      }
    },
  
    is_valid_yt_video: function (url) {
      var isValid = false;
      var re = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})?$/i;
      try {
        isValid = re.test(url); // Corregido: era 'phone'
      } catch (e) {
        console.log(e);
      } finally {
        return isValid;
      }
    },
  
    getYTVideoId: function(url){
      return url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)[1];
    },
  
    getEmbeddedCode: function (url){
      var id = this.getYTVideoId(url);
      var code = '<iframe width="560" height="315" src="https://www.youtube.com/embed/'+id+ '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      return code;
    },
  
    getImageTag: function(url){
      var tag = '<img src="'+url+'" style="max-height: 400px;max-width: 400px;">';
      return tag;
    },
  
    validateMessage: function(msg){
      // 1. Validar entrada
      if (!msg || typeof msg !== 'string') {
        return JSON.stringify({ mensaje: '' });
      }

      try {
        var obj = JSON.parse(msg);

        // 2. PREVENCIÓN DE XSS: Sanear el mensaje eliminando etiquetas <script> y eventos onerror/onload
        if (obj.mensaje && typeof obj.mensaje === 'string') {
            // Elimina scripts
            obj.mensaje = obj.mensaje.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            // Elimina inyecciones en atributos (ej. onerror=alert)
            obj.mensaje = obj.mensaje.replace(/on\w+\s*=\s*(['"]).*?\1/gi, '');
            obj.mensaje = obj.mensaje.replace(/on\w+\s*=\s*[^\s>]+/gi, '');
            // Elimina javascript:
            obj.mensaje = obj.mensaje.replace(/javascript:/gi, '');
        }

        // 3. Validar si es imagen o video (Paso 4)
        if(this.is_valid_url_image(obj.mensaje)){
          console.log("Es una imagen!");
          obj.mensaje = this.getImageTag(obj.mensaje);
        }
        else if(this.is_valid_yt_video(obj.mensaje)){
          console.log("Es un video!");
          obj.mensaje = this.getEmbeddedCode(obj.mensaje);
        }
        else{
          console.log("Es un texto!");
        }
        
        return JSON.stringify(obj);
      } catch (e) {
        console.log('Error processing message:', e);
        // Si falla el JSON, devolvemos el mensaje original saneado
        let cleanMsg = msg.replace(/<[^>]+>/g, ''); 
        return JSON.stringify({ mensaje: cleanMsg }); 
      }
    }
};