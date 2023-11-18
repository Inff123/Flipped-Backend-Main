import { Router } from "express";
import discovery from "./discoverystuff/discovery_frontend.json";

const express = Router();

express.post("*/discovery/surface/*", async (req, res) => {
    res.json(discovery);
});

express.post("/links/api/fn/mnemonic", async (req, res) => {
    const MnemonicArray = [];

    for (const result of discovery.Panels[0].Pages[0].results) {
        MnemonicArray.push(result.linkData);
    }

    res.json(MnemonicArray);
});

express.get("/links/api/fn/mnemonic/*", async (req, res) => {
    const requestedMnemonic = req.url.split("/").slice(-1)[0];
    
    for (const result of discovery.Panels[0].Pages[0].results) {
        if (result.linkData.mnemonic === requestedMnemonic) {
            res.json(result.linkData);
            return;
        }
    }
    res.status(404).json({ error: "Mnemonic not found" });
});

export default express;
