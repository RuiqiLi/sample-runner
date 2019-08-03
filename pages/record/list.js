Page({
  data: {
    pageData: [], // 跑步记录列表
    nextPage: 0 // 页码，从0开始
  },
  onLoad() {
    this.getNextPageData()
  },
  onReachBottom() {
    this.getNextPageData()
  },
  getNextPageData() {
    const PAGE_COUNT = 20 // 使用常量表示每一页显示的数据的数量
    const db = wx.cloud.database() // 获取数据库的引用
    db.collection('run').count().then(res => { // 获取集合中的记录的数量
      const totalCount = res.total
      const totalPages = Math.ceil(totalCount / PAGE_COUNT) // 计算总页数，小数向上取整
      if (this.data.nextPage < totalPages) { // 当下一页存在时
        db.collection('run')
          .skip(this.data.nextPage * PAGE_COUNT) // 跳过已经获取的数据
          .limit(PAGE_COUNT) // 获取新的20条数据
          .get().then(res2 => { // 为了防止命名冲突，返回值命名为res2
            res2.data.map(item => { // 遍历数据，在每个跑步记录中新增一个createTimeStr属性
              const t = item.createTime
              item.createTimeStr = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate() + ' ' + t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds()
            })
            // 将已有的pageData与新获得的20条数据合并成一个新的数组
            const pageData = this.data.pageData.concat(res2.data)
            this.setData({
              pageData, // 将合并后的数据更新到data对象中
              nextPage: this.data.nextPage + 1 // 将nextPage更新为下一页
            })
          })
      } else {
        console.log('no more data') // 数据已经全部加载完毕
      }
    })
  }
})