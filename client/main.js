const socket = io();
let currentBot = null;

async function fetchBots() {
  const res = await fetch('/api/bots');
  return res.json();
}

function renderClientList(bots) {
  const ul = document.getElementById('clientList');
  ul.innerHTML = '';
  bots.forEach(bot => {
    const li = document.createElement('li');
    if (bot.id === currentBot) li.classList.add('active');

    const span = document.createElement('span');
    span.textContent = bot.id;
    span.onclick = () => selectBot(bot.id);

    const del = document.createElement('button');
    del.textContent = '✕';
    del.onclick = () => deleteBot(bot.id);

    li.append(span, del);
    ul.appendChild(li);
  });
}

async function selectBot(id) {
  currentBot = id;
  renderClientList(await fetchBots());
  clearDetail();
  socket.emit('watchBot', id);
  socket.emit('getStatus', id, updateStatus);
  socket.emit('getInventory', id, updateInventory);
  socket.emit('getHealth', id, updateHealth);
  socket.emit('chatMessage', { botId: id, message: '/shards' });
}

function clearDetail() {
  document.getElementById('chatWindow').innerHTML = '';
  ['status','inventory','health','scoreboard'].forEach(k => {
    document.getElementById(k).innerHTML = '';
  });
}

async function addBot(e) {
  e.preventDefault();
  const f = e.target;
  const cfg = {
    id:       f.id.value,
    email:    f.email.value,
    password: f.password.value,
    host:     f.host.value,
    port:     Number(f.port.value),
    version:  f.version.value
  };
  await fetch('/api/bots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg)
  });
  f.reset();
  renderClientList(await fetchBots());
}

async function deleteBot(id) {
  await fetch(`/api/bots/${id}`, { method: 'DELETE' });
  if (currentBot === id) currentBot = null;
  renderClientList(await fetchBots());
  clearDetail();
}

function appendChat({ username, message }) {
  const w = document.getElementById('chatWindow');
  const d = document.createElement('div');
  d.textContent = `${username}: ${message}`;
  w.appendChild(d);
  w.scrollTop = w.scrollHeight;
}

function updateStatus(d) {
  document.getElementById('status').textContent =
    `Connected: ${d.connected}, Pos: ${d.position?.x.toFixed(1)},${d.position?.y.toFixed(1)},${d.position?.z.toFixed(1)}`;
}
function updateInventory({ items }) {
  document.getElementById('inventory').textContent =
    `Inventory: ${items.map(i=>`${i.name} x${i.count}`).join(', ')}`;
}
function updateHealth({ health, food }) {
  document.getElementById('health').textContent =
    `Health: ${health}, Food: ${food}`;
}
function updateShards({ shards }) {
  document.getElementById('scoreboard').textContent =
    `Shards: ${shards}`;
}

// Chat input send on Enter
const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && currentBot) {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (msg) {
      socket.emit('chatMessage', { botId: currentBot, message: msg });
      chatInput.value = '';
    }
  }
});

// Socket listeners
socket.on('chatUpdate', appendChat);
socket.on('healthUpdate', updateHealth);
socket.on('inventoryUpdate', updateInventory);
socket.on('shardsUpdate', updateShards);
socket.on('spawn', () => socket.emit('getStatus', currentBot, updateStatus));
socket.on('end', () => updateStatus({ connected: false }));

document.getElementById('addBotForm').addEventListener('submit', addBot);

(async () => {
  renderClientList(await fetchBots());
})();