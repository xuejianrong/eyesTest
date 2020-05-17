// miniprogram/pages/result/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    type: '', // left right
    left: {},
    right: {},
    leftList: [],
    rightList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this
    wx.getStorage({
      key: 'result',
      success: function (res) {
        const result = res.data
        const type = result.left ? 'left' : 'right'
        _this.setData({
          type,
          left: result.left,
          right: result.right,
          leftList: result.left ? result.left.list : [],
          rightList: result.right ? result.right.list : []
        })
        if (type === 'left') {
          wx.setStorage({ key: 'result', data: {} })
        }
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
  continueTest () {
    wx.redirectTo({
      url: '../detection/index?type=left'
    })
  },
  endTest () {
    wx.switchTab({
      url: '/pages/home/home'
    })
  }
})