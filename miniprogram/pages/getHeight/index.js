const app = getApp()
const api = require('../../apis/index.js')

import bluebooth from '../../utils/bluetooth.js'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentUser: {},
    value: ''
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      currentUser: app.globalData.currentUser
    })
    bluebooth.openDistance(this.onMsg)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    bluebooth.closeDistance(this.onMsg)
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    bluebooth.closeDistance(this.onMsg)
  },
  onMsg (res) {
    const validDistance = /^550581/.test(res) // 550581 开头的才是测距数据
    const validSure = res === '55038200da'  // 点击的是确定按钮
    if (validSure) {
      this.save()
      return
    }

    if (!validDistance) return
    console.log('收到的测距数据', res)
    let data = {}
    data.value = parseInt(res.slice(8, 12), 16) / 10
    this.setData(data)
  },
  save () {
    const _this = this
    bluebooth.closeDistance(this.onMsg)
    if (!this.data.value) {
      wx.showToast({
        icon: 'none',
        title: '请先连接设备然后测量身高',
        complete: function () {
          bluebooth.openDistance(this.onMsg)
        }
      })
      return
    }
    wx.showModal({
      content: '您测量的身高为' + this.data.value + 'cm',
      cancelText: '继续测量',
      confirmText: '保存',
      success: function (res) {
        if (res.confirm) {
          api.addHeightRecord({uid: _this.data.currentUser._id,  height: _this.data.value }).then(res => {
            wx.switchTab({ url: '/pages/home/home' })
          })
        }
        if (res.cancel) {
          bluebooth.openDistance(_this.onMsg)
        }
      }
    })
  }
})