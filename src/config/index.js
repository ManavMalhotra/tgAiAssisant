require('dotenv').config();

module.exports = {
    telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN,
        adminIds: process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())),
    },
    chatgpt: {
        apiUrl: process.env.CHATGPT_API_URL,
    },
    exam: {
        date: new Date(process.env.EXAM_DATE),
        notificationTime: process.env.NOTIFICATION_TIME,
    },
    commandPrefix: '.',
}; 