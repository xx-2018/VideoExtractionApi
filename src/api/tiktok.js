const express = require('express');
const TiktokDownloader = require('../platforms/tiktok/TiktokDownloader');
const path = require('path');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { createLogger } = require('../common/Logger');

// 创建日志记录器
const logger = createLogger('TiktokAPI');

const router = express.Router();
const downloader = new TiktokDownloader();

/**
 * @swagger
 * tags:
 *   name: TikTok
 *   description: TikTok视频下载API
 */

/**
 * @swagger
 * /api/tiktok/download:
 *   post:
 *     summary: 下载TikTok视频
 *     description: 下载TikTok视频到服务器并返回下载信息
 *     tags: [TikTok]
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
 *                 description: TikTok视频URL
 *                 example: https://www.tiktok.com/@erria.eri/video/7446228096237178133?is_from_webapp=1
 *     responses:
 *       200:
 *         description: 成功下载视频或提供下载信息
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
 *                   description: 下载的视频文件路径（如果成功下载）
 *                 folder:
 *                   type: string
 *                   description: 视频保存的文件夹路径
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/download', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, message: '缺少URL参数' });
        }

        if (!downloader.isValidUrl(url)) {
            return res.status(400).json({ success: false, message: '无效的TikTok视频URL' });
        }

        const result = await downloader.download(url);
        res.json(result);
    } catch (error) {
        logger.error(`下载TikTok视频失败: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 