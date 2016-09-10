export default function (object, set) {
  let finalObject = {}
  set.forEach(key => {
    finalObject[key] = object[key]
  })
  return finalObject
}
