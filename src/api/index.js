const express = require('express');
const bilibiliRouter = require('./bilibili');
const tiktokRouter = require('./tiktok');
const { createLogger } = require('../common/Logger');

// 创建日志记录器
const logger = createLogger('API');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: 通用
 *   description: 通用API接口
 */

// 平台路由
router.use('/bilibili', bilibiliRouter);
router.use('/tiktok', tiktokRouter);

/**
 * @swagger
 * /api/download:
 *   post:
 *     summary: 通用视频下载接口
 *     description: 根据视频URL自动检测平台并下载视频
 *     tags: [通用]
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
 *                 description: 视频URL（支持B站和TikTok）
 *                 example: https://www.bilibili.com/video/BV1QrwGenEAS
 *               cookie:
 *                 type: string
 *                 description: B站cookie，用于下载高清视频或需要登录的内容，仅对B站有效
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
 *                 path:
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
// 通用视频下载接口
router.post('/download', async (req, res) => {
    try {
        const { url, cookie } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: '请提供视频URL'
            });
        }

        // 根据URL自动检测平台
        let targetPlatform;
        if (url.includes('bilibili.com') || url.includes('b23.tv')) {
            targetPlatform = 'bilibili';
        } else if (url.includes('tiktok.com') || url.includes('douyin.com') || url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
            targetPlatform = 'tiktok';
        } else {
            return res.status(400).json({
                success: false,
                message: '不支持的视频平台，目前仅支持B站和TikTok'
            });
        }

        // 创建一个新的请求对象，包含所需参数
        const platformReq = {
            body: {
                url,
                cookie: targetPlatform === 'bilibili' ? cookie : undefined
            },
            method: 'POST',
            path: `/${targetPlatform}/download`
        };

        // 创建一个新的响应对象来捕获平台处理程序的响应
        const platformRes = {
            json: (data) => res.json(data),
            status: (code) => {
                res.status(code);
                return platformRes;
            }
        };

        // 转发到对应平台的下载接口
        if (targetPlatform === 'bilibili') {
            return bilibiliRouter.handle(platformReq, platformRes, () => {
                res.status(500).json({
                    success: false,
                    message: '处理B站视频下载请求时出错'
                });
            });
        } else if (targetPlatform === 'tiktok') {
            return tiktokRouter.handle(platformReq, platformRes, () => {
                res.status(500).json({
                    success: false,
                    message: '处理TikTok视频下载请求时出错'
                });
            });
        }
    } catch (error) {
        logger.error(`下载视频失败: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: API状态检查
 *     description: 检查API服务是否正常运行
 *     tags: [通用]
 *     responses:
 *       200:
 *         description: API状态信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API服务正常运行
 *                 platforms:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [bilibili, tiktok]
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
// API状态检查
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'API服务正常运行',
        platforms: ['bilibili', 'tiktok'],
        version: '1.1.0'
    });
});

module.exports = router; 