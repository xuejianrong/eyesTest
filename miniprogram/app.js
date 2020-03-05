//app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      })
    }

    this.globalData = {
      currentIndex: 0,
      users: [],
      eyesightList: [
        { value: '4.0/0.1', size: 212 },
        { value: '4.1/0.12', size: 168 },
        { value: '4.2/0.15', size: 134 },
        { value: '4.3/0.2', size: 106 },
        { value: '4.4/0.25', size: 84 },
        { value: '4.5/0.3', size: 67 },
        { value: '4.6/0.4', size: 53 },
        { value: '4.7/0.5', size: 42 },
        { value: '4.8/0.6', size: 34 },
        { value: '4.9/0.8', size: 27 },
        { value: '5.0/1.0', size: 21 },
        { value: '5.1/1.2', size: 17 },
        { value: '5.2/1.5', size: 13 },
        { value: '5.3/2.0', size: 6 },
      ]
    }

    // 初始化storage
    wx.setStorage({ key: 'mic', data: true }) // mic的开关
    wx.setStorage({ key: 'start', data: 0 }) // 测试开始的下标
    wx.setStorage({ key: 'end', data: 13 }) // 测试结束的下标
    wx.setStorage({ key: 'direction', data: 1 }) // 智力值是顺序(1)还是倒序(0)
    wx.setStorage({ key: 'picType', data: 'E' }) // E、儿童
    wx.setStorage({ key: 'eyesGlasses', data: '1' }) // 1 裸眼， 2 眼镜
    wx.setStorage({ key: 'counter', data: 5 }) // 视标数量(3-10) 正确几次通过：Math.floor((counter / 2) + 1)
  }
  // toogleEyesightHandle已被使用
  // tooglePicTypeHandle已被使用
})
