// bot.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const tmi = require('tmi.js');
const axios = require('axios');
const { Pool } = require('pg');

const { createGamesTable, createMessagesTable, createDatabase, createGame, saveMessageToDB, isWordNew, getGameId } = require('./database');
const { CHALLENGE_TYPE, USER_ID, GAME_CONTEXT_ID } = require('./config/game.js.sample');
const { opts } = require('./config/twitch.js.sample');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const fs = require('fs'); // connect module fs

const dbPool = new Pool({
  connectionString: 'postgresql://localhost/twitch_development'
});

const client = new tmi.client(opts);

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.connect();

async function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  }

  const commandName = msg.trim();

  if (commandName.split(' ').length === 1) {
    if (await isWordNew(commandName)) {
      // response:
      // {
      //   "completed": true,
      //   "details": "Слово мел уже было использовано",
      //   "error": true,
      //   "rank": -1,
      //   "tips": 0,
      //   "tries": 231,
      //   "word": "мел"
      // }
      const response = await sendRequest(context.username, commandName);
      if (!response.data.error) {
        saveMessageToDB(context.username, commandName, response.data.rank);
        reloadPage(context.username, commandName);
      }

      console.log(`* Executed ${commandName} word`);
    }
  }
}

function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

async function reloadPage(username, commandName) {
  try {
    const gameId = await getGameId();
    io.emit('diceRoll', { username, commandName, gameId });
    console.log(`* ${username} send: ${commandName}`);
  } catch (error) {
    console.error('Error handling dice command:', error);
  }
}

function rollDice() {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

async function main() {
  await createDatabase();
  await createGamesTable();
  await createMessagesTable();
  await createGame();

  io.on('connection', (socket) => {
    console.log('A client connected.');

    socket.on('disconnect', () => {
      console.log('A client disconnected.');
    });
  });

  app.get('/', (req, res) => {
    const filePath = __dirname + '/index.html';
    fs.readFile(filePath, 'utf8', (err, fileContent) => {
      if (err) {
        console.error('Ошибка чтения файла:', err);
        return res.status(500).send('Ошибка сервера');
      }

      // Change placeholder in HTML file to GAME_CONTEXT_ID value
      const modifiedContent = fileContent.replace('{{GAME_CONTEXT_ID}}', GAME_CONTEXT_ID);

      res.send(modifiedContent);
    });
  });

  const port = 3000;
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

async function sendRequest(username, word) {
  const params = {
    challenge_id: GAME_CONTEXT_ID,
    user_id: USER_ID,
    word: word,
    challenge_type: CHALLENGE_TYPE
  };

  try {
    const response = await axios.get('https://xn--80aqu.xn--e1ajbkccewgd.xn--p1ai/get_score', { params });
    console.log(`* Sent GET request for word: ${word}`);
    return response; // Return response
  } catch (error) {
    console.error('Error sending GET request:', error);
    throw error; // Rethrow error
  }
}

main();
