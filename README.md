# Knowledge Notes

这是一个用于公开展示个人学习笔记的 Astro 静态站点

站点内容来自本地 Obsidian 知识库，经过筛选、转换和整理后发布到 GitHub Pages，适合长期保留、公开查看和按主题回看学习记录

## 目录关系

当前方案把知识库、发布中间层和站点代码拆成三个同级目录

- `../知识仓库`：私有 Obsidian 知识库，日常写作和原始笔记都保留在这里
- `../notes-publish`：发布中间层，保存公开笔记清单、导出的 Markdown、复制后的附件和最近一次发布记录
- `../notes-site`：Astro 站点目录，负责页面展示、本地预览、构建和 GitHub Pages 部署

## 工作流程

日常使用时，先在 `../知识仓库` 中继续写作和整理笔记

如果要新增或调整公开笔记，修改 `../notes-publish/manifest/publish.config.json` 中的发布清单

然后在本站点目录运行：

```bash
npm run publish:notes
```

这个命令会把允许公开的笔记导出到 Astro 内容目录，并同步需要展示的附件

本地预览：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

本地查看生产构建结果：

```bash
npm run preview
```

## 发布脚本当前行为

`npm run publish:notes` 会执行以下处理

- 只导出 `publish.config.json` 中列出的公开笔记
- 将 Obsidian 图片语法转换为普通 Markdown 图片引用
- 将已发布目标的 Wiki 链接转换为站内链接
- 复制公开笔记需要使用的附件到 `public/assets`
- 生成 Astro 内容集合需要的 Markdown 文件
- 将未解析的链接和附件记录到 `../notes-publish/manifest/last-run.json`

## 页面展示

站点目前包含以下页面

- 首页：展示专题入口、精选笔记、最近更新和归档速览
- 全部笔记：按更新时间浏览所有公开笔记
- 分类页：按稳定主题组织公开内容
- 标签页：跨分类串联概念、工具和问题
- 笔记详情页：展示正文、目录、元信息、标签和相关阅读
- 说明页：说明这个公开站与本地知识库之间的关系

页面文案面向个人学习记录和笔记整理，不把站点包装成正式博客或产品页

## 数学公式

站点使用 `remark-math`、`rehype-katex` 和 `katex` 渲染 Markdown 中的数学公式

配置位于 `astro.config.mjs`，样式在全局布局中引入

## 部署

本站点部署到 GitHub Pages

当前 Astro 配置：

- `site`: `https://Xiqichaoming.github.io`
- `base`: `/knowledge-notes-pages-test`
- `output`: `static`

GitHub Actions 工作流位于 `.github/workflows/deploy.yml`

推送到 `main` 分支后，Actions 会自动构建并发布站点

## 后续维护建议

- 日常写作只改 `../知识仓库`
- 公开范围只通过 `publish.config.json` 控制
- 每次新增公开笔记后运行 `npm run publish:notes`
- 推送前运行 `npm run build` 检查站点能否正常生成
- 不直接手改生成出来的公开笔记内容，避免下次发布时被覆盖
