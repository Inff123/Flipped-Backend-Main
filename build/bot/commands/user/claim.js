import { ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Users from '../../../model/user.js';
import Profiles from '../../../model/profiles.js';
import axios from 'axios';

export const data = new SlashCommandBuilder()
    .setName('claimvbucks')
    .setDescription('Claim your daily 400 V-Bucks')
    .setDMPermission(false);

export async function execute(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const user = await Users.findOne({ discordId: interaction.user.id });
        if (!user) {
            return interaction.followUp({ content: "You do not own an account", ephemeral: true });
        }

        const userProfile = await Profiles.findOne({ accountId: user?.accountId });

        const lastClaimed = userProfile?.profiles?.lastVbucksClaim;
        if (lastClaimed && (Date.now() - new Date(lastClaimed).getTime() < 24 * 60 * 60 * 1000)) {
            const timeLeft = 24 - Math.floor((Date.now() - new Date(lastClaimed).getTime()) / (1000 * 60 * 60));
            return interaction.followUp({
                content: `You have already claimed your daily V-Bucks. Please wait the remainder: ${timeLeft} hours.`,
                ephemeral: true
            });
        }

        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirm Claim')
            .setStyle(ButtonStyle.Success);
        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);
        const row = [
            { type: 1, components: [confirm.toJSON(), cancel.toJSON()] }
        ];
        const confirmationEmbed = new EmbedBuilder()
            .setTitle(`Claim your daily 400 V-Bucks?`)
            .setDescription("Once claimed, you cannot reclaim for the next 24 hours.")
            .setColor("1eff00")
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
                        .setTitle("V-Bucks Claim cancelled")
                        .setDescription(`Your request to claim the daily V-Bucks has been successfully cancelled. If you change your mind, you can initiate the claim process again.`)
                        .setColor("#ff0000")
                        .setTimestamp();
                    await i.update({ embeds: [cancelEmbed], components: [] });
                } else if (i.customId === 'confirm') {
                    await i.deferUpdate(); 

                    await Profiles.findOneAndUpdate(
                        { accountId: user?.accountId }, 
                        { 
                            $inc: { 'profiles.common_core.items.Currency:MtxPurchased.quantity': 400 }, 
                            'profiles.lastVbucksClaim': Date.now() 
                        }
                    );
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
                        playerName: user.username
                    })
                    .then(function (response) {
                    })
                    .catch(function (error) {
                        console.log(error);
                        return res.status(404).json({ error: 'Something went wrong' });
                    }); 
                    const embed = new EmbedBuilder()
                        .setTitle("400 V-Bucks Claimed")
                        .setDescription(`You have claimed your daily 250 V-Bucks!`)
                        .setThumbnail ("https://media.discordapp.net/attachments/1134514551606476810/1152156761793511425/250vbucks.png")
                        .setColor("#1eff00")
                        .setTimestamp();
                    await interaction.followUp({ embeds: [embed], ephemeral: true });
                    await confirmationResponse.edit({ components: [] });
                }
            } catch (error) {
                console.error(error);
            }
        });
    } catch (error) {
        console.error(error);
    }
}
