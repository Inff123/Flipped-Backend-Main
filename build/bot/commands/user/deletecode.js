import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Users from '../../../model/user.js';
import mmcodes from '../../../model/mmcodes.js';
export const data = new SlashCommandBuilder()
    .setName('deletecode')
    .setDescription('Deletes a custom matchmaking code')
    .addStringOption(option => option.setName('code')
    .setDescription('The code you want to delete')
    .setRequired(true));
export async function execute(interaction) {
    try {
        const user = await Users.findOne({ discordId: interaction.user.id });
        if (!user)
            return interaction.reply({ content: "You are not registered!", ephemeral: true });
        if (!user.canCreateCodes)
            return interaction.reply({ content: "You are not allowed to create or delete codes!", ephemeral: true });
        const code = interaction.options.getString('code');
        const codeExists = await mmcodes.findOne({ code_lower: code.toLowerCase() }).populate("owner");
        if (!codeExists)
            return interaction.reply({ content: "This code doesn't exist", ephemeral: true });
        //@ts-expect-error ???
        if (codeExists.owner?.discordId !== interaction.user.id)
            return interaction.reply({ content: "You are not the owner of this code", ephemeral: true });
        await mmcodes.deleteOne({ code_lower: code.toLowerCase() });
        const embed = new EmbedBuilder()
            .setTitle("Code deleted")
            .setDescription(`Your code \`${code}\` has been deleted`)
            .setColor("#2b2d31")
            .setFooter({
            text: "Revive",
            iconURL: "https://media.discordapp.net/attachments/1123367135444471962/1139339199141658704/tiltedlogo.png",
        })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    catch (err) {
        await interaction.reply({ content: "An error occured while deleting your code. Please try again later.", ephemeral: true });
    }
}
//# sourceMappingURL=deletecode.js.map