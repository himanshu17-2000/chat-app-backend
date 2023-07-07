import mongoose, { model } from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    password: String,
  },
  { timestamps: true }
);
export const User = mongoose.model("User", UserSchema);
