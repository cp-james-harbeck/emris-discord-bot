// //This command listens to the user's voice channel for 5 seconds, transcribes the audio using the OpenAI API, and sends a summary of the activity back to the user. 
// //Make sure to have the @discordjs/voice package installed and replace the OpenAI API key with your own.
// const {
//     ChatInputCommand
// } = require('../../classes/Commands');
// const {
//     joinVoiceChannel,
//     createAudioPlayer,
//     createAudioResource,
//     entersState,
//     VoiceConnectionStatus,
//     AudioPlayerStatus,
//     createDiscordJSAdapter
// } = require('@discordjs/voice');
// const axios = require('axios');
// const fs = require('fs');
// const {
//     pipeline
// } = require('stream');
// const {
//     promisify
// } = require('util');
// const streamPipeline = promisify(pipeline);

// async function transcribeAudio(audioBuffer) {
//     try {
//         const response = await axios.post(
//             'https://api.openai.com/v1/audio/transcriptions',
//             audioBuffer, {
//                 headers: {
//                     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                     'Content-Type': 'audio/wav',
//                 },
//             }
//         );

//         return response.data.text;
//     } catch (error) {
//         console.error(error);
//         return 'Error: Unable to transcribe the audio.';
//     }
// }

// module.exports = new ChatInputCommand({
//     global: true,
//     aliases: ['transcribe'],
//     cooldown: {
//         type: 'user',
//         usages: 2,
//         duration: 10,
//     },
//     clientPerms: ['EmbedLinks'],
//     data: {
//         description: 'Listen to the voice channel, transcribe the audio, and send a summary of the activity.',
//     },
//     run: async (client, interaction) => {
//         const voiceChannel = interaction.member.voice.channel;

//         if (!voiceChannel) {
//             return interaction.reply({
//                 content: 'You need to be in a voice channel to use this command.',
//                 ephemeral: true,
//             });
//         }

//         await interaction.deferReply();

//         const connection = joinVoiceChannel({
//             channelId: voiceChannel.id,
//             guildId: voiceChannel.guild.id,
//             adapterCreator: createDiscordJSAdapter(voiceChannel),
//         });

//         try {
//             await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
//         } catch (error) {
//             connection.destroy();
//             return interaction.editReply({
//                 content: 'Failed to join the voice channel within 30 seconds.',
//                 ephemeral: true
//             });
//         }

//         const audioPlayer = createAudioPlayer();
//         connection.subscribe(audioPlayer);

//         const outputStream = fs.createWriteStream('audio.wav');
//         const audioResource = createAudioResource(voiceChannel.members.get(interaction.user.id).voice.connection.receiver.createStream(interaction.user.id, {
//             mode: 'pcm',
//             end: 'manual'
//         }), {
//             inputType: 'pcm'
//         });

//         audioPlayer.play(audioResource);

//         try {
//             await entersState(audioPlayer, AudioPlayerStatus.Playing, 5_000);
//         } catch (error) {
//             audioPlayer.stop();
//             connection.destroy();
//             return interaction.editReply({
//                 content: 'Failed to play audio.',
//                 ephemeral: true
//             });
//         }

//         setTimeout(async () => {
//             audioPlayer.stop();
//             audioResource.playStream.destroy();
//             await streamPipeline(audioResource.playStream, outputStream);
//             const audioBuffer = fs.readFileSync('audio.wav');
//             const transcription = await transcribeAudio(audioBuffer);

//             await interaction.editReply({
//                 content: `Transcription: \n\n${transcription}`,
//             });

//             fs.unlink('audio.wav', (err) => {
//                 if (err) console.error(`Error deleting audio.wav file: ${err}`);
//             });

//             connection.destroy();
//         }, 5_000); // Record for 5 seconds
//     },
// });