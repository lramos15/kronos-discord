import { Client, ClientOptions, Collection } from "discord.js";
import { ICommand } from "./commands/utils/commandTypes";
import { loadAllCommands } from "./commands/utils/commandLoader";

export class DiscordClient extends Client {
  private readonly _commands = new Collection<string, ICommand>();
  constructor(options: ClientOptions) {
    super(options);
    // Async but firing it off in the background should be generally safe in that the commands just won't work until they're loaded
    loadAllCommands().then(commands => {
      commands.forEach(command => {
        this._commands.set(command.commandName, command);
      });
    });
  }

  public getCommand(name: string) {
    return this._commands.get(name);
  }

}