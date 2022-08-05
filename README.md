# EPUB 导出 HTML

将EPUB文件 导出到 HTML文件。世面上对垂直滚动支持比较好的，只有Neat Reader。但是着实有点贵，因此就随手写了这个项目。

大部分解析代码是参照 [https://github.com/zk4/epub2html/tree/master/epub2html](https://github.com/zk4/epub2html/tree/master/epub2html)

结合GithubAction 可以生成访问的站点: [https://zxcvbnmzsedr.github.io/epub_html/](https://zxcvbnmzsedr.github.io/epub_html/)

## 用法

将epub文件丢到book目录下即可,然后运行python epub2html/epub2html.py

最后出来的样子：
![img.png](img/img.png)

## 免责声明

本项目中的EPUB文件均来自网络和热心网友的PR，若有版权争议请提PR或者issues进行删除