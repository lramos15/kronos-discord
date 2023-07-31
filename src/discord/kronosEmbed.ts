import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, Message, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { isAdminService } from "../kronos/common/utils";
import { AbstractKronosService } from "../kronos/common/abstractKronosService";

export class KronosEmbed {
  private serviceIndex = 0;
  constructor(
    private readonly _interaction: CommandInteraction,
    private readonly _services: AbstractKronosService[]
  ) { }

  public async createAndSendEmbed() {
    const kronosEmbed = await this.createEmbed();
    let components = await this.getEmbedComponents();
    // Handle the right response type based on if this interaction has been used
    let postedMessage: Message<boolean> | undefined;
    if (this._interaction.replied || this._interaction.deferred) {
      postedMessage = await this._interaction.followUp({ embeds: [kronosEmbed], components, ephemeral: true });
    } else {
      await this._interaction.reply({ embeds: [kronosEmbed], components, ephemeral: true });
      postedMessage = await this._interaction.fetchReply();
    }
    // Install a listener to handle the button clicks
    const interactionCollector = postedMessage.createMessageComponentCollector({ time: 240000 });
    interactionCollector.on('collect', async (interaction) => {
      // Updating can be slow, so respond immediately with a simple deferred response.
      const deferred = await interaction.update({embeds: [new EmbedBuilder().setTitle('Processing...')], components: []});
      // If the dropdown was used we select a new service
      if (interaction.isStringSelectMenu()) {
        const selectedServiceId = interaction.values[0];
        const selectedServiceIndex = this._services.findIndex(s => s.serviceId.toString() === selectedServiceId);
        if (selectedServiceIndex === -1) {
          await deferred.edit({ content: 'Something went wrong, please try again.', components });
          return;
        }
        this.serviceIndex = selectedServiceIndex;
        components = await this.getEmbedComponents();
        const newEmbed = await this.createEmbed();
        await deferred.edit({ embeds: [newEmbed], components });
      }

      // If the button was used we perform the action
      if (interaction.isButton()) {
        const currentService = this._services[this.serviceIndex];
        const buttonId = interaction.customId;
        switch (buttonId) {
          case 'start':
            await currentService.startService();
            break;
          case 'stop':
            await currentService.shutdownService();
            break;
          case 'restart':
            await currentService.restartService();
            break;
          default:
            await deferred.edit({ content: 'Something went wrong, please try again.', components });
            return;
        }
        const newEmbed = await this.createEmbed(true);
        components = await this.getEmbedComponents();
        await deferred.edit({ embeds: [newEmbed], components });
      }
    });

  }

  private async getEmbedComponents() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const components: ActionRowBuilder<any>[] = [await this.createServiceOperationButtons()];
    if (this._services.length > 1) {
      components.push(this.createServiceSelector());
    }
    return components;
  }

  private async createEmbed(forceUpdateStatus?: boolean) {
    const currentService = this._services[this.serviceIndex];
    const serviceStatus = await currentService.getServiceStatus(forceUpdateStatus);
    const streamInfo: {activeStreams: number | undefined, activeTranscodes: number | undefined} = isAdminService(currentService) ? await currentService.resolveStreamInfo() : {activeStreams: undefined, activeTranscodes: undefined};
    // Prettify some strings
    const plexURL = isAdminService(currentService) ? currentService.plexURL : 'Unknown';
    const activeStreamString = streamInfo.activeStreams !== undefined ? `${streamInfo.activeStreams} stream(s)` : 'Unknown';
    const activeTranscodeString = streamInfo.activeTranscodes !== undefined ? `${streamInfo.activeTranscodes} transcode(s)` : 'Unknown';
    const gpuTranscodingString = currentService.supportsGPUTranscoding ? '<a:check:972631736624250950>' : '❌';
    const serverId = currentService.serviceId;
    const kronosEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setAuthor({ name: 'Kronos Bot' })
      .setTitle(`${this._services[this.serviceIndex].serviceAlias}`)
      .setDescription(this._services[this.serviceIndex].serviceDescription)
      .addFields(
        { name: 'Service Status', value: this.prettifyServiceStatus(serviceStatus), inline: true },
        { name: 'Product', value: currentService.product, inline: true },
        { name: 'GPU Transcoding', value: gpuTranscodingString, inline: true },
        { name: 'Node', value: currentService.nodeAlias, inline: true },
        { name: 'Folder Name', value: currentService.containerFolderName, inline: true },
        { name: 'Service ID', value: serverId.toString(), inline: true },
        { name: 'Plex URL', value: plexURL, inline: false },
        { name: 'Active Streams', value: activeStreamString, inline: true },
        { name: 'Active Transcodes', value: activeTranscodeString, inline: true },
      )
      .setFooter({ text: `Result fetched from Kronos` })
      .setTimestamp(Date.now());


    return kronosEmbed;
  }

  /**
   * Prettifys the service status
   * @param serviceStatus The status of the service
   * @returns A prettier version of the status string for printing in the embed
   */
  private prettifyServiceStatus(serviceStatus: string) {
    switch (serviceStatus) {
      case 'running':
        return '<:online:1106290640599396445> Running';
      case 'stopped':
        return '<a:offline:1106291193844879360> Stopped';
      default:
        return `🟡 ${serviceStatus}`
    }
  }

  /**
   * Creates the action row containing the dropdown selector for picking various services
   * @returns The action row containing the dropdown selector for picking various services
   */
  private createServiceSelector() {
    const servicesToSelectOptions = this._services.map((service) => {
      return new StringSelectMenuOptionBuilder()
        .setLabel(service.serviceAlias)
        .setDescription(service.serviceDescription)
        .setValue(service.serviceId.toString());
    });
    const select = new StringSelectMenuBuilder()
      .setCustomId('appboxSelector')
      .setPlaceholder('Choose which appbox to view!')
      .addOptions(servicesToSelectOptions);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
  }

  /**
   * Creates the action row containing the buttons for starting, stopping and restarting the service
   * @returns The action row containing the buttons for starting, stopping and restarting the service
   */
  private async createServiceOperationButtons() {
    const serviceStatus = await this._services[this.serviceIndex].getServiceStatus();
    const startButton = new ButtonBuilder()
      .setCustomId('start')
      .setDisabled(serviceStatus !== 'stopped')
      .setEmoji('▶️')
      .setLabel('Start')
      .setStyle(ButtonStyle.Success);
    const stopButton = new ButtonBuilder()
      .setCustomId('stop')
      .setDisabled(serviceStatus === 'stopped')
      .setEmoji('⏹️')
      .setLabel('Stop')
      .setStyle(ButtonStyle.Danger);
    const restartButton = new ButtonBuilder()
      .setCustomId('restart')
      .setDisabled(serviceStatus === 'stopped')
      .setEmoji('🔄')
      .setLabel('Restart')
      .setStyle(ButtonStyle.Primary);
    const buttons = [startButton, stopButton, restartButton];
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
    return actionRow;
  }
}