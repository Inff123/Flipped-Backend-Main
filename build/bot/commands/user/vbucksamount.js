import { EmbedBuilder, SlashCommandBuilder, User } from "discord.js";
import Profiles from '../../../model/profiles.js';
import Users from '../../../model/user.js';
export const data = new SlashCommandBuilder()
    .setName('vbucksamount')
    .setDescription('tells you how much vbucks you have')
    .setDMPermission(false);
export async function execute(interaction) {
    const currentuser = await Users.findOne({ discordId: interaction.user.id });
    const vbucksamount = await Profiles.findOne({ accountId: currentuser?.accountId });
    const currency = vbucksamount?.profiles.common_core.items["Currency:MtxPurchased"].quantity;
    if (!currentuser) 
    {
        return interaction.followUp({ content: "You do not have an account", ephemeral: true });
    }
    const embed = new EmbedBuilder()
        .setTitle("Vbucks")
        .setDescription(`You have ` + currency + " vbucks!")
        .setColor("#2b2d31")
        .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
//# sourceMappingURL=givevbucks.js.map