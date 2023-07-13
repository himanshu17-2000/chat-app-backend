import express from "express";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
const AppRouter = express.Router();
AppRouter.get("/messages", (req, res) => {
  const { sender, recipient } = req.query
  Message.find({
    sender: { $in: [sender, recipient] },
    recipient: { $in: [sender, recipient] }
  }).sort({ createdAt: 1 }).then((messages) => {
    return res.json(messages)
  }).catch(err => {
    return res.json({ message: "somthing went wrong" }).status(400)
  })
});

AppRouter.get('/people', (req, res) => {
  User.find({}, { "_id": 1, username: 1 }).then((users) => {
    return res.json(users)
  })
})
export default AppRouter;
