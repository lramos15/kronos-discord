import type { CommandInteraction, SlashCommandBuilder } from "discord.js";

export interface ICommand {
    execute(interaction: CommandInteraction): Promise<void>;
    commandName: string;
    commandDescription: string;
    commandBuilder: SlashCommandBuilder;
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isICommand(obj: any): obj is ICommand {
    return obj.execute !== undefined && obj.commandName !== undefined && obj.commandDescription !== undefined;
}