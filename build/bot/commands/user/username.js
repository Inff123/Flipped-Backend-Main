import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Users from '../../../model/user.js';
export const data = new SlashCommandBuilder()
    .setName('username')
    .setDescription('Lets you change your userame')
    .addStringOption(option => option.setName('username')
    .setDescription('Your desired username')
    .setRequired(true));
export async function execute(interaction) {
    const existingUser = await Users.findOne({
        $or: [{ username }]
    });
    if (existingUser) {
        return interaction.editReply({ content: "Username is already taken." });
    }
    if (username.length > 20) {
        return interaction.editReply({ content: "Username must be 25 characters or less." });
    }
    await interaction.deferReply({ ephemeral: true });
    const user = await Users.findOne({ discordId: interaction.user.id });
    if (!user)
        return interaction.reply({ content: "You are not registered!", ephemeral: true });
    let accessToken = global.accessTokens.find(i => i.accountId == user.accountId);
    if (accessToken)
        return interaction.editReply({ content: "Failed to change username as you are currently logged in to Fortnite.\nRun the /sign-out-of-all-sessions command to sign out." });
    const username = interaction.options.getString('username');
    await user.updateOne({ $set: { username: username } });
    const embed = new EmbedBuilder()
        .setTitle("Username changed")
        .setDescription("Your account username has been changed to " + username + "")
        .setColor("#2b2d31")
        .setFooter({
        text: "Flipped",
        iconURL: "https://cdn.discordapp.com/attachments/1175237541327274075/1175251623648444487/2fa0a9db5ad78bda424099711c3c410a.png?ex=656a8d5e&is=6558185e&hm=2427e70783c0587c1706cdaa969d4824bb5ae5e3f5e586bb33b3883db6c804f7&",
    })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}
//# sourceMappingURL=username.js.map