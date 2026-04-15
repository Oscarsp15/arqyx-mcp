const WebSocket = require('ws'); 
const ws = new WebSocket('ws://localhost:7777/ws'); 
ws.on('open', () => { 
  console.log('Connected'); 
  ws.send(JSON.stringify({ type: 'hello' })); 
  ws.send(JSON.stringify({ type: 'erd:table:add', canvasId: 'e00b68a5-d24b-435b-afe5-b745e8259470', name: 'nueva_tabla_1', position: { x: 100, y: 100 } })); 
}); 
ws.on('message', m => console.log('Received:', m.toString().substring(0, 500))); 
ws.on('close', () => console.log('Closed')); 
ws.on('error', e => console.error('Error:', e)); 
setTimeout(() => { ws.close(); process.exit(0); }, 3000);
