import { Component, createElement, PropTypes } from 'react'
import shallowEqual from '../utils/shallowEqual'
import hoistStatics from 'hoist-non-react-statics'
import getDisplayName from '../utils/getDisplayName'
import setSome from '../utils/setSome'
import pickSet from '../utils/pickSet'
import invariant from 'invariant'

export default function wrapWithFilter(WrappedComponent, options = {}) {
  const connectDisplayName = `Filter(${getDisplayName(WrappedComponent)})`
  const { pure = true, withRef = false } = options

  class Filter extends Component {
    constructor(props, context) {
      invariant((context.getBlackboxFacsimiles),
        `Could not find "getBlackboxFacsimiles" in the ` +
        `context of "${connectDisplayName}". Please make sure the react-redux-blackbox ` +
        `Provider component is at the root of the application`
      )
      super(props, context)
      const { blackbox, ...otherProps } = props
      invariant((props.blackbox),
        `Could not find "blackbox" in the ` +
        `props of "${connectDisplayName}". `
      )
      this.blackbox = blackbox
      this.otherProps = otherProps
      this.connectIds = new Set()
    }

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
      this.context.removeConnectIds && this.context.removeConnectIds(ids)
    }
    getChildContext() {
      return { 
        addConnectIds: this.addConnectIds.bind(this),
        removeConnectIds: this.removeConnectIds.bind(this)
      }
    }

    otherProps_changed(otherProps) {
      if(shallowEqual(otherProps, this.otherProps)) {
        return false
      }
      this.otherProps = otherProps
      return true
    }

    filteredBlackbox_changed(blackbox) {
      const change = setSome(this.connectIds, id => !this.context.getBlackboxFacsimiles(id))
      if(change) {
        this.blackbox = pickSet(blackbox, this.connectIds)
      }
      return change
    }

    shouldComponentUpdate(nextProps) {
      const { blackbox, ...otherProps } = nextProps
      const blackboxChanged = this.filteredBlackbox_changed(blackbox)
      const otherPropsChanged = this.otherProps_changed(otherProps)
      return !pure || blackboxChanged || otherPropsChanged
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
    addConnectIds: PropTypes.func,
    removeConnectIds: PropTypes.func,
    getBlackboxFacsimiles: PropTypes.func.isRequired
  }
  Filter.propTypes = {
    blackbox: PropTypes.object.isRequired
  }
  Filter.childContextTypes = {
    addConnectIds: PropTypes.func,
    removeConnectIds: PropTypes.func 
  }

  return hoistStatics(Filter, WrappedComponent)
}
