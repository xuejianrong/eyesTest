export default {
  list: [],
  current: null,
  index: -1,
  set (list) {
    this.list = list
  },
  setCurrent (curr, index) {
    this.current = curr
    this.index = index
  }
}