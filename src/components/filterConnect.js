import filter from './filter'
import connect from './connect'
export default function (mapStateToProps, mapDispatchToProps, mergeProps, options) {
  return (WrappedComponent)=>{
    return filter(connect(mapStateToProps, mapDispatchToProps, mergeProps, options)(WrappedComponent))
  }
}
