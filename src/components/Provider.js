import { Component, PropTypes, Children, cloneElement } from 'react'
import storeShape from '../utils/storeShape'
import warning from '../utils/warning'

let didWarnAboutReceivingStore = false
function warnAboutReceivingStore() {
  if (didWarnAboutReceivingStore) {
    return
  }
  didWarnAboutReceivingStore = true

  warning(
    '<Provider> does not support changing `store` on the fly. ' +
    'You are most likely seeing this error because you updated to ' +
    'Redux 2.x and React Redux 2.x which no longer hot reload reducers ' +
    'automatically. See https://github.com/reactjs/react-redux/releases/' +
    'tag/v2.0.0 for the migration instructions.'
  )
}

export default class Provider extends Component {
  nextUniqueId() {
    const currentUniqueId = Number(this.currentUniqueId)
    ++this.currentUniqueId
    return currentUniqueId
  }
  getChildContext() {
    return { 
      store: this.store,
      getUniqueId: this.nextUniqueId.bind(this),
      setMapStateToProps: this.setMapStateToProps,
      unsetMapStateToProps: this.unsetMapStateToProps,
      getBlackboxFacsimiles: (id)=>this.blackboxFacsimiles[id]
    }
  }

  constructor(props, context) {
    super(props, context)
    this.store = props.store
    this.currentUniqueId = 1
    this.blackbox = {}
    this.blackboxFacsimiles = {}
    this.allMapStateToProps = {}
    this.getBlackbox = this.getBlackbox.bind(this)
    this.setMapStateToProps = this.setMapStateToProps.bind(this)
    this.unsetMapStateToProps = this.unsetMapStateToProps.bind(this)
    const storeState = this.store.getState()
    this.state = { storeState }
  }

  render() {
    const blackbox = this.getBlackbox()
    if(this.props.children === undefined || Array.isArray(this.props.children)) {
      return Children.only(this.props.children)
    }
    return cloneElement(this.props.children, { blackbox })
  }

  getBlackbox() {
    this.blackboxFacsimiles = {}
    Object.keys(this.allMapStateToProps)
    .forEach(
      id => {
        const idSelector = this.allMapStateToProps[id]
        const nextStateProps = idSelector.selector(this.state.storeState, idSelector.propArguments)
        if(this.blackbox[id] === nextStateProps) {
          this.blackboxFacsimiles[id] = true
        } else {
          this.blackboxFacsimiles[id] = false
          this.blackbox[id] = nextStateProps
        }
      }
    )
    return this.blackbox
  }
  setMapStateToProps(id, selector, propArguments) {
    this.allMapStateToProps[id] = {
      selector,
      propArguments
    }
  }

  unsetMapStateToProps(id) {
    delete this.allMapStateToProps[id]
  }

  trySubscribe(c) {
    c.unsubscribe = c.store.subscribe(c.handleChange.bind(c))
    c.handleChange()
  }

  getPure(c) {
    if(c.props.pure !== undefined) {
      return c.props.pure
    }
    return true
  }

  handleChange() {
    if (!this.unsubscribe) {
      return
    }
    const pure = this.getPure(this)
    const storeState = this.store.getState()
    const prevStoreState = this.state.storeState
    if (pure && prevStoreState === storeState) {
      return
    }
    this.setState({ storeState })
  }

  tryUnsubscribe(c) {
    if (c.unsubscribe) {
      c.unsubscribe()
      c.unsubscribe = null
    }
  }

  componentDidMount() {
    this.trySubscribe(this)
  }

  componentWillUnmount() {
    this.tryUnsubscribe(this)
  }
}

if (process.env.NODE_ENV !== 'production') {
  Provider.prototype.componentWillReceiveProps = function (nextProps) {
    const { store } = this
    const { store: nextStore } = nextProps

    if (store !== nextStore) {
      warnAboutReceivingStore()
      this.trySubscribe(this)
    }
  }
}

Provider.propTypes = {
  store: storeShape.isRequired,
  children: PropTypes.element.isRequired
}
Provider.childContextTypes = {
  store: storeShape.isRequired,
  getUniqueId: PropTypes.func.isRequired,
  getBlackboxFacsimiles: PropTypes.func.isRequired,
  setMapStateToProps: PropTypes.func.isRequired,
  unsetMapStateToProps: PropTypes.func.isRequired
}
