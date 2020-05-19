const db = wx.cloud.database()

// 获取openID
export const getOpenid = () => wx.cloud.callFunction({
  name: 'login',
  data: {}
})

// 查询该openID下的所有检测用户
export const getUsers = openid => db.collection('users').get()

// 新增用户
export const addUser = info => {
  let data = {}
  if (info) {
    data = { ...info, updateTime: new Date().getTime() }
  } else {
    data = {
      name: 'admin',
      avatar: '',
      sex: 'man',
      birth: '',
      school: '',
      grade: '',
      updateTime: new Date().getTime()
    }
  }
  return db.collection('users').add({
    data
  })
}

// 更新用户数据
export const updateUser = (id, data) => db.collection('users').doc(id).update({ data, updateTime: new Date().getTime() })

// 删除用户
export const deleteUser = id => db.collection('users').doc(id).remove()

// 删除改用户的是用测试记录
export const delRecordsByUid = uid => wx.cloud.callFunction({
  name: 'delRecordsByUid',
  data: { uid }
})

// 新增测试记录
export const addRecord = data => db.collection('records').add({ data })

// 更新测试记录
export const updateRecord = (id, data) => db.collection('records').doc(id).update({ data })

// 查询最新一条测试记录
export const getRecord = data => db.collection('records').where({
  ...data
}).orderBy('date', 'desc').limit(1).get()

// 查询所有测试记录
export const getRecords = uid => wx.cloud.callFunction({
  name: 'getRecords',
  data: { uid }
})

// 新增测量身高记录
export const addHeightRecord = data => {
  return db.collection('height-records').add({
    data: { ...data, updateTime: new Date().getTime() }
  }).then(() => {
    return updateUser(data.uid, { height: data.height })
  })
}

// 查询所有测试记录
export const getHeightRecords = uid => wx.cloud.callFunction({
  name: 'getHeightRecords',
  data: { uid }
})

// 查询所有测试记录
export const getSetting = () => wx.cloud.callFunction({
  name: 'getSetting'
})
