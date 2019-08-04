Page({
  data: {
    authFailed: false, // 地理位置信息授权是否失败
    latitude: 0, // 用户当前位置的纬度
    longitude: 0, // 用户当前位置的经度
    status: 'stop', // 当前状态，可选值包括 stop/starting/running/pause
    countingNum: 3, // 跑步开始时的倒计时秒数
    polyline: [], // 跑步轨迹
    markers: [] // 标记点
  },
  onLoad() {
    wx.authorize({ // 请求授权地理位置信息
      scope: 'scope.userLocation',
      success: () => { // 用户同意了授权
        this.makeUserCenter() // 地图居中显示用户定位地点
      },
      fail: () => { // 用户拒绝了授权
        this.setData({ // 修改页面状态，显示提示文字引导用户重新授权
          authFailed: true
        })
      }
    })
  },
  makeUserCenter(cb) { // 地图居中显示用户定位地点
    wx.getLocation({ // 获取用户当前定位坐标
      type: 'gcj02',
      success: res => {
        this.setData({ // 更新用户定位坐标数据
          latitude: res.latitude,
          longitude: res.longitude
        })
        if (cb && typeof(cb) === 'function') { // 调用回调函数（如果存在的话）
          cb(res)
        }
      }
    })
  },
  openSetting() { // 引导用户重新授权时调用该函数
    wx.openSetting({ // 打开设置页面
      success: res => {
        if (res.authSetting['scope.userLocation']) { // 判断用户是否授权了地理位置信息
          this.setData({ // 修改页面状态，显示地图组件
            authFailed: false
          })
          this.makeUserCenter() // 地图居中显示用户定位地点
        }
      }
    })
  },
  onRegionChange(e) { // 地图显示区域变化时回调该函数
    if (this.data.status === 'stop') { // 未开始跑步时
      if (this.resetTimeout) { // 显示区域发生任何改变都要清除未执行的定时器
        clearTimeout(this.resetTimeout)
        this.resetTimeout = null
      }
      // 只关注用户拖动或缩放地图的情况，操作结束时，定时10秒居中显示用户定位地点
      if (e.type === 'end' && (e.causedBy === 'drag' || e.causedBy === 'scale')) {
        this.resetTimeout = setTimeout(() => { // 设置定时器
          this.resetTimeout = null
          this.makeUserCenter()
        }, 10000)
      }
    }
  },
  onClickRun() { // 用户点击开始跑步或继续跑步按钮时回调该函数
    wx.showModal({ // 显示提示弹窗，防误触
      title: '开始跑步',
      content: '准备好了吗？',
      confirmText: '开始跑步',
      confirmColor: '#39b54a',
      success: res => {
        if (res.confirm) {
          this.countDownToStart() // 开始倒计时
        }
      }
    })
  },
  countDownToStart() { // 跑步前的倒计时
    if (this.data.status === 'stop' || this.data.status === 'pause') {
      this.setData({ // 转换状态为starting，从3开始倒计时
        status: 'starting',
        countingNum: 3
      })
      setTimeout(this.countDownToStart, 1000) // 设置1秒后再次调用本函数
    } else if (this.data.status === 'starting') { // 定时再次调用本函数时进入这个条件分支
      if (this.data.countingNum > 1) {
        this.setData({ // 更新倒计时数减1，一直到countingNum为1
          countingNum: this.data.countingNum - 1
        })
        setTimeout(this.countDownToStart, 1000) // 设置1秒后再次调用本函数
      } else {
        this.startRunning() // 倒计时结束
      }
    }
  },
  startRunning() { // 开始跑步 or 继续跑步
    let polyline = this.data.polyline
    polyline.push({ // 新增一条跑步轨迹
      points: [], // 初始不包含坐标点
      color: "#39b54a",
      width: 3
    })
    this.setData({ // 转换状态为running，并更新跑步轨迹
      status: 'running',
      polyline
    })
    this.makeUserCenter(location => { // 将用户位置设为中心，并回调函数
      let markers = this.data.markers // 新增一个起点标记点
      const markerNo = Math.floor(markers.length / 2) + 1
      markers.push({
        latitude: location.latitude,
        longitude: location.longitude,
        callout: { // 标记点上的文字气泡
          content: '起点' + markerNo,
          color: '#39b54a',
          display: 'ALWAYS'
        }
      })
      this.setData({ // 更新标记点数据
        markers
      })
      this.recordPoint(location) // 记录用户当前坐标点至跑步轨迹中
    })
    this.recordInterval = setInterval(() => { // 设置定时器，2秒钟记录一次定位
      this.makeUserCenter(this.recordPoint)
    }, 2000)
  },
  recordPoint(location) { // 记录用户当前坐标点至跑步轨迹中
    let polyline = this.data.polyline // 获取所有跑步轨迹
    let points = polyline[polyline.length - 1].points // 获取最后一条轨迹的坐标点数组
    points.push({ // 在最后一条跑步轨迹中新增一个坐标点
      latitude: location.latitude,
      longitude: location.longitude
    })
    this.setData({ // 更新跑步轨迹数据
      polyline
    })
  },
  onClickPause() { // 用户点击暂停跑步按钮时回调次函数
    wx.showModal({ // 显示提示弹窗，防误触
      title: '暂停跑步',
      content: '休息一下吧',
      confirmText: '暂停跑步',
      confirmColor: '#fbbd08',
      success: res => {
        if (res.confirm) {
          clearInterval(this.recordInterval) // 删除定时器
          this.recordInterval = null // 清除定时器变量
          this.makeUserCenter(location => { // 获取定位数据
            let markers = this.data.markers // 新增一个终点标记点
            const markerNo = Math.floor(markers.length / 2) + 1
            markers.push({
              latitude: location.latitude,
              longitude: location.longitude,
              callout: { // 标记点上的文字气泡
                content: '终点' + markerNo,
                color: '#e54d42',
                display: 'ALWAYS'
              }
            })
            this.setData({ // 更新标记点数据，并转换状态为pause
              markers,
              status: 'pause'
            })
          })
        }
      }
    })
  },
  onClickStop() { // 用户点击结束跑步按钮时回调此函数
    wx.showModal({ // 显示提示弹窗，防误触
      title: '结束跑步',
      content: '跑完记得要拉伸哦',
      confirmText: '结束跑步',
      confirmColor: '#e54d42',
      success: res => {
        if (res.confirm) {
          const db = wx.cloud.database()  // 获取默认环境的数据库的引用
          db.collection('run').add({
            data: {
              polyline: this.data.polyline,
              markers: this.data.markers,
              createTime: db.serverDate()
            },
            success: res => { // 保存成功后清理本地数据
              this.setData({ // 清除跑步轨迹和标记点，并转换状态为stop
                status: 'stop',
                polyline: [],
                markers: []
              })
            },
            fail: res => { // 保存失败时提示用户
              wx.showToast({
                icon: 'none',
                title: '保存数据失败'
              })
            }
          })
        }
      }
    })
  },
  onClickRecord() { // 用户点击跑步记录按钮时回调此函数
    wx.navigateTo({
      url: '/pages/record/list'
    })
  }
})
