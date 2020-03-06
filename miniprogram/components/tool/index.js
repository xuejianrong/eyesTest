// components/tool/index.js
let app = getApp()
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    type: {
      type: String,
      value: '1'  // 1 默认，2 没有音频开关和toast提示
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    show: false,
    mic: true,
    direction: 1,
    start: 0,
    end: 13,
    picType: 'E'
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toogleTool () {
      this.setData({
        show: !this.data.show
      })
      let _this = this
      wx.getStorage({
        key: 'mic',
        success: function (res) {
          _this.setData({
            mic: res.data
          })
        }
      })
      wx.getStorage({
        key: 'direction',
        success: function (res) {
          _this.setData({
            direction: res.data
          })
        }
      })
      wx.getStorage({
        key: 'start',
        success: function(res) {
          _this.setData({
            start: res.data
          })
        },
      })
      wx.getStorage({
        key: 'end',
        success: function (res) {
          _this.setData({
            end: res.data
          })
        },
      })
      wx.getStorage({
        key: 'picType',
        success: function (res) {
          _this.setData({
            picType: res.data
          })
        },
      })
    },
    toogleMic () {
      let mic = !this.data.mic
      this.setData({ mic })
      wx.setStorage({
        key: 'mic',
        data: mic,
      })
    },
    toogleDirection () {
      let direction = this.data.direction ? 0 : 1
      this.setData({ direction, show: false })
      wx.setStorage({
        key: 'direction',
        data: direction
      })
      let { start: end, end: start } = this.data
      wx.setStorage({ key: 'start', data: start })
      wx.setStorage({ key: 'end', data: end })
      this.setData({ start, end })
      // 默认模式下才弹toast
      this.properties.type === '1' && wx.showToast({
        title: '视力值已切换从' + app.globalData.eyesightList[start].value + '开始',
        icon: 'none',
        mask: true,
        duration: 2000
      })
      app.toogleEyesightHandle && app.toogleEyesightHandle()
    },
    toogleType() {
      let picType = this.data.picType === 'E' ? '儿童' : 'E'
      this.setData({ picType, show: false })
      wx.setStorage({ key: 'picType', data: picType })
      // 默认模式下才弹toast
      this.properties.type === '1' && wx.showToast({
        title: '已切换成' + picType + '视力表',
        icon: 'none',
        mask: true,
        duration: 2000
      })
      app.tooglePicTypeHandle && app.tooglePicTypeHandle()
    }
  }
})
