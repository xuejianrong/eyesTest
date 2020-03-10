export const dateFormat = (date, fmt) => {
  // eslint-disable-next-line
  if(!date) return;

  if (isNaN(date)) {
    // 如果传入一个非数字（不包括字符串的数字）而直接返回
    // eslint-disable-next-line
    return date;
  }

  // eslint-disable-next-line
  var d = new Date(date);
  if (isNaN(d.getDate())) {
    // eslint-disable-next-line
    return 'Invalid date';
  }
  // eslint-disable-next-line
  const o = {
    'y+': d.getFullYear(),
    'M+': d.getMonth() + 1, // 月份
    'd+': d.getDate(), // 日
    'h+': d.getHours(), // 小时
    'm+': d.getMinutes(), // 分
    's+': d.getSeconds(), // 秒
    'q+': Math.floor((d.getMonth() + 3) / 3), // 季度
  };

  // eslint-disable-next-line
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
  // eslint-disable-next-line
  for (var k in o)
    // eslint-disable-next-line
    if (new RegExp('(' + k + ')').test(fmt))
    // eslint-disable-next-line
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
  // eslint-disable-next-line
  return fmt;
}