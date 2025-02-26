/**
 * 基础下载器接口
 * 所有平台特定的下载器都应该实现这个接口
 */
class BaseDownloader {
    /**
     * 构造函数
     * @param {Object} options - 下载器配置选项
     */
    constructor(options = {}) {
        this.options = options;
        this.platform = 'base'; // 子类应该覆盖这个属性
    }

    /**
     * 获取视频信息
     * @param {string} url - 视频URL
     * @returns {Promise<Object>} 视频信息对象
     * @throws {Error} 当获取失败时抛出异常
     */
    async getVideoInfo (url) {
        throw new Error('子类必须实现 getVideoInfo 方法');
    }

    /**
     * 获取视频下载信息
     * @param {string} url - 视频URL
     * @returns {Promise<Object>} 下载信息对象
     * @throws {Error} 当获取失败时抛出异常
     */
    async getVideoDownloadInfo (url) {
        throw new Error('子类必须实现 getVideoDownloadInfo 方法');
    }

    /**
     * 下载视频
     * @param {string} url - 视频URL
     * @param {string} [outputDir] - 输出目录，默认为平台特定的下载目录
     * @returns {Promise<Object>} 下载结果对象
     * @throws {Error} 当下载失败时抛出异常
     */
    async download (url, outputDir) {
        throw new Error('子类必须实现 download 方法');
    }

    /**
     * 验证URL是否为该平台的有效URL
     * @param {string} url - 要验证的URL
     * @returns {boolean} 是否为有效URL
     */
    isValidUrl (url) {
        throw new Error('子类必须实现 isValidUrl 方法');
    }
}

module.exports = BaseDownloader; 