const db = wx.cloud.database()

// 获取openID
export const getOpenid = () => wx.cloud.callFunction({
  name: 'login',
  data: {}
})

// 查询该openID下的所有检测用户
export const getUsers = openid => db.collection('users').get()

// 新增用户
export const addUser = data => db.collection('users').add({
  data: data || {
    name: 'admin',
    avatar: '',
    sex: 'man',
    birth: '',
    school: '',
    grade: ''
  }
})

// 更新用户数据
export const updateUser = (id, data) => db.collection('users').doc(id).update({
  data
})

// 删除用户
export const deleteUser = id => db.collection('users').doc(id).remove()

