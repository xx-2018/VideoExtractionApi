const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const BaseDownloader = require('../../common/BaseDownloader');
const VideoProcessor = require('../../common/VideoProcessor');
const FileUtils = require('../../common/FileUtils');
const { createLogger } = require('../../common/Logger');
const fs = require('fs');

// 创建日志记录器
const logger = createLogger('TiktokDownloader');

/**
 * TikTok视频下载器
 * 实现了BaseDownloader接口，提供TikTok视频的无水印下载功能
 */
class TiktokDownloader extends BaseDownloader {
    /**
     * 构造函数
     * @param {Object} options - 下载器配置选项
     */
    constructor(options = {}) {
        super(options);
        this.platform = 'tiktok';
        this.videoProcessor = new VideoProcessor();
        this.fileUtils = FileUtils;
    }

    /**
     * 验证URL是否为TikTok视频URL
     * @param {string} url - 要验证的URL
     * @returns {boolean} 是否为有效URL
     */
    isValidUrl (url) {
        const patterns = [
            /tiktok\.com\/@[\w.-]+\/video\/\d+/,
            /vm\.tiktok\.com\/\w+/,
            /vt\.tiktok\.com\/\w+/
        ];

        return patterns.some(pattern => pattern.test(url));
    }

    /**
     * 从TikTok链接获取无水印视频下载链接
     * @param {string} tiktokUrl - TikTok视频链接
     * @returns {Promise<Object>} 包含下载链接和状态的对象
     */
    async getVideoDownloadLink (tiktokUrl) {
        try {
            // 发送请求获取视频信息
            const response = await fetch("https://tikdownloader.io/api/ajaxSearch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                body: `q=${encodeURIComponent(tiktokUrl)}&lang=en`
            });

            if (!response.ok) {
                return {
                    success: false,
                    message: `获取下载链接失败: HTTP ${response.status} ${response.statusText}`,
                    downloadUrl: null
                };
            }

            const result = await response.json();

            if (result.status === "ok" && result.hasOwnProperty("data")) {
                // 提取下载链接
                const downloadUrls = this.extractHref(result.data);

                if (downloadUrls.length > 0) {
                    // 返回最佳质量的下载链接
                    return {
                        success: true,
                        message: "获取下载链接成功",
                        downloadUrl: downloadUrls.length >= 2 ? downloadUrls.at(-2) : downloadUrls[0]
                    };
                } else {
                    return {
                        success: false,
                        message: "未找到可下载的链接",
                        downloadUrl: null
                    };
                }
            } else {
                return {
                    success: false,
                    message: "解析失败，请检查链接是否有效",
                    downloadUrl: null
                };
            }
        } catch (error) {
            logger.error(`获取下载链接失败: ${error.message}`);
            return {
                success: false,
                message: `获取下载链接失败: ${error.message}`,
                downloadUrl: null
            };
        }
    }

    /**
     * 从HTML中提取下载链接
     * @param {string} html - 包含下载链接的HTML
     * @returns {Array} 提取的链接数组
     */
    extractHref (html) {
        const regex = /<a\s+(?:[^>]*?\s+)?href=(['"])(.*?)\1/gi;
        const hrefs = [];
        let match;

        while ((match = regex.exec(html)) !== null) {
            hrefs.push(match[2]);
        }
        return hrefs.filter((href) => href.indexOf("snapcdn.app") !== -1);
    }

    /**
     * 获取视频信息
     * @param {string} url - 视频URL
     * @returns {Promise<Object>} 视频信息对象
     * @throws {Error} 当获取失败时抛出异常
     */
    async getVideoInfo (url) {
        try {
            // 获取下载链接
            const linkResult = await this.getVideoDownloadLink(url);

            if (!linkResult.success) {
                return {
                    title: "Unknown TikTok Video",
                    author: "TikTok User",
                    url: url,
                    downloadUrl: null,
                    error: linkResult.message
                };
            }

            // 提取视频ID作为标题
            let videoId = "tiktok_video";
            const match = url.match(/\/video\/(\d+)/);
            if (match && match[1]) {
                videoId = match[1];
            }

            // 获取视频基本信息
            try {
                const response = await fetch(linkResult.downloadUrl, {
                    method: "HEAD"
                });

                if (!response.ok) {
                    throw new Error(`获取视频信息失败: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                const contentLength = response.headers.get('content-length');

                return {
                    title: `TikTok_${videoId}`,
                    author: "TikTok User",
                    url: url,
                    downloadUrl: linkResult.downloadUrl,
                    info: {
                        type: contentType,
                        size: contentLength ? parseInt(contentLength, 10) : 0,
                        sizeFormatted: contentLength ? this.formatFileSize(parseInt(contentLength, 10)) : "未知"
                    }
                };
            } catch (error) {
                logger.error(`获取视频详细信息失败: ${error.message}`);
                return {
                    title: `TikTok_${videoId}`,
                    author: "TikTok User",
                    url: url,
                    downloadUrl: linkResult.downloadUrl
                };
            }
        } catch (error) {
            logger.error(`获取视频信息失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的大小
     */
    formatFileSize (bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 下载视频
     * @param {string} url - 视频URL
     * @param {string} [outputDir] - 输出目录，默认为平台特定的下载目录
     * @param {Object} [downloadOptions={}] - 下载选项
     * @param {string} [downloadOptions.filename] - 自定义文件名
     * @returns {Promise<Object>} 下载结果对象
     * @throws {Error} 当下载失败时抛出异常
     */
    async download (url, outputDir, downloadOptions = {}) {
        try {
            logger.info('处理 TikTok 视频...');

            // 获取下载链接
            const linkResult = await this.getVideoDownloadLink(url);

            if (!linkResult.success) {
                logger.error(`获取下载链接失败: ${linkResult.message}`);
                return {
                    success: false,
                    message: linkResult.message
                };
            }

            // 获取视频信息
            const videoInfo = await this.getVideoInfo(url);

            // 使用自定义文件名或从视频信息中获取
            let filename = downloadOptions.filename || videoInfo.title;
            const safeTitle = this.fileUtils.sanitizeFileName(filename);

            // 为文件夹名称移除TikTok_前缀
            const folderName = safeTitle.replace(/^TikTok_/, '');

            const mainDir = outputDir || this.fileUtils.getPlatformDownloadDir('tiktok');

            // 始终创建以视频ID命名的子文件夹（不带TikTok_前缀）
            const videoDir = path.join(mainDir, folderName);
            this.fileUtils.ensureDir(videoDir);
            logger.info(`为视频创建文件夹: ${videoDir}`);

            const filePath = path.join(videoDir, `${safeTitle}.mp4`);

            logger.info(`视频标题: ${videoInfo.title}`);
            logger.info(`下载链接: ${linkResult.downloadUrl}`);

            // 下载视频
            try {
                // 确保下载目录存在
                this.fileUtils.ensureDir(videoDir);

                // 获取文件
                const response = await fetch(linkResult.downloadUrl);

                if (!response.ok) {
                    throw new Error(`下载失败: ${response.status} ${response.statusText}`);
                }

                // 创建文件写入流
                const fileStream = fs.createWriteStream(filePath);

                // 使用流式下载而不是一次性加载整个视频
                return new Promise((resolve, reject) => {
                    // 设置错误处理
                    response.body.on('error', (err) => {
                        fileStream.close();
                        reject(err);
                    });

                    fileStream.on('error', (err) => {
                        fileStream.close();
                        reject(err);
                    });

                    // 当下载完成时
                    fileStream.on('finish', () => {
                        resolve({
                            success: true,
                            message: "下载完成",
                            title: videoInfo.title,
                            path: filePath,
                            folder: videoDir
                        });
                    });

                    // 开始流式传输
                    response.body.pipe(fileStream);
                }).catch(error => {
                    logger.error(`下载文件失败: ${error.message}`);
                    // 如果下载失败，尝试删除可能部分下载的文件
                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                        } catch (unlinkError) {
                            logger.error(`删除部分下载的文件失败: ${unlinkError.message}`);
                        }
                    }
                    return {
                        success: false,
                        message: `下载失败: ${error.message}`,
                        title: videoInfo.title
                    };
                });
            } catch (error) {
                logger.error(`下载文件失败: ${error.message}`);
                return {
                    success: false,
                    message: `下载失败: ${error.message}`,
                    title: videoInfo.title
                };
            }
        } catch (error) {
            logger.error(`处理过程中出现错误: ${error.message}`);
            throw error;
        }
    }
}

module.exports = TiktokDownloader; 