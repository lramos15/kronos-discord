import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ICommand } from "./utils/commandTypes";
import { KronosEmbed } from "../kronosEmbed";
import { KronosAdminAPI } from "../../kronos/unofficial/kronosAdminAPI";
import { KronosAPIFetcher } from "../../kronos/common/kronosAPITypes";
import { KronosOfficialAPI } from "../../kronos/official/kronosOfficialAPI";
import { WhmcsAPI } from "../../whmcs/whmcsAPI";

export default class KronosCommand implements ICommand {
	public readonly commandName = 'kronos';
	public readonly commandDescription = 'Lists out and allows for management of the servers on your Kronos dashboard!';
	public readonly commandBuilder = new SlashCommandBuilder()
	private readonly _kronosManager: KronosAPIFetcher;
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
	}

	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		const whmcsID = await this._whcmsAPI.getWHMCSId(interaction.user.tag);
		const kronosUserId = whmcsID ? await this._kronosManager.getKronosUserId(whmcsID) : undefined;
		if (!kronosUserId) {
			await interaction.editReply('Kronos customer not found! If you believe this to be incorrect, please contact an admin!');
			return;
		}
		const services = await this._kronosManager.getAllServices(kronosUserId);
		const kronosEmbed = new KronosEmbed(interaction, services);
		return kronosEmbed.createAndSendEmbed();
	}

}
