// miniprogram/pages/editUser/index.js
const app = getApp()
const api = require('../../apis/index.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    detail: {
      sex: 'man'
    },
    type: 'add'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      type: options.type || 'add'
    })
    // edit
    if (options.type === 'edit') {
      this.setData({
        detail: app.globalData.currentUser
      })
      return
    }
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
  selectMan () {
    this.setData({
      'detail.sex': 'man'
    })
  },
  selectWoman () {
    this.setData({
      'detail.sex': 'woman'
    })
  },
  onSexChange (event) {
    this.setData({
      'detail.sex': event.detail
    })
  },
  bindDateChange (e) {
    this.setData({
      'detail.birth': e.detail.value
    })
  },
  formSubmit (e) {
    console.log('form发生了submit事件，携带数据为：', e.detail.value)
    const { detail, type } = this.data
    const data = {
      sex: detail.sex,
      birth: detail.birth,
      avatar: detail.avatar,
      ...e.detail.value
    }
    wx.showLoading({
      title: '保存中',
    })
    if (type === 'edit') {
      api.updateUser(detail._id, data)
        .then(res => {
          return api.getUsers()
        })
        .then(res => {
          app.globalData.users = res.data
          wx.hideLoading()
          wx.navigateBack()
        })
    }
    if (type === 'add') {
      api.addUser(data)
        .then(res => {
          return api.getUsers()
        })
        .then(res => {
          app.globalData.users = res.data
          app.globalData.currentIndex = res.data.length - 1
          app.globalData.currentUser = res.data[res.data.length - 1]
          wx.hideLoading()
          wx.navigateBack()
        })
    }
  },
  doDelete () {
    let _this = this
    wx.showModal({
      content: '确认删除吗？',
      success (res) {
        if (res.confirm) {
          api.deleteUser(_this.data.detail._id)
            .then(() => {
              api.delRecordsByUid(_this.data.detail._id)
              return api.getUsers()
            })
            .then(res => {
              app.globalData.users = res.data
              wx.hideLoading()
              wx.navigateBack()
            })
        }
      }
    })
  },
  // 上传图片
  doUpload () {
    const _this = this
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success (res) {
        wx.showLoading({
          title: '上传中',
        })
        console.log(_this.data.detail)
        const filePath = res.tempFilePaths[0]
        let detail = _this.data.detail

        // 上传图片
        const cloudPath = _this.data.detail._id + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)
            detail.avatar = res.fileID
            _this.setData({
              detail
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  }
})