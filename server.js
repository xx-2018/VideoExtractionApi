const express = require("express");
const app = require("./src/app");
const { createLogger } = require("./src/common/Logger");
const config = require("./src/config");

// 创建日志记录器
const logger = createLogger('Server');

const PORT = process.env.PORT || config.server.port || 3001;

// 添加未捕获异常处理
process.on('uncaughtException', (err) => {
    logger.error(`未捕获的异常: ${err.message}`);
    logger.error(err.stack);
    logger.warn('服务器将继续运行，但请检查错误并修复问题');
});

// 添加未处理的Promise拒绝处理
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`未处理的Promise拒绝: ${reason}`);
    logger.warn('服务器将继续运行，但请检查错误并修复问题');
});

// 创建HTTP服务器并添加错误处理
const server = app.listen(PORT, () => {
    logger.info(`视频提取API服务已启动，运行在 http://localhost:${PORT}`);
    logger.info(`支持的平台: Bilibili, TikTok`);
    logger.info(`访问 http://localhost:${PORT} 查看API文档`);
    logger.info(`访问 http://localhost:${PORT}/api-docs 查看Swagger API文档`);
});

// 添加服务器错误处理
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`端口 ${PORT} 已被占用，请尝试使用其他端口`);
    } else {
        logger.error(`服务器错误: ${err.message}`);
        logger.error(err.stack);
    }
    process.exit(1);
});
