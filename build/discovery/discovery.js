import { Router } from "express";
import discovery from "./discoverystuff/discovery_frontend.json";

const express = Router();

express.post("/fortnite/api/game/v2/creative/discovery/surface/*", async (req, res) => {
    switch (req.body.surfaceName) {
        case "CreativeDiscoverySurface_Frontend":
            if (req.body.panelName) {
                for (var i in discovery.Panels) {
                    if (discovery.Panels[i].PanelName == req.body.panelName) {
                        res.json(discovery.Panels[i].Pages[req.body.pageIndex || 0])
                    }
                }
            } else {
                res.json(discovery);
            }
        break;

        default:
            res.json({});
    }
})

export default express;
