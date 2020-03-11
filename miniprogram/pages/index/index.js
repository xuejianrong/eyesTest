const app = getApp()
const api = require('../../apis/index.js')
const util = require('../../utils/utils.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    users: [],
    currentIndex: 0,
    currentUser: {},
    left_v1: '', 
    left_v2: '',
    left_plus: false,
    date: '',
    right_v1: '', 
    right_v2: '',
    right_plus: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取该微信用户(openID)下的所有测试用户，如果没有则新增一条记录
    api.getOpenid()
      .then(res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        const { openid } = res.result
        app.globalData.openid = openid
        return openid
      })
    wx.showLoading({
      title: '加载中'
    })
    // 获取数据不需要openID，默认也就只能获取该用户创建的数据
    api.getUsers()
      .then(res => {
        console.log('getUsers', res)
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
        console.log('addUser', res)
        return api.getUsers()
      }).then(res => {
        if (!res) return
        console.log('addUser 之后 getUsers', res)
        wx.hideLoading()
        const { data } = res
        this.setUsers(data)
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    app.swiperChange = curr => {
      console.log(curr)
      console.log(this.data.currentIndex)
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      users: app.globalData.users,
      currentIndex: app.globalData.currentIndex,
      currentUser: app.globalData.currentUser
    })
    // 如果存在用户数据，则重新拉取最近测试记录
    if (this.data.currentUser && this.data.currentUser._id) {
      this.setUsers(app.globalData.users)
    }
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
    app.swiperChange = undefined
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
  setUsers (users) {
    app.globalData.users = users
    app.globalData.currentUser = users[app.globalData.currentIndex]
    this.setData({
      users: users,
      currentUser: users[app.globalData.currentIndex]
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
            date: util.dateFormat(record.date, 'yyyy-MM-dd hh:mm'),
            right_v1: right.v1,
            right_v2: right.v2,
            right_plus: right.list && right.list[0].right > 0
          })
        }
      })
  },
  start () {
    wx.navigateTo({
      url: '../detection/index?type=left',
    })
  }
})