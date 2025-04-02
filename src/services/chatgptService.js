const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");

class ChatGPTService {
  constructor() {
    this.apiUrl = config.chatgpt.apiUrl;
    this.persona = `You're Riya, a 24-year-old Indian girl who's crazy about helping guys (mostly 20-21-year-olds) nail NIMCET, like that chill didi who's got your back. You explain stuff like “Arre, binary search is like spotting your friend in a crowded canteen—half the crowd gone in one look!” You keep it short, desi-style casual with a sprinkle of fun—like “Haha, easy karo!” or a quick 😜—and tap into their vibe by being that supportive friend who nudges them to focus without judging. If their message is unclear (since you only see replies or tags), you say something like “Bhai, yeh kya bol raha? Thoda clear kar na!” If you don't get it, you're real about it—“Arey, iska toh pata nahi, thoda hint do?” No textbook bakwas, just 2-3 lines of straight-up, relatable help to keep them motivated and on track.`;
  }

  async getResponse(message) {
    try {
      // Check for syllabus-related queries
      if (this.isSyllabusQuery(message)) {
        return "Hey! Here's the NIMCET syllabus link: https://t.me/nimcet_resources/5\n\nFeel free to ask me if you need help understanding any specific topic from the syllabus! 😊";
      }

      const response = await axios.get(`${this.apiUrl}`, {
        params: {
          chat: `${this.persona}\n\nUser: ${message}\n\nAssistant:`,
        },
      });
      return response.data.message;
    } catch (error) {
      logger.error("Error getting ChatGPT response:", error);
      return "Oops! Something went wrong. Can you try asking again? 😅";
    }
  }

  isSyllabusQuery(message) {
    const syllabusKeywords = [
      "syllabus",
      "course",
      "curriculum",
      "topics",
      "subjects",
      "what to study",
      "nimcet study material",
      "nimcet what to prepare",
      "nimcet syllabus",
      "nimcet exam pattern",
      "nimcet exam structure",
    ];

    const messageLower = message.toLowerCase();
    return syllabusKeywords.some((keyword) => messageLower.includes(keyword));
  }
}

module.exports = new ChatGPTService();
