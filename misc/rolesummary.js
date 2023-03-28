// require('dotenv').config();
// const {
//     ChatInputCommand
// } = require('../../classes/Commands');
// const {
//     commandAutoCompleteOption
// } = require('../../interactions/autocomplete/command');
// const {
//     EmbedBuilder
// } = require('discord.js');
// const axios = require('axios');


// async function summarizeRoleMessageContent(role, messages, time_period) {
//     const text = `Friendly and concise. Please summarize the following messages from role ${role} in the past ${time_period} hours:\n\n${messages}`;

//     try {
//         const response = await axios.post(
//             'https://api.openai.com/v1/chat/completions', {
//                 model: 'gpt-3.5-turbo',
//                 messages: [{
//                         role: 'system',
//                         content: `You are a friendly and concise AI. Your task is to summarize the following messages:`,
//                     },
//                     {
//                         role: 'user',
//                         content: text,
//                     },
//                 ],
//                 temperature: 0.7,
//                 max_tokens: 300,
//             }, {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                 },
//             }
//         );

//         console.log(response.data);
//         const summary = response.data.choices[0].message.content ? response.data.choices[0].message.content.trim() : 'Error: Unable to generate summary.';
//         return summary;
//     } catch (error) {
//         console.error(error);
//         return 'Error: Unable to generate summary.';
//     }

// }

// const roleAutoCompleteOption = {
//     type: 8,
//     name: 'role',
//     description: 'Role to generate a summary for',
//     required: true,
// };

// const channelAutoCompleteOption = {
//     type: 7,
//     name: 'channel',
//     description: 'Channel to generate a summary for',
//     required: false,
// };

// module.exports = new ChatInputCommand({
//     global: true,
//     aliases: ['rolesummary'],
//     cooldown: {
//         type: 'user',
//         usages: 2,
//         duration: 10,
//     },
//     clientPerms: ['EmbedLinks'],
//     data: {
//         description: 'Generates a summary of role activities within the selected channels.',
//         options: [{
//                 type: 3,
//                 name: 'time_period',
//                 description: 'Time period to summarize messages (24h, 7d, 30d)',
//                 required: true,
//                 choices: [{
//                         name: 'Last 24 Hours',
//                         value: '24h',
//                     },
//                     {
//                         name: 'Last 7 Days',
//                         value: '7d',
//                     },
//                     {
//                         name: 'Last 30 Days',
//                         value: '30d',
//                     },
//                 ],
//             },
//             roleAutoCompleteOption,
//             channelAutoCompleteOption
//         ]
//     },
//     run: async (client, interaction) => {
//         console.log(interaction.options);
//         const role = interaction.options.getRole('role');
//         const time_period = interaction.options.getString('time_period');
//         const channel = interaction.options.getChannel('channel');
//         const hours = time_period === '24h' ? 24 : time_period === '7d' ? 168 : 720;

//         const time_range_ms = hours * 60 * 60 * 1000;
//         const messages = [];

//         let last_message_id;
//         let remaining_time = time_range_ms;


//         do {
//             const options = {
//                 limit: 100
//             };
//             if (last_message_id) {
//                 options.before = last_message_id;
//             }

//             const fetchedMessages = await channel.messages.fetch(options);
//             if (!fetchedMessages.size) {
//                 break;
//             }

//             const messagesInRange = fetchedMessages.filter((fetchedMessage) => {
//                 const created_at_utc = fetchedMessage.createdTimestamp;
//                 return Date.now() - created_at_utc <= remaining_time && fetchedMessage.member.roles.cache.has(role.id);
//             });

//             const messageContents = messagesInRange.map((message) => message.content);
//             messages.push(...messageContents);

//             last_message_id = fetchedMessages.last().id;
//             remaining_time -= time_range_ms;
//         } while (remaining_time > 0);

//         const messages_str = messages.join('\n');
//         if (messages_str) {
//             await interaction.deferReply();
//             const summary = await summarizeRoleMessageContent(`<@&${role.id}>`, messages_str, hours);

//             const embed = new EmbedBuilder()
//                 .setTitle(`Summary for ${role.name}`)
//                 .setDescription(summary)
//                 .setColor(0x00ff00)
//                 .setTimestamp()
//                 .setFooter({
//                     text: `Generated by ${client.user.username}`
//                 });

//             await interaction.editReply({
//                 embeds: [embed]
//             });
//         } else {
//             const embed = new EmbedBuilder()
//                 .setTitle(`Summary for ${role.name}`)
//                 .setDescription('No messages were found.')
//                 .setColor(0xff0000)
//                 .setTimestamp()
//                 .setFooter({
//                     text: `Generated by ${client.user.username}`
//                 });

//             await interaction.deferReply();
//             await interaction.editReply({
//                 embeds: [embed]
//             });
//         }
//     },



//     autocomplete: async (interaction) => {
//         const focusedOption = interaction.options.getFocused(true);

//         if (focusedOption.name === 'role') {
//             const roles = interaction.guild.roles.cache
//                 .filter(role => role.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
//                 .map(role => ({
//                     name: role.name,
//                     value: role.id
//                 }));

//             await interaction.respond(roles);
//         }

//         if (focusedOption.name === 'channel') {
//             const channels = interaction.guild.channels.cache
//                 .filter(channel => channel.type === 'GUILD_TEXT' && channel.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
//                 .map(channel => ({
//                     name: channel.name,
//                     value: channel.id
//                 }));

//             await interaction.respond(channels);
//         }

//         // Add the required case for the command autocomplete option
//         if (focusedOption.name === 'command') {
//             const query = focusedOption.value;
//             const queryResult = await commandAutoCompleteOption.run(client, interaction, query);
//             await interaction.respond(queryResult);
//         }
//     }
// });