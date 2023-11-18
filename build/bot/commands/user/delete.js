import { ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Users from '../../../model/user.js';
import Profiles from '../../../model/profiles.js';
import Friends from '../../../model/friends.js';
export const data = new SlashCommandBuilder()
    .setName('deleteaccount')
    .setDescription('Deletes your account (irreversible)');
export async function execute(interaction) {
    const user = await Users.findOne({ discordId: interaction.user.id });
    if (!user)
        return interaction.reply({ content: "You are not registered!", ephemeral: true });
    if (user.banned)
        return interaction.reply({ content: "You are banned, and your account cannot therefore be deleted.", ephemeral: true });
    if (user.Reports > 5) 
    {
        return interaction.reply({ content: "Your account has been locked please contact support for further assistance.", ephemeral: true });
    }
    const confirm = new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('Confirm Deletion')
        .setStyle(ButtonStyle.Danger);
    const cancel = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);
    const row = {
        type: 1,
        components: [confirm.toJSON(), cancel.toJSON()]
    };
    const confirmationEmbed = new EmbedBuilder()
        .setTitle("Are you sure you want to delete your account?")
        .setDescription("This action is irreversible, and will delete all your data.")
        .setColor("#2b2d31")
        .setFooter({
        text: "Flipped",
        iconURL: "https://cdn.discordapp.com/attachments/1175237541327274075/1175251623648444487/2fa0a9db5ad78bda424099711c3c410a.png?ex=656a8d5e&is=6558185e&hm=2427e70783c0587c1706cdaa969d4824bb5ae5e3f5e586bb33b3883db6c804f7&",
    })
        .setTimestamp();
    const confirmationResponse = await interaction.reply({
        embeds: [confirmationEmbed],
        components: [row],
        ephemeral: true
    });
    const filter = (i) => i.user.id === interaction.user.id;
    const collector = confirmationResponse.createMessageComponentCollector({ filter, time: 10000 });
    collector.on("collect", async (i) => {
        switch (i.customId) {
            case "confirm": {
                await Users.findOneAndDelete({ discordId: interaction.user.id });
                await Profiles.findOneAndDelete({ accountId: user.accountId });
                await Friends.findOneAndDelete({ accountId: user.accountId });
                const confirmEmbed = new EmbedBuilder()
                    .setTitle("Account Deleted")
                    .setDescription("Your account has been deleted, we're sorry to see you go!")
                    .setColor("#2b2d31")
                    .setFooter({
                    text: "Flipped",
                    iconURL: "https://cdn.discordapp.com/attachments/1175237541327274075/1175251623648444487/2fa0a9db5ad78bda424099711c3c410a.png?ex=656a8d5e&is=6558185e&hm=2427e70783c0587c1706cdaa969d4824bb5ae5e3f5e586bb33b3883db6c804f7&",
                })
                    .setTimestamp();
                i.reply({ embeds: [confirmEmbed], ephemeral: true });
                break;
            }
            case "cancel": {
                const cancelEmbed = new EmbedBuilder()
                    .setTitle("Account Deletion Cancelled")
                    .setDescription("Your account has not been deleted.")
                    .setColor("#2b2d31")
                    .setFooter({
                    text: "Flipped",
                    iconURL: "https://cdn.discordapp.com/attachments/1175237541327274075/1175251623648444487/2fa0a9db5ad78bda424099711c3c410a.png?ex=656a8d5e&is=6558185e&hm=2427e70783c0587c1706cdaa969d4824bb5ae5e3f5e586bb33b3883db6c804f7&",
                })
                    .setTimestamp();
                i.reply({ embeds: [cancelEmbed], ephemeral: true });
                break;
            }
        }
    });
}
//# sourceMappingURL=delete.js.map