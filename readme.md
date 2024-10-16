# 介绍
【野百合远程控制】是我的第 2 个全栈项目，这是后端部分。基于 ws 库从 0 到 1 实现了一个简单的 websocket 服务，以支撑前端业务。前段端部分采用 Electron 实现。

前端部分：https://github.com/adamswan/Wild_Lily_FrontEnd

掘金文章地址：https://juejin.cn/post/7413356439474995215

# 实现思路
1. 控制端和傀儡端都使用该服务，所以两端连接时会触发两次 connectiong 事件。
2. 两端连接产生两个 6 位随机数，用它作为控制的密钥
3. 用 Map 结构存储随机数与 ws 实例的映射关系
4. 登录事件（login）：登录后，返回各端控制码 code
5. 控制事件（control）：控制端输入傀儡端的 code ，就能控制傀儡端，服务器给控制端返回成功控制的提示，remote 为傀儡端的 code；通过建立两个 ws 的关联关系，傀儡端也能收到被控制的通知
6. 转发事件（forward）：转发 SDP 邀请

# 使用
1. 终端中执行 node websocketServer.js
2. 前端连接 ws://127.0.0.1:8088