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
  },
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
      if (this.mainDevice) return
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = this.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        if (idx === -1) {
          this.devices[foundDevices.length] = device
        } else {
          this.devices[idx] = device
        }
        device.name = device.name || device.localName
        if (/^DXLD-.{4}$/.test(device.name)) {
          this.mainDevice = device
          this.createBLEConnection(device)
        }
      })
    })
  },
  // 连接低功耗蓝牙设备
  createBLEConnection(device) {
    const { deviceId, name } = device
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        this.connected = true
        this.name = name
        this.deviceId = deviceId
        this.getBLEDeviceServices(deviceId)
      }
    })
    this.stopBluetoothDevicesDiscovery()
  },
  // 断开与低功耗蓝牙设备的连接
  closeBLEConnection() {
    wx.closeBLEConnection({
      deviceId: this.deviceId
    })
    this.connected = false
    this.chs = []
    this.canWrite = false
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
            this.canWrite = true
            this._deviceId = deviceId
            this._serviceId = serviceId
            this._characteristicId = item.uuid
            // this.writeBLECharacteristicValue(['0x55', '0x03', '0x11', '0x01', '0x6A'])
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
      this.subs.forEach(cb => {
        cb(msg)
      })
      // switch (msg) {
      //   case '55038202dc':
      //     console.log('点击了向上')
      //     break;
      //   case '55038203dd':
      //     console.log('点击了向右')
      //     break;
      //   case '55038204de':
      //     console.log('点击了向下')
      //     break;
      //   case '55038201db':
      //     console.log('点击了向左')
      //     break;
      //   case '55038200da':
      //     console.log('点击了确定')
      //     break;
      //   default:
      //     break;
      // }
    })
  },
  // 向低功耗蓝牙设备特征值中写入二进制数据。注意：必须设备的特征值支持 write 才可以成功调用。
  writeBLECharacteristicValue(data) {
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
  },

  // 指令
  closeLeftEye (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.closeLeftEye)
    // 添加收到蓝牙消息的回调
    cb && typeof cb == 'function' && this.subs.push(cb)
  },
  closeRightEye (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.closeRightEye)
    // 添加收到蓝牙消息的回调
    cb && typeof cb == 'function' && this.subs.push(cb)
  },
  openLaser (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.openLaser)
    // 添加收到蓝牙消息的回调
    cb && typeof cb == 'function' && this.subs.push(cb)
  },
  closeLaser (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.closeLaser)
    // 移除收到蓝牙消息的回调
    this.subs = this.subs.filter(item => item !== cb)
  },
  openDistance (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.openDistance)
    // 添加收到蓝牙消息的回调
    cb && typeof cb == 'function' && this.subs.push(cb)
  },
  closeDistance (cb) {
    this.writeBLECharacteristicValue(this.deviceMsgs.closeDistance)
    // 移除收到蓝牙消息的回调
    this.subs = this.subs.filter(item => item !== cb)
  },
}

export default bluetooth
