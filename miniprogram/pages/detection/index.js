// miniprogram/pages/detection/index.js
import bluetooth from '../../utils/bluetooth'

let app = getApp()
const api = require('../../apis/index.js')
const answerKey = require('../../utils/answer-key.js')

const innerAudioContext_left_start = wx.createInnerAudioContext()
innerAudioContext_left_start.src = 'cloud://release-x9wki.7265-release-x9wki-1301385683/audio/left-start.mp3'
const innerAudioContext_right_start = wx.createInnerAudioContext()
innerAudioContext_right_start.src = 'cloud://release-x9wki.7265-release-x9wki-1301385683/audio/right-start.mp3'
const innerAudioContext_over = wx.createInnerAudioContext()
innerAudioContext_over.src = 'cloud://release-x9wki.7265-release-x9wki-1301385683/audio/over.mp3'
const plugin = requirePlugin("WechatSI")
const manager = plugin.getRecordRecognitionManager()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    type: 'right', // left 左眼，right 右眼
    start: 0, // list的下标 视标范围的开始
    end: 13, // list的下标 视标范围的结束
    current: 0, // list的下标 当前测试到哪个视标
    right: 0, // 当前视标正确个数
    wrong: 0, // 当前视标错误个数
    list: [], // 所有势力值的数据(固定的)
    answer: 'up', // 当前图案的答案
    mic: true,
    picType: 'E',
    settingShow: false,
    settingIconState: '1', // 1/2/3/4/5
    eyesGlasses: '1', // 1 裸眼/2 眼镜
    distance: '3m',
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
    currentTranslate: '', // 翻译内容
    isOver: false, // 防止多次提交结果
    tipText: '录音中...',
    isPause: false, // 防止录音结果多次提交
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this
    this.setData({ type: options.type })
    wx.setInnerAudioOption({
      mixWithOther: false, // 不与其他音频混播，终止其他应用或微信内的音乐
      obeyMuteSwitch: false, // (仅在 iOS 生效）是否遵循静音开关，设置为 false 之后，即使是在静音模式下，也能播放声音
    })
    wx.getStorage({
      key: 'distance',
      success: function(res) {
        if (res.data === '40cm') {
          _this.setData({ list: app.globalData.eyesightList_2 })
        }
        if (res.data === '3m') {
          _this.setData({ list: app.globalData.eyesightList_1 })
        }
      },
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

    bluetooth.addSub(this.onDeviceMsg)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    if (this.data.type === 'right') {
      innerAudioContext_left_start.play()
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

    this.initRecoed()
    setTimeout(() => {
      // 延迟启动录音(开启测试时会有语音播放)
      this.data.mic && this.streamRecord()
    }, 2000)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.closeBluetoothAdapter()
    this.streamRecordEnd()
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
    bluetooth.removeSub(this.onDeviceMsg)
  },
  // 随机图案
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
  // 回答
  response (answer) {
    // 防止多次提交结果
    if (this.data.isOver) return
    // 防止连续作答
    if (this.data.isPause) return
    this.data.isPause = true
    setTimeout(() => {
      this.data.isPause = false
    }, 500)
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
    const item = this.data.list[this.data.current]
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
    this.data.isOver = true
    let _this = this
    const item = this.data.list[this.data.current]
    this.data.resultList.push({ index: this.data.current, right, wrong, v1: item.v1, v2: item.v2 })
    console.log('测试结果：', this.data.type + '眼视力值为 ' + this.data.list[index].value)
    this.data.type === 'left' && innerAudioContext_over.play()
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
        let date = new Date()
        result.date = date
        result.timestamp = date.getTime()
        result.uid = app.globalData.currentUser._id
        wx.setStorage({
          key: 'result',
          data: result,
          success: function () {
            wx.redirectTo({
              url: '../result/index',
            })
          }
        })

        // 测右眼，添加一条测试数据
        if (_this.data.type === 'right') {
          api.addRecord(result).then(res => {
            wx.setStorage({
              key: 'resultId',
              data: res._id
            })
          })
        }
        // 测左眼，更新此条数据
        if (_this.data.type === 'left') {
          wx.getStorage({
            key: 'resultId',
            success: function (res) {
              api.updateRecord(res.data, result)
            }
          })
        }
      },
      fail: function (err) {
        console.log(err)
      }
    })
    // TODO 跳转值结果页
  },
  // 语音开关
  toogleMic () {
    let mic = !this.data.mic
    this.setData({ mic })
    wx.setStorage({
      key: 'mic',
      data: mic,
    })
    if (mic) {
      this.streamRecord()
    } else {
      this.streamRecordEnd()
    }
  },
  // 增大
  increase () {
    // increase: 增大 是下标缩小的意思，因为下标越小，图片越大
    const { start, end, current } = this.data
    if (start <= end && current === start) return
    if (start > end && current === end) return
    this.setData({ current: current - 1 })
  },
  // 缩小
  shrink () {
    // shrink 缩小 与increase相反
    const { start, end, current } = this.data
    if (start <= end && current === end) return
    if (start > end && current === start) return
    this.setData({ current: current + 1 })
  },
  // 撤回
  backout () {
    if (this.data.resultList.length === 0) return
    let curr = this.data.resultList[this.data.resultList.length - 1]
    this.data.resultList.pop()
    this.setData({ current: curr.index })
    this.random()
  },
  showSetting () {
    this.setData({ settingShow: true })
  },
  hideSetting () {
    let _this = this
    this.setData({ settingShow: false })
    wx.showModal({
      title: '提示',
      content: '是否重新开始测试',
      success: function (res) {
        if (res.confirm) {
          _this.resetting()
        }
      }
    })
  },
  // 重新开始
  resetting () {
    this.setData({
      resultList: [],
      current: this.data.start,
      right: 0,
      wrong: 0
    })
  },
  // 切换设置哪个参数
  toogleSettingState (e) {
    this.setData({ settingIconState: e.currentTarget.dataset.state })
  },
  // 裸眼、眼镜切换
  eyesGlassesHandle (e) {
    this.setData({ eyesGlasses: e.currentTarget.dataset.v })
  },
  // 更改开始视标
  startChangeHandle (e) {
    let { value } = e.detail
    let startValue = (value).toFixed(1)
    let start = parseInt(((value - 4) * 10).toFixed(1))
    this.setData({ start, startValue })
    wx.setStorage({ key: 'start', data: start })
    let direction = start <= this.data.end ? 1 : 0
    wx.setStorage({ key: 'direction', data: direction })
  },
  // 更改结束视标
  endChangeHandle (e) {
    let { value } = e.detail
    let endValue = (value).toFixed(1)
    let end = parseInt(((value - 4) * 10).toFixed(1))
    this.setData({ end, endValue })
    wx.setStorage({ key: 'end', data: end })
    let direction = this.data.start <= end ? 1 : 0
    wx.setStorage({ key: 'direction', data: direction })
  },
  // 更改视标数量
  counterChangeHandle (e) {
    let { value } = e.detail
    this.setData({ counter: value, counterValue: Math.floor((value / 2) + 1) })
    wx.setStorage({ key: 'counter', data: value })
  },
  // 调整屏幕亮度
  brightnessChangeHandle (e) {
    let { value } = e.detail
    this.setData({ screenBrightness: value })
    wx.setScreenBrightness({
      value
    })
  },
  // 开始语音识别
  streamRecord: function () {
    if (!this.data.mic) return
    manager.start({
      lang: 'zh_CN',
    })
    this.setData({
      currentTranslate: '',
    })
  },
  // 结束录音
  streamRecordEnd: function() {
    manager.stop()
  },
  /**
   * 初始化语音识别回调
   * 绑定语音播放开始事件
   */
  initRecoed: function () {
    manager.onRecognize = res => {
      this.setData({
        currentTranslate: res.result,
      })
      console.log('当前语音', res.result)
      // 判断语音中是否含有答案
      const answers = this.getAnswers(this.data.picType, res.result)
      if (answers.length === 0) {
        // 一个关键字都没有,则都当做没有作答
        return
      }
      if (answers.length > 1) {
        // 关键字大于一个,则都当做没有作答,并开启新一轮录音
        this.streamRecordEnd()
        return
      }
      // 只有一个关键字
      this.response(answers[0])
      this.streamRecordEnd()
    }
    manager.onStop = res => {
      let text = res.result
      // if(text == '') {
      //   this.setData({
      //     currentTranslate: '录音内容为空',
      //   })
      //   return
      // }
      this.setData({
        currentTranslate: text,
      })
      // 测试未结束就重新开启录音
      !this.data.isOver && this.data.mic && this.streamRecord()
      console.log('最后语音', text)
    }
  },
  // 判断语音识别结果中包含哪些答案
  getAnswers (picType, text) {
    const answers = []
    const directions = ['up', 'down', 'left', 'right']
    // if (picType === 'E') {
    directions.forEach(direction => {
      if (answerKey[direction + (picType === 'E' ? '' : '2')].find(key => {
        return text.indexOf(key) > -1
      })) {
        answers.push(direction)
      }
    })
    return answers
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
  },
  answerWrong () {
    this.response('')
  },
  onDeviceMsg (msg) {
    switch (msg) {
        case '55038202dc':
          console.log('点击了向上')
          this.answerUp()
          break;
        case '55038203dd':
          console.log('点击了向右')
          this.answerRight()
          break;
        case '55038204de':
          console.log('点击了向下')
          this.answerDwon()
          break;
        case '55038201db':
          console.log('点击了向左')
          this.answerLeft()
          break;
        case '55038200da':
          console.log('点击了确定')
          this.answerWrong()
          break;
        default:
          break;
      }
  }
})