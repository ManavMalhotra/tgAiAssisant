const config = require('../config');
const logger = require('../utils/logger');

class ExamService {
    constructor() {
        this.examDate = config.exam.date;
    }

    getRemainingDays() {
        const today = new Date();
        const diffTime = this.examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    getFormattedMessage() {
        const days = this.getRemainingDays();
        if (days < 0) {
            return 'The exam date has passed.';
        } else if (days === 0) {
            return 'The exam is today! Good luck!';
        } else {
            return `There are ${days} days remaining until the exam.`;
        }
    }

    isExamDateValid() {
        return this.examDate instanceof Date && !isNaN(this.examDate);
    }
}

module.exports = new ExamService(); 