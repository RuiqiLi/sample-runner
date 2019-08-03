export function getReadableTime(t) {
  const year = t.getFullYear()
  const month = alignNumber(t.getMonth() + 1)
  const date = alignNumber(t.getDate())
  const hours = alignNumber(t.getHours())
  const minutes = alignNumber(t.getMinutes())
  const seconds = alignNumber(t.getSeconds())
  return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds
}

function alignNumber(n) {
  return (n < 10) ? ('0' + n) : ('' + n)
}