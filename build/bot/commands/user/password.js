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
        text: "Flipped",
        iconURL: "https://cdn.discordapp.com/attachments/1175237541327274075/1175251623648444487/2fa0a9db5ad78bda424099711c3c410a.png?ex=656a8d5e&is=6558185e&hm=2427e70783c0587c1706cdaa969d4824bb5ae5e3f5e586bb33b3883db6c804f7&",
    })
        .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
//# sourceMappingURL=password.js.map