import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import functions from "../../../utilities/structs/functions.js";
import log from "../../../utilities/structs/log.js";
import Users from '../../../model/user.js';
import Badwords from "bad-words";

const badwords = new Badwords();

export const data = new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register On Flippeds Servers')
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
    const ALLOWED_CHANNEL_ID = '1175838553012437103';
    if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
        return interaction.reply({ content: "Please register in the <#1175838553012437103> channel.", ephemeral: true });
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
            text: "Flipped",
            iconURL: "https://cdn.discordapp.com/attachments/1175237541327274075/1175251623648444487/2fa0a9db5ad78bda424099711c3c410a.png?ex=656a8d5e&is=6558185e&hm=2427e70783c0587c1706cdaa969d4824bb5ae5e3f5e586bb33b3883db6c804f7&",
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
            text: "Flipped",
            iconURL: "https://cdn.discordapp.com/attachments/1175237541327274075/1175251623648444487/2fa0a9db5ad78bda424099711c3c410a.png?ex=656a8d5e&is=6558185e&hm=2427e70783c0587c1706cdaa969d4824bb5ae5e3f5e586bb33b3883db6c804f7&",
        })
        .setTimestamp();
    await interaction.channel?.send({ embeds: [publicEmbed] });
    }).catch((err) => {
        log.error(err);
    });
}