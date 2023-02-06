# xy-flow
一个简洁的git flow。

- xy-flow init
初始化设定主干分支名、测试分支名

- xy-flow feature start <branch-name> [-p prefix]
拉取主分支，并从主分支切出开发分支，检测是否重名

- xy-flow feature finish
检查远程分支是否存在测试分支，如果没有则创建，有则合并，推送远程仓库，合并冲突时由用户自行操作

- xy-flow publish
对比主分支和测试分支，如果不一致则跳转网页进行pr
获取主分支最新版本号，对比测试分支, 不一致则提供开发者小、中、大三个版本号升级选项，默认小，兼容旧tag版本号杂乱的情况。
基于该版本号对主分支分支打tag，并更新
删除测试分支
列举当前所有分支，多选进行删除分支，默认不选择，即不删除
