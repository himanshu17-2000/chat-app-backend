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
dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use("/auth", AuthRouter);
app.use("/app", AppRouter);
app.get("/", (req, res) => {
  res.send("home");
});

dbconnector();
const server = app.listen(process.env.PORT, () => {
  console.log(`server is listening to ${process.env.PORT}`);
});
const wss = new WebSocketServer({ server });
const activeConnections = new Set();
wss.on("connection", (connection, req) => {
  console.log("Websocket connected");

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

  // notifying all the clients who are online
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

  connection.on("message", (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text, sender } = messageData;
    console.log(messageData);
    // we can use this sender also but in video we used connection.id
    if (recipient && text) {
      Message.create({
        sender: sender,
        recipient: recipient,
        text: text,
      }).then((messageDoc) => {
        [...wss.clients]
          .filter((c) => c.id === messageDoc.recipient)
          .forEach((c) =>
            c.send(
              JSON.stringify({
                id: messageDoc.id,
                text: messageDoc.text,
                sender: messageDoc.sender,
                recipient: messageDoc.recipient,
              })
            )
          );
        console.log(messageDoc);
      });
    }
  });
});
