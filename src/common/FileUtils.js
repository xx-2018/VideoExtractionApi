const fs = require('fs');
const path = require('path');

/**
 * 通用文件操作工具类
 * 提供文件系统相关的实用方法
 */
class FileUtils {
    /**
     * 确保目录存在，如果不存在则创建
     * @param {string} dirPath - 目录路径
     */
    static ensureDir (dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * 检查文件是否存在
     * @param {string} filePath - 文件路径
     * @returns {boolean} 文件是否存在
     */
    static fileExists (filePath) {
        return fs.existsSync(filePath);
    }

    /**
     * 清理文件名，移除不合法字符
     * @param {string} fileName - 原始文件名
     * @returns {string} 清理后的文件名
     */
    static sanitizeFileName (fileName) {
        if (!fileName) return 'unnamed';

        // 移除不合法的文件名字符
        return fileName
            .replace(/[\\/:*?"<>|]/g, '_') // 替换Windows不允许的字符
            .replace(/\s+/g, ' ')          // 将多个空格替换为单个空格
            .trim();                       // 移除首尾空格
    }

    /**
     * 获取文件扩展名
     * @param {string} filePath - 文件路径
     * @returns {string} 文件扩展名（包含点，如 .mp4）
     */
    static getFileExtension (filePath) {
        return path.extname(filePath);
    }

    /**
     * 删除文件
     * @param {string} filePath - 要删除的文件路径
     * @returns {boolean} 是否成功删除
     */
    static deleteFile (filePath) {
        if (this.fileExists(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }

    /**
     * 获取平台特定的下载目录
     * @param {string} platform - 平台名称 (如 'bilibili', 'tiktok')
     * @param {string} [subDir=''] - 子目录名称
     * @returns {string} 完整的下载目录路径
     */
    static getPlatformDownloadDir (platform, subDir = '') {
        const baseDir = path.join('downloads', platform);
        this.ensureDir(baseDir);

        if (subDir) {
            const fullPath = path.join(baseDir, subDir);
            this.ensureDir(fullPath);
            return fullPath;
        }

        return baseDir;
    }
}

module.exports = FileUtils; 