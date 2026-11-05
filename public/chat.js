let currentUser;
let stopping = false;
const socket = io({path:'/api/socket-io/socket.io',transports:['websocket'],autoConnect:false,auth:async callback => {
  try {
    const response = await fetch('/api/socket-ticket',{method:'POST'});
    if (response.status === 401) { stopping=true; location.assign('/?login=required'); return; }
    if (!response.ok) throw new Error();
    callback(await response.json());
  } catch { updateConnection('disconnected','No se pudo conectar'); setTimeout(() => {if (!stopping) socket.connect();},3000); }
}});
      const form = document.getElementById('message-form');
      const nameInput = document.getElementById('nombre');
      const messageInput = document.getElementById('m');
      const sendButton = document.getElementById('send-button');
      const messages = document.getElementById('messages');
      const emptyState = document.getElementById('empty-state');
      const status = document.getElementById('connection-status');
      const statusLabel = document.getElementById('connection-label');
      const colors = ['#a91d36', '#245d9c', '#37624a', '#725194', '#925c25'];

      const messageTime = new Intl.DateTimeFormat('es-CR', { hour: '2-digit', minute: '2-digit' });

      function updateSendButton() {
        sendButton.disabled = !socket.connected || !messageInput.value.trim();
      }

      function updateConnection(state, label) {
        status.dataset.state = state;
        statusLabel.textContent = label;
        updateSendButton();
      }

      socket.on('connect', () => updateConnection('connected', 'En línea'));
      socket.on('disconnect', reason => {
  updateConnection('disconnected','Sin conexión');
  if (reason === 'io server disconnect' && !stopping) setTimeout(() => socket.connect(),500);
});
      socket.on('connect_error', () => { updateConnection('disconnected','Sin conexión'); if (!stopping) setTimeout(() => socket.connect(),3000); });
      messageInput.addEventListener('input', updateSendButton);

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const mensaje = messageInput.value.trim();
        if (!socket.connected || !mensaje) return;

        const errorBox=document.getElementById('message-error');
        errorBox.textContent='';
        sendButton.disabled=true;
        socket.timeout(5000).emit('Evento-Mensaje-Server', JSON.stringify({mensaje}), (error,result) => {
          if (error || result?.error) errorBox.textContent=result?.error || 'No se confirmó el envío. Conservamos tu mensaje para reintentarlo.';
          else if (messageInput.value.trim()===mensaje) messageInput.value='';
          updateSendButton(); messageInput.focus();
        });
      });
      socket.on('Evento-Mensaje-Server', (message) => {
        let data;
        try {
          data = JSON.parse(message);
        } catch {
          return;
        }
        if (!data || typeof data.mensaje !== 'string') return;

        const nombre = typeof data.nombre === 'string' ? data.nombre : 'Anónimo';
        const color = /^#[0-9a-f]{6}$/i.test(data.color)
          ? colors[parseInt(data.color.slice(1), 16) % colors.length]
          : colors[0];
        const ownMessage = data.sub === currentUser?.sub;
        const item = document.createElement('li');
        item.className = ownMessage ? 'own' : 'other';

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = nombre.charAt(0).toUpperCase() || '?';
        avatar.style.backgroundColor = color;
        avatar.setAttribute('aria-hidden', 'true');

        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const meta = document.createElement('div');
        meta.className = 'msg-meta';
        const author = document.createElement('b');
        author.textContent = nombre;
        const time = document.createElement('time');
        const now = new Date(data.at || Date.now());
        time.dateTime = now.toISOString();
        time.textContent = messageTime.format(now);
        meta.append(author, time);

        const content = document.createElement('div');
        content.className = 'msg-text';
        // El servidor genera HTML para imágenes y videos: conservar ese contrato.
        // Esto no sustituye una revisión completa del saneamiento del backend.
        content.textContent = data.mensaje;
try {
  const url = new URL(data.mensaje);
  if (url.protocol === 'https:') {
    let videoId;
    if (url.hostname === 'youtu.be') videoId=url.pathname.slice(1);
    else if (['youtube.com','www.youtube.com'].includes(url.hostname)) videoId=url.searchParams.get('v') || url.pathname.split('/')[2];
    if (/^[\w-]{11}$/.test(videoId || '')) {
      const frame=document.createElement('iframe'); frame.src='https://www.youtube.com/embed/'+videoId; frame.title='Video de YouTube'; frame.allowFullscreen=true; frame.referrerPolicy='no-referrer'; content.replaceChildren(frame);
    } else if (/\.(png|jpe?g|gif|webp|bmp)$/i.test(url.pathname) || ['picsum.photos','images.unsplash.com','i.imgur.com'].includes(url.hostname)) {
      const image=document.createElement('img'); image.src=url.href; image.alt='Imagen compartida'; image.referrerPolicy='no-referrer'; image.loading='lazy'; content.replaceChildren(image);
    }
  }
} catch { /* Ordinary text is displayed as text, including any HTML. */ }
        bubble.append(meta, content);
        item.append(avatar, bubble);
        emptyState.hidden = true;
        messages.append(item);
        messages.scrollTop = messages.scrollHeight;
      });
const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('una-chat-session') : null;
channel?.addEventListener('message', () => { stopping=true; socket.disconnect(); location.assign('/'); });
document.getElementById('logout-form').addEventListener('submit', () => { stopping=true; socket.disconnect(); channel?.postMessage('logout'); });
(async () => {
  try {
    const response=await fetch('/api/session');
    if (response.status===401) { location.assign('/?login=required'); return; }
    if (!response.ok) throw new Error();
    currentUser=await response.json(); nameInput.value=currentUser.name; socket.connect();
  } catch {updateConnection('disconnected','No se pudo comprobar la sesión');}
})();
