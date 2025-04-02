const config = require("../config");
const examService = require("../services/examService");
const chatgptService = require("../services/chatgptService");
const botStatusService = require("../services/botStatusService");
const logger = require("../utils/logger");

class CommandHandler {
  constructor(bot) {
    this.bot = bot;
    this.commands = new Map();
    this.setupCommands();
  }

  setupCommands() {
    // Public commands
    this.commands.set("days", this.handleDaysCommand.bind(this));
    this.commands.set("help", this.handleHelpCommand.bind(this));

    // Admin commands
    this.commands.set("broadcast", this.handleBroadcastCommand.bind(this));
    this.commands.set("stats", this.handleStatsCommand.bind(this));
    this.commands.set("status", this.handleStatusCommand.bind(this));
  }

  async handleMessage(msg) {
    try {
      const text = msg.text;

      // Handle commands
      if (text.startsWith(config.commandPrefix)) {
        const [command, ...args] = text.slice(1).split(" ");
        await this.handleCommand(msg, command, args);
        return;
      }

      // Check for syllabus query first (works without mention/reply)
      if (chatgptService.isSyllabusQuery(text)) {
        const response = await chatgptService.getResponse(text);
        await this.bot.sendMessage(msg.chat.id, response);
        return;
      }

      // Handle AI chat only when bot is mentioned or replied to
      const isMentioned = msg.entities?.some((e) => e.type === "mention");
      const isReplyToBot =
        msg.reply_to_message?.from?.username === "FridayNimcetbot";

      if (isMentioned || isReplyToBot) {
        // Show typing indicator
        await this.bot.sendChatAction(msg.chat.id, "typing");
        const response = await chatgptService.getResponse(text);
        await this.bot.sendMessage(msg.chat.id, response);
      }
    } catch (error) {
      logger.error("Error handling message:", error);
      await this.bot.sendMessage(
        msg.chat.id,
        "Oops! Something went wrong. Can you try asking again? 😅"
      );
    }
  }

  async handleCommand(msg, command, args) {
    const handler = this.commands.get(command);
    if (handler) {
      await handler(msg, args);
    }
  }

  async handleHelpCommand(msg) {
    const isAdmin = this.isAdmin(msg.from.id);
    const helpText = `Hey! I'm Friday, your NIMCET study buddy! Here's what I can do:

📚 Public Commands:
.days - Check remaining days until NIMCET exam
.help - Show this help message

💡 Tips:
• Tag me (@FridayNimcetbot) or reply to my messages to chat with me
• Ask about syllabus anytime (no need to tag me)
• I'll help explain complex topics with real-life examples

${isAdmin ? `🔧 Admin Commands:
.broadcast <message> - Send message to all groups
.stats - View bot statistics
.status - Check detailed bot status` : ''}

Need help with a specific topic? Just ask! 😊`;

    await this.bot.sendMessage(msg.chat.id, helpText);
  }

  async handleDaysCommand(msg) {
    const message = examService.getFormattedMessage();
    await this.bot.sendMessage(msg.chat.id, message);
  }

  async handleBroadcastCommand(msg, args) {
    if (!this.isAdmin(msg.from.id)) {
      await this.bot.sendMessage(
        msg.chat.id,
        "This command is restricted to admins only."
      );
      return;
    }

    const message = args.join(" ");
    if (!message) {
      await this.bot.sendMessage(
        msg.chat.id,
        "Please provide a message to broadcast."
      );
      return;
    }

    try {
      const groups = botStatusService.getGroupsStatus();
      let successCount = 0;
      let failCount = 0;

      for (const group of groups) {
        const sent = await botStatusService.queueGroupMessage(group.id, message);
        if (sent) successCount++;
        else failCount++;
      }

      await this.bot.sendMessage(
        msg.chat.id,
        `Broadcast complete! ✅\nSuccess: ${successCount}\nFailed: ${failCount}`
      );
    } catch (error) {
      logger.error("Error broadcasting message:", error);
      await this.bot.sendMessage(
        msg.chat.id,
        "Oops! Something went wrong while broadcasting. 😅"
      );
    }
  }

  async handleStatsCommand(msg) {
    if (!this.isAdmin(msg.from.id)) {
      await this.bot.sendMessage(
        msg.chat.id,
        "This command is restricted to admins only."
      );
      return;
    }

    const status = botStatusService.getStatus();
    const statsText = `📊 Bot Statistics:

👥 Groups: ${status.groups.length}
💬 Total Messages: ${status.groups.reduce((acc, group) => acc + group.messageCount, 0)}
⏰ Uptime: ${status.uptime.days}d ${status.uptime.hours}h ${status.uptime.minutes}m
📝 Pending Messages: ${status.messageQueue.reduce((acc, queue) => acc + queue.pendingMessages, 0)}`;

    await this.bot.sendMessage(msg.chat.id, statsText);
  }

  async handleStatusCommand(msg) {
    if (!this.isAdmin(msg.from.id)) {
      await this.bot.sendMessage(
        msg.chat.id,
        "This command is restricted to admins only."
      );
      return;
    }

    const status = botStatusService.getStatus();
    const statusText = `🔍 Detailed Status:

⏰ Uptime: ${status.uptime.days}d ${status.uptime.hours}h ${status.uptime.minutes}m ${status.uptime.seconds}s

👥 Groups (${status.groups.length}):
${status.groups.map(group => `• ${group.name} (${group.messageCount} msgs)`).join('\n')}

📝 Message Queue:
${status.messageQueue.map(queue => `• Group ${queue.groupId}: ${queue.pendingMessages} pending`).join('\n')}

💾 Memory Usage:
• Heap Used: ${status.memory.heapUsed}MB
• Heap Total: ${status.memory.heapTotal}MB
• External: ${status.memory.external}MB`;

    await this.bot.sendMessage(msg.chat.id, statusText);
  }

  isAdmin(userId) {
    return config.telegram.adminIds.includes(userId);
  }
}

module.exports = CommandHandler;
