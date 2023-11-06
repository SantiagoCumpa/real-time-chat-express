import express from 'express';
import logger from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'node:http'
import mysql from 'mysql2/promise';
import 'dotenv/config';

const DEFAULT_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'rtchat'
}

const connectString = process.env.DATABASE_URL ?? DEFAULT_CONFIG;

const connection = await mysql.createConnection(connectString);

const app = express();
// create server https with app
const server = createServer(app);
// io websocket server
const io = new Server(server, {
  // recovery messages offline
  connectionStateRecovery: {}
});

// If a new user connects
io.on('connection', async (socket) => {
  console.log('User connected');
  // if user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected');
  })
  // recovery messages
  socket.on('chat message', async (msg) => {
    let result;
    const username = socket.handshake.auth.username;
    try {
      result = await connection.query('INSERT INTO message (content, username) VALUES (?, ?)', [msg, username]);
    } catch (error) {
      console.log(error);
    }
    io.emit('chat message', msg, result[0].insertId, username);
  })

  if (!socket.recovered) {
    try {
      const [rows] = await connection.query('SELECT * FROM message WHERE id > ?', [socket.handshake.auth.serverOffset ?? 0]);

      rows.forEach(row => {
        // server emit message, id and username to the client
        socket.emit('chat message', row.content, row.id.toString(), row.username);
      })
    } catch (error) {
      console.log(error);
    }
  }
})

app.use(logger('dev'))

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html');
})

const port = process.env.PORT ?? 3000;
// listening server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
})