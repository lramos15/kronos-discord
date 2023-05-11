import { ICommand, isICommand } from "./commandTypes";
import fs from 'fs';
import path from 'path';

export async function loadAllCommands(): Promise<ICommand[]> {
  const commands: ICommand[] = [];
  const commandFolder = path.join(__dirname, '..');
  const commandFiles = fs.readdirSync(commandFolder).filter(file => fs.statSync(path.join(commandFolder, file)).isFile());
  console.log(`Loading ${commandFiles.length} commands... from ${commandFolder}`)
  for (const file of commandFiles) {
      if (!file.endsWith('.js')) continue;
      console.log(`Loading command ${file}`)
      const commandModule: {default?: unknown} = await import(path.join(commandFolder, file));
      const command = commandModule.default;
      // Commands have empty constructors, so instantiate the loaded command and check if it's a command
      if (typeof command === 'function' && command.prototype.constructor.length === 0) {
          const commandInstance = new command.prototype.constructor();
          if (isICommand(commandInstance)) {
              commands.push(commandInstance);
          }
      }
  }
  return commands;
}