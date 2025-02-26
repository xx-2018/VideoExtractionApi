# 视频提取 API

一个支持从多个平台提取视频的 API 服务。

## 支持的平台

- Bilibili (B站)
- TikTok

## 特性

- 支持多平台视频提取
- RESTful API 设计
- Swagger API 文档
- 跨域资源共享 (CORS) 支持，可从任何前端应用调用
- 无水印视频下载
- 简化的API接口，每个平台只有一个下载接口

## 项目结构

```
├── downloads/            # 下载的视频存储目录
│   ├── bilibili/         # B站视频下载目录
│   └── tiktok/           # TikTok视频下载目录
├── src/                  # 源代码
│   ├── api/              # API路由
│   │   ├── bilibili.js   # B站API路由
│   │   ├── index.js      # 主API路由
│   │   └── tiktok.js     # TikTok API路由
│   ├── common/           # 通用工具
│   │   ├── BaseDownloader.js  # 基础下载器接口
│   │   ├── FileUtils.js       # 文件操作工具
│   │   └── VideoProcessor.js  # 视频处理工具
│   ├── platforms/        # 平台特定实现
│   │   ├── bilibili/     # B站实现
│   │   │   ├── BilibiliDownloader.js  # B站下载器
│   │   │   └── config/   # B站配置
│   │   └── tiktok/       # TikTok实现
│   │       └── TiktokDownloader.js    # TikTok下载器
│   ├── swagger.js        # Swagger API文档配置
│   └── app.js            # Express应用
└── server.js             # 服务器入口
```

## 安装

1. 克隆仓库
```bash
git clone https://github.com/yourusername/videoextractionapi.git
cd videoextractionapi
```

2. 安装依赖
```bash
npm install
```

3. 安装 FFmpeg (用于视频处理)

   **Windows:**
   - 下载 FFmpeg: 访问 [FFmpeg官网](https://ffmpeg.org/download.html) 或 [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) 下载 FFmpeg
   - 下载 "git" 版本的压缩包，例如 "ffmpeg-git-full.7z"
   - 解压缩下载的文件
   - 将解压后的 `bin` 目录添加到系统 PATH 环境变量:
     1. 右键点击 "此电脑" 或 "我的电脑"，选择 "属性"
     2. 点击 "高级系统设置"
     3. 点击 "环境变量"
     4. 在 "系统变量" 部分，找到并选择 "Path" 变量，然后点击 "编辑"
     5. 点击 "新建"，添加 FFmpeg 的 bin 目录路径 (例如 `C:\ffmpeg\bin`)
     6. 点击 "确定" 保存更改
   - 重启命令提示符或 PowerShell 窗口
   - 验证安装: 在命令提示符或 PowerShell 中运行 `ffmpeg -version`

   **macOS:**
   ```bash
   brew install ffmpeg
   ```

   **Linux:**
   ```bash
   # Debian/Ubuntu
   apt-get install ffmpeg
   
   # CentOS/RHEL
   yum install ffmpeg
   ```

   **注意:** 如果没有安装 FFmpeg，API 仍然可以运行，但视频合并功能将不可用。在这种情况下，下载的 B 站视频将只包含视频流，没有音频。

## 运行

```bash
npm start
```

开发模式（自动重启）:
```bash
npm run dev
```

服务器将在 http://localhost:3001 上运行。

## API 使用说明

### 通用下载接口

通用下载接口会根据URL自动检测平台并下载视频：

```javascript
// 使用 fetch API
fetch('http://localhost:3001/api/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: '视频URL', // B站或TikTok视频链接
    cookie: 'SESSDATA=xxx; bili_jct=xxx' // 可选，仅对B站有效
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('下载成功，文件路径:', data.path);
  } else {
    console.log('下载失败，原因:', data.message);
  }
})
.catch(error => console.error('Error:', error));
```

### 下载 B 站视频

```javascript
// 使用 fetch API
fetch('http://localhost:3001/api/bilibili/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://www.bilibili.com/video/BV1QrwGenEAS',
    cookie: 'SESSDATA=xxx; bili_jct=xxx' // 可选，用于下载高清视频或需要登录的内容
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('下载成功，文件路径:', data.path);
  } else {
    console.log('下载失败，原因:', data.message);
  }
})
.catch(error => console.error('Error:', error));
```

### 获取 B站 Cookie

要获取 B站 cookie 用于下载高清视频或需要登录的内容，请按照以下步骤操作：

1. 在浏览器中登录 B站 (https://www.bilibili.com)
2. 打开浏览器开发者工具 (F12 或右键点击 -> 检查)
3. 切换到 "应用" 或 "Application" 选项卡
4. 在左侧找到 "Cookies" -> "https://www.bilibili.com"
5. 找到并复制 "SESSDATA" 和 "bili_jct" 的值
6. 将这些值组合为 cookie 字符串: `SESSDATA=你的SESSDATA值; bili_jct=你的bili_jct值`

**注意:** 请勿分享你的 cookie，它包含你的登录凭证。

### 下载 TikTok 视频

```javascript
// 使用 fetch API
fetch('http://localhost:3001/api/tiktok/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://www.tiktok.com/@erria.eri/video/7446228096237178133?is_from_webapp=1'
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('下载成功，文件路径:', data.path);
  } else {
    console.log('下载失败，原因:', data.message);
  }
})
.catch(error => console.error('Error:', error));
```

API 响应示例:

```json
{
  "success": true,
  "message": "下载完成",
  "title": "TikTok_1234567890123456789",
  "path": "downloads\\tiktok\\TikTok_1234567890123456789.mp4"
}
```

## 故障排除

### FFmpeg 相关问题

如果您在下载视频时遇到以下错误：

```
处理过程中出现错误: Error: 启动 ffmpeg 失败: spawn ffmpeg ENOENT
```

这表示系统找不到 FFmpeg 命令。请按照以下步骤解决：

1. 确保已按照上述安装说明安装 FFmpeg
2. 确保 FFmpeg 的 bin 目录已添加到系统 PATH 环境变量
3. 重启命令提示符/PowerShell 和应用程序
4. 验证 FFmpeg 安装：在命令行中运行 `ffmpeg -version`

如果仍然无法解决问题，可以尝试：

- 使用完整路径运行 FFmpeg（修改代码中的 spawn 调用）
- 检查系统环境变量是否正确设置
- 重新安装 FFmpeg

### CORS 相关问题

如果您在前端应用中调用 API 时遇到 CORS 错误，请确保：

1. API 服务器正在运行
2. 您使用的是正确的 URL（包括端口号）
3. 请求方法（GET、POST 等）与 API 要求一致
4. 请求头设置正确（如 Content-Type: application/json）

如果问题仍然存在，可能是由于浏览器的安全策略。尝试使用浏览器扩展禁用 CORS（仅用于开发测试）。

## 许可证

ISC
