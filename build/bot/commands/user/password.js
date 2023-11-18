import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Users from '../../../model/user.js';
import bcrypt from 'bcrypt';
export const data = new SlashCommandBuilder()
    .setName('password')
    .setDescription('Allows you to change your password')
    .addStringOption(option => option.setName('password')
    .setDescription('Your desired password')
    .setRequired(true));
export async function execute(interaction) {
    const user = await Users.findOne({ discordId: interaction.user.id });
    if (!user)
        return interaction.reply({ content: "You are not registered!", ephemeral: true });
    const plainPassword = interaction.options.getString('password');
    if (plainPassword.length >= 128)
        return interaction.reply({ content: "You do not need a 128 character password", ephemeral: true });
    if (plainPassword.length < 8)
        return interaction.reply({ content: "Your password has to be at least 8 characters long.", ephemeral: true });
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await user.updateOne({ $set: { password: hashedPassword } });
    const embed = new EmbedBuilder()
        .setTitle("Password changed")
        .setDescription("Your account password has been changed")
        .setColor("#2b2d31")
        .setFooter({
        text: "Revive",
        iconURL: "https://media.discordapp.net/attachments/1123367135444471962/1139339199141658704/tiltedlogo.png",
    })
        .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
//# sourceMappingURL=password.js.map