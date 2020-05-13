const app = getApp()
const api = require('../../apis/index.js')
const util = require('../../utils/utils.js')

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
      { url: '/pages/beforeDetection/index', name: '视力检测' },
      { url: '', name: '身高测量' },
      { url: '', name: '激光校准' },
      { url: '/pages/userList/index', name: '用户管理' },
      { url: '', name: '系统设置' },
      { url: '', name: '联系我们' },
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
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
    wx.navigateTo({
      url: this.data.tabs[dataset.index].url
    })
  }
})