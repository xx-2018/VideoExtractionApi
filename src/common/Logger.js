/**
 * 日志工具类
 * 提供统一的日志记录接口，支持不同级别的日志
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');

class Logger {
    /**
     * 创建一个新的日志记录器
     * @param {string} module - 模块名称
     */
    constructor(module) {
        this.module = module;
        this.config = config.logging;

        // 确保日志目录存在
        if (this.config.file) {
            const logDir = path.dirname(this.config.filePath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        }
    }

    /**
     * 获取当前时间戳
     * @returns {string} 格式化的时间戳
     */
    getTimestamp () {
        const now = new Date();
        return now.toISOString();
    }

    /**
     * 格式化日志消息
     * @param {string} level - 日志级别
     * @param {string} message - 日志消息
     * @returns {string} 格式化后的日志消息
     */
    formatMessage (level, message) {
        return `[${this.getTimestamp()}] [${level.toUpperCase()}] [${this.module}] ${message}`;
    }

    /**
     * 写入日志
     * @param {string} level - 日志级别
     * @param {string} message - 日志消息
     */
    log (level, message) {
        const levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };

        // 检查是否应该记录此级别的日志
        if (levels[level] > levels[this.config.level]) {
            return;
        }

        const formattedMessage = this.formatMessage(level, message);

        // 控制台输出
        if (this.config.console) {
            switch (level) {
                case 'error':
                    console.error(formattedMessage);
                    break;
                case 'warn':
                    console.warn(formattedMessage);
                    break;
                case 'info':
                    console.info(formattedMessage);
                    break;
                case 'debug':
                    console.debug(formattedMessage);
                    break;
                default:
                    console.log(formattedMessage);
            }
        }

        // 文件输出
        if (this.config.file) {
            fs.appendFileSync(this.config.filePath, formattedMessage + '\n');
        }
    }

    /**
     * 记录错误日志
     * @param {string} message - 日志消息
     */
    error (message) {
        this.log('error', message);
    }

    /**
     * 记录警告日志
     * @param {string} message - 日志消息
     */
    warn (message) {
        this.log('warn', message);
    }

    /**
     * 记录信息日志
     * @param {string} message - 日志消息
     */
    info (message) {
        this.log('info', message);
    }

    /**
     * 记录调试日志
     * @param {string} message - 日志消息
     */
    debug (message) {
        this.log('debug', message);
    }
}

/**
 * 创建一个新的日志记录器
 * @param {string} module - 模块名称
 * @returns {Logger} 日志记录器实例
 */
function createLogger (module) {
    return new Logger(module);
}

module.exports = {
    createLogger
}; 