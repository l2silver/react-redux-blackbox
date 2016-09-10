export default function (set, fn) {
  let response = false
  try {
    set.forEach((val)=>{
      if(fn(val)) {
        throw new Error()
      }
      return
    })
  } catch(e) {
    response = true
  } finally {
    return response
  }
}
