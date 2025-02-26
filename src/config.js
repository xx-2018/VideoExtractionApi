/**
 * 项目配置文件
 * 集中管理所有配置项
 */
const path = require('path');

module.exports = {
    // 版本信息
    version: '1.2.0',

    // 服务器配置
    server: {
        port: process.env.PORT || 3001,
        host: process.env.HOST || 'localhost'
    },

    // 下载配置
    download: {
        // 下载目录配置
        directories: {
            base: path.join(process.cwd(), 'downloads'),
            bilibili: path.join(process.cwd(), 'downloads', 'bilibili'),
            tiktok: path.join(process.cwd(), 'downloads', 'tiktok')
        },

        // 下载超时设置（毫秒）
        timeout: 60000,

        // 重试配置
        retry: {
            maxAttempts: 3,
            delay: 1000
        }
    },

    // 平台特定配置
    platforms: {
        bilibili: {
            defaultQuality: 80, // 默认1080P
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            referer: 'https://www.bilibili.com',
            // 视频质量代码
            quality: {
                '240P': 6,
                '360P': 16,
                '480P': 32,
                '720P': 64,
                '720P60': 74,
                '1080P': 80,
                '1080P+': 112,
                '1080P60': 116,
                '4K': 120,
                'HDR': 125,
                'DOLBY': 126,
                '8K': 127
            },
            // API URLs
            api: {
                videoInfo: 'https://api.bilibili.com/x/web-interface/view',
                playUrl: 'https://api.bilibili.com/x/player/playurl',
                subtitle: 'https://api.bilibili.com/x/player/v2'
            }
        },
        tiktok: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    },

    // 日志配置
    logging: {
        // 日志级别: 'error', 'warn', 'info', 'debug'
        level: process.env.LOG_LEVEL || 'info',
        // 是否在控制台显示日志
        console: true,
        // 是否保存日志到文件
        file: false,
        // 日志文件路径
        filePath: path.join(process.cwd(), 'logs', 'app.log')
    }
}; 