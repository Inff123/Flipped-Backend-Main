import express from "express";
const app = express();
const bcrypt = import("bcrypt");
import User from "./model/user.js";
import Profile from "./model/profiles.js";
import functions from "./utilities/structs/functions.js";
import fs from "fs";
import Safety from './utilities/safety.js';
const APIKEY = Safety.env.APIKEY


app.get("/api", async (req, res) =>{
    const currentDate = new Date();
   res.json({ currentDate: currentDate.toISOString(), status: "online" });
   return res.status(200)
})

app.get("/api/vbucks", async (req, res) => {
    const { apikey, username, addValue, reason } = req.query;
    if (!apikey)
    {
        res.json({ code: "400", error: "APIKEY no provided" });
        return res.status(400)
    }
    if (!username)
    {
        res.json({ code: "400", error: "Username not provided" });
        return res.status(400)
    }
    if (!addValue)
    {
        res.json({ code: "400", error: "Add value not provided" });
        return res.status(400)
    }
    if (!reason)
    {
        res.json({ code: "400", error: "Reason not provided" });
        return res.status(400)
    }
    
   const apiusername = username.toLowerCase();
    if (apikey == APIKEY) {
        try {
            const user = await User.findOne({ username_lower: apiusername });
            if (user) {
                const multiplier = user.isDonator ? 1.5 : 1; // Check if user is a donator
                if (reason === "Kills") {
                    await User.updateOne({ username_lower: apiusername }, { $inc: { statisticsKills: 1 } });
                }
                else if (reason === "Top10") {
                    await User.updateOne({ username_lower: apiusername }, { $inc: { statisticsTop10: 1 } });
                }
                else if (reason === "Top5") {
                    await User.updateOne({ username_lower: apiusername }, { $inc: { statisticsTop5: 1 } });
                }
                else if (reason === "Wins") {
                    await User.updateOne({ username_lower: apiusername }, { $inc: { statisticsWins: 1 } });
                }
                const filter = { accountId: user.accountId };
                const update = { $inc: { 'profiles.common_core.items.Currency:MtxPurchased.quantity': parseInt(addValue) * multiplier } }; // Apply multiplier
                const options = { new: true };
                const updatedProfile = await Profile.findOneAndUpdate(filter, update, options);
                if (updatedProfile) {
                    const newQuantity = updatedProfile.profiles.common_core.items['Currency:MtxPurchased'].quantity;
                    Profile.findOne(filter);
                    console.log(`Vbucks given ${lowerUsername}, ${addValue}, ${reason}`);
                    return res.status(200).json({ quantity: newQuantity });
                }
                else {
                    return res.status(404).send('Profile not found or item not found.');
                }
            }
            else {
                return res.status(404).send('User not found.');
            }
         
        }
        catch (err) {
            res.json({ code: "500", error: err });
            return res.status(500)
        }
    }
    else {
        res.json({ code: "401", error: "Invalid API key" });
        return res.status(401)
    }
});
