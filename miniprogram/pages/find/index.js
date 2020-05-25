const api = require('../../apis/index.js')

import articles from './findClass'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    api.getArticles().then(res => {
      const list = res.result.data
      this.setData({ list })
      articles.set(list)
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
  openDetail (e) {
    const { dataset } = e.currentTarget
    articles.setCurrent(this.data.list[dataset.index], dataset.index)
    wx.navigateTo({
      url: '/pages/find/detail'
    })
  }
})