// miniprogram/pages/detection/index.js
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    type: 'left', // left 左眼，right 右眼
    start: 0, // list的下标 视标范围的开始
    end: 13, // list的下标 视标范围的结束
    current: 0, // list的下标 当前测试到哪个视标
    right: 0, // 当前视标正确个数
    wrong: 0, // 当前视标错误个数
    list: [],
    answer: 'up', // 当前图案的答案
    mic: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this
    this.setData({
      list: app.globalData.eyesightList
    })
    wx.getStorage({
      key: 'mic',
      success: function(res) {
        _this.setData({ mic: res.data })
      },
    })
    // 初次加载，随机一个答案
    this.random(true)
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
    let _this = this
    // 切换视力初始值触发的方法
    app.toogleEyesightHandle = () => {
      let { start: end, end: start } = _this.data
      _this.setData({ start, end, current: start, right: 0, wrong: 0 })
      _this.random()
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    app.toogleEyesightHandle = undefined
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    app.toogleEyesightHandle
  },
  random (isFirst) {
    let num = parseInt(Math.random() * 4) // 0|1|2|3
    let answer = ''
    switch (num) {
      case 0:
        answer = 'up'
        break
      case 1:
        answer = 'down'
        break
      case 2:
        answer = 'left'
        break
      case 3:
        answer = 'right'
    }
    if (!isFirst && answer === this.data.answer) {
      this.random()
      return
    }
    this.setData({
      answer
    })
  },
  response (answer) {
    if (answer === this.data.answer) {
      // 回答正确
      let right = this.data.right + 1
      if (right < 3) {
        console.log(right)
        this.setData({ right })
        this.random()
      } else if (this.data.current < this.data.end) {
        // right值为3 且未结束
        this.setData({
          current: this.data.current + 1
        })
        this.next()
      } else {
        // 全部都通过了
        this.over(true)
      }
    } else {
      // 回答错误
      let wrong = this.data.wrong + 1
      if (wrong < 3) {
        this.setData({ wrong })
        this.random()
      } else {
        this.over()
      }
    }
  },
  // 下一题
  next () {
    this.setData({
      right: 0,
      wrong: 0
    })
    this.random()
  },
  // 测试结束
  over (isPass) {
    if (isPass) {
      console.log('测试结果：', this.data.type + '眼视力值为 ' + this.data.list[this.data.current].value)
    } else {
      // 如果一个都没通过，结果取测试的开始下标
      let result = this.data.current > this.data.start ? this.data.current - 1 : this.data.current
      console.log('测试结果：', this.data.type + '眼视力值为 ' + this.data.list[result].value)
    }
    // TODO 跳转值结果页
  },
  toogleMic () {
    let mic = !this.data.mic
    this.setData({ mic })
    wx.setStorage({
      key: 'mic',
      data: mic,
    })
  },

  // 模拟操作
  answerUp () {
    this.response('up')
  },
  answerDwon () {
    this.response('down')
  },
  answerLeft () {
    this.response('left')
  },
  answerRight () {
    this.response('right')
  }
})