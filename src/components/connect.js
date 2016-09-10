import React, { Component, createElement, PropTypes } from 'react'
import storeShape from '../utils/storeShape'
import shallowEqual from '../utils/shallowEqual'
import wrapActionCreators from '../utils/wrapActionCreators'
import warning from '../utils/warning'
import getDisplayName from '../utils/getDisplayName'
import isPlainObject from 'lodash/isPlainObject'
import hoistStatics from 'hoist-non-react-statics'
import invariant from 'invariant'

const defaultStateProps = {}

const defaultMapOwnProps = props => props 
const defaultMapStateToProps = state => defaultStateProps // eslint-disable-line no-unused-vars
const defaultMapDispatchToProps = dispatch => ({ dispatch })
const defaultMergeProps = (stateProps, dispatchProps, parentProps) => ({
  ...parentProps,
  ...stateProps,
  ...dispatchProps
})

function didPropsChange(newProp, propertyName, component) {
  if(shallowEqual(newProp, component[propertyName] || {})) {
    return false
  }
  component[propertyName] = newProp
  return true
}

class ShouldComponentUpdate extends Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.update
  }
  render() {
    return this.props.renderElement()
  }
}

export default function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {}) {
  let mapStateToProps_selector = mapStateToProps || defaultMapStateToProps
  let mapStateToProps_ownPropsSelector = defaultMapOwnProps
  if(Array.isArray(mapStateToProps)) {
    mapStateToProps_selector = mapStateToProps[0]
    mapStateToProps_ownPropsSelector = mapStateToProps[1] || defaultMapOwnProps
  }
  let mapDispatchToProps_selector = mapDispatchToProps || defaultMapDispatchToProps
  let mapDispatchToProps_ownPropsSelector = defaultMapOwnProps
  if(Array.isArray(mapDispatchToProps)) {
    mapDispatchToProps_selector = mapDispatchToProps[0]
    mapDispatchToProps_ownPropsSelector = mapDispatchToProps[1] || defaultMapOwnProps
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

    function checkOwnPropsSelector(selectorFunction, type) {
      if(selectorFunction === defaultMapOwnProps) {
        warning(
        `${type}() in ${connectDisplayName} uses props in the selector as the second argument,` +
        ` but no selector has been provided for those props. Please consider supplying a props selector` +
        ` in the following format: connect([ (state, resultProps)=>{...}, (props)=>resultProps ], ...)`
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
        invariant((props.blackbox),
          `Could not find "blackbox" in the ` +
          `props of "${connectDisplayName}". `
        )
        super(props, context)
        this.appendMapStateToProps = this.appendMapStateToProps.bind(this)
        this.store = this.props.store || this.context.store
        this.uniqueId = context.getUniqueId()
        this.appendStateProps = {
          names: {},
          selectors: {},
          inputs: {}
        }
        this.stateProps = {
          appendStateProps: {}
        }
        this.mapStateToProps_ownProps = {}
        this.lastFilteredBlackbox = {}
        const testMapStateToProps = mapStateToProps_selector(this.store.getState(), props)
        if(typeof testMapStateToProps === 'function') {
          this.mapStateToProps_selector = testMapStateToProps
        } else {
          this.mapStateToProps_selector = mapStateToProps_selector
        }
        if(this.mapStateToProps_selector.length ===  1) {
          this.mapStateToProps_dependsOnProps = false
        } else {
          if (process.env.NODE_ENV !== 'production') {
            checkOwnPropsSelector(mapStateToProps_ownPropsSelector, 'mapStateToProps')
          }
          this.mapStateToProps_dependsOnProps = true
        }
        this.dispatchProps = {}
        this.mapDispatchToProps_ownProps = {}
        const testMapDispatchToProps = mapDispatchToProps_selector(this.store.dispatch, props)
        let dispatchFactory
        if(typeof testMapDispatchToProps === 'function') {
          dispatchFactory = true
          this.mapDispatchToProps_selector = testMapDispatchToProps
        } else {
          dispatchFactory = false
          this.mapDispatchToProps_selector = mapDispatchToProps_selector
        }
        if(mapDispatchToProps_selector.length === 1) {
          this.dispatchProps = dispatchFactory ? this.mapDispatchToProps_selector(this.store.dispatch, props) : testMapDispatchToProps
          if (process.env.NODE_ENV !== 'production') {
            checkStateShape(this.dispatchProps, 'mapDispatchToProps')
          }
          this.mapDispatchToProps_dependsOnProps = false
        } else {
          if (process.env.NODE_ENV !== 'production') {
            checkOwnPropsSelector(mapStateToProps_ownPropsSelector, 'mapStateToProps')
          }
          this.mapDispatchToProps_dependsOnProps = true
        }

      }
      componentDidMount() {
        this.context.addConnectIds && this.context.addConnectIds([ this.uniqueId ])
      }

      shouldComponentUpdate(nextProps) {
        const { blackbox: nextBlackbox, ...nextOwnProps } = nextProps
        const { blackbox, ...ownProps } = this.props
        let blackboxChanged = false
        if(!shallowEqual(nextOwnProps, ownProps)) {
          this.haveOwnPropsChanged = true
        } else {
          this.haveOwnPropsChanged = false
        }
        if(!pure) {
          return true
        }
        if(!shallowEqual(blackbox, nextBlackbox))  {
          blackboxChanged = true
        }
        return (blackboxChanged || this.haveOwnPropsChanged)
      }

      componentWillUnmount() {
        this.context.unsetMapStateToProps(this.uniqueId)
        this.context.removeConnectIds && this.context.removeConnectIds([ this.uniqueId ])
        this.clearCache()
      }

      clearCache() {
        this.store = null
        this.uniqueId = null
        this.mapStateToProps_selector = null
        this.mapStateToProps_ownProps = null
        this.mapDispatchToProps_selector = null
        this.mapDispatchToProps_ownProps = null
        this.lastFilteredBlackbox = null
        this.lastFilteredBlackbox_ownProps = null
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
        const { blackbox, ...ownProps } = this.props
        const nextOwnProps = allOwnPropsSelectors[`map${name}ToProps_ownPropsSelector`](ownProps)
        if(shallowEqual(this[ownPropsName], nextOwnProps)) {
          return false
        }
        this[ownPropsName] = nextOwnProps
        return true
      }

      mapStateToProps_ownProps_didChange() {
        if(this.mapStateToProps_dependsOnProps) {
          return this.genericProps_ownProps_didChange('State')  
        }
        return false
      }

      mapDispatchToProps_ownProps_didChange() {
        if(this.mapDispatchToProps_dependsOnProps) {
          return this.genericProps_ownProps_didChange('Dispatch')
        }
        return false
      }

      computeStateProps() {
        const stateProps = this.mapStateToProps_selector(
          this.store.getState(),
          //Maybe use proxy object here to throw error when calling undefined properties
          this.mapStateToProps_ownProps
        )
        this.context.setMapStateToProps(this.uniqueId, this.allMapStateToProps_selector())
        this.statePropsBase = stateProps
        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(stateProps, 'mapStateToProps')
        }
        return { ...stateProps, appendStateProps: this.stateProps.appendStateProps }
      }

      computeDispatchProps() {
        const dispatchProps = this.mapDispatchToProps_selector(
          this.store.dispatch,
          //Maybe use proxy object here to throw error when calling undefined properties
          this.mapDispatchToProps_ownProps
        )
        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(dispatchProps, 'mapDispatchToProps')
        }
        return dispatchProps
      }

      filterBlackbox_ownProps() {
        const { blackbox, ...ownProps } = this.props
        delete blackbox[this.uniqueId]
        if(didPropsChange(blackbox, 'lastFilteredBlackbox', this) || this.haveOwnPropsChanged !== false) {
          this.lastFilteredBlackbox_ownProps = { blackbox: this.lastFilteredBlackbox, ...ownProps }
        }
        return this.lastFilteredBlackbox_ownProps || {}
      }

      updateMergedPropsIfNeeded(stateProps, dispatchProps, ownProps) {
        const nextMergedProps = computeMergedProps(stateProps, dispatchProps, ownProps)
        if (this.mergedProps && checkMergedEquals && shallowEqual(nextMergedProps, this.mergedProps || {})) {
          return false
        }
        this.mergedProps = nextMergedProps
        return true
      }

      appendMapStateToProps(name, inputs, selector) {
        if(shallowEqual(this.appendStateProps.inputs[name] || {}, inputs)) {
          if(
          this.props.blackbox[this.uniqueId] && 
          this.props.blackbox[this.uniqueId].appendStateProps && 
          this.props.blackbox[this.uniqueId].appendStateProps[name]) {
            return this.props.blackbox[this.uniqueId].appendStateProps[name]
          }
        }
        this.setAppendStateProps(name, inputs, selector)
        this.context.setMapStateToProps(this.uniqueId, this.allMapStateToProps_selector())
        const thisAppendStateProps = selector(this.store.getState(), inputs)
        this.stateProps.appendStateProps[name] = thisAppendStateProps
        return thisAppendStateProps
      }

      setAppendStateProps(name, inputs, selector) {
        this.appendStateProps.names[name] = null
        this.appendStateProps.selectors[name] = selector
        this.appendStateProps.inputs[name] = inputs
      }

      allMapStateToProps_selector() {
        return (state)=>{
          let changed = false
          let appendStatePropsChanged = false
          const baseMapStateToProps = this.mapStateToProps_selector(state, this.mapStateToProps_ownProps)
          if(this.statePropsBase !== baseMapStateToProps) {
            changed = true
            this.statePropsBase = baseMapStateToProps
            this.stateProps = { appendStateProps: this.stateProps.appendStateProps, ...baseMapStateToProps }
          }
          Object.keys(this.appendStateProps.names).forEach((name) => {
            const thisAppendStateProps = this.appendStateProps.selectors[name](state, this.appendStateProps.inputs[name])
            if(this.stateProps.appendStateProps[name] !== thisAppendStateProps) {
              this.stateProps.appendStateProps[name] = thisAppendStateProps
              if(!appendStatePropsChanged) {
                appendStatePropsChanged = true
                this.stateProps.appendStateProps = { ...this.stateProps.appendStateProps }
              }
            }
          })
          if(appendStatePropsChanged || changed) {
            this.statePropsChanged = true
          }else {
            this.statePropsChanged = false
          }
          if(appendStatePropsChanged) {
            return [ appendStatePropsChanged, { ...this.stateProps } ]
          }
          return [ changed, this.stateProps ]
        }
      }

      render() {
        const nextStateProps = this.getStateProps()
        const [ nextDispatchProps, knowForSureTheSameProps ] = this.getDispatchProps()
        const haveStatePropsChanged = this.statePropsChanged || didPropsChange(nextStateProps, 'stateProps', this)
        const haveDispatchPropsChanged = knowForSureTheSameProps || didPropsChange(nextDispatchProps, 'dispatchProps', this)
        let haveMergedPropsChanged = false
        if (
          haveStatePropsChanged ||
          haveDispatchPropsChanged ||
          this.haveOwnPropsChanged !== false
        ) {
          haveMergedPropsChanged = this.updateMergedPropsIfNeeded(nextStateProps, nextDispatchProps, this.filterBlackbox_ownProps())
        }
        if (!haveMergedPropsChanged && this.renderedElement) {
          return (<ShouldComponentUpdate 
            update={false}
            key={`connect-${this.uniqueId}`}
          />)
        }
        if (withRef) {
          this.renderedElement = (<ShouldComponentUpdate 
            update
            key={`connect-${this.uniqueId}`}
            renderElement={()=>createElement(WrappedComponent, {
              ...this.mergedProps,
              ref: 'wrappedInstance',
              appendMapStateToProps: this.appendMapStateToProps
            })} 
          />)
        } else {
          this.renderedElement = (<ShouldComponentUpdate 
            update
            key={`connect-${this.uniqueId}`}
            renderElement={()=>createElement(WrappedComponent,
              { ...this.mergedProps, appendMapStateToProps: this.appendMapStateToProps },
            )}
          />)
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
