const WebSocket = require('ws')
const { random } = require('lodash')

// 创建 WebSocket 服务
const wss = new WebSocket.Server({
    port: 8088
})

// 建立 6 位随机数与 ws 实例的映射
// 客户端、傀儡端都会登录，所以会产生两个 Map 成员
const map = new Map()

wss.on('connection', function connection(ws, request) { // 监听 connection 事件
    // 新增方法：发送格式化的数据
    ws.sendDataWithJSON = (type, oData) => {
        ws.send(JSON.stringify({
            action: type,
            data: oData
        }))
    }

    // 新增方法：处理错误请求数据
    ws.sendError = (oData) => {
        ws.send(JSON.stringify({
            action: 'error',
            data: oData
        }))
    }

    // 生成 6 位随机数
    const randomNum = random(100000, 999999, false)
    console.log('6 位随机数', randomNum)

    map.set(randomNum, ws)

    // 监听 message 事件
    listenMsg(randomNum, ws)

    // 监听 close 事件
    listenClose(randomNum, instance)

    // 超时自动断开
    whenTimeout(instance)
})

function listenMsg(randomNum, instance) {
    instance.on('message', function (message) {
        console.log('服务端收到消息:', message.toString('utf8'))

        let parsedMessage = {
            // action: '操作类型',
            // data: '负载'
        }

        try {
            parsedMessage = JSON.parse(message.toString('utf8'))
        } catch (errInfo) {
            instance.sendError(errInfo)
            return console.log('无效消息:', errInfo)
        }

        const { action, data } = parsedMessage

        if (action === 'login') { //! 处理登录
            instance.sendDataWithJSON('login-success', { code: randomNum })
        } else if (action === 'control') { //! 处理控制
            // 控制端输入傀儡端的 code，作为 remote 字段的值发送给ws服务，
            // 表示要控制code值为该值的傀儡端
            const remote = Number(data.remote)

            if (map.has(remote)) { // 如果要控制的用户存在
                // 通知控制端，控制成功
                instance.sendDataWithJSON('control-success', { 'remote': remote })

                //! 建立两个ws实例的联动关系
                // 获取傀儡端的 ws 实例
                let remoteWS = map.get(remote)
                // 将傀儡端的 ws 实例的 sendDataWithJSON 方法设置为控制端的 sendRemote 方法
                instance.sendRemote = remoteWS.sendDataWithJSON
                // 将控制端的 ws 实例的 sendDataWithJSON 方法设置为傀儡端的 sendRemote 方法
                remoteWS.sendRemote = instance.sendDataWithJSON

                // 通知傀儡端，它被控制了
                instance.sendRemote('controlled-by', { 'remote': randomNum })
            } else {
                instance.sendError('用户不存在')
            }
        } else if (action === 'forward') { //! 处理转发
            instance.sendRemote(data.event, data.data)
        }
    })
}

function listenClose(randomNum, instance) {
    instance.on('close', () => {
        map.delete(randomNum)
        delete instance.sendRemote
        clearTimeout(instance._closeTimeout)
    })
}

function whenTimeout(instance) {
    instance._closeTimeout = setTimeout(() => {
        instance.terminate()
    }, 600000);
}

