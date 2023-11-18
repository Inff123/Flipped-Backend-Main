import { ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Users from '../../../model/user.js';
import Profiles from '../../../model/profiles.js';
import GiftingKnowledge from '../../../model/gifting.js';
import axios from 'axios';

export const data = new SlashCommandBuilder()
    .setName('giftvbucks')
    .setDescription('Send another user your vbucks')
    .addUserOption(option => option.setName('user')
        .setDescription('The user you want to gift vbucks to')
        .setRequired(true))
    .addStringOption(option => option.setName('vbucks')
        .setDescription('The amount of vbucks you want to gift')
        .setRequired(true))
    .setDMPermission(false);

export async function execute(interaction) {
    try {
        let giftingCanceled = false; // Flag to track gifting status
        await interaction.deferReply({ ephemeral: true });
        const sender = await Users.findOne({ discordId: interaction.user.id });
        const recieverUser = interaction.options.getUser('user');
        const recieverUserId = recieverUser?.id;
        const recieveuser = await Users.findOne({ discordId: recieverUserId });

        // Check if user profiles exist
        if (!recieveuser) {
            return interaction.followUp({ content: "That user does not own an account", ephemeral: true });
        }

        if (!sender) {
            return interaction.followUp({ content: "You do not own an account", ephemeral: true });
        }

        if (recieveuser.id === sender.id) {
            return interaction.followUp({ content: "You cannot gift yourself", ephemeral: true });
        }

        const vbucks = parseInt(interaction.options.getString('vbucks'));

        if (isNaN(vbucks)) {
            return interaction.followUp({ content: "You need to type a valid number for vbucks", ephemeral: true });
        }

        if (vbucks < 0) {
            return interaction.followUp({ content: "You can't gift negative vbucks", ephemeral: true });
        }

        const currentuser = await Profiles.findOne({ accountId: sender?.accountId });

        // Check if the sender has enough vbucks to send
        const currency = currentuser?.profiles.common_core.items["Currency:MtxPurchased"].quantity;

        if (vbucks >= 5000) {
            return interaction.followUp({ content: "This gift has been flagged for containing too many vbucks. If it is legitimate, please create a support ticket", ephemeral: true });
        }

        if (vbucks < 100) {
            return interaction.followUp({ content: "You must gift 100 vbucks or above", ephemeral: true });
        }

        if (currency < vbucks) {
            return interaction.followUp({ content: `You have ${currency} Vbucks and don't have enough vbucks to gift`, ephemeral: true });
        }

        const existingGifting = await GiftingKnowledge.findOne({ discordId: interaction.user.id });

        async function gifting() {
            if (!existingGifting) {
                // If there is no existing document, create a new one for each user gifted to
                const newGifting = await GiftingKnowledge.create({
                    created: Date.now(),
                    discordId: interaction.user.id,
                    gifts: 3,
                    SentTo: [],
                });
                newGifting.SentTo.push({ username: recieveuser?.username, sentAmount: vbucks, SentDate: Date.now() });
                await newGifting.save();
            } else {
                // Find the entry for the recipient, if it exists
                const recipientEntry = existingGifting.SentTo.find(entry => entry.username === recieveuser?.username);
                if (!recipientEntry) {
                    // If there's no entry for the recipient, create one
                    existingGifting.SentTo.push({ username: recieveuser?.username, sentAmount: vbucks, SentDate: Date.now() });
                } else {
                    if (existingGifting.gifts === 0) {
                        if (recipientEntry.SentDate && Date.now() - new Date(recipientEntry.SentDate).getTime() < 24 * 60 * 60 * 1000) {
                            const timeLeft = 24 - Math.floor((Date.now() - new Date(recipientEntry.SentDate).getTime()) / (1000 * 60 * 60));
                            giftingCanceled = true; // Set the flag to cancel gifting
                            return interaction.followUp({
                                content: `You cannot send gifts anymore. Please wait the remainder: ${timeLeft} hours.`,
                                ephemeral: true
                            });
                        }
                    } else {
                        // If there is an existing entry for the recipient and they haven't exhausted their gifts, increment the gifts count by 1 and update the sentAmount
                        recipientEntry.sentAmount += vbucks;
                        recipientEntry.SentDate = Date.now();
                    }
                }
                existingGifting.gifts -= 1;
                await existingGifting.save();
            }
        }

        await gifting(); // Wait for gifting to complete

        // Check if there are remaining gifts
        if (giftingCanceled || (existingGifting && existingGifting.gifts === 0)) {
            return;
        }

        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirm purchase')
            .setStyle(ButtonStyle.Danger);
        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);
        const row = [
            { type: 1, components: [confirm.toJSON(), cancel.toJSON()] }
        ];
        const confirmationEmbed = new EmbedBuilder()
            .setTitle(`Are you sure you want to gift ${recieveuser.username} ${vbucks} Vbucks?`)
            .setDescription("Vbucks gifts are non-refundable, use at your own risk.")
            .setColor("#2b2d31")
            .setTimestamp();

        const confirmationResponse = await interaction.followUp({
            embeds: [confirmationEmbed],
            components: row,
            ephemeral: true
        });

        const filter = (i) => i.customId === 'cancel' || i.customId === 'confirm';
        const collector = confirmationResponse.createMessageComponentCollector({ filter, time: 10000 });

        collector.on("collect", async (i) => {
            try {
                if (i.customId === 'cancel') {
                    const cancelEmbed = new EmbedBuilder()
                        .setTitle("Gift cancelled")
                        .setDescription("Your account was not charged for this gift")
                        .setColor("#2b2d31")
                        .setTimestamp();
                    await i.update({ embeds: [cancelEmbed], components: [] });
                    giftingCanceled = true; // Set the flag to cancel gifting
                } else if (i.customId === 'confirm') {
                    if (giftingCanceled) {
                        await confirmationResponse.delete();
                        return;
                    } else {
                        // Continue with gifting
                        await i.deferUpdate(); // Acknowledge the button click here

              // Process vbucks transfer and notifications
              const recievervbucks = await Profiles.findOneAndUpdate({ accountId: recieveuser?.accountId }, { $inc: { 'profiles.common_core.items.Currency:MtxPurchased.quantity': vbucks } });
              const sendervbucks = await Profiles.findOneAndUpdate({ accountId: currentuser?.accountId }, { $inc: { 'profiles.common_core.items.Currency:MtxPurchased.quantity': -vbucks } });

              if (!sendervbucks) {
                  return interaction.followUp({ content: "User Profile failure or account does not exist", ephemeral: true });
              }

              if (!recievervbucks) {
                  return interaction.followUp({ content: "Profile failure or account does not exist", ephemeral: true });
              }
              axios.post("http://127.0.0.1:3551/fortnite/api/game/v3/profile/*/client/emptygift", {
                  offerId: "e406693aa12adbc8b04ba7e6409c8ab3d598e8c3",
                  currency: "MtxCurrency",
                  currencySubType: "",
                  expectedTotalPrice: "0",
                  gameContext: "",
                  receiverAccountIds: [recieveuser.accountId],
                  giftWrapTemplateId: "GiftBox:gb_makegood",
                  personalMessage: "Your personal message here",
                  accountId: recieveuser.accountId,
                  playerName: recieveuser.username
              })
              .then(function (response) {
                  // Handle the response if needed
              })
              .catch(function (error) {
                  console.log(error);
                  return res.status(404).json({ error: 'Something went wrong' });
              });
              axios.post("http://127.0.0.1:3551/fortnite/api/game/v3/profile/*/client/emptygift", {
                  offerId: "e406693aa12adbc8b04ba7e6409c8ab3d598e8c3",
                  currency: "MtxCurrency",
                  currencySubType: "",
                  expectedTotalPrice: "0",
                  gameContext: "",
                  receiverAccountIds: [sender.accountId],
                  giftWrapTemplateId: "GiftBox:gb_makegood",
                  personalMessage: "Your personal message here",
                  accountId: sender.accountId,
                  playerName: sender.username
              })
              .then(function (response) {
                  // Handle the response if needed
              })
              .catch(function (error) {
                  console.log(error);
                  return res.status(404).json({ error: 'Something went wrong' });
              });

                        const embed = new EmbedBuilder()
                            .setTitle("Vbucks Sent")
                            .setDescription(`Gifted ${vbucks} vbucks to ${recieveuser.username}`)
                            .setColor("#2b2d31")
                            .setTimestamp();
                        await interaction.followUp({ embeds: [embed], ephemeral: true });

                        // Notify the recipient
                        try {
                            const recipientUser = await client.users.fetch(recieveuser?.discordId);
                            await recipientUser.send({ content: `${sender?.username} has gifted you ${vbucks} vbucks!` });
                        } catch {
                            await interaction.followUp({
                                content: `${recieveuser.username} does not have their DMs enabled, so they have not been notified`,
                                ephemeral: true
                            });
                        } finally {
                            // Remove the message components (buttons) after processing
                            await confirmationResponse.edit({ components: [] });
                        }
                    }
                }
            } catch (error) {
                //console.error(error);
                // Handle any unexpected errors here
            }
        });
    } catch (error) {
        //console.error(error);
        // Handle any unexpected errors here
    }
}
