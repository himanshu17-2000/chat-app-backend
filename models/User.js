import mongoose, { model } from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    password: String,
    avatar: {
      type: String,
      default: process.env.DEFAULT_AVATAR,
    },
  },
  { timestamps: true }
);
export const User = mongoose.model("User", UserSchema);
