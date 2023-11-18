import express from "express";
import path from "path";
const app = express.Router();
import { dirname } from 'dirname-filename-esm';
const __dirname = dirname(import.meta);
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import Profile from '../model/profiles.js';
import User from '../model/user.js';
import log from "../utilities/structs/log.js";
import createClient from '../tokenManager/tokenCreation.js'
import { env } from "process";

app.get('/rewardPlayer', async function(req, res) {
    try 
    {
    let playerName = req.query.playerName;
    let vbucks = req.query.amount;
    const authkey = req.query.authkey;
    if (vbucks > 1000) 
    {
        return res.status(400).json({error: 'limit reached.'});
    }
    if (authkey == process.env.AUTHKEY) 
    {
    if (!playerName) {
        return res.status(400).json({error: 'playerName is required'});
    }

    let user = await User.findOne({ username_lower: playerName.toLowerCase() }).lean();

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    let profile = await Profile.findOne({ accountId: user.accountId });

    if (!profile.profiles.common_core.items['Currency:MtxPurchased']) {
        profile.profiles.common_core.items['Currency:MtxPurchased'] = { quantity: 0 };
    }
    let initialQuantity = profile.profiles.common_core.items['Currency:MtxPurchased'].quantity;

    if (isNaN(vbucks)) 
    {
        console.log("Not a number?");
        return res.status(404).json({ error: 'Vbucks is not a number' });
    }
    // Convert vbucks and initial quantity to integers before adding
    vbucks = parseInt(vbucks, 10);
    initialQuantity = parseInt(initialQuantity, 10);

    let newQuantity = initialQuantity + vbucks;

    profile.profiles.common_core.items['Currency:MtxPurchased'].quantity = newQuantity;

    // Mark the path as modified to ensure the changes are saved
    profile.markModified('profiles.common_core.items.Currency:MtxPurchased');

    // Save the updated profile document
    let result = await profile.save();

      axios.post("http://127.0.0.1:3551/fortnite/api/game/v3/profile/*/client/emptygift", {
        offerId: "e406693aa12adbc8b04ba7e6409c8ab3d598e8c3",
        currency: "MtxCurrency",
        currencySubType: "",
        expectedTotalPrice: "0",
        gameContext: "",
        receiverAccountIds: [user.accountId],
        giftWrapTemplateId: "GiftBox:gb_makegood",
        personalMessage: "Your personal message here",
        accountId: user.accountId,
        playerName: playerName
    })
    .then(function (response) {
        // Handle the response if needed
    })
    .catch(function (error) {
        console.log(error);
        return res.status(404).json({ error: 'Something went wrong' });
    });

      log.xmpp(`Player ${user.username} has been rewarded with ${vbucks} vBucks. Initial quantity was ${initialQuantity}, new quantity is ${profile.profiles.common_core.items['Currency:MtxPurchased'].quantity}`);
      return res.status(200).json({ success: 'Command successfully executed.' });
    } else {
        console.log("Auth key invalid?");
        console.log("Gotten: " + authkey + " Expected: " + process.env.AUTHKEY);
        return res.status(404).json({ error: 'invalid authkey' });
    }
    } catch {
        console.log("INTERNAL ERROR: Addvbucks");
        return res.status(404).json({ error: 'internal error' }
    );}
})

export default app;
