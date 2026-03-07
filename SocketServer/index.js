const { WebSocketServer } = require('ws');

const port = 8080;
const wss = new WebSocketServer({ port });

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', function message(data) {
        console.log('received: %s', data);
    });

    ws.send('something');
});

wss.on('listening', () => {
    console.log(`Data socket listening on port ${port}`);
});