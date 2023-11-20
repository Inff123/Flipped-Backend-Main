import { Router } from "express";
import discovery from "./discoverystuff/discovery_frontend.json";

const express = Router();

express.post("/fortnite/api/game/v2/creative/discovery/surface/*", async (req, res) => {
    res.json(discovery);
})

export default express;
