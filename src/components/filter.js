import { Component, createElement, PropTypes } from 'react'
import pick from 'lodash.pick'
import shallowEqual from '../utils/shallowEqual'
import hoistStatics from 'hoist-non-react-statics'
import getDisplayName from '../utils/getDisplayName'

export default function wrapWithFilter(WrappedComponent, options = {}) {
  const connectDisplayName = `Filter(${getDisplayName(WrappedComponent)})`
  const { pure = true, withRef = false } = options

  class Filter extends Component {
    addConnectIds(ids) {
      ids.forEach(id => {
        this.connectIds.add(id)
      })
      this.context.addConnectIds && this.context.addConnectIds(this.connectIds)
    }
    removeConnectIds(ids) {
      ids.forEach(id => {
        this.connectIds.delete(id)
      })
      this.context.removeConnectIds && this.context.removeConnectIds(this.connectIds)
    }
    getChildContext() {
      return { 
        addConnectIds: this.addConnectIds.bind(this),
        removeConnectIds: this.removeConnectIds.bind(this)
      }
    }
    constructor(props, context) {
      super(props, context)
      const { blackbox, ...otherProps } = props
      this.blackbox = blackbox
      this.otherProps = otherProps
      this.connectIds = new Set()
    }

    otherProps_changed(otherProps) {
      if(shallowEqual(otherProps, this.otherProps)) {
        return true
      }
      this.otherProps = otherProps
      return false
    }

    fileredBlackbox_changed(blackbox) {
      let change = false
      try {
        this.connectIds.forEach(id => {
          if(this.context.getBlackboxFacsimiles(id)) {
            return
          }
          throw new Error()
        })
      } catch(e) {
        change = true
        this.blackbox = pick(blackbox, this.connectIds)
      } finally {
        return change
      }
    }

    shouldComponentUpdate(nextProps) {
      const { blackbox, ...otherProps } = nextProps
      return !pure || this.filteredBlackbox_changed(blackbox) || this.otherProps_changed(otherProps)
    }

    componentWillUnmount() {
      this.context.removeConnectIds(this.connectIds)
      this.clearCache()
    }

    clearCache() {
      this.blackbox = null
      this.otherProps = null
      this.connectIds = null
    }

    getMergedProps() {
      const { blackbox, otherProps } = this
      return { blackbox, ...otherProps }
    }
    render() {
      if (withRef) {
        return createElement(WrappedComponent,
          { ...this.getMergedProps(), ref: 'wrappedInstance' }
        )
      } 
      return createElement(WrappedComponent,
        this.getMergedProps()
      )
    }
  }

  Filter.displayName = connectDisplayName
  Filter.WrappedComponent = WrappedComponent
  Filter.contextTypes = {
    getUniqueId: PropTypes.func.isRequired,
    addConnectIds: PropTypes.func.isOptional,
    removeConnectIds: PropTypes.func.isOptional
  }
  Filter.propTypes = {
    blackbox: PropTypes.object.isRequired
  }

  return hoistStatics(Filter, WrappedComponent)
}
