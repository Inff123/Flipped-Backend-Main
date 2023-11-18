import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Users from '../../../model/user.js';
import Profiles from '../../../model/profiles.js';
import axios from 'axios';
export const data = new SlashCommandBuilder()
    .setName('vbucks')
    .setDescription('Lets you change a users amount of vbucks')
    .addUserOption(option => option.setName('user')
    .setDescription('The user you want to change the vbucks of')
    .setRequired(true))
    .addStringOption(option => option.setName('vbucks')
    .setDescription('The amount of vbucks you want to give (Can be a negative number to take vbucks)')
    .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone)
    .setDMPermission(false);
export async function execute(interaction) {
    const selectedUser = interaction.options.getUser('user');
    const selectedUserId = selectedUser?.id;
    const user = await Users.findOne({ discordId: selectedUserId });
    if (!user)
        return interaction.reply({ content: "That user does not own an account", ephemeral: true });
    const vbucks = parseInt(interaction.options.getString('vbucks'));
    const profile = await Profiles.findOneAndUpdate({ accountId: user.accountId }, { $inc: { 'profiles.common_core.items.Currency:MtxPurchased.quantity': vbucks } });
    if (!profile)
        return interaction.reply({ content: "That user does not own an account", ephemeral: true });
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
            // Handle the response if needed
        })
        .catch(function (error) {
            console.log(error);
            return res.status(404).json({ error: 'Something went wrong' });
        });
    const embed = new EmbedBuilder()
        .setTitle("vBucks changed")
        .setDescription("Successfully changed the amount of vbucks for <@" + selectedUserId + "> by " + vbucks)
        .setColor("#2b2d31")
        .setFooter({
        text: "Revive",
        iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
    })
        .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
//# sourceMappingURL=vbucks.js.map