// miniprogram/pages/beforeDetection/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    result: {
      picType: 'E', // E 儿童
      mode: 'voice', // hand voice
      distance: '40cm', // 40cm 3m
    },
    options: [
      { key: 'picType', value: 'E', name: 'E字视力表' },
      { key: 'picType', value: '儿童', name: '儿童视力表' },
      { key: 'mode', value: 'hand', name: '手动模式' },
      { key: 'mode', value: 'voice', name: '语音模式' },
      { key: 'distance', value: '40cm', name: '距离40cm' },
      { key: 'distance', value: '3m', name: '距离3m' }
    ],
    dialogShow: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const data = {
      picType: wx.getStorageSync('picType'),
      mode: wx.getStorageSync('mic') ? 'voice' : 'hand',
      distance: wx.getStorageSync('distance'),
    }
    this.setData({
      result: data
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
  selectOption (event) {
    let { dataset } = event.currentTarget
    let { key, value } = dataset
    let data = {}
    data[`result.${key}`] = value
    this.setData(data)
  },
  start () {
    wx.setStorageSync('picType', this.data.result.picType)
    wx.setStorageSync('mic', this.data.result.mode === 'voice')
    wx.setStorageSync('distance', this.data.result.distance)
    wx.navigateTo({
      url: '../detection/index?type=right',
    })
  },
  beforeStart () {
    this.setData({
      dialogShow: true
    })
  }
})