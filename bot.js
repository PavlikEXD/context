// bot.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const tmi = require('tmi.js');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const dbPool = new Pool({
  connectionString: 'postgresql://localhost/twitch_development'
});

async function createMessagesTable() {
  try {
    const dbClient = await dbPool.connect();
    const result = await dbClient.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages')
    `);
    const exists = result.rows[0].exists;

    if (!exists) {
      await dbClient.query(`
        CREATE TABLE messages (
          id SERIAL PRIMARY KEY,
          user_name VARCHAR(255),
          message TEXT
        )
      `);
      console.log('Table "messages" created');
    } else {
      console.log('Table "messages" already exists');
    }

    dbClient.release();
  } catch (error) {
    console.error('Error creating table "messages":', error);
  }
}

async function createDatabase() {
  try {
    const dbClient = new Pool({
      connectionString: 'postgresql://localhost/postgres'
    });

    const result = await dbClient.query(`
      SELECT COUNT(*) FROM pg_database WHERE datname = 'twitch_development'
    `);
    const exists = result.rows[0].count === '1';

    if (!exists) {
      await dbClient.query('CREATE DATABASE twitch_development');
      console.log('Database "twitch_development" created');
    } else {
      console.log('Database "twitch_development" already exists');
    }

    dbClient.end();
  } catch (error) {
    console.error('Error creating database "twitch_development":', error);
  }
}

createDatabase();
createMessagesTable();

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

async function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  }

  const commandName = msg.trim();

  // Проверить, что сообщение состоит из одного слова и этого слова нет в базе данных
  // Если условие выполняется, то сохранить сообщение в базу данных
  if (commandName.split(' ').length === 1) {
    const result = await dbPool.query('SELECT * FROM messages WHERE message = $1', [commandName]);
    if (result.rows.length === 0) {
      saveMessageToDB(context.username, commandName);
    }
  }

  if (commandName === '!dice') {
    const num = rollDice();
    client.say(target, `${context.username} rolled a ${num}`);
    handleDiceCommand(context.username, num);
    console.log(`* Executed ${commandName} command`);
  } else {
    console.log(`* Unknown command ${commandName}`);
  }
}

async function saveMessageToDB(username, message) {
  try {
    await dbPool.query('INSERT INTO messages (user_name, message) VALUES ($1, $2)', [
      username,
      message
    ]);
    console.log(`* Saved chat message: ${username}: ${message}`);
  } catch (error) {
    console.error('Error saving chat message:', error);
  }
}

function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

async function handleDiceCommand(username, num) {
  try {
    io.emit('diceRoll', num);
    console.log(`* Emulated dice roll: ${username} rolled a ${num}`);
  } catch (error) {
    console.error('Error handling dice command:', error);
  }
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
