# Kronos Bot 
Brings many commonly used Kronos dashboard features right to discord! This project integrates the [Kronos](https://kronosapp.io/) service for managing plex appboxes right into discord. This project is not affiliated with the Kronos team in any manner.


![A photo of a discord embed showing information about a plex appbox](https://media.discordapp.net/attachments/954439411435724873/1106321313968169000/image.png?width=500&height=400)

# Setup
A pre-requisite to using this integration is to ensure you have a WHMCS install, a valid Kronos subscription, and Docker installed on the host machine.

1. Create a discord bot and add it to your server. Follow this [guide](https://discordpy.readthedocs.io/en/stable/discord.html). The bot needs the bot scope with the send messages, embed links, and use external emojis permissions.
2. Create a Kronos API key. This can be done under the admin dashboard > Integrations > Kronos API > New API Key
3. Copy / rename the .env.example file to .env and fill in all the values. Note the bot is able to operate in two modes, one which utilizes the internal Kronos API and requires admin credentials and another that utilizes the external API and requires an API key. The two feature sets attempt to mirror each other as closely as possible, but there are some differences. The external API is recommended, but the internal one at times may provide additional features which are not available in the external API.
4. Build the docker image with `docker build -t kronos-bot-image .`
5. Run the docker image with `docker run -d --name kronos-bot kronos-bot-image`
6. 🎉 You're done! The bot should now be online and ready to use. The logs can be viewed with `docker logs kronos-bot`.

# Usage
The bot registers a single command `/Kronos`. This command displays all appboxes which a user has access to. Access is determined by having their discord id linked to their WHMCS in the WHMCS database. Kronos's discord integration is not currently supported.

# How to contribute
This project requires Node.js v16.x or greater. VS Code is the recommended code editor due to debugging and linting support.
1. Fork the repository
2. Clone the repository
3. Run `npm install`
4. Make your changes
5. Run `npm run build && npm run lint`
6. Commit your changes
7. Open a pull request
8. 🎉 Thanks for your contribution!

If you make any changes to the commands, running `npm run registerCommands` will be necessary for your app to utilize the commands.

# License
This project is licensed under the MIT license. See the LICENSE file for more information.