const express = require('express');
const BilibiliDownloader = require('../platforms/bilibili/BilibiliDownloader');
const { createLogger } = require('../common/Logger');

// 创建日志记录器
const logger = createLogger('BilibiliAPI');

const router = express.Router();
const downloader = new BilibiliDownloader();

/**
 * @swagger
 * tags:
 *   name: Bilibili
 *   description: B站视频下载API
 */

/**
 * @swagger
 * /api/bilibili/download:
 *   post:
 *     summary: 下载B站视频
 *     description: 下载B站视频到服务器并返回下载信息
 *     tags: [Bilibili]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: B站视频URL
 *                 example: https://www.bilibili.com/video/BV1QrwGenEAS
 *               cookie:
 *                 type: string
 *                 description: B站cookie，用于下载高清视频或需要登录的内容
 *                 example: SESSDATA=xxx; bili_jct=xxx
 *     responses:
 *       200:
 *         description: 成功下载视频
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 title:
 *                   type: string
 *                 path:
 *                   type: string
 *                   description: 下载的视频文件路径
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/download', async (req, res) => {
    try {
        const { url, cookie } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, message: '缺少URL参数' });
        }

        if (!downloader.isValidUrl(url)) {
            return res.status(400).json({ success: false, message: '无效的B站视频URL' });
        }

        // 默认使用1080P质量
        const quality = 80;

        // 下载视频
        const result = await downloader.download(url, null, { quality, cookie });
        res.json(result);
    } catch (error) {
        logger.error(`下载B站视频失败: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 