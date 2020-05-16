const app = getApp()
const api = require('../../apis/index.js')
const util = require('../../utils/utils.js')

import bluebooth from '../../utils/bluetooth.js'

function showLaserControl () {
  wx.showModal({
    title: '激光校准',
    cancelText: '打开激光',
    confirmText: '关闭激光',
    confirmColor: '#000',
    success: function (res) {
      if (res.confirm) {
        bluebooth.closeLaser()
      }
      if (res.cancel) {
        bluebooth.openLaser()
      }
    }
  })
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentUser: {},
    date: '',
    left_v1: '', 
    left_v2: '',
    left_plus: false,
    date: '',
    right_v1: '',
    right_v2: '',
    right_plus: false,
    tabs: [
      { name: '视力检测', url: '/pages/beforeDetection/index' },
      { name: '身高测量', url: '/pages/getHeight/index' },
      { name: '激光校准', handler: showLaserControl },
      { name: '用户管理', url: '/pages/userList/index' },
      { name: '系统设置', handler: 'showSetting' },
      { name: '联系我们', url: '' },
    ],
    settingShow: false,
    settingIconState: '1', // 1/2/3/4/5
    eyesGlasses: '1', // 1 裸眼/2 眼镜
    startValue: '4.0', // 用于标尺开始值的显示
    endValue: '5.3', // 用于标尺结束值的显示
    counter: 5, // 视标数量
    counterValue: 3, // 视标数量对应的正确通过数
    screenBrightness: 0.8,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this
    wx.getStorage({
      key: 'eyesGlasses',
      success: function(res) {
        _this.setData({ eyesGlasses: res.data })
      },
    })
    // 获取屏幕亮度，不足于0.8则调至0.8，否则不变
    wx.getScreenBrightness({
      success: function (res) {
        if (res.value >= 0.8) {
          _this.setData({ screenBrightness: res.value })
          return
        }
        _this.setData({ screenBrightness: 0.8 })
        wx.setScreenBrightness({ value: 0.8 })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    wx.showLoading({
      title: '加载中'
    })
    // 获取数据不需要openID，默认也就只能获取该用户创建的数据
    api.getUsers()
      .then(res => {
        const { data } = res
        if (!data || data.length === 0) {
          // 没有则创建
          return api.addUser()
        }
        wx.hideLoading()
        this.setUsers(data)
      })
      .then(res => {
        if (!res) return
        return api.getUsers()
      }).then(res => {
        if (!res) return
        wx.hideLoading()
        const { data } = res
        this.setUsers(data)
      })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  setUsers(users) {
    if (users.length === 0) {
      api.addUser().then(res => {
        return api.getUsers()
      }).then(res => {
        wx.hideLoading()
        const { data } = res
        this.setUsers(data)
      })
      return
    }
    app.globalData.users = users
    app.globalData.currentUser = users[app.globalData.currentIndex]
    this.setData({
      users: users,
      currentUser: users[app.globalData.currentIndex] || {}
    })
    api.getRecord({ uid: users[app.globalData.currentIndex]._id })
      .then(res => {
        const { data } = res
        if (data.length > 0) {
          const record = data[0]
          let left = record.left || {}
          let right = record.right || {}
          this.setData({
            left_v1: left.v1, 
            left_v2: left.v2,
            left_plus: left.list && left.list[0].right > 0,
            date: util.dateFormat(record.date, 'yyyy.MM.dd hh:mm'),
            right_v1: right.v1 || '',
            right_v2: right.v2 || '',
            right_plus: !!right.list && right.list[0].right > 0
          })
        } else {
          this.setData({
            left_v1: '', 
            left_v2: '',
            left_plus: false,
            date: '',
            right_v1: '', 
            right_v2: '',
            right_plus: false,
          })
        }
      })
  },
  tapTab(e) {
    const { dataset } = e.currentTarget
    let tab = this.data.tabs[dataset.index]
    if (tab.handler) {
      if (typeof tab.handler === 'function') {
        tab.handler()
      }
      if (typeof tab.handler === 'string' && this[tab.handler]) {
        this[tab.handler]()
      }
    }
    if (tab.url) {
      wx.navigateTo({
        url: this.data.tabs[dataset.index].url
      })
    }
  },
  showSetting () {
    this.setData({ settingShow: true })
  },
  hideSetting () {
    this.setData({ settingShow: false })
  },
  // 切换设置哪个参数
  toogleSettingState (e) {
    this.setData({ settingIconState: e.currentTarget.dataset.state })
  },
  // 裸眼、眼镜切换
  eyesGlassesHandle (e) {
    this.setData({ eyesGlasses: e.currentTarget.dataset.v })
  },
  // 更改开始视标
  startChangeHandle (e) {
    let { value } = e.detail
    let startValue = (value).toFixed(1)
    let start = parseInt(((value - 4) * 10).toFixed(1))
    this.setData({ start, startValue })
    wx.setStorage({ key: 'start', data: start })
    let direction = start <= this.data.end ? 1 : 0
    wx.setStorage({ key: 'direction', data: direction })
  },
  // 更改结束视标
  endChangeHandle (e) {
    let { value } = e.detail
    let endValue = (value).toFixed(1)
    let end = parseInt(((value - 4) * 10).toFixed(1))
    this.setData({ end, endValue })
    wx.setStorage({ key: 'end', data: end })
    let direction = this.data.start <= end ? 1 : 0
    wx.setStorage({ key: 'direction', data: direction })
  },
  // 更改视标数量
  counterChangeHandle (e) {
    let { value } = e.detail
    this.setData({ counter: value, counterValue: Math.floor((value / 2) + 1) })
    wx.setStorage({ key: 'counter', data: value })
  },
  // 调整屏幕亮度
  brightnessChangeHandle (e) {
    let { value } = e.detail
    this.setData({ screenBrightness: value })
    wx.setScreenBrightness({
      value
    })
  }
})