import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import functions from "../../../utilities/structs/functions.js";
import log from "../../../utilities/structs/log.js";
import Users from '../../../model/user.js';
import Badwords from "bad-words";

const badwords = new Badwords();

export const data = new SlashCommandBuilder()
    .setName('create')
    .setDescription('Creates an account for you')
    .addStringOption(option => option.setName('username')
        .setDescription('The username you want to use')
        .setRequired(true))
    .addStringOption(option => option.setName('email')
        .setDescription('The email you want to use')
        .setRequired(true))
    .addStringOption(option => option.setName('password')
        .setDescription('The password you want to use')
        .setRequired(true));

export async function execute(interaction) {
    const ALLOWED_CHANNEL_ID = '1175267607658635304';
    if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
        return interaction.reply({ content: "Please register in the <#1175267607658635304> channel.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const discordId = interaction.user.id;
    const username = interaction.options.getString('username');
    const email = interaction.options.getString('email');
    const plainPassword = interaction.options.getString('password');
    const user = await Users.findOne({ discordId: interaction.user.id });

    // ... [rest of the user validation code]

    if (user)
        return interaction.editReply({ content: "You are already registered!" });
    await functions.registerUser(discordId, username, email, plainPassword, false).then(async (res) => {
        const embed = new EmbedBuilder()
            .setTitle("Account created")
            .setColor("#FFFFFF")
            .setDescription("Your account has been successfully created")
            .addFields({
            name: "Username",
            value: username,
            inline: false
        }, {
            name: "Email",
            value: email,
            inline: false
        })
            .setColor("#FFFFFF")
            .setFooter({
            text: "Revive",
            iconURL: "https://media.discordapp.net/attachments/1123367135444471962/1139339199141658704/tiltedlogo.png",
        })
        const publicEmbed = new EmbedBuilder()
        .setTitle("New registration")
        .setColor("#FFFFFF")
        .setThumbnail(interaction.user.avatarURL({ format: 'png', dynamic: true, size: 256 }))
        .addFields({
            name: "Message",
            value: "Successfully created an account.",
        }, {
            name: "Username",
            value: username,
        }, {
            name: "Discord Tag",
            value: interaction.user.tag,
        })
        .setColor("#FFFFFF")
        .setFooter({
            text: "Revive",
            iconURL: "https://media.discordapp.net/attachments/1123367135444471962/1139339199141658704/tiltedlogo.png",
        })
        .setTimestamp();
    await interaction.channel?.send({ embeds: [publicEmbed] });
    }).catch((err) => {
        log.error(err);
    });
}