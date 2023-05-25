// database.js
const { Pool } = require('pg');
const { GAME_CONTEXT_ID } = require('./config/game.js.sample');

const dbPool = new Pool({
  connectionString: 'postgresql://localhost/twitch_development'
});

async function createGamesTable() {
  try {
    const dbClient = await dbPool.connect();
    const result = await dbClient.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'games')
    `);
    const exists = result.rows[0].exists;

    if (!exists) {
      await dbClient.query(`
        CREATE TABLE games (
          id SERIAL PRIMARY KEY,
          context_id VARCHAR(255)
        )
      `);
      console.log('Table "games" created');
    } else {
      console.log('Table "games" already exists');
    }

    dbClient.release();
  } catch (error) {
    console.error('Error creating table "games":', error);
  }
}

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
          message TEXT,
          rank VARCHAR(255),
          game_id INTEGER
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

async function createGame() {
  try {
    const dbClient = await dbPool.connect();
    const result = await dbClient.query('SELECT id FROM games WHERE context_id = $1', [GAME_CONTEXT_ID]);

    if (result.rows.length === 0) {
      const insertResult = await dbClient.query('INSERT INTO games (context_id) VALUES ($1) RETURNING id', [GAME_CONTEXT_ID]);
      const gameId = insertResult.rows[0].id;
      console.log(`Game created with id ${gameId}`);
    }

    dbClient.release();
  } catch (error) {
    console.error('Error creating game:', error);
  }
}

async function saveMessageToDB(username, message, rank) {
  try {
    const dbClient = await dbPool.connect();
    const result = await dbClient.query('SELECT id FROM games WHERE context_id = $1', [GAME_CONTEXT_ID]);

    if (result.rows.length > 0) {
      const gameId = result.rows[0].id;
      await dbClient.query('INSERT INTO messages (user_name, message, rank, game_id) VALUES ($1, $2, $3, $4)', [
        username,
        message,
        rank,
        gameId
      ]);
      console.log(`* Saved chat message: ${username}: ${message}`);
    }

    dbClient.release();
  } catch (error) {
    console.error('Error saving chat message:', error);
  }
}

// Function checks that the word is not in the database
// If the word is not in the database, then returns true
// If the word is in the database, then returns false
async function isWordNew(word) {
  try {
    const dbClient = await dbPool.connect();
    const result = await dbClient.query('SELECT * FROM messages WHERE message = $1 AND game_id IN (SELECT id FROM games WHERE context_id = $2)', [word, GAME_CONTEXT_ID]);
    dbClient.release();
    return result.rows.length === 0;
  } catch (error) {
    console.error('Error checking if word is new:', error);
  }
}

// Получить id игры по её context_id
// Если игра не найдена, то создать её и вернуть id

// Function gets game id by its context_id
// If the game is not found, then create it and return id
async function getGameId() {
  try {
    const dbClient = await dbPool.connect();
    const result = await dbClient.query('SELECT id FROM games WHERE context_id = $1', [GAME_CONTEXT_ID]);
    // Если игра не найдена, то создать её и вернуть id
    if (result.rows.length === 0) {
      await createGame();
      const newResult = await dbClient.query('SELECT id FROM games WHERE context_id = $1', [GAME_CONTEXT_ID]);
      dbClient.release();
      return newResult.rows[0].id;
    }
    dbClient.release();
    return result.rows[0].id;
  } catch (error) {
    console.error('Error getting game id:', error);
  }
}

module.exports = {
  createGamesTable,
  createMessagesTable,
  createDatabase,
  createGame,
  saveMessageToDB,
  isWordNew,
  getGameId,
};
