// miniprogram/pages/detection/index.js
let app = getApp()

const innerAudioContext_start = wx.createInnerAudioContext()
innerAudioContext_start.src = 'cloud://release-x9wki.7265-release-x9wki-1301385683/audio/start.mp3'
const innerAudioContext_right_start = wx.createInnerAudioContext()
innerAudioContext_right_start.src = 'cloud://release-x9wki.7265-release-x9wki-1301385683/audio/right-start.mp3'
const innerAudioContext_over = wx.createInnerAudioContext()
innerAudioContext_over.src = 'cloud://release-x9wki.7265-release-x9wki-1301385683/audio/over.mp3'

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
    picType: 'E',
    settingShow: false,
    settingIconState: '1', // 1/2/3/4/5
    eyesGlasses: '1', // 1 裸眼/2 眼镜
    distance: '2.5m',
    // iconState3: 就是start和end
    iconState4: 3,
    iconState5: 0.8,
    startValue: '4.0', // 用于标尺开始值的显示
    endValue: '5.3', // 用于标尺结束值的显示
    counter: 5, // 视标数量
    counterValue: 3, // 视标数量对应的正确通过数
    oldScreenBrightness: 0.8,
    screenBrightness: 0.8,
    resultList: [], // 测试结果列表
    // resultList数据格式：
    /*
    {
      index: 0, // 该视值下标
      right: 0, // 正确个数
      wrong: 0, // 错误个数
      v1: '4.0',
      v2: '0.1'
    }
    */
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this
    this.setData({ type: options.type })
    this.setData({ list: app.globalData.eyesightList })
    wx.setInnerAudioOption({
      mixWithOther: false, // 不与其他音频混播，终止其他应用或微信内的音乐
      obeyMuteSwitch: false, // (仅在 iOS 生效）是否遵循静音开关，设置为 false 之后，即使是在静音模式下，也能播放声音
    })
    wx.getStorage({
      key: 'mic',
      success: function(res) {
        _this.setData({ mic: res.data })
      },
    })
    wx.getStorage({
      key: 'start',
      success: function(res) {
        _this.setData({ start: res.data, current: res.data })
      },
    })
    wx.getStorage({
      key: 'end',
      success: function(res) {
        _this.setData({ end: res.data })
      },
    })
    wx.getStorage({
      key: 'picType',
      success: function(res) {
        _this.setData({ picType: res.data })
      },
    })
    wx.getStorage({
      key: 'eyesGlasses',
      success: function(res) {
        _this.setData({ eyesGlasses: res.data })
      },
    })
    wx.getStorage({
      key: 'counter',
      success: function(res) {
        _this.setData({ counter: res.data, counterValue: Math.floor((res.data / 2) + 1) })
      },
    })
    // 初次加载，随机一个答案
    this.random(true)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    if (this.data.type === 'left') {
      innerAudioContext_start.play()
    } else {
      innerAudioContext_right_start.play()
    }
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
    app.tooglePicTypeHandle = () => {
      const picType = _this.data.picType === 'E' ? '儿童' : 'E'
      _this.setData({ picType })
    }
    // 保持屏幕常亮
    wx.setKeepScreenOn({ keepScreenOn: true })
    // 获取屏幕亮度，不足于0.8则调至0.8，否则不变
    wx.getScreenBrightness({
      success: function (res) {
        _this.setData({ oldScreenBrightness: res.value })
        if (res.value >= 0.8) {
          _this.setData({ screenBrightness: res.value })
          return
        }
        _this.setData({ screenBrightness: 0.8 })
        wx.setScreenBrightness({ value: 0.8 })
      }
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
    app.toogleEyesightHandle = undefined
    app.tooglePicTypeHandle = undefined
    // 取消常亮
    wx.setKeepScreenOn({ keepScreenOn: false })
    // 恢复之前的亮度
    wx.setScreenBrightness({ value: this.data.oldScreenBrightness })
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
    let offset = this.data.end >= this.data.start ? 1 : -1
    let next = this.data.current + offset // 下一个需要测试的下标
    let prev = this.data.current - offset // 上一个需要测试的下标
    let nextItem = this.data.resultList.find(ele => ele.index === next)
    let prevItem = this.data.resultList.find(ele => ele.index === prev)
    if (answer === this.data.answer) {
      // 回答正确
      let right = this.data.right + 1
      // 当前视值的测试未结束
      if (right < this.data.counterValue) {
        this.setData({ right })
        this.random()
        return
      }
      // 一下的情况都是 right === this.data.counterValue
      // 通过当前视值 且可能未结束 （如果是使用增大和缩小按钮跳着测可能会结束）
      /**
       * 需要结束的情况
       */
      // 倒序，第一个就通过了最大的视力值，over
      if (offset < 0 && this.data.current === this.data.start) {
        this.over(this.data.current, right, this.data.wrong)
        return
      }
      // 顺序，通过了最后一个
      if (offset > 0 && this.data.current === this.data.end) {
        this.over(this.data.current, right, this.data.wrong)
        return
      }
      // 顺序，下一个测过了（一定是不通过），over
      if (offset > 0 && nextItem) {
        this.over(this.data.current, right, this.data.wrong)
        return
      }
      // 倒序，上一个测过了（一定是不通过），over
      if (offset < 0 && prevItem) {
        this.over(this.data.current, right, this.data.wrong)
        return
      }
      /**
       * 进入下一轮测试的情况
       */
      // 顺序，下一个没测
      if (offset > 0 && !nextItem) {
        this.next(next, right, this.data.wrong)
      }
      // 倒序，上一个没测
      if (offset < 0 && !prevItem) {
        this.next(prev, right, this.data.wrong)
      }
    } else {
      // 回答错误
      let wrong = this.data.wrong + 1
      // 当前视值的测试未结束
      if (wrong < this.data.counterValue) {
        this.setData({ wrong })
        this.random()
        return
      }
      // 一下的情况都是 wrong === this.data.counterValue
      // 不通过当前视值 且可能未结束 （如果是使用增大和缩小按钮跳着测可能会结束）
      /**
       * 需要结束的情况
       */
      // 顺序，第一个就不通过了, over
      if (offset > 0 && this.data.current === this.data.start) {
        this.over(this.data.current, this.data.right, wrong)
        return
      }
      // 倒序，最后一个不通过，over
      if (offset < 0 && this.data.current === this.data.end) {
        this.over(this.data.current, this.data.right, wrong)
        return
      }
      // 倒序，下一个测过了（一定是通过的）,over
      if (offset < 0 && nextItem) {
        this.over(next, this.data.right, wrong)
        return
      }
      // 顺序，上一个测过了（一定是通过的），over
      if (offset > 0 && prevItem) {
        this.over(prev, this.data.right, wrong)
        return
      }
      /**
       * 进入下一轮测试的情况
       */
      // 倒序，下一个没测
      if (offset < 0 && !nextItem) {
        this.next(next, this.data.right, wrong)
        return
      }
      // 顺序，上一个没测
      if (offset > 0 && !prevItem) {
        this.next(prev, this.data.right, wrong)
        return
      }
    }
  },
  // 下一题
  next (nextIndex, right, wrong) {
    const item = app.globalData.eyesightList[this.data.current]
    this.data.resultList.push({ index: this.data.current, right, wrong, v1: item.v1, v2: item.v2 })
    this.setData({
      current: nextIndex,
      right: 0,
      wrong: 0
    })
    this.random()
  },
  // 测试结束
  over (index, right, wrong) {
    let _this = this
    const item = app.globalData.eyesightList[this.data.current]
    this.data.resultList.push({ index: this.data.current, right, wrong, v1: item.v1, v2: item.v2 })
    console.log('测试结果：', this.data.type + '眼视力值为 ' + this.data.list[index].value)
    this.data.type === 'right' && innerAudioContext_over.play()
    wx.getStorage({
      key: 'result',
      success: function (res) {
        let result = res.data || {}
        result[_this.data.type] = {
          // list: _this.data.resultList.sort((a, b) => a.index - b.index),
          list: _this.data.resultList.reverse(),
          start: _this.data.start,
          end: _this.data.end,
          distance: _this.data.distance,
          counter: _this.data.counter,
          counterValue: _this.data.counterValue,
          screenBrightness: _this.data.screenBrightness,
          eyesGlasses: _this.data.eyesGlasses,
          v1: _this.data.list[index].v1,
          v2: _this.data.list[index].v2,
        }
        result.date = new Date()
        wx.setStorage({
          key: 'result',
          data: result,
          success: function () {
            wx.redirectTo({
              url: '../result/index',
            })
          }
        })
      },
      fail: function (err) {
        console.log(err)
      }
    })
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
  increase () {
    // increase: 增大 是下标缩小的意思，因为下标越小，图片越大
    const { start, end, current } = this.data
    if (start <= end && current === start) return
    if (start > end && current === end) return
    this.setData({ current: current - 1 })
  },
  shrink () {
    // shrink 缩小 与increase相反
    const { start, end, current } = this.data
    if (start <= end && current === end) return
    if (start > end && current === start) return
    this.setData({ current: current + 1 })
  },
  backout () {},
  showSetting () {
    this.setData({ settingShow: true })
  },
  hideSetting () {
    this.setData({ settingShow: false })
  },
  toogleSettingState (e) {
    this.setData({ settingIconState: e.currentTarget.dataset.state })
  },
  eyesGlassesHandle (e) {
    this.setData({ eyesGlasses: e.currentTarget.dataset.v })
  },
  startChangeHandle (e) {
    let { value } = e.detail
    let startValue = (value).toFixed(1)
    let start = parseInt(((value - 4) * 10).toFixed(1))
    this.setData({ start, startValue })
    wx.setStorage({ key: 'start', data: start })
    let direction = start <= this.data.end ? 1 : 0
    wx.setStorage({ key: 'direction', data: direction })
  },
  endChangeHandle (e) {
    let { value } = e.detail
    let endValue = (value).toFixed(1)
    let end = parseInt(((value - 4) * 10).toFixed(1))
    this.setData({ end, endValue })
    wx.setStorage({ key: 'end', data: end })
    let direction = this.data.start <= end ? 1 : 0
    wx.setStorage({ key: 'direction', data: direction })
  },
  counterChangeHandle (e) {
    let { value } = e.detail
    this.setData({ counter: value, counterValue: Math.floor((value / 2) + 1) })
    wx.setStorage({ key: 'counter', data: value })
  },
  brightnessChangeHandle (e) {
    let { value } = e.detail
    this.setData({ screenBrightness: value })
    wx.setScreenBrightness({
      value
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