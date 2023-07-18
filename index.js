import express from "express";
import AuthRouter from "./Routers/AuthRouter.js";
import AppRouter from "./Routers/AppRouter.js";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose, { connect } from "mongoose";
import dotenv from "dotenv";
import dbconnector from "./utils/db.js";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { Message } from "./models/Message.js";
import fs from 'fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use("/auth", AuthRouter);
app.use('/uploads', express.static('uploads'));
app.use("/app", AppRouter);
app.get("/", (req, res) => {
  res.send("home");
});

dbconnector();

const server = app.listen(process.env.PORT, () => {
  console.log(`Himanshu server is listening to ${process.env.PORT}`);
});

const wss = new WebSocketServer({ server });
const activeConnections = new Set();

wss.on("connection", (connection, req) => {
  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            id: c.id,
            username: c.username,
          })),
        })
      );
    });
  }
  connection.isAlive = true;
  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false
      clearInterval(connection.timer)
      connection.terminate()
      notifyAboutOnlinePeople()
      console.log('dead')
    }, 1000)
  }, 5000)

  connection.on('pong', () => {
    clearTimeout(connection.deathTimer)
  })

  jwt.verify(
    req.headers["sec-websocket-protocol"],
    process.env.JWT_SECRET,
    {},
    (err, client_data) => {
      if (err) throw err;
      const { id, username } = client_data;
      connection.id = id;
      connection.username = username;
    }
  );




  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text, sender, file } = messageData;
    let filename = null
    if (file) {
      console.log('size', file.data.length)
      const parts = file.name.split('.')
      const ext = parts[parts.length - 1];
      filename = Date.now() + '.' + ext
      const path = __dirname + "./uploads/" + filename
      const bufferData = new Buffer(file.data.split(',')[1], 'base64')
      fs.writeFile(path, bufferData, () => {
        console.log('file saved:' + path)
      })
    }
    // we can use this sender also but in video we used connection.id
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender: connection.id,
        recipient: recipient,
        text: text,
        file: file ? filename : null,
      });

      [...wss.clients].filter(c => c.id === recipient)
        .forEach(c => c.send(JSON.stringify({
          _id: messageDoc._id,
          text: text,
          sender: connection.id,
          file: file ? filename : null,
          recipient: recipient,
        })))
    }
    // notifying all the clients who are online
    notifyAboutOnlinePeople()

  });
});

