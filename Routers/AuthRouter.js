import express from "express";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const AuthRouter = express.Router();
const bcryptSalt = bcrypt.genSaltSync(10);

AuthRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign( 
        { id: foundUser.id, username: foundUser.username },
        process.env.JWT_SECRET,
        {},
        (err, token) => {
          if (err) throw err;
          res
            .cookie("token", token, { sameSite: "none", secure: true })
            .json({ message: "user loggedin", token: token })
            .status(200);
        }
      );
    } else {
      return res.status(401).json({ message: "Password invalid" });
    }
  } else {
    return res.status(400).json({ message: "user not found" });
  } 
});

AuthRouter.post("/register", async (req, res) => {
  const { username, password } = req.body;
  // checking if user already created
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    return res.status(409).json({ message: "user already registerd" });
  }

  const hashedpassword = bcrypt.hashSync(password, bcryptSalt);
  User.create({ username: username, password: hashedpassword })
    .then((doc) => {
      console.log(doc.id);
      jwt.sign(
        { id: doc.id, username: doc.username },
        process.env.JWT_SECRET,
        {},
        (err, token) => {
          if (err) throw err;
          res
            .cookie("token", token, { sameSite: "none", secure: true })
            .json({ message: "user created", token: token })
            .status(200);
        }
      );
    })
    .catch((err) => {
      console.log("error aagya hai ");
      return res
        .status(403)
        .json({ message: "Something went wrong in Authrouter" });
    });
});

export default AuthRouter;
