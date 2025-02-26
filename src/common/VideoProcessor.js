const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { createLogger } = require('./Logger');

// 创建日志记录器
const logger = createLogger('VideoProcessor');

// 全局变量，用于跟踪是否已经显示过FFmpeg警告
let ffmpegWarningShown = false;

/**
 * 视频处理工具类
 * 提供视频下载、合并等功能
 */
class VideoProcessor {
    constructor() {
        // 检查 FFmpeg 是否可用
        this.ffmpegAvailable = false;
        this.checkFFmpeg();
    }

    /**
     * 检查 FFmpeg 是否已安装
     */
    checkFFmpeg () {
        try {
            // 使用同步方式检查，确保在使用前已经确定状态
            const { execSync } = require('child_process');
            try {
                execSync('ffmpeg -version', { stdio: 'ignore' });
                this.ffmpegAvailable = true;
                // 只在首次检测到FFmpeg时显示消息
                if (!ffmpegWarningShown) {
                    logger.info('FFmpeg 已安装，视频处理功能可用。');
                }
            } catch (error) {
                this.ffmpegAvailable = false;
                // 只在首次检测到FFmpeg缺失时显示警告
                if (!ffmpegWarningShown) {
                    logger.warn('警告: FFmpeg 未安装或未添加到 PATH 中。视频合并功能将不可用。');
                    logger.warn('请按照 README.md 中的说明安装 FFmpeg。');
                    ffmpegWarningShown = true;
                }
            }
        } catch (error) {
            this.ffmpegAvailable = false;
            // 只在首次检测出错时显示警告
            if (!ffmpegWarningShown) {
                logger.warn('警告: 检查 FFmpeg 时出错。视频合并功能将不可用。');
                ffmpegWarningShown = true;
            }
        }
    }

    /**
     * 下载文件到指定路径
     * @param {string} url - 文件URL
     * @param {string} outputPath - 输出路径
     * @param {Object} [headers={}] - 请求头
     * @returns {Promise<void>}
     */
    async downloadFile (url, outputPath, headers = {}) {
        try {
            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
            }

            const fileStream = fs.createWriteStream(outputPath);
            await new Promise((resolve, reject) => {
                response.body.pipe(fileStream);
                response.body.on('error', reject);
                fileStream.on('finish', resolve);
            });

            logger.info(`文件下载完成: ${outputPath}`);
        } catch (error) {
            logger.error(`下载文件失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 使用ffmpeg合并视频和音频
     * @param {string} videoPath - 视频文件路径
     * @param {string} audioPath - 音频文件路径
     * @param {string} outputPath - 输出文件路径
     * @param {Object} [options={}] - 选项
     * @param {boolean} [options.keepTempFiles=false] - 是否保留临时文件
     * @returns {Promise<Object>} 合并结果
     */
    async mergeVideoAudio (videoPath, audioPath, outputPath, options = {}) {
        const { keepTempFiles = false } = options;

        return new Promise((resolve, reject) => {
            // 检查文件是否存在
            if (!fs.existsSync(videoPath)) {
                return reject(new Error(`视频文件不存在: ${videoPath}`));
            }
            if (!fs.existsSync(audioPath)) {
                return reject(new Error(`音频文件不存在: ${audioPath}`));
            }

            // 定义一个删除临时文件的函数
            const deleteTempFiles = () => {
                if (keepTempFiles) {
                    logger.info(`保留临时文件: ${videoPath} 和 ${audioPath}`);
                    return;
                }

                try {
                    if (fs.existsSync(videoPath)) {
                        fs.unlinkSync(videoPath);
                    }
                    if (fs.existsSync(audioPath)) {
                        fs.unlinkSync(audioPath);
                    }
                    logger.info('临时文件已删除');
                } catch (err) {
                    logger.warn(`删除临时文件失败: ${err.message}`);
                }
            };

            // 再次检查 FFmpeg 是否可用（以防初始化后安装了FFmpeg）
            this.checkFFmpeg();

            // 检查 FFmpeg 是否可用
            if (!this.ffmpegAvailable) {
                logger.warn('FFmpeg 不可用，将使用简单复制方法（仅保留视频，无音频）');
                try {
                    // 简单地复制视频文件作为输出
                    fs.copyFileSync(videoPath, outputPath);
                    logger.info(`由于 FFmpeg 不可用，仅复制了视频文件: ${outputPath}`);
                    logger.info(`音频文件 ${audioPath} 未合并，请安装 FFmpeg 获得完整体验`);

                    // 删除临时文件
                    deleteTempFiles();

                    return resolve({
                        success: true,
                        message: '由于 FFmpeg 不可用，仅复制了视频文件，没有音频',
                        outputPath
                    });
                } catch (err) {
                    return reject(new Error(`复制文件失败: ${err.message}`));
                }
            }

            // 使用ffmpeg合并视频和音频
            logger.info('使用 FFmpeg 合并视频和音频...');
            const ffmpeg = spawn('ffmpeg', [
                '-i', videoPath,
                '-i', audioPath,
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-strict', 'experimental',
                outputPath
            ]);

            let stdoutData = '';
            let stderrData = '';

            ffmpeg.stdout.on('data', (data) => {
                stdoutData += data.toString();
            });

            ffmpeg.stderr.on('data', (data) => {
                stderrData += data.toString();
                // 打印进度信息
                logger.debug(data.toString());
            });

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    logger.info(`合并完成: ${outputPath}`);

                    // 删除临时文件
                    deleteTempFiles();

                    resolve({
                        success: true,
                        message: '视频和音频合并成功',
                        outputPath
                    });
                } else {
                    logger.error(`ffmpeg 退出码: ${code}`);
                    logger.error(`ffmpeg 错误: ${stderrData}`);

                    // 尝试使用备用方法
                    logger.warn('FFmpeg 合并失败，尝试使用备用方法（仅保留视频）');
                    try {
                        fs.copyFileSync(videoPath, outputPath);
                        logger.info(`使用备用方法，仅复制了视频文件: ${outputPath}`);

                        // 删除临时文件
                        deleteTempFiles();

                        resolve({
                            success: true,
                            message: 'FFmpeg 合并失败，仅复制了视频文件，没有音频',
                            outputPath
                        });
                    } catch (err) {
                        // 即使备用方法失败，也尝试删除临时文件
                        deleteTempFiles();
                        reject(new Error(`合并失败，备用方法也失败: ${err.message}`));
                    }
                }
            });

            ffmpeg.on('error', (err) => {
                if (err.code === 'ENOENT') {
                    logger.error(`找不到 FFmpeg 命令。请确保 FFmpeg 已安装并添加到系统 PATH 中。安装说明请参考 README.md`);

                    // 尝试使用备用方法
                    logger.warn('尝试使用备用方法（仅保留视频）');
                    try {
                        fs.copyFileSync(videoPath, outputPath);
                        logger.info(`使用备用方法，仅复制了视频文件: ${outputPath}`);

                        // 删除临时文件
                        deleteTempFiles();

                        resolve({
                            success: true,
                            message: '由于 FFmpeg 不可用，仅复制了视频文件，没有音频',
                            outputPath
                        });
                    } catch (copyErr) {
                        // 即使备用方法失败，也尝试删除临时文件
                        deleteTempFiles();
                        reject(new Error(`找不到 FFmpeg，备用方法也失败: ${copyErr.message}`));
                    }
                } else {
                    logger.error(`启动 ffmpeg 失败: ${err.message}`);
                    // 删除临时文件
                    deleteTempFiles();
                    reject(new Error(`启动 ffmpeg 失败: ${err.message}`));
                }
            });
        });
    }

    /**
     * 获取视频信息
     * @param {string} videoPath - 视频文件路径
     * @returns {Promise<Object>} 视频信息对象
     */
    async getVideoInfo (videoPath) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(videoPath)) {
                return reject(new Error(`视频文件不存在: ${videoPath}`));
            }

            const ffprobe = spawn('ffprobe', [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                videoPath
            ]);

            let outputData = '';

            ffprobe.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            ffprobe.on('close', (code) => {
                if (code === 0) {
                    try {
                        const info = JSON.parse(outputData);
                        resolve(info);
                    } catch (err) {
                        reject(new Error(`解析视频信息失败: ${err.message}`));
                    }
                } else {
                    reject(new Error(`获取视频信息失败，ffprobe 退出码: ${code}`));
                }
            });

            ffprobe.on('error', (err) => {
                reject(new Error(`启动 ffprobe 失败: ${err.message}`));
            });
        });
    }
}

module.exports = VideoProcessor; 