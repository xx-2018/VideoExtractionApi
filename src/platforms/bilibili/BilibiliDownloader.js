const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const BaseDownloader = require('../../common/BaseDownloader');
const VideoProcessor = require('../../common/VideoProcessor');
const FileUtils = require('../../common/FileUtils');
const { createLogger } = require('../../common/Logger');
const config = require('../../config');

// 创建日志记录器
const logger = createLogger('BilibiliDownloader');

/**
 * B站视频下载器
 * 实现了BaseDownloader接口
 */
class BilibiliDownloader extends BaseDownloader {
    /**
     * 构造函数
     * @param {Object} options - 下载器配置选项
     * @param {string} [options.cookie] - B站cookie，用于下载高清视频
     * @param {number} [options.quality] - 视频质量代码
     * @param {string} [options.qualityFallback='best'] - 清晰度降级策略
     */
    constructor(options = {}) {
        super(options);
        this.platform = 'bilibili';
        this.videoProcessor = new VideoProcessor();
        this.fileUtils = FileUtils;

        // 默认配置
        this.options = {
            cookie: '',
            quality: config.platforms.bilibili.quality['1080P'],
            qualityFallback: 'best',
            ...options
        };
    }

    /**
     * 从URL中提取视频ID
     * @param {string} url - 视频URL
     * @returns {string|null} 视频ID或null
     */
    extractVideoId (url) {
        // 支持多种URL格式
        const patterns = [
            /bilibili\.com\/video\/([^/?]+)/,  // 常规URL
            /b23\.tv\/([^/?]+)/               // 短链接
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * 验证URL是否为B站视频URL
     * @param {string} url - 要验证的URL
     * @returns {boolean} 是否为有效URL
     */
    isValidUrl (url) {
        return !!this.extractVideoId(url);
    }

    /**
     * 获取视频信息
     * @param {string} url - 视频URL
     * @returns {Promise<Object>} 视频信息对象
     * @throws {Error} 当获取失败时抛出异常
     */
    async getVideoInfo (url) {
        const bvid = this.extractVideoId(url);
        if (!bvid) {
            throw new Error('无效的B站视频URL');
        }

        const apiUrl = `${config.platforms.bilibili.api.videoInfo}?bvid=${bvid}`;
        const headers = {
            'User-Agent': config.platforms.bilibili.userAgent,
            'Referer': config.platforms.bilibili.referer,
            Cookie: this.options.cookie
        };

        const response = await fetch(apiUrl, { headers });
        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(`获取视频信息失败: ${data.message}`);
        }

        return data.data;
    }

    /**
     * 获取视频下载信息
     * @param {string} url - 视频URL
     * @returns {Promise<Object>} 下载信息对象
     * @throws {Error} 当获取失败时抛出异常
     */
    async getVideoDownloadInfo (url) {
        const videoInfo = await this.getVideoInfo(url);
        const cid = videoInfo.cid;
        const bvid = videoInfo.bvid;

        const apiUrl = `${config.platforms.bilibili.api.playUrl}?bvid=${bvid}&cid=${cid}&qn=${this.options.quality}&fnval=16`;
        const headers = {
            'User-Agent': config.platforms.bilibili.userAgent,
            'Referer': config.platforms.bilibili.referer,
            Cookie: this.options.cookie
        };

        const response = await fetch(apiUrl, { headers });
        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(`获取下载链接失败: ${data.message}`);
        }

        // 处理分P视频
        const downloads = [];
        if (videoInfo.pages && videoInfo.pages.length > 0) {
            for (const page of videoInfo.pages) {
                const pageApiUrl = `${config.platforms.bilibili.api.playUrl}?bvid=${bvid}&cid=${page.cid}&qn=${this.options.quality}&fnval=16`;
                const pageResponse = await fetch(pageApiUrl, { headers });
                const pageData = await pageResponse.json();

                if (pageData.code === 0 && pageData.data && pageData.data.dash) {
                    const videoStream = this.getBestQualityStream(pageData.data.dash.video);
                    const audioStream = this.getBestQualityStream(pageData.data.dash.audio);

                    downloads.push({
                        title: page.part || `P${page.page}`,
                        page: page.page,
                        cid: page.cid,
                        video: {
                            url: videoStream.baseUrl,
                            headers: headers
                        },
                        audio: {
                            url: audioStream.baseUrl,
                            headers: headers
                        }
                    });
                }
            }
        } else {
            // 单个视频
            const videoStream = this.getBestQualityStream(data.data.dash.video);
            const audioStream = this.getBestQualityStream(data.data.dash.audio);

            downloads.push({
                title: videoInfo.title,
                page: 1,
                cid: cid,
                video: {
                    url: videoStream.baseUrl,
                    headers: headers
                },
                audio: {
                    url: audioStream.baseUrl,
                    headers: headers
                }
            });
        }

        return {
            title: videoInfo.title,
            bvid: bvid,
            author: videoInfo.owner.name,
            description: videoInfo.desc,
            downloads: downloads
        };
    }

    /**
     * 获取最佳质量的流
     * @param {Array} streams - 流数组
     * @returns {Object} 最佳质量的流
     */
    getBestQualityStream (streams) {
        if (!streams || streams.length === 0) {
            throw new Error('没有可用的流');
        }

        // 按照质量排序
        const sortedStreams = [...streams].sort((a, b) => b.bandwidth - a.bandwidth);
        return sortedStreams[0];
    }

    /**
     * 下载视频
     * @param {string} url - 视频URL
     * @param {string} [outputDir] - 输出目录，默认为平台特定的下载目录
     * @param {Object} [downloadOptions={}] - 下载选项
     * @param {boolean} [downloadOptions.keepTempFiles=false] - 是否保留临时文件
     * @returns {Promise<Object>} 下载结果对象
     * @throws {Error} 当下载失败时抛出异常
     */
    async download (url, outputDir, downloadOptions = {}) {
        try {
            logger.info('开始下载B站视频...');
            const videoInfo = await this.getVideoDownloadInfo(url);

            // 使用平台特定的下载目录
            const mainDir = outputDir || this.fileUtils.getPlatformDownloadDir('bilibili', this.fileUtils.sanitizeFileName(videoInfo.title));

            logger.info(`视频标题: ${videoInfo.title}`);
            logger.info(`分P数量: ${videoInfo.downloads.length}`);

            const downloadResults = [];

            for (const [index, download] of videoInfo.downloads.entries()) {
                logger.info(`\n正在处理第 ${index + 1}/${videoInfo.downloads.length} 个视频: ${download.title}`);

                const safeTitle = this.fileUtils.sanitizeFileName(download.title);
                const videoPath = path.join(mainDir, `${safeTitle}.video.mp4`);
                const audioPath = path.join(mainDir, `${safeTitle}.audio.m4a`);
                const outputPath = path.join(mainDir, `${safeTitle}.mp4`);

                if (this.fileUtils.fileExists(outputPath)) {
                    logger.info(`文件已存在，跳过: ${outputPath}`);
                    downloadResults.push({
                        title: download.title,
                        path: outputPath,
                        skipped: true
                    });
                    continue;
                }

                logger.info('下载视频流...');
                await this.videoProcessor.downloadFile(download.video.url, videoPath, download.video.headers);

                logger.info('下载音频流...');
                await this.videoProcessor.downloadFile(download.audio.url, audioPath, download.audio.headers);

                logger.info('合并音视频...');
                // 传递 keepTempFiles 选项，默认为 false，表示不保留临时文件
                await this.videoProcessor.mergeVideoAudio(videoPath, audioPath, outputPath, {
                    keepTempFiles: downloadOptions.keepTempFiles || false
                });

                logger.info(`完成: ${safeTitle}`);
                downloadResults.push({
                    title: download.title,
                    path: outputPath,
                    skipped: false
                });
            }

            logger.info('\n所有文件处理完成！');
            logger.info(`文件保存在: ${mainDir}`);

            return {
                success: true,
                title: videoInfo.title,
                outputDir: mainDir,
                downloads: downloadResults
            };
        } catch (error) {
            logger.error(`处理过程中出现错误: ${error.message}`);
            throw error;
        }
    }
}

module.exports = BilibiliDownloader; 