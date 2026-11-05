const params=new URLSearchParams(location.search);
const messages={configuration:'El inicio de sesión aún no está configurado. Inténtalo más tarde.',authentication:'No se completó el inicio de sesión. Puede haberse cancelado o ocurrido un error. Puedes reintentarlo.'};
const notice=document.getElementById('notice');
if (params.has('error') || params.has('login')) {notice.textContent=messages[params.get('error')] || 'Inicia sesión para acceder al chat.';notice.hidden=false;}
