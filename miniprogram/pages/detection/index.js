// miniprogram/pages/detection/index.js
let app = getApp()
const api = require('../../apis/index.js')
const answerKey = require('../../utils/answer-key.js')

const innerAudioContext_start = wx.createInnerAudioContext()
innerAudioContext_start.src = 'cloud://release-x9wki.7265-release-x9wki-1301385683/audio/start.mp3'
const innerAudioContext_right_start = wx.createInnerAudioContext()
innerAudioContext_right_start.src = 'cloud://release-x9wki.7265-release-x9wki-1301385683/audio/right-start.mp3'
const innerAudioContext_over = wx.createInnerAudioContext()
innerAudioContext_over.src = 'cloud://release-x9wki.7265-release-x9wki-1301385683/audio/over.mp3'
const plugin = requirePlugin("WechatSI")
const manager = plugin.getRecordRecognitionManager()

function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

// 转换成可展示的文字
function hexCharCodeToStr(hexCharCodeStr) {
  var trimedStr = hexCharCodeStr.trim();
  var rawStr = trimedStr.substr(0, 2).toLowerCase() === '0x' ? trimedStr.substr(2) : trimedStr;
  var len = rawStr.length;
  var curCharCode;
  var resultStr = [];
  for (var i = 0; i < len; i = i + 2) {
    curCharCode = parseInt(rawStr.substr(i, 2), 16);
    resultStr.push(String.fromCharCode(curCharCode));
  }
  return resultStr.join('');
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

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
    list: [], // 所有势力值的数据(固定的)
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
    currentTranslate: '', // 翻译内容
    isOver: false, // 防止多次提交结果
    tipText: '录音中...',
    isPause: false, // 防止录音结果多次提交
    devices: [],
    matchDevice: null, // 符合要求的蓝牙设备，name为“DXLD-xxxx”
    connected: false,
    chs: [],
    canWrite: true,

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

    this.initRecoed()
    setTimeout(() => {
      // 延迟启动录音(开启测试时会有语音播放)
      this.streamRecord()
    }, 2000)

    this.openBluetoothAdapter()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.closeBluetoothAdapter()
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
    this.data.isOver = true
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

        // 测左眼，添加一条测试数据
        if (_this.data.type === 'left') {
          api.addRecord(result).then(res => {
            wx.setStorage({
              key: 'resultId',
              data: res._id
            })
          })
        }
        // 测右眼，更新此条数据
        if (_this.data.type === 'right') {
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
      !this.data.isOver && this.streamRecord()
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

  // 蓝牙相关
  // 初始化蓝牙模块
  openBluetoothAdapter() {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              this.startBluetoothDevicesDiscovery()
            }
          })
        }
      }
    })
  },
  // 获取本机蓝牙适配器状态
  getBluetoothAdapterState() {
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('getBluetoothAdapterState', res)
        if (res.discovering) {
          this.onBluetoothDeviceFound()
        } else if (res.available) {
          this.startBluetoothDevicesDiscovery()
        }
      }
    })
  },
  // 开始搜寻附近的蓝牙外围设备。此操作比较耗费系统资源，请在搜索并连接到设备后调用 wx.stopBluetoothDevicesDiscovery 方法停止搜索
  startBluetoothDevicesDiscovery() {
    if (this._discoveryStarted) {
      return
    }
    this._discoveryStarted = true
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        this.onBluetoothDeviceFound()
      },
    })
  },
  // 停止搜寻附近的蓝牙外围设备。若已经找到需要的蓝牙设备并不需要继续搜索时，建议调用该接口停止蓝牙搜索
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
  },
  // 监听寻找到新设备的事件
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {
      if (this.data.mainDevice) return
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = this.data.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        const data = {}
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = device
        } else {
          data[`devices[${idx}]`] = device
        }
        device.name = device.name || device.localName
        if (/^DXLD-.{4}$/.test(device.name)) {
          data.mainDevice = device
          this.createBLEConnection(device)
        }
        this.setData(data)
      })
    })
  },
  // 连接低功耗蓝牙设备
  createBLEConnection(device) {
    const { deviceId, name } = device
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        this.setData({
          connected: true,
          name,
          deviceId,
        })
        this.getBLEDeviceServices(deviceId)
      }
    })
    this.stopBluetoothDevicesDiscovery()
  },
  // 断开与低功耗蓝牙设备的连接
  closeBLEConnection() {
    wx.closeBLEConnection({
      deviceId: this.data.deviceId
    })
    this.setData({
      connected: false,
      chs: [],
      canWrite: false,
    })
  },
  // 获取蓝牙设备所有服务(service)
  getBLEDeviceServices(deviceId) {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        console.log('所有服务', res)
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary) {
            this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
            return
          }
        }
      }
    })
  },
  // 获取蓝牙设备某个服务中所有特征值(characteristic)
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('getBLEDeviceCharacteristics success', res.characteristics)
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.read) {
            wx.readBLECharacteristicValue({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
            })
          }
          if (item.properties.write) {
            this.setData({
              canWrite: true
            })
            this._deviceId = deviceId
            this._serviceId = serviceId
            this._characteristicId = item.uuid
            this.writeBLECharacteristicValue(['0x55', '0x03', '0x11', '0x01', '0x6A'])
          }
          if (item.properties.notify || item.properties.indicate) {
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
            })
          }
        }
      },
      fail(res) {
        console.error('getBLEDeviceCharacteristics', res)
      }
    })
    // 操作之前先监听，保证第一时间获取数据
    wx.onBLECharacteristicValueChange((characteristic) => {
      const msg = ab2hex(characteristic.value)
      console.log('接收到的数据：', msg)
      switch (msg) {
        case '55038202dc':
          console.log('点击了向上')
          break;
        case '55038203dd':
          console.log('点击了向右')
          break;
        case '55038204de':
          console.log('点击了向下')
          break;
        case '55038201db':
          console.log('点击了向左')
          break;
        case '55038200da':
          console.log('点击了确定')
          break;
        default:
          break;
      }
      // const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
      // const data = {}
      // if (idx === -1) {
      //   data[`chs[${this.data.chs.length}]`] = {
      //     uuid: characteristic.characteristicId,
      //     value: ab2hex(characteristic.value)
      //   }
      // } else {
      //   data[`chs[${idx}]`] = {
      //     uuid: characteristic.characteristicId,
      //     value: ab2hex(characteristic.value)
      //   }
      // }
      // // data[`chs[${this.data.chs.length}]`] = {
      // //   uuid: characteristic.characteristicId,
      // //   value: ab2hex(characteristic.value)
      // // }
      // this.setData(data)
    })
  },
  // 向低功耗蓝牙设备特征值中写入二进制数据。注意：必须设备的特征值支持 write 才可以成功调用。
  writeBLECharacteristicValue(data) {
    // 向蓝牙设备发送一个0x00的16进制数据
    // let buffer = new ArrayBuffer('测试文字')
    // console.log(buffer)
    // let dataView = new DataView(buffer)
    // console.log(dataView)
    // dataView.setUint8(0, Math.random() * 255 | 0)
    // wx.writeBLECharacteristicValue({
    //   deviceId: this._deviceId,
    //   serviceId: this._deviceId,
    //   characteristicId: this._characteristicId,
    //   value: buffer,
    // })
    this.sendData(data)
  },
  // 关闭蓝牙模块。调用该方法将断开所有已建立的连接并释放系统资源。建议在使用蓝牙流程后，与 wx.openBluetoothAdapter 成对调用
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },
  sendData(data) {
    let dataBuffer = new ArrayBuffer(data.length)
    let dataView = new DataView(dataBuffer)
    for (var i = 0; i < data.length; i++) {
      dataView.setUint8(i, parseInt(data[i]))
    }
    let dataHex = ab2hex(dataBuffer)
    console.log('dataHex:' + dataHex)
    let writeDatas = hexCharCodeToStr(dataHex)
    console.log('发送的数据：' + writeDatas)
    wx.writeBLECharacteristicValue({
      deviceId: this._deviceId,
      serviceId: this._serviceId,
      characteristicId: this._characteristicId,
      value: dataBuffer,
      success: function (res) {
        console.log('message发送成功')
      },
      fail: function (res) {
        console.log('message发送失败', res)
      },
      complete: function (res) {
        console.log('message发送完成', res)
      }
    })
  }
})