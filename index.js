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
  if (activeConnections.has(connection)) {
    connection.close(); // Close the duplicate connection
    return;
  }
  activeConnections.add(connection);

  jwt.verify(
    req.headers["sec-websocket-protocol"],
    process.env.JWT_SECRET,
    {},
    (err, client_data) => {
      if (err) throw err;
      console.log(client_data);
      const { id, username } = client_data;
      connection.id = id;
      connection.username = username;
    }
  );
  console.log([...wss.clients].map((c) => c.username));
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

  connection.on("close", () => {
    // Remove the connection from activeConnections set when the client disconnects
    activeConnections.delete(connection);
  });
});
