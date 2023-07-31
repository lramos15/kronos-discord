import { ChatInputCommandInteraction, SlashCommandBuilder, Client, Guild, GuildMember, Role, User } from "discord.js";
import { ICommand } from "./utils/commandTypes";
import { KronosEmbed } from "../kronosEmbed";
import { KronosAdminAPI } from "../../kronos/unofficial/kronosAdminAPI";
import { KronosAPIFetcher } from "../../kronos/common/kronosAPITypes";
import { KronosOfficialAPI } from "../../kronos/official/kronosOfficialAPI";
import { WhmcsAPI } from "../../whmcs/whmcsAPI";

export default class KronosInspectCommand implements ICommand {
    public readonly commandName = 'kronosinspect';
    public readonly commandDescription = 'Lists out and allows for management of the servers on your Kronos dashboard!';
    public readonly commandBuilder = new SlashCommandBuilder()
    private readonly _kronosManager: KronosAPIFetcher;
    private readonly _staffRole = process.env.STAFF_ROLE ?? ''
  	private readonly _whcmsAPI: WhmcsAPI = new WhmcsAPI(
  		process.env.WHMCS_DB_HOST ?? '',
  		process.env.WHMCS_DB_NAME ?? '',
  		process.env.WHMCS_DB_USERNAME ?? '',
  		process.env.WHMCS_DB_PASSWORD ?? ''
  	);

    constructor() {
        this.commandBuilder.setName(this.commandName);
        this.commandBuilder.setDescription(this.commandDescription);
        if (process.env.KRONOS_ADMIN_USERNAME && process.env.KRONOS_ADMIN_PASSWORD && process.env.KRONOS_ENDPOINT) {
            this._kronosManager = new KronosAdminAPI(process.env.KRONOS_ADMIN_USERNAME, process.env.KRONOS_ADMIN_PASSWORD, process.env.KRONOS_ENDPOINT);
        } else {
            this._kronosManager = new KronosOfficialAPI(process.env.KRONOS_ENDPOINT ?? '', process.env.KRONOS_TOKEN ?? '');
        }
        this.commandBuilder.addUserOption(option =>
            option.setName('user')
                .setDescription('The user to inspect')
                .setRequired(true))
    }

    private async userHasRole(guild: Guild | null, userId: string, roleId: string): Promise<boolean> {
        if (!guild) {
            return false;
        }

        const user: User | null = await guild.client.users.fetch(userId).catch(() => null);
        if (!user) {
            return false;
        }

        const member: GuildMember | null = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            return false;
        }

        const role: Role | null = guild.roles.resolve(roleId);
        if (!role) {
            return false;
        }

        return member.roles.cache.has(role.id);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        // Check if the guild is available before calling userHasRole
        if (!interaction.guild) {
            await interaction.editReply('This command can only be used in a server (guild).');
            return;
        }
        const userOption = interaction.options.getUser('user');
        if (!userOption) {
            await interaction.editReply('User option not found.');
            return;
        }
        if (await this.userHasRole(interaction.guild, interaction.user.id, this._staffRole)) {
            const whmcsID = await this._whcmsAPI.getWHMCSId(userOption.tag);
            const kronosUserId = whmcsID ? await this._kronosManager.getKronosUserId(whmcsID) : undefined;
            if (!kronosUserId) {
                await interaction.editReply('Kronos customer not found! If you believe this to be incorrect, please contact an admin!');
                return;
            }
            const services = await this._kronosManager.getAllServices(kronosUserId);
            const kronosEmbed = new KronosEmbed(interaction, services);
            return kronosEmbed.createAndSendEmbed();
        } else {
            await interaction.editReply('You do not have permission to use this command!');
            return;
        }
    }
}
