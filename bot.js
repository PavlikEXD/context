// bot.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const tmi = require('tmi.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const opts = {
  identity: {
    username: 'kalesko',
    password: '1i019uda5wpjtbh5esdd3go21hf6cl'
  },
  channels: ['kalesko']
};

const client = new tmi.client(opts);

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.connect();

function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  }

  const commandName = msg.trim();

  if (commandName === '!dice') {
    const num = rollDice();
    client.say(target, `${context.username} rolled a ${num}`);
    handleDiceCommand(num);
    console.log(`* Executed ${commandName} command`);
  } else {
    console.log(`* Unknown command ${commandName}`);
  }
}

function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

function handleDiceCommand(num) {
  io.emit('diceRoll', num);
}

function rollDice() {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

io.on('connection', (socket) => {
  console.log('A client connected.');

  socket.on('disconnect', () => {
    console.log('A client disconnected.');
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
