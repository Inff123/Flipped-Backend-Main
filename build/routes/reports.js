import express from "express";
const app = express.Router();
import { verifyToken } from "../tokenManager/tokenVerify.js";
import User from "../model/user.js";
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import Safety from '../utilities/safety.js';
import functions from "../utilities/structs/functions.js";

app.post("/fortnite/api/game/v2/toxicity/account/:unsafeReporter/report/:reportedPlayer", verifyToken, async (req, res) => {
    try {
        const reporter = req.user.accountId;
        const reportedPlayer = req.params.reportedPlayer;
        let reporterData = await User.findOne({ accountId: reporter }).lean();
        let reportedPlayerData = await User.findOne({ accountId: reportedPlayer }).lean();
        
        const reason = req.body.reason || 'No reason provided';
        const details = req.body.details || 'No details provided';
        const markedasknown = req.body.bUserMarkedAsKnown ? 'Yes' : 'No'; 
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
            ]
        });
  
        if (reportedPlayerData.Reports === undefined) {
            reportedPlayerData.Reports = 1; // If Reports is undefined, set it to 1.
          } else {
            reportedPlayerData.Reports += 1; // If Reports exists, increment it by 1.
          }

        await new Promise((resolve, reject) => {
            client.once('ready', async () => {
                console.log(`Logged in as ${client.user.tag}!`);
        
                try {
                    const payload = {
                        embeds: [{
                            title: 'A new report was sent',
                            description: 'Would you like to ban this user?',
                            color: 16711680,
                            fields: [
                                {
                                    name: "Reporter",
                                    value: reporterData.username,
                                    inline: true
                                },
                                {
                                    name: "Reported",
                                    value: reportedPlayerData.username,
                                    inline: true
                                },
                                {
                                    name: "Marked As Known",
                                    value: markedasknown,
                                    inline: true
                                },
                                {
                                    name: "Reason",
                                    value: reason,
                                    inline: true // Make this field take up the full width
                                },
                                {
                                    name: "Details",
                                    value: details,
                                    inline: true // Make this field take up the full width
                                }
                            ]
                        }]
                    };                    
                    
                    console.log('Embed sent successfully!');
            
                    const channel = await client.channels.cache.get('1150042340430450728'); // Replace with the actual channel ID
                    
                    if (channel instanceof TextChannel) {
                        // Log the message ID of the sent message
                        console.log(`Message sent with ID: ${channel.id}`);
                        if (channel) {
                            // Send the embed using the bot (not webhook)
                            const message = await channel.send(payload);
                
                            // Log the message ID of the sent message
                            console.log(`Message sent with ID: ${message.id}`);
                
                            await message.react('✅'); // Green check mark
                            await message.react('⚠️');
                            await message.react('❌'); // Red X
                
                            const filter = (reaction, user) => {
                                return ['✅', '❌'].includes(reaction.emoji.name) && !user.bot;
                            };
                
                            const collector = message.createReactionCollector({ filter, time: 60000 });
                
                            collector.on('collect', async (reaction, user) => {
                                if (reaction.emoji.name === '✅') {
                                    const targetUser = await User.findOne({ username_lower: reportedPlayerData.username_lower });
                                    if (!targetUser)
                                        await channel.send("The account user does not exist.");
                                    else if (targetUser.banned == true)
                                        await channel.send("This account is already banned.");
                                    if (targetUser && targetUser.banned !== true) {
                                        await targetUser.updateOne({ $set: { banned: true } });
                                        let refreshToken = global.refreshTokens.findIndex(i => i.accountId == targetUser.accountId);
                                        if (refreshToken != -1)
                                            global.refreshTokens.splice(refreshToken, 1);
                                        let accessToken = global.accessTokens.findIndex(i => i.accountId == targetUser.accountId);
                                        if (accessToken != -1) {
                                            global.accessTokens.splice(accessToken, 1);
                                            let xmppClient = global.Clients.find(client => client.accountId == targetUser.accountId);
                                            if (xmppClient)
                                                xmppClient.client.close();
                                        }
                                        if (accessToken != -1 || refreshToken != -1)
                                            await functions.UpdateTokens();
                                        await channel.send(reportedPlayerData.username + " has been banned.");
                                        client.destroy();
                                    }
                                } else if (reaction.emoji.name === '⚠️') 
                                {
                                    await channel.send("User has has a total of " + reportedPlayerData.Reports + " pending reports.");
                                    client.destroy();
                                } else if (reaction.emoji.name === '❌') 
                                {
                                    if (reportedPlayerData.Reports < 1) 
                                    {
                                    reportedPlayerData.Reports -= 1; 
                                    }
                                    await channel.send("Report has been cancelled.");
                                    client.destroy();
                                }
                                else {
                                    await channel.send("Please select a valid response.");
                                }
                            });
                        } else {
                            console.error("Channel not found or bot doesn't have access.");
                        }
                
                    } else {
                        console.error("Channel is not a text channel or bot does not have access to it.");
                    }

                    resolve(); // Resolve the promise when the bot is done
                } catch (error) {
                    console.log('Error:', error);
                    reject(error); // Reject the promise if an error occurs
                }
            });
        
            // Log in to Discord
            client.login(Safety.env.BOT_TOKEN);
        });

        try {
            await User.findOneAndUpdate({ accountId: reportedPlayer }, { $inc: { reports: 1 } }, { new: true });
        } catch (err) {
            console.error(err);
        }

        res.status(200).send({ "success": true });
    } catch (error) {
        console.error(error);
        res.status(500).send({ "error": "Internal server error" });
    }
});

export default app;
