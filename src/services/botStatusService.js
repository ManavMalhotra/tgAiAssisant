const logger = require('../utils/logger');

class BotStatusService {
    constructor() {
        this.groups = new Map(); // Store group information
        this.messageQueue = new Map(); // Store messages for each group
        this.isProcessing = false;
        this.startTime = new Date();
        this.bot = null; // Will be set when bot is initialized
    }

    setBot(bot) {
        this.bot = bot;
    }

    addGroup(groupId, groupName) {
        this.groups.set(groupId, {
            name: groupName,
            joinedAt: new Date(),
            messageCount: 0
        });
        logger.info(`Bot joined new group: ${groupName} (${groupId})`);
    }

    removeGroup(groupId) {
        const group = this.groups.get(groupId);
        if (group) {
            logger.info(`Bot left group: ${group.name} (${groupId})`);
            this.groups.delete(groupId);
        }
    }

    queueGroupMessage(groupId, message) {
        if (!this.messageQueue.has(groupId)) {
            this.messageQueue.set(groupId, []);
        }
        this.messageQueue.get(groupId).push(message);
        this.processMessageQueue();
    }

    async processMessageQueue() {
        if (this.isProcessing || !this.bot) return;
        this.isProcessing = true;

        try {
            for (const [groupId, messages] of this.messageQueue.entries()) {
                while (messages.length > 0) {
                    const message = messages.shift();
                    const sent = await this.sendMessageToGroup(groupId, message);
                    if (sent) {
                        // Add delay between messages to avoid rate limits
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
        } catch (error) {
            logger.error('Error processing message queue:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async sendMessageToGroup(groupId, message) {
        try {
            const group = this.groups.get(groupId);
            if (group && this.bot) {
                await this.bot.sendMessage(groupId, message);
                group.messageCount++;
                return true;
            }
            return false;
        } catch (error) {
            logger.error(`Error sending message to group ${groupId}:`, error);
            return false;
        }
    }

    getStatus() {
        return {
            uptime: this.getUptime(),
            groups: this.getGroupsStatus(),
            messageQueue: this.getMessageQueueStatus(),
            memory: this.getMemoryUsage()
        };
    }

    getUptime() {
        const uptime = new Date() - this.startTime;
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

        return {
            days,
            hours,
            minutes,
            seconds,
            total: uptime
        };
    }

    getGroupsStatus() {
        return Array.from(this.groups.entries()).map(([id, group]) => ({
            id,
            name: group.name,
            joinedAt: group.joinedAt,
            messageCount: group.messageCount
        }));
    }

    getMessageQueueStatus() {
        return Array.from(this.messageQueue.entries()).map(([groupId, messages]) => ({
            groupId,
            pendingMessages: messages.length
        }));
    }

    getMemoryUsage() {
        const used = process.memoryUsage();
        return {
            heapUsed: Math.round(used.heapUsed / 1024 / 1024),
            heapTotal: Math.round(used.heapTotal / 1024 / 1024),
            external: Math.round(used.external / 1024 / 1024)
        };
    }
}

module.exports = new BotStatusService(); 