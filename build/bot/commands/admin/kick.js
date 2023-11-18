import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import User from "../../../model/user.js";
import functions from "../../../utilities/structs/functions.js";
import fs from "fs";

export const data = new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick someone out of their current session by their username.')
    .addStringOption(option => option.setName('username')
        .setDescription('The username of the user you want to kick')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone)
    .setDMPermission(false);

export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const { options } = interaction;
    const targetUsername = options.getString('username'); // Get the target username

    // Use async/await to find the user by username
    try {
        const target = await User.findOne({ username_lower: targetUsername.toLowerCase() });

        if (!target) {
            return interaction.editReply({ content: "The account username you entered does not exist.", ephemeral: true });
        }

        let refreshTokenIndex = global.refreshTokens.findIndex((i) => i.accountId === target.accountId);
        if (refreshTokenIndex !== -1) {
            global.refreshTokens.splice(refreshTokenIndex, 1);
        }

        let accessTokenIndex = global.accessTokens.findIndex((i) => i.accountId === target.accountId);
        if (accessTokenIndex !== -1) {
            global.accessTokens.splice(accessTokenIndex, 1);

            let xmppClient = global.Clients.find((client) => client.accountId === target.accountId);
            if (xmppClient) xmppClient.client.close();
        }

        if (accessTokenIndex !== -1 || refreshTokenIndex !== -1) {
            functions.UpdateTokens();

            const embed = new EmbedBuilder()
                .setTitle("User Kicked")
                .setDescription(`${targetUsername} has been kicked`)
                .setColor("#2b2d31")
                .setFooter({
                    text: "Revive",
                    iconURL: "https://media.discordapp.net/attachments/1123367135444471962/1139339199141658704/tiltedlogo.png",
                })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        interaction.editReply({ content: `There are no current active sessions by ${targetUsername}`, ephemeral: true });
    } catch (error) {
        console.error(error);
        interaction.editReply({ content: "An error occurred while processing the command.", ephemeral: true });
    }
}
