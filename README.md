# FridayNim Telegram Bot

A feature-rich Telegram bot that helps track exam days and provides AI-powered responses.

## Features

- Exam days tracking and automatic notifications
- AI-powered responses using ChatGPT
- Admin-restricted commands
- Easy to extend with new features

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your configuration:
   ```bash
   cp .env.example .env
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Commands

### Public Commands
- `.days` - Check remaining days until exam
- Tag or reply to bot - Get AI-powered response

### Admin Commands
- `.broadcast <message>` - Send message to all users
- `.stats` - Get bot statistics

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Adding New Commands

1. Create a new command file in `src/commands/`
2. Register the command in `src/commands/index.js`
3. Add command handler in `src/handlers/commandHandler.js` 