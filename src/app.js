const express = require("express");
const path = require("path");
const cors = require("cors");
const apiRouter = require("./api");
const FileUtils = require("./common/FileUtils");
const swagger = require("./swagger");
const { createLogger } = require("./common/Logger");
const config = require("./config");

// 创建日志记录器
const logger = createLogger('App');

const app = express();

// 启用CORS中间件，允许跨域请求
app.use(cors());

// 中间件：解析 JSON 请求
app.use(express.json());

// 确保下载目录存在
FileUtils.ensureDir(path.join(__dirname, "../downloads"));
FileUtils.ensureDir(path.join(__dirname, "../downloads/bilibili"));
FileUtils.ensureDir(path.join(__dirname, "../downloads/tiktok"));

// Swagger API文档
/**
 * @swagger
 * /:
 *   get:
 *     summary: API首页
 *     description: 返回API的基本信息和可用端点
 *     tags: [通用]
 *     responses:
 *       200:
 *         description: API信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: 视频提取API
 *                 description:
 *                   type: string
 *                   example: 支持从多个平台提取视频的API服务
 *                 platforms:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [bilibili, tiktok]
 *                 endpoints:
 *                   type: object
 */
app.use('/api-docs', swagger.serve, swagger.setup);

// API 路由
app.use("/api", apiRouter);

// 首页
app.get("/", (req, res) => {
    res.json({
        name: "视频提取API",
        description: "支持从多个平台提取视频的API服务",
        version: config.version || "1.2.0",
        platforms: ["bilibili", "tiktok"],
        endpoints: {
            // 通用接口
            status: "/api/status (GET)",
            download: "/api/download (POST)",

            // 平台特定接口
            bilibili: {
                download: "/api/bilibili/download (POST)"
            },
            tiktok: {
                download: "/api/tiktok/download (POST)"
            }
        },
        documentation: "/api-docs"
    });
});

// 404 处理
app.use((req, res) => {
    logger.warn(`404 - 接口不存在: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: "接口不存在"
    });
});

// 错误处理
app.use((err, req, res, next) => {
    logger.error(`服务器错误: ${err.message}`);
    logger.error(err.stack);
    res.status(500).json({
        success: false,
        message: "服务器内部错误"
    });
});

module.exports = app;
