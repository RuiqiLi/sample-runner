const util = require('../../utils/util.js')

Page({
  data: {
    polyline: [], // 跑步轨迹
    markers: [], // 标记点
    includePoints: [] // 需要显示的所有坐标点
  },
  onLoad: function (options) {
    if (options.recordId) {
      const db = wx.cloud.database() // 获取数据库的引用
      db.collection('run').doc(options.recordId).get({ // 根据id获取数据
        success: res => {
          // 设置地图需要显示的点，包括markers和polyline中的所有点
          let includePoints = res.data.markers.map(item => {
            return {
              latitude: item.latitude,
              longitude: item.longitude
            }
          })
          res.data.polyline.map(item => {
            includePoints = includePoints.concat(item.points)
          })
          // 更新数据
          this.setData({
            polyline: res.data.polyline,
            markers: res.data.markers,
            includePoints
          })
          // 动态设置导航栏标题
          wx.setNavigationBarTitle({
            title: util.getReadableTime(res.data.createTime)
          })
        }
      })
    }
  }
})