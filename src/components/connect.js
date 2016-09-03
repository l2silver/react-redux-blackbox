import { Component, createElement, PropTypes } from 'react'
import storeShape from '../utils/storeShape'
import shallowEqual from '../utils/shallowEqual'
import wrapActionCreators from '../utils/wrapActionCreators'
import warning from '../utils/warning'
import getDisplayName from '../utils/getDisplayName'
import isPlainObject from 'lodash/isPlainObject'
import hoistStatics from 'hoist-non-react-statics'
import invariant from 'invariant'

const defaultMapOwnProps = props => props 
const defaultMapStateToProps = state => ({}) // eslint-disable-line no-unused-vars
const defaultMapDispatchToProps = dispatch => ({ dispatch })
const defaultMergeProps = (stateProps, dispatchProps, parentProps) => ({
  ...parentProps,
  ...stateProps,
  ...dispatchProps
})

function didPropsChange(newProp, propertyName, component) {
  if(shallowEqual(newProp, component[propertyName] || {})) {
    return true
  }
  component[propertyName] = newProp
  return false
}

export default function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {}) {
  let mapStateToProps_selector = mapStateToProps || defaultMapStateToProps
  let mapStateToProps_ownPropsSelector = defaultMapOwnProps
  let mapStateToProps_factory = false
  if(Array.isArray(mapStateToProps)) {
    mapStateToProps_selector = mapStateToProps[0]
    mapStateToProps_ownPropsSelector = mapStateToProps[1] || defaultMapOwnProps
    mapStateToProps_factory = mapStateToProps[2]
  }
  let mapDispatchToProps_selector = mapDispatchToProps || defaultMapDispatchToProps
  let mapDispatchToProps_ownPropsSelector = defaultMapOwnProps
  let mapDispatchToProps_factory = false
  if(Array.isArray(mapDispatchToProps)) {
    mapDispatchToProps_selector = mapDispatchToProps[0]
    mapDispatchToProps_ownPropsSelector = mapDispatchToProps[1]
    mapDispatchToProps_factory = mapDispatchToProps[2]
  }
  
  if (typeof mapDispatchToProps_selector !== 'function') {
    mapDispatchToProps_selector = wrapActionCreators(mapDispatchToProps_selector)
  }
  const allOwnPropsSelectors = {
    mapDispatchToProps_ownPropsSelector: mapDispatchToProps_ownPropsSelector,
    mapStateToProps_ownPropsSelector
  }
  const finalMergeProps = mergeProps || defaultMergeProps
  const { pure = true, withRef = false } = options
  const checkMergedEquals = pure && finalMergeProps !== defaultMergeProps

  return function wrapWithConnect(WrappedComponent) {
    const connectDisplayName = `Connect(${getDisplayName(WrappedComponent)})`

    function checkStateShape(props, methodName) {
      if (!isPlainObject(props)) {
        warning(
          `${methodName}() in ${connectDisplayName} must return a plain object. ` +
          `Instead received ${props}.`
        )
      }
    }

    function computeMergedProps(stateProps, dispatchProps, parentProps) {
      const mergedProps = finalMergeProps(stateProps, dispatchProps, parentProps)
      if (process.env.NODE_ENV !== 'production') {
        checkStateShape(mergedProps, 'mergeProps')
      }
      return mergedProps
    }

    class Connect extends Component {
      constructor(props, context) {
        invariant((props.store || context.store),
          `Could not find "store" in either the context or ` +
          `props of "${connectDisplayName}". ` +
          `Either wrap the root component in a <Provider>, ` +
          `or explicitly pass "store" as a prop to "${connectDisplayName}".`
        )
        super(props, context)
        this.uniqueId = context.getUniqueId()
        this.dispatchProps = {}
        this.stateProps = {}
        this.mapStateToProps_selector = mapStateToProps_selector
        if(mapStateToProps_factory) {
          this.mapStateToProps_selector = mapStateToProps_selector(this.getStore().getState(), props)
        }
        this.mapDispatchToProps_selector = mapDispatchToProps_selector
        if(mapDispatchToProps_factory) {
          this.mapDispatchToProps_selector = mapDispatchToProps_selector(this.getStore().getState(), props)
        }
      }

      getStore() {
        return this.props.store || this.context.store
      }

      componentDidMount() {
        this.context.setMapStateToProps(this.uniqueId, this.mapStateToProps_selector, this.mapStateToProps_ownProps)
        this.context.addConnectIds && this.context.addConnectIds(this.uniqueId)
      }

      shouldComponentUpdate(nextProps) {
        if (!pure || !shallowEqual(nextProps, this.props)) {
          this.haveOwnPropsChanged = true
        }
        this.haveOwnPropsChanged = false
      }

      componentWillUnmount() {
        this.context.unsetMapStateToProps(this.uniqueId)
        this.context.removeConnectIds && this.context.removeConnectIds(this.uniqueId)
        this.clearCache()
      }

      clearCache() {
        this.uniqueId = null
        this.mapStateToProps_selector = null
        this.mapStateToProps_ownProps = null
        this.mapDispatchToProps_selector = null
        this.mapDispatchToProps_ownProps = null
        this.stateProps = null
        this.dispatchProps = null
        this.mergedProps = null
        this.renderedElement = null
      }

      getWrappedInstance() {
        invariant(withRef,
          `To access the wrapped instance, you need to specify ` +
          `{ withRef: true } as the fourth argument of the connect() call.`
        )

        return this.refs.wrappedInstance
      }

      getDispatchProps() {
        if(!this.mapDispatchToProps_ownProps_didChange()) {
          return [ this.dispatchProps, false ]
        }

        return [ this.computeDispatchProps(), true ]
      }
      getStateProps() {
        const { blackbox } = this.props
        const stateProps = blackbox[this.uniqueId]
        if(stateProps) {
          if(!this.mapStateToProps_ownProps_didChange()) {
            return stateProps
          }
        }
        return this.computeStateProps()
      }

      genericProps_ownProps_didChange(name) {
        const ownPropsName = `map${name}ToProps_ownProps`
        const nextOwnProps = allOwnPropsSelectors[`map${name}ToProps_ownPropsSelector`](this.props)

        if(shallowEqual(this[ownPropsName], nextOwnProps)) {
          return true
        }
        this[ownPropsName] = nextOwnProps
        return false
      }

      mapStateToProps_ownProps_didChange() {
        return this.genericProps_ownProps_didChange('State')
      }

      mapDispatchToProps_ownProps_didChange() {
        return this.genericProps_ownProps_didChange('Dispatch')
      }

      computeDispatchProps() {
        return this.mapStateToProps_selector(
          this.getStore().getState(),
          //Maybe use proxy object here to throw error when calling undefined properties
          this.mapDispatchToProps_ownProps
        )
      }

      computeStateProps() {
        return this.mapDispatchToProps_selector(
          this.getStore().dispatch,
          //Maybe use proxy object here to throw error when calling undefined properties
          this.mapStateToProps_ownProps
        )
      }

      updateMergedPropsIfNeeded(stateProps, dispatchProps, ownProps) {
        const nextMergedProps = computeMergedProps(stateProps, dispatchProps, ownProps)
        if (this.mergedProps && checkMergedEquals && shallowEqual(nextMergedProps, this.mergedProps || {})) {
          return false
        }

        this.mergedProps = nextMergedProps
        return true
      }

      render() {
        const nextStateProps = this.getStateProps()
        const [ nextDispatchProps, knowForSureTheSameProps ] = this.getDispatchProps()
        
        const haveStatePropsChanged = didPropsChange(nextStateProps, 'stateProps', this)
        
        const haveDispatchPropsChanged = knowForSureTheSameProps || didPropsChange(nextDispatchProps, 'dispatchProps', this)
        let haveMergedPropsChanged = false
        if (
          haveStatePropsChanged ||
          haveDispatchPropsChanged ||
          this.haveOwnPropsChanged
        ) {
          haveMergedPropsChanged = this.updateMergedPropsIfNeeded(nextStateProps, nextDispatchProps, this.props)
        }

        if (!haveMergedPropsChanged && this.renderedElement) {
          return this.renderedElement
        }

        if (withRef) {
          this.renderedElement = createElement(WrappedComponent, {
            ...this.mergedProps,
            ref: 'wrappedInstance'
          })
        } else {
          this.renderedElement = createElement(WrappedComponent,
            this.mergedProps
          )
        }

        return this.renderedElement
      }
    }

    Connect.displayName = connectDisplayName
    Connect.WrappedComponent = WrappedComponent
    Connect.contextTypes = {
      store: storeShape,
      getUniqueId: PropTypes.func.isRequired,
      setMapStateToProps: PropTypes.func.isRequired,
      unsetMapStateToProps: PropTypes.func.isRequired,
      addConnectIds: PropTypes.func
    }
    Connect.propTypes = {
      store: storeShape
    }

    return hoistStatics(Connect, WrappedComponent)
  }
}
