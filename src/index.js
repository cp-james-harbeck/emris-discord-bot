require('dotenv').config();
const logger = require('@mirasaki/logger');
const chalk = require('chalk');
const {
  Client, GatewayIntentBits, ActivityType, PresenceUpdateStatus
} = require('discord.js');

const modeArg = process.argv.find((arg) => arg.startsWith('mode='));

const pkg = require('../package');
const { clearApplicationCommandData, refreshSlashCommandData } = require('./handlers/commands');
const {
  getFiles, titleCase, getRuntime, clientConfig
} = require('./util');
const config = clientConfig;
const path = require('path');
const clientExtensions = require('./client');


process.env.NODE_ENV !== 'production' && console.clear();
const packageIdentifierStr = `${ pkg.name }@${ pkg.version }`;
logger.info(`${ chalk.greenBright.underline(packageIdentifierStr) } by ${ chalk.cyanBright.bold(pkg.author) }`);

const initTimerStart = process.hrtime.bigint();
const intents = config.intents.map((intent) => GatewayIntentBits[intent]);
const presenceActivityMap = config.presence.activities.map(
  (act) => ({
    ...act, type: ActivityType[titleCase(act.type)]
  })
);

const client = new Client({
  intents: intents,
  presence: {
    status: PresenceUpdateStatus[config.presence.status] || PresenceUpdateStatus['online'],
    activities: presenceActivityMap
  }
});

const {
  DISCORD_BOT_TOKEN,
  DEBUG_ENABLED,
  CLEAR_SLASH_COMMAND_API_DATA,
  USE_API,

  CHAT_INPUT_COMMAND_DIR,
  CONTEXT_MENU_COMMAND_DIR,
  AUTO_COMPLETE_INTERACTION_DIR,
  BUTTON_INTERACTION_DIR,
  MODAL_INTERACTION_DIR,
  SELECT_MENU_INTERACTION_DIR
} = process.env;

process.on('SIGINT', () => {
  logger.info('\nGracefully shutting down from SIGINT (Ctrl-C)');
  process.exit(0);
});

if (process.env.NODE_ENV !== 'production') {
  process.on('unhandledRejection', (reason, promise) => {
    logger.syserr('Encountered unhandledRejection error (catch):');
    console.error(reason, promise);
  });
  process.on('uncaughtException', (err, origin) => {
    logger.syserr('Encountered uncaughtException error:');
    console.error(err, origin);
  });
}

/**
 * Register our listeners using client.on(fileNameWithoutExtension)
 * @private
 */
const registerListeners = () => {
  const eventFiles = getFiles('src/listeners', '.js');
  const eventNames = eventFiles.map((filePath) => filePath.slice(
    filePath.lastIndexOf(path.sep) + 1,
    filePath.lastIndexOf('.')
  ));

  if (DEBUG_ENABLED === 'true') {
    logger.debug(`Registering ${ eventFiles.length } listeners: ${ eventNames.map((name) => chalk.whiteBright(name)).join(', ') }`);
  }

  for (const filePath of eventFiles) {
    const eventName = filePath.slice(
      filePath.lastIndexOf(path.sep) + 1,
      filePath.lastIndexOf('.')
    );

    const eventFile = require(filePath);

    client.on(eventName, (...received) => eventFile(client, ...received));
  }
};

client.container = clientExtensions;

if (CLEAR_SLASH_COMMAND_API_DATA === 'true') {
  clearApplicationCommandData();
}

const {
  commands,
  contextMenus,
  buttons,
  modals,
  autoCompletes,
  selectMenus
} = client.container;

logger.debug(`Start loading Slash Commands... ("${ CHAT_INPUT_COMMAND_DIR }")`);
for (const filePath of getFiles(CHAT_INPUT_COMMAND_DIR)) {
  try {
    const command = require(filePath);

    command.load(filePath, commands);

    command.loadAliases();
  }
  catch (err) {
    logger.syserr(`Error encountered while loading Slash Command (${ CHAT_INPUT_COMMAND_DIR }), are you sure you're exporting an instance of ChatInputCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

logger.debug(`Start loading User Context Menu Commands... ("${ CONTEXT_MENU_COMMAND_DIR }/user")`);
for (const filePath of getFiles(`${ CONTEXT_MENU_COMMAND_DIR }/user`)) {
  try {
    const command = require(filePath);
    command.load(filePath, contextMenus, 'user-ctx-menu-');
  }
  catch (err) {
    logger.syserr(`Error encountered while loading User Context Menu Command (${ CONTEXT_MENU_COMMAND_DIR }/user), are you sure you're exporting an instance of UserContextCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

logger.debug(`Start loading Message Context Menu Commands... ("${ CONTEXT_MENU_COMMAND_DIR }/message")`);
for (const filePath of getFiles(`${ CONTEXT_MENU_COMMAND_DIR }/message`)) {
  try {
    const command = require(filePath);
    command.load(filePath, contextMenus, 'message-ctx-menu-');
  }
  catch (err) {
    logger.syserr(`Error encountered while loading User Context Menu Command (${ CONTEXT_MENU_COMMAND_DIR }/message), are you sure you're exporting an instance of MessageContextCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

logger.debug(`Start loading Button Commands... ("${ BUTTON_INTERACTION_DIR }")`);
for (const filePath of getFiles(BUTTON_INTERACTION_DIR)) {
  try {
    const command = require(filePath);
    command.load(filePath, buttons);
  }
  catch (err) {
    logger.syserr(`Error encountered while loading Button Command (${ BUTTON_INTERACTION_DIR }), are you sure you're exporting an instance of ComponentCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

logger.debug(`Start loading Modal Commands... ("${ MODAL_INTERACTION_DIR }")`);
for (const filePath of getFiles(MODAL_INTERACTION_DIR)) {
  try {
    const command = require(filePath);
    command.load(filePath, modals);
  }
  catch (err) {
    logger.syserr(`Error encountered while loading Modal Command (${ MODAL_INTERACTION_DIR }), are you sure you're exporting an instance of ComponentCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

logger.debug(`Start loading Auto Complete Commands... ("${ AUTO_COMPLETE_INTERACTION_DIR }")`);
for (const filePath of getFiles(AUTO_COMPLETE_INTERACTION_DIR)) {
  try {
    const command = require(filePath);
    command.load(filePath, autoCompletes);
  }
  catch (err) {
    logger.syserr(`Error encountered while loading Auto Complete Command (${ AUTO_COMPLETE_INTERACTION_DIR }), are you sure you're exporting an instance of ComponentCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

logger.debug(`Start loading Select Menu Commands... ("${ SELECT_MENU_INTERACTION_DIR }")`);
for (const filePath of getFiles(SELECT_MENU_INTERACTION_DIR)) {
  try {
    const command = require(filePath);
    command.load(filePath, selectMenus);
  }
  catch (err) {
    logger.syserr(`Error encountered while loading Select Menu Command (${ SELECT_MENU_INTERACTION_DIR }), are you sure you're exporting an instance of ComponentCommand?\nCommand: ${ filePath }`);
    console.error(err.stack || err);
  }
}

refreshSlashCommandData(client);

registerListeners();

logger.success(`Finished initializing after ${ getRuntime(initTimerStart).ms } ms`);

if (USE_API === 'true') require('./server/');

if (modeArg && modeArg.endsWith('test')) process.exit(1);

client.login(DISCORD_BOT_TOKEN);

module.exports = client;
