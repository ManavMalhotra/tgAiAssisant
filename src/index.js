const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const config = require("./config");
const CommandHandler = require("./handlers/commandHandler");
const examService = require("./services/examService");
const botStatusService = require("./services/botStatusService");
const logger = require("./utils/logger");

class FridayNimBot {
  constructor() {
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.commandHandler = new CommandHandler(this.bot);
    this.botInfo = null;
    this.setupEventHandlers();
    this.setupScheduledTasks();
  }

  setupEventHandlers() {
    // Handle messages
    this.bot.on("message", async (msg) => {
      if (!msg.text) return;
      await this.commandHandler.handleMessage(msg);
    });

    // Handle bot's status changes in groups
    this.bot.on("my_chat_member", async (update) => {
      const chat = update.chat;
      const newStatus = update.new_chat_member.status;
      const oldStatus = update.old_chat_member.status;

      // Bot was added to a group
      if (newStatus === 'member' || newStatus === 'administrator') {
        await botStatusService.addGroup(chat.id, chat.title);
        
        // Send welcome message to the group
        await this.bot.sendMessage(
          chat.id,
          "Hey everyone! 👋 I'm Friday, your NIMCET study buddy! Use .help to see what I can do! 😊"
        );

        // Notify admins about the new group
        const status = botStatusService.getStatus();
        const adminMessage = `🆕 Bot joined new group!

📋 Group Details:
• Name: ${chat.title}
• ID: ${chat.id}
• Type: ${chat.type}
• Status: ${newStatus}

📊 Current Status:
• Total Groups: ${status.groups.length}
• Total Messages: ${status.groups.reduce((acc, group) => acc + group.messageCount, 0)}
• Uptime: ${status.uptime.days}d ${status.uptime.hours}h ${status.uptime.minutes}m`;

        // Send to all admin users
        for (const adminId of config.telegram.adminIds) {
          try {
            await this.bot.sendMessage(adminId, adminMessage);
          } catch (error) {
            logger.error(`Failed to notify admin ${adminId}:`, error);
          }
        }
      }
      // Bot was removed from a group
      else if (newStatus === 'left' || newStatus === 'kicked') {
        await botStatusService.removeGroup(chat.id);
        
        // Notify admins about the group left
        const adminMessage = `❌ Bot left group!

📋 Group Details:
• Name: ${chat.title}
• ID: ${chat.id}
• Type: ${chat.type}
• Previous Status: ${oldStatus}
• New Status: ${newStatus}

Current groups: ${botStatusService.getGroupsStatus().length}`;

        // Send to all admin users
        for (const adminId of config.telegram.adminIds) {
          try {
            await this.bot.sendMessage(adminId, adminMessage);
          } catch (error) {
            logger.error(`Failed to notify admin ${adminId}:`, error);
          }
        }
      }
    });

    // Error handlers
    this.bot.on("error", (error) => {
      logger.error("Telegram Bot Error:", error);
    });

    this.bot.on("polling_error", (error) => {
      logger.error("Telegram Bot Polling Error:", error);
    });
  }

  setupScheduledTasks() {
    // Schedule daily notification at 5:00 AM
    cron.schedule(`0 5 * * *`, async () => {
      try {
        const message = examService.getFormattedMessage();
        const groups = botStatusService.getGroupsStatus();
        
        for (const group of groups) {
          await botStatusService.queueGroupMessage(group.id, message);
        }
        
        logger.info("Scheduled notification sent to all groups");
      } catch (error) {
        logger.error("Error sending scheduled notification:", error);
      }
    });
  }

  async start() {
    if (!examService.isExamDateValid()) {
      logger.error("Invalid exam date in configuration");
      process.exit(1);
    }

    try {
      // Get bot information
      this.botInfo = await this.bot.getMe();
      logger.info("FridayNim bot is starting...");
      logger.info(`Bot username: @${this.botInfo.username}`);

      // Set bot instance in status service
      botStatusService.setBot(this.bot);

      // Send startup status to admins
      const startupMessage = `🚀 Bot Started!

📋 Bot Info:
• Username: @${this.botInfo.username}
• ID: ${this.botInfo.id}
• First Name: ${this.botInfo.first_name}
• Last Name: ${this.botInfo.last_name || 'N/A'}

📊 Current Status:
• Groups: ${botStatusService.getGroupsStatus().length}
• Uptime: 0d 0h 0m

💻 System Status:
• Node Version: ${process.version}
• Platform: ${process.platform}
• Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`;

      // Send to all admin users
      for (const adminId of config.telegram.adminIds) {
        try {
          await this.bot.sendMessage(adminId, startupMessage);
        } catch (error) {
          logger.error(`Failed to notify admin ${adminId}:`, error);
        }
      }
    } catch (error) {
      logger.error("Error starting bot:", error);
      process.exit(1);
    }
  }
}

// Start the bot
const bot = new FridayNimBot();
bot.start();
