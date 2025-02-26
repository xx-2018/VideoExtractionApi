const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger定义
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '视频提取 API',
            version: '1.0.0',
            description: '支持从多个平台提取视频的API服务',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            },
            license: {
                name: 'ISC',
                url: 'https://opensource.org/licenses/ISC'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: '开发服务器'
            }
        ],
        tags: [
            {
                name: '通用',
                description: '通用API接口'
            },
            {
                name: 'Bilibili',
                description: 'B站视频提取接口'
            },
            {
                name: 'TikTok',
                description: 'TikTok视频提取接口'
            }
        ],
        components: {
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: '发生错误'
                        }
                    }
                },
                VideoInfo: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object',
                            properties: {
                                title: {
                                    type: 'string',
                                    example: '视频标题'
                                },
                                author: {
                                    type: 'string',
                                    example: '作者名称'
                                },
                                description: {
                                    type: 'string',
                                    example: '视频描述'
                                }
                            }
                        }
                    }
                },
                DownloadInfo: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object',
                            properties: {
                                title: {
                                    type: 'string',
                                    example: '视频标题'
                                },
                                downloadUrl: {
                                    type: 'string',
                                    example: 'https://example.com/video.mp4'
                                }
                            }
                        }
                    }
                },
                DownloadResult: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object',
                            properties: {
                                title: {
                                    type: 'string',
                                    example: '视频标题'
                                },
                                outputDir: {
                                    type: 'string',
                                    example: 'downloads/bilibili/视频标题'
                                },
                                downloads: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            title: {
                                                type: 'string',
                                                example: '视频标题'
                                            },
                                            path: {
                                                type: 'string',
                                                example: 'downloads/bilibili/视频标题/视频标题.mp4'
                                            },
                                            skipped: {
                                                type: 'boolean',
                                                example: false
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/api/*.js', './src/app.js'] // 指定包含API注释的文件路径
};

const specs = swaggerJsdoc(options);

module.exports = {
    serve: swaggerUi.serve,
    setup: swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "视频提取API文档"
    }),
    specs
}; 