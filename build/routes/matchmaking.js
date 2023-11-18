import Safety from "../utilities/safety.js";

import express from "express";
const app = express.Router();
import functions from "../utilities/structs/functions.js";
import MMCode from "../model/mmcodes.js";
import { verifyToken } from "../tokenManager/tokenVerify.js";
import qs from "qs";
import error from "../utilities/structs/error.js";

const mmclients = new Map();
let buildUniqueId = {};


app.get("/fortnite/api/matchmaking/session/findPlayer/*", (req, res) => {
    res.status(200).end();
});

app.get("/fortnite/api/game/v2/matchmakingservice/ticket/player/*", verifyToken, async (req, res) => {
    const playerCustomKey = qs.parse(req.query, { ignoreQueryPrefix: true })["player.option.customKey"];
    const bucketId = qs.parse(req.query, { ignoreQueryPrefix: true })["bucketId"];
    if (typeof bucketId !== "string" || bucketId.split(":").length !== 4) {
        return res.status(400).end();
    }
    const region = bucketId.split(":")[2];
    const playlist = bucketId.split(":")[3];
    const gameServers = Safety.env.GAME_SERVERS;
    const selectedServer = gameServers.find((server) => server.split(":")[2] === playlist);
    if (!selectedServer) {
        return error.createError("errors.com.epicgames.common.matchmaking.playlist.not_found", `No server found for playlist ${playlist}`, [], 1013, "invalid_playlist", 404, res);
    }
    if (typeof playerCustomKey === "string") {
        const codeDocument = await MMCode.findOne({ code_lower: playerCustomKey?.toLowerCase() });
        if (!codeDocument) {
            return error.createError("errors.com.epicgames.common.matchmaking.code.not_found", `The matchmaking code "${playerCustomKey}" was not found`, [], 1013, "invalid_code", 404, res);
        }
        mmclients.set(req.user.accountId, {
            accountId: req.user.accountId,
            customKey: playerCustomKey,
            region: region,
            playlist: playlist,
            ip: codeDocument.ip,
            port: codeDocument.port,
        });
    }
    else {
        mmclients.set(req.user.accountId, {
            accountId: req.user.accountId,
            customKey: playerCustomKey,
            region: region,
            playlist: playlist,
            ip: selectedServer.split(":")[0],
            port: parseInt(selectedServer.split(":")[1]),
        });
    }
    if (typeof req.query.bucketId !== "string" || req.query.bucketId.split(":").length !== 4) {
        return res.status(400).end();
    }
    buildUniqueId[req.user.accountId] = req.query.bucketId.split(":")[0];
    const memory = functions.GetVersionInfo(req);
    console.log(memory, region);
    const partyId = "@ikjdfiuosdfuyidsufb@";
    const payload = {
        playerId: req.user.accountId,
        partyPlayerIds: [req.user.accountId],
        bucketId: bucketId,
        attributes: {
            "player.subregions": region,
            "player.role": req.user.role,
            "player.season": memory.season,
            "player.option.partyId": partyId,
            "player.userAgent": memory.CL,
            "player.platform": "Windows",
            "player.option.linkType": "DEFAULT",
            "player.preferredSubregion": region,
            "player.input": "KBM",
            "playlist.revision": 1,
            ...(playerCustomKey && { customKey: playerCustomKey }),
            "player.option.fillTeam": false,
            "player.option.linkCode": playerCustomKey ? playerCustomKey : "none",
            "player.option.uiLanguage": "en",
            "player.privateMMS": playerCustomKey ? true : false,
            "player.option.spectator": false,
            "player.inputTypes": "KBM",
            "player.option.groupBy": playerCustomKey ? playerCustomKey : "none",
            "player.option.microphoneEnabled": true,
        },
        expireAt: new Date(Date.now() + 1000 * 30).toISOString(),
    };
    const data = Buffer.from(JSON.stringify(payload));

    const matchmakerIP = Safety.env.MATCHMAKER_IP;
    return res.json({
        "serviceUrl": matchmakerIP.includes("ws") || matchmakerIP.includes("wss") ? matchmakerIP : `ws://${matchmakerIP}`,
        "ticketType": "mms-player",
        "signature": signatureHash,
    });
});

app.get("/fortnite/api/game/v2/matchmaking/account/:accountId/session/:sessionId", (req, res) => {
    res.json({
        "accountId": req.params.accountId,
        "sessionId": req.params.sessionId,
        "key": "none",
    });
});

app.get("/fortnite/api/matchmaking/session/:sessionId", verifyToken, async (req, res) => {
    console.log("Requested to join");
    if (!mmclients.has(req.user.accountId)) {
        return error.createError("errors.com.epicgames.common.matchmaking.session.not_found", `The matchmaking session "${req.params.sessionId}" was not found`, [], 1013, "invalid_session", 404, res);
    }
    const client = mmclients.get(req.user.accountId);
    if (!client)
        return res.status(400).end();
    res.json({
        "id": req.params.sessionId,
        "ownerId": functions.MakeID().replace(/-/gi, "").toUpperCase(),
        "ownerName": "[DS]fortnite-liveeugcec1c2e30ubrcore0a-z8hj-1968",
        "serverName": "[DS]fortnite-liveeugcec1c2e30ubrcore0a-z8hj-1968",
        "serverAddress": client.ip,
        "serverPort": client.port,
        "maxPublicPlayers": 220,
        "openPublicPlayers": 175,
        "maxPrivatePlayers": 0,
        "openPrivatePlayers": 0,
        "attributes": {
            "REGION_s": "EU",
            "GAMEMODE_s": "FORTATHENA",
            "ALLOWBROADCASTING_b": true,
            "SUBREGION_s": "GB",
            "DCID_s": "FORTNITE-LIVEEUGCEC1C2E30UBRCORE0A-14840880",
            "tenant_s": "Fortnite",
            "MATCHMAKINGPOOL_s": "Any",
            "STORMSHIELDDEFENSETYPE_i": 0,
            "HOTFIXVERSION_i": 0,
            "PLAYLISTNAME_s": client.playlist,
            "SESSIONKEY_s": functions.MakeID().replace(/-/gi, "").toUpperCase(),
            "TENANT_s": "Fortnite",
            "BEACONPORT_i": 15009,
        },
        "publicPlayers": [],
        "privatePlayers": [],
        "totalPlayers": 0,
        "allowJoinInProgress": false,
        "shouldAdvertise": false,
        "isDedicated": false,
        "usesStats": false,
        "allowInvites": false,
        "usesPresence": false,
        "allowJoinViaPresence": true,
        "allowJoinViaPresenceFriendsOnly": false,
        "buildUniqueId": buildUniqueId[req.user.accountId] || "0",
        "lastUpdated": new Date().toISOString(),
        "started": false,
    });
});

app.post("/fortnite/api/matchmaking/session/*/join", (req, res) => {

    res.status(204).end();
});

app.post("/fortnite/api/matchmaking/session/matchMakingRequest", (req, res) => {

    res.json([]);
});

export default app;