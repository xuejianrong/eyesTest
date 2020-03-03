// components/headSwiper/index.js
const app = getApp()
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    list: {
      type: Array,
      value: []
    },
    current: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  /**
   * 组件的方法列表
   */
  methods: {
    edit (e) {
      const { dataset } = e.currentTarget
      // 当前swiper-item才能点击
      if (this.data.current !== dataset.index) return
      this.toEditUser('edit')
    },
    add () {
      this.toEditUser('add')
    },
    toEditUser (type) {
      wx.navigateTo({
        url: '../../pages/editUser/index?type=' + type
      })
    },
    onSwiperChange (e) {
      const { detail } = e
      // 非用户触发或者当前swiper-item为add时return
      if (detail.source !== 'touch' || detail.current > this.properties.list.length) return
      app.globalData.currentUser = this.properties.list[detail.current]
      app.globalData.currentIndex = detail.current
      this.setData({
        current: detail.current
      })
    }
  }
})
