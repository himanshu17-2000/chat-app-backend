import express from "express";
const AppRouter = express.Router();
AppRouter.get("/", (req, res) => {
  return res.json("Hello moto");
});
export default AppRouter;
 