import express from "express";
const app = express.Router();

app.get("/Test", (req, res) => {
    res.send("Success");
});

export default app;