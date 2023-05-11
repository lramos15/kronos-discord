import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import { loadAllCommands } from "./commandLoader";
dotenv.config();

if (!process.env.DISCORD_TOKEN) {
  throw new Error('No Discord token was provided!');
}

const clientId = process.env.DISCORD_CLIENT_ID;

if (!clientId) {
  throw new Error('No Discord client ID was provided!');
}


const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
    const commands = await loadAllCommands();
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands.map(c => c.commandBuilder.toJSON()) },
		) as unknown as {length: number};

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();