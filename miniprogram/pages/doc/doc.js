// miniprogram/pages/doc/doc.js
const app = getApp()
const api = require('../../apis/index.js')
const util = require('../../utils/utils.js')
const wxCharts = require('../../utils/wxcharts-min.js')
let lineChart = null;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    user: {},
    showChart: false,
    records: [],
    records1: [], // 裸眼数据
    records2: [], // 眼镜数据
    loading: true,
    eyesGlasses: '1'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.chartInit()
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
    if (app.globalData.currentUser && app.globalData.currentUser._id) {
      wx.showLoading({
        title: '加载中',
        mask: true
      })
      api.getRecords(app.globalData.currentUser._id)
      .then(res => {
        wx.hideLoading()
        const records = res.result.data
        this.setData({ records: this.dealData(records), loading: false })
        this.data.records1 = records.filter(item => {
          if (item.right) {
            return item.right.eyesGlasses === '1'
          }
          return item.left.eyesGlasses === '1'
        })
        this.data.records2 = records.filter(item => {
          if (item.right) {
            return item.right.eyesGlasses === '2'
          }
          return item.left.eyesGlasses === '2'
        })
      })
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

  },
  toogleChart () {
    this.setData({ showChart: !this.data.showChart })
    this.updateData(this.data.eyesGlasses)
  },
  toogleEyesGlasses () {
    let eyesGlasses = this.data.eyesGlasses === '1' ? '2' : '1'
    this.updateData(eyesGlasses)
    this.setData({ eyesGlasses })
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
  },
  chartInit () {
    let windowWidth = 320;
    try {
      let res = wx.getSystemInfoSync();
      windowWidth = res.windowWidth;
    } catch (e) {
      console.error('getSystemInfoSync failed!');
    }
    let simulationData = this.createSimulationData('1');
    lineChart = new wxCharts({
      canvasId: 'lineCanvas',
      type: 'line',
      categories: simulationData.categories,
      animation: true,
      // background: '#f5f5f5',
      series: [{
        name: '右眼',
        data:  simulationData.rightData,
        format: function (val, name) {
          return (val / 10).toFixed(1)
        },
        color: '#f86e6a'
      }, {
        // 左眼放后面，有时曲线需要覆盖右眼数据
        name: '左眼',
        data: simulationData.leftData,
        format: function (val, name) {
          return (val / 10).toFixed(1)
        },
        color: '#4caf9a'
      }],
      xAxis: {
        disableGrid: true,
        type: 'calibration'
      },
      yAxis: {
        title: '',
        format: function (val) {
          return (val / 10).toFixed(1);
        },
        min: 39,
        max: 54
      },
      width: windowWidth * 0.813,
      height: 200,
      dataLabel: false,
      dataPointShape: true,
      enableScroll: true,
      legend: false
    })
  },
  touchHandler: function (e) {
    lineChart.showToolTip(e, {
      // background: '#7cb5ec',
      format: function (item, category) {
        return category + ' ' + item.name + ':' + item.data 
      }
    });
  },
  touchHandler: function(t) {
    lineChart.scrollStart(t)
  },
  moveHandler: function(t) {
    lineChart.scroll(t)
  },
  touchEndHandler: function(t) {
    lineChart.scrollEnd(t), lineChart.showToolTip(t, {
      format: function(t, e) {
        return e + " " + t.name + ":" + t.data
      }
    });
  },
  // eyesGlasses { string } 1 裸眼 2 眼镜
  createSimulationData: function (eyesGlasses) {
    let categories = []
    let leftData = []
    let rightData = []
    let records = this.data['records' + eyesGlasses]
    let hasRightData = false
    for (let i = 0; i < records.length; i++) {
      categories.push(util.dateFormat(records[i].timestamp, 'yyyy.MM.dd'))
      leftData.push(records[i].left.v1 * 10)
      // 右眼数据稍微复杂，因为右眼数据可能不存在
      let rd = ''
      if (records[i].right) {
        // 有当前下标的右眼数据
        rd = records[i].right.v1
        hasRightData = true
      } else if (hasRightData) {
        // 之前有个右眼数据了
        rd = rightData[i - 1]
      } else {
        // 一直都没有右眼数据，则让右眼曲线与左眼的重合，让右眼曲线在曲线图上不可见
        rd = records[i].left.v1
      }
      rightData.push(rd * 10)
    }
    return { categories, leftData, rightData }
  },
  // eyesGlasses { string } 1 裸眼 2 眼镜
  updateData: function (eyesGlasses) {
    let simulationData = this.createSimulationData(eyesGlasses);
    let series = [{
      name: '右眼',
      data:  simulationData.rightData,
      format: function (val, name) {
        return (val / 10).toFixed(1)
      },
      color: '#f86e6a'
    }, {
      // 左眼放后面，有时曲线需要覆盖右眼数据
      name: '左眼',
      data: simulationData.leftData,
      format: function (val, name) {
        return (val / 10).toFixed(1)
      },
      color: '#4caf9a'
    }]
    lineChart.updateData({
      categories: simulationData.categories,
      series: series
    })
  },
})