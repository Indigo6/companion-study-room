# 陪伴自习室规划阅读页

项目包含完整产品规划源文档和一个无需构建、无需第三方依赖的 HTML 阅读页。

## 使用

直接打开 `index.html`，或在项目根目录启动任意静态文件服务器。

```bash
python3 -m http.server 8080
```

访问 `http://localhost:8080`。运行结构测试：

```bash
node --test tests/site.test.mjs
```

