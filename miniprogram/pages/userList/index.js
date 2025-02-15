let app = getApp()
let api = require('../../apis/index.js')
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    users: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },
  onShow: function () {
    this.getData()
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
  getData() {
    wx.showLoading({
      title: '加载中'
    })
    // 获取数据不需要openID，默认也就只能获取该用户创建的数据
    api.getUsers()
      .then(res => {
        const { data } = res
        wx.hideLoading()
        this.setUsers(data)
      })
  },
  setUsers(users) {
    app.globalData.users = users
    this.setData({
      users: users
    })
  },
  selectUser(e) {
    const { dataset } = e.currentTarget
    app.globalData.currentIndex = dataset.index
    app.globalData.currentUser = this.data.users[app.globalData.currentIndex]
    wx.switchTab({
      url: '/pages/home/home'
    })
  },
  onClose(event) {
    const { position, instance } = event.detail;
    const { dataset } = event.currentTarget
    switch (position) {
      case 'left':
      case 'cell':
        instance.close();
        app.globalData.currentIndex = dataset.index
        app.globalData.currentUser = this.data.users[app.globalData.currentIndex]
        wx.navigateTo({
          url: '../../pages/editUser/index?type=edit'
        })
        break;
      case 'right':
        Dialog.confirm({
          message: '确定删除吗？',
        }).then(() => {
          instance.close();
          this.doDelete(this.data.users[dataset.index]._id)
        });
        break;
    }
  },
  addUser() {
    wx.navigateTo({
      url: '../../pages/editUser/index?type=add'
    })
  },
  doDelete (id) {
    let _this = this
    api.deleteUser(id)
      .then(() => {
        api.delRecordsByUid(id)
        _this.getData()
      })
  }
})