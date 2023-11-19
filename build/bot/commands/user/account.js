import Asteria from "../../../utilities/asteriasdk/index.js";
const asteria = new Asteria({
    collectAnonStats: true,
    throwErrors: true,
});
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Users from '../../../model/user.js';
import Profiles from '../../../model/profiles.js';
export const data = new SlashCommandBuilder()
    .setName('account')
    .setDescription('Shows you your account information');
export async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const user = await Users.findOne({ discordId: interaction.user.id });
        if (!user)
            return interaction.editReply({ content: "You are not registered!" });
        const profile = await Profiles.findOne({ accountId: user.accountId });
        if (!profile)
            return interaction.editReply({ content: "You are not registered!" });
        const selectedSkin = profile.profiles.athena.stats.attributes.favorite_character;
        const selectedSkinSplit = selectedSkin.split(":") || "CID_005_Athena_Commando_M_Default";
        let cosmetic = { images: { icon: "" } };
        try {
            cosmetic = await asteria.getCosmetic("id", selectedSkinSplit[1], true);
        }
        catch (err) {
            cosmetic = { images: { icon: "https://nexusassets.zetax.workers.dev/ceba508f24a70c50bd8782d08bd530b0d0df82e0baf7e357bcfd01ac81898297.gif" } };
        }
        if (!cosmetic)
            cosmetic = { images: { icon: "https://nexusassets.zetax.workers.dev/ceba508f24a70c50bd8782d08bd530b0d0df82e0baf7e357bcfd01ac81898297.gif" } };
        let icon = cosmetic.images.icon;
        const embed = new EmbedBuilder()
            .setTitle("Your account")
            .setDescription("These are your account details")
            .setColor("#2b2d31")
            .addFields([
            {
                name: "Username",
                value: user.username,
                inline: true
            },
            {
                name: "Email",
                value: user.email,
                inline: true
            },
            {
                name: "Account ID",
                value: user.accountId
            },
            {
                name: "MFA enabled?",
                value: user.mfa.toString(),
            },
            {
                name: "Banned", 
                value: `${user.banned ? "Yes" : "No"}` 
            },
            {
                name: "Wins",
                value: `${user.statisticsWins}`
            },
            {
                name: "Donator",
                value: `${user.isDonator ? "Yes" : "No"}`
            },
            {
                name: "Kills",
                value: `${user.statisticsKills}`
            }
            
            
        ])
            .setThumbnail(icon)
            .setFooter({
            text: "Flipped",
            iconURL: "https://cdn.discordapp.com/attachments/1175237541327274075/1175251623648444487/2fa0a9db5ad78bda424099711c3c410a.png?ex=656a8d5e&is=6558185e&hm=2427e70783c0587c1706cdaa969d4824bb5ae5e3f5e586bb33b3883db6c804f7&",
        })
            .setTimestamp();
        interaction.editReply({ embeds: [embed] });
    }
    catch (err) {
        console.log(err);
        interaction.editReply({ content: "An error occured while executing this command!\n\n" + err });
    }
}
//# sourceMappingURL=account.js.map