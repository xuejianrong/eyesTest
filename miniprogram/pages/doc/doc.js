// miniprogram/pages/doc/doc.js
const app = getApp()
const api = require('../../apis/index.js')
const util = require('../../utils/utils.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    user: {},
    showChart: false,
    records: [],
    loading: true
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
    this.setData({ user: app.globalData.currentUser })
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    api.getRecords(app.globalData.currentUser._id)
      .then(res => {
        wx.hideLoading()
        const records = res.result.data
        this.setData({ records: this.dealData(records), loading: false })
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
  toogleChart () {
    this.setData({ showChart: !this.data.showChart })
  },
  dealData (data) {
    const list = data.map(item => ({
      ...item,
      dateStr: util.dateFormat(item.timestamp, 'yyyy年MM月'),
      dateStr2: util.dateFormat(item.timestamp, 'dd/hh:mm')
    }))
    return list.reduce((prev, next) => {
      const matchIndex = prev.findIndex(item => item.dateStr === next.dateStr)
      // 无匹配项，创建一个新的日期项
      if (matchIndex === -1) {
        return prev.concat({ dateStr: next.dateStr, list: [next] })
      }
      // 删除匹配到的项
      const matchItem = (prev.splice(matchIndex, 1))[0]
      // 修改匹配项并插入到数据中
      prev.splice(matchItem, 0, { dateStr: matchItem.dateStr, list: matchItem.list.concat(next) })
      return prev
    }, [])
  }
})