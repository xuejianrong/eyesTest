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
  // 测试结果是小写，为了避免意外，还是转换一下
  return hexArr.join('').toLowerCase();
}

const bluetooth = {
  devices: [],
  matchDevice: null, // 符合要求的蓝牙设备，name为“DXLD-xxxx”
  connected: false,
  chs: [],
  canWrite: true,
  deviceMsgs: {
    // 遮盖左眼
    closeLeftEye: ['0x55', '0x0C', '0x02', '0xC7', '0xEB', '0xD5', '0xDA', '0xB8', '0xC7', '0xD7', '0xF3', '0xD1', '0xDB', '0xB9'],
    // 遮盖右眼
    closeRightEye: ['0x55', '0x09', '0x02', '0xD7', '0xF3', '0xD1', '0xDB', '0x34', '0x2E', '0x39', '0x71'],
    // 打开激光
    openLaser: ['0x55', '0x03', '0x11', '0x01', '0x6A'],
    // 关闭激光
    closeLaser: ['0x55', '0x03', '0x11', '0x00', '0x69'],
    // 打开测距
    openDistance: ['0x55', '0x03', '0x12', '0x01', '0x6B'],
    // 关闭测距
    closeDistance: ['0x55', '0x03', '0x12', '0x00', '0x6A']
  },
  subs: [],
  init () {
    this.openBluetoothAdapter()
    this.getBluetoothAdapterState()
  },
  // 初始化蓝牙模块
  openBluetoothAdapter() {
    const _this = this
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        _this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              _this.startBluetoothDevicesDiscovery()
            }
          })
        }
      },
      complete: (msg) => {
        console.log(msg)
      }
    })
  },
  // 获取本机蓝牙适配器状态
  getBluetoothAdapterState() {
    const _this = this
    console.log('getBluetoothAdapterState')
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('getBluetoothAdapterState', res)
        if (res.discovering) {
          _this.onBluetoothDeviceFound()
        } else if (res.available) { // 适配器是否可用
          _this.startBluetoothDevicesDiscovery()
        }
      },
      fail: (e) => {
        console.log(e)
      }
    })
  },
  // 开始搜寻附近的蓝牙外围设备。此操作比较耗费系统资源，请在搜索并连接到设备后调用 wx.stopBluetoothDevicesDiscovery 方法停止搜索
  startBluetoothDevicesDiscovery() {
    const _this = this
    if (_this._discoveryStarted) {
      console.log('已经开启搜寻附近的蓝牙外围设备，不需要重新开启')
      return
    }
    console.log('开始搜寻附近的蓝牙外围设备')
    _this._discoveryStarted = true
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        _this.onBluetoothDeviceFound()
      },
    })
  },
  // 停止搜寻附近的蓝牙外围设备。若已经找到需要的蓝牙设备并不需要继续搜索时，建议调用该接口停止蓝牙搜索
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
  },
  // 监听寻找到新设备的事件
  onBluetoothDeviceFound() {
    const _this = this
    wx.onBluetoothDeviceFound((res) => {
      if (_this.mainDevice) return
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = _this.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        if (idx === -1) {
          _this.devices[foundDevices.length] = device
        } else {
          _this.devices[idx] = device
        }
        device.name = device.name || device.localName
        if (/^DXLD-.{4}$/.test(device.name)) {
          _this.mainDevice = device
          _this.createBLEConnection(device)
        }
      })
    })
    _this.onBLEConnectionStateChange()
  },
  // 监听低功耗蓝牙连接状态的改变
  onBLEConnectionStateChange () {
    const _this = this
    wx.onBLEConnectionStateChange(res => {
      const { deviceId, connected } = res
      console.log(`设备ID:${deviceId}已${connected ? '连接' : '断开连接'}`)
      // 如果是断开连接，就重新开始搜索设备
      if (!connected) {
        _this.resetOptions()
        _this.startBluetoothDevicesDiscovery()
      }
    })
  },
  // 连接低功耗蓝牙设备
  createBLEConnection(device) {
    const _this = this
    const { deviceId, name } = device
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        wx.showToast({
          icon: 'none',
          title: '成功连接设备'
        })
        _this.connected = true
        _this.name = name
        _this.deviceId = deviceId
        _this.getBLEDeviceServices(deviceId)
      }
    })
    _this.stopBluetoothDevicesDiscovery()
  },
  // 断开与低功耗蓝牙设备的连接
  closeBLEConnection() {
    const _this = this
    wx.closeBLEConnection({
      deviceId: _this.deviceId
    })
    _this.connected = false
    _this.chs = []
    _this.canWrite = false
  },
  // 获取蓝牙设备所有服务(service)
  getBLEDeviceServices(deviceId) {
    const _this = this
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        console.log('所有服务', res)
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary) {
            _this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
            return
          }
        }
      }
    })
  },
  // 获取蓝牙设备某个服务中所有特征值(characteristic)
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    const _this = this
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
            _this.canWrite = true
            _this._deviceId = deviceId
            _this._serviceId = serviceId
            _this._characteristicId = item.uuid
            // _this.writeBLECharacteristicValue(['0x55', '0x03', '0x11', '0x01', '0x6A'])
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
      _this.subs.forEach(cb => {
        cb(msg)
      })
    })
  },
  // 向低功耗蓝牙设备特征值中写入二进制数据。注意：必须设备的特征值支持 write 才可以成功调用。
  writeBLECharacteristicValue(data) {
    this.sendData(data)
  },
  // 关闭蓝牙模块。调用该方法将断开所有已建立的连接并释放系统资源。建议在使用蓝牙流程后，与 wx.openBluetoothAdapter 成对调用
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this.resetOptions()
  },
  resetOptions () {
    this.connected = false
    this.chs = []
    this.canWrite = false
    this.mainDevice = null
    this.devices = []
    delete this._discoveryStarted
    delete this._deviceId
    delete this._serviceId
    delete this._characteristicId
  },
  sendData(data) {
    let _this = this
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
      deviceId: _this._deviceId,
      serviceId: _this._serviceId,
      characteristicId: _this._characteristicId,
      value: dataBuffer,
      success: function (res) {
        console.log('message发送成功')
      },
      fail: function (res) {
        wx.showToast({
          icon: 'none',
          title: '请确认与设备的正常连接'
        })
        // _this.closeBluetoothAdapter()
        // _this.init()
        console.log('message发送失败', res)
      },
      complete: function (res) {
        console.log('message发送完成', res)
      }
    })
  },

  // 指令
  closeLeftEye (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.closeLeftEye)
    // 添加收到蓝牙消息的回调
    this.addSub(cb)
  },
  closeRightEye (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.closeRightEye)
    // 添加收到蓝牙消息的回调
    this.addSub(cb)
  },
  openLaser (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.openLaser)
    // 添加收到蓝牙消息的回调
    this.addSub(cb)
  },
  closeLaser (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.closeLaser)
    // 移除收到蓝牙消息的回调
    this.removeSub(cb)
  },
  openDistance (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.openDistance)
    // 添加收到蓝牙消息的回调
    this.addSub(cb)
  },
  closeDistance (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.closeDistance)
    // 移除收到蓝牙消息的回调
    this.removeSub(cb)
  },
  addSub (sub) {
    sub && typeof sub == 'function' && this.subs.push(sub)
  },
  removeSub (sub) {
    this.subs = this.subs.filter(item => item !== sub)
  }
}

export default bluetooth
