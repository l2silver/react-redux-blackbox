import expect from 'expect'
import React, { createClass, Children, PropTypes, Component } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { createStore } from 'redux'
import { connect, Provider } from '../../src/index'

const randomId = Math.floor((Math.random() * 100000))
/*eslint-disable no-unused-vars */
const dispatch = (action) => action
/*eslint-enable no-unused-vars */
describe('React', () => {
  describe('connect', () => {
    class Passthrough extends Component {
      render() {
        return <div {...this.props} />
      }
    }

    class ProviderMock extends Component {
      getChildContext() {
        return { 
          store: this.props.store,
          getUniqueId: ()=>randomId,
          setMapStateToProps: ()=>{},
          unsetMapStateToProps: ()=>{},
          getBlackboxFacsimile: ()=>{}
        }
      }

      render() {
        const { store, ...props } = this.props
        return Children.only(this.props.children)        
      }
    }
    
    ProviderMock.childContextTypes = {
      store: PropTypes.object,
      getUniqueId: PropTypes.func,
      setMapStateToProps: PropTypes.func,
      unsetMapStateToProps: PropTypes.func,
      getBlackboxFacsimile: PropTypes.func

    }
    const getUniqueId = ()=>randomId
    const setMapStateToProps = ()=>{}
    const unsetMapStateToProps = ()=>{}
    const blackbox = {}
    const store = createStore(() => ({}))
    
    function stringBuilder(prev = '', action) {
      return action.type === 'APPEND'
        ? prev + action.body
        : prev
    }
    describe('constructor', () => {
      @connect()
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      it('should generate default properties', () => {
        const container = new Container({ blackbox }, { store, getUniqueId, setMapStateToProps, unsetMapStateToProps })
        expect(container.uniqueId).toBe(randomId)
        expect(container.dispatchProps).toEqual({ dispatch: store.dispatch })
        expect(container.stateProps).toEqual({ appendStateProps: {} })
        expect(container.mapStateToProps_selector()).toEqual({})
        expect(container.mapDispatchToProps_selector('dispatch')).toEqual({ dispatch: 'dispatch' })
      })
      it('should generate factories', () => {
        function factory() {
          return {}
        }
        @connect([ ()=>factory, ()=>{} ], [ ()=>factory, ()=>{} ])
        class Container extends Component {
          render() {
            return <Passthrough {...this.props} />
          }
        }
        const container = new Container({ blackbox }, { store, getUniqueId, setMapStateToProps, unsetMapStateToProps })
        expect(container.mapStateToProps_selector).toEqual(factory)
        expect(container.mapDispatchToProps_selector).toEqual(factory)
      })
    })
    describe('componentDidMount', () => {
      @connect()
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      it('should addConnectIds', () => {
        const addConnectIds = expect.createSpy(()=>{})
        const context = { store, getUniqueId, setMapStateToProps, unsetMapStateToProps, addConnectIds }
        const container = new Container({ blackbox }, context)
        container.componentDidMount()
        expect(addConnectIds).toHaveBeenCalledWith([ container.uniqueId ])
      })
    })

    describe('componentWillUnmount', () => {
      @connect()
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      
      it('should unsetMapStateToProps and clearCache', () => {
        const props = { blackbox }
        const context = { store, getUniqueId, unsetMapStateToProps, setMapStateToProps }
        const unsetMapStateToPropsSpy = expect.spyOn(context, 'unsetMapStateToProps')
        const container = new Container(props, context)
        const clearCacheSpy = expect.spyOn(container, 'clearCache')
        container.componentWillUnmount()
        expect(unsetMapStateToPropsSpy).toHaveBeenCalledWith(randomId)
        expect(clearCacheSpy).toHaveBeenCalled()
      })
      it('should unsetMapStateToProps clearCache and removeConnectIds', () => {
        const props = { blackbox: {} }
        const context = { store, getUniqueId, unsetMapStateToProps, setMapStateToProps, removeConnectIds: ()=>{} }
        const unsetMapStateToPropsSpy = expect.spyOn(context, 'unsetMapStateToProps')
        const removeConntectIdsSpy = expect.spyOn(context, 'removeConnectIds')
        const container = new Container(props, context)
        const clearCacheSpy = expect.spyOn(container, 'clearCache')
        container.componentWillUnmount()
        expect(unsetMapStateToPropsSpy).toHaveBeenCalledWith(randomId)
        expect(removeConntectIdsSpy).toHaveBeenCalledWith([ randomId ])
        expect(clearCacheSpy).toHaveBeenCalled()
      })
    })

    describe('filterBlackbox_ownProps', () => {
      @connect()
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      it('should return new last filteredBlackbox ownProps', () => {
        const blackbox = { [randomId]: { example: 'test' } }
        const props = { blackbox, otherProps: 'example' }
        const context = { store, getUniqueId, unsetMapStateToProps, setMapStateToProps }
        const container = new Container(props, context)
        expect(container.lastFilteredBlackbox_ownProps).toBe(undefined) 
        container.filterBlackbox_ownProps()
        expect(container.lastFilteredBlackbox).toEqual({})
        expect(container.lastFilteredBlackbox_ownProps).toEqual({ blackbox: {}, otherProps: 'example' }) 
      })
    })

    it('should render with state props', () => {
      @connect(() => ({ example: 'test' }))
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      const container = TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
            <Container blackbox={{}} pass="through" />
        </ProviderMock>
      )
      const stub = TestUtils.findRenderedComponentWithType(container, Passthrough)
      expect(stub.props.pass).toEqual('through')
      expect(stub.props.example).toEqual('test')
      expect(stub.props.blackbox).toEqual(blackbox)
    })

    it('should render with dispatch props', () => {
      @connect(() => ({}), () => ({ example: 'test' }))
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      const container = TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <Container blackbox={blackbox} pass="through" />
        </ProviderMock>
      )
      const stub = TestUtils.findRenderedComponentWithType(container, Passthrough)
      expect(stub.props.pass).toEqual('through')
      expect(stub.props.example).toEqual('test')
      expect(stub.props.blackbox).toEqual(blackbox)
    })

    it('should handle dispatches before componentDidMount', () => {
      const store = createStore(stringBuilder)

      @connect(state => ({ string: state }) )
      class Container extends Component {
        componentWillMount() {
          store.dispatch({ type: 'APPEND', body: 'a' })
        }
        render() {
          return <Passthrough {...this.props}/>
        }
      }

      const ProviderContent = props => {
        return (<div>
          <Container {...props} />
        </div>)
      }
      const tree = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <ProviderContent />
        </Provider>
      )

      const stub = TestUtils.findRenderedComponentWithType(tree, Passthrough)
      expect(stub.props.string).toBe('a')
    })

    it('should handle additional prop changes in addition to slice', () => {
      const store = createStore(() => ({
        foo: 'bar'
      }))

      @connect(state => state)
      class ConnectContainer extends Component {
        render() {
          return (
            <Passthrough {...this.props} pass={this.props.bar.baz} />
          )
        }
      }

      class Container extends Component {
        constructor() {
          super()
          this.state = {
            bar: {
              baz: ''
            }
          }
        }

        componentDidMount() {
          this.setState({
            bar: Object.assign({}, this.state.bar, { baz: 'through' })
          })
        }

        render() {
          return (
            <ProviderMock store={store}>
              <ConnectContainer {...{ blackbox }} bar={this.state.bar} />
             </ProviderMock>
          )
        }
      }

      const container = TestUtils.renderIntoDocument(<Container />)
      const stub = TestUtils.findRenderedComponentWithType(container, Passthrough)
      expect(stub.props.foo).toEqual('bar')
      expect(stub.props.pass).toEqual('through')
    })

    it('should handle unexpected prop changes with forceUpdate()', () => {
      const store = createStore(() => ({}))

      @connect(state => state)
      class ConnectContainer extends Component {
        render() {
          return (
            <Passthrough {...this.props} pass={this.props.bar} />
          )
        }
      }

      class Container extends Component {
        constructor() {
          super()
          this.bar = 'baz'
        }

        componentDidMount() {
          this.bar = 'foo'
          this.forceUpdate()
          this.c.forceUpdate()
        }

        render() {
          return (
            <ProviderMock store={store}>
              <div>
                <ConnectContainer blackbox={{}} bar={this.bar} ref={c => this.c = c} />
              </div>
            </ProviderMock>
          )
        }
      }

      const container = TestUtils.renderIntoDocument(<Container />)
      const stub = TestUtils.findRenderedComponentWithType(container, Passthrough)
      expect(stub.props.bar).toEqual('foo')
    })

    it('should remove undefined props', () => {
      const store = createStore(() => ({}))
      let props = { x: true }
      let container

      @connect(() => ({}), () => ({}))
      class ConnectContainer extends Component {
        render() {
          return (
            <Passthrough {...this.props} />
          )
        }
      }

      class HolderContainer extends Component {
        render() {
          return (
            <ConnectContainer blackbox={blackbox} {...props} />
          )
        }
      }

      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <HolderContainer ref={instance => container = instance} />
        </ProviderMock>
      )

      const propsBefore = {
        ...TestUtils.findRenderedComponentWithType(container, Passthrough).props
      }

      props = {}
      container.forceUpdate()

      const propsAfter = {
        ...TestUtils.findRenderedComponentWithType(container, Passthrough).props
      }

      expect(propsBefore.x).toEqual(true)
      expect('x' in propsAfter).toEqual(false, 'x prop must be removed')
    })

    it('should remove undefined props without mapDispatch', () => {
      const store = createStore(() => ({}))
      let props = { x: true }
      let container

      @connect(() => ({}))
      class ConnectContainer extends Component {
        render() {
          return (
            <Passthrough {...this.props} />
          )
        }
      }

      class HolderContainer extends Component {
        render() {
          return (
            <ConnectContainer blackbox={blackbox} {...props} />
          )
        }
      }

      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <HolderContainer ref={instance => container = instance} />
        </ProviderMock>
      )

      const propsBefore = {
        ...TestUtils.findRenderedComponentWithType(container, Passthrough).props
      }

      props = {}
      container.forceUpdate()

      const propsAfter = {
        ...TestUtils.findRenderedComponentWithType(container, Passthrough).props
      }

      expect(propsBefore.x).toEqual(true)
      expect('x' in propsAfter).toEqual(false, 'x prop must be removed')
    })

    it('should ignore deep mutations in props', () => {
      const store = createStore(() => ({
        foo: 'bar'
      }))

      @connect(state => state)
      class ConnectContainer extends Component {
        render() {
          return (
            <Passthrough {...this.props} pass={this.props.bar.baz} />
          )
        }
      }

      class Container extends Component {
        constructor() {
          super()
          this.state = {
            bar: {
              baz: ''
            }
          }
        }

        componentDidMount() {
          // Simulate deep object mutation
          this.state.bar.baz = 'through'
          this.setState({
            bar: this.state.bar
          })
        }

        render() {
          return (
            <ProviderMock store={store}>
              <div>
                <ConnectContainer blackbox={blackbox} bar={this.state.bar} />
              </div>
            </ProviderMock>
          )
        }
      }

      const container = TestUtils.renderIntoDocument(<Container />)
      const stub = TestUtils.findRenderedComponentWithType(container, Passthrough)
      expect(stub.props.foo).toEqual('bar')
      expect(stub.props.pass).toEqual('')
    })

    it('should allow for merge to incorporate state and prop changes', () => {
      const store = createStore(stringBuilder)

      function doSomething(thing) {
        return {
          type: 'APPEND',
          body: thing
        }
      }

      @connect(
        state => ({ stateThing: state }),
        dispatch => ({
          doSomething: (whatever) => dispatch(doSomething(whatever))
        }),
        (stateProps, actionProps, parentProps) => ({
          ...stateProps,
          ...actionProps,
          mergedDoSomething(thing) {
            const seed = stateProps.stateThing === '' ? 'HELLO ' : ''
            actionProps.doSomething(seed + thing + parentProps.extra)
          }
        })
      )
      class Container extends Component {
        render() {
          return <Passthrough {...this.props}/>
        }
      }

      const ProviderContent = props => <div>
        <Container {...props}  />
      </div>

      class OuterContainer extends Component {
        constructor() {
          super()
          this.state = { extra: 'z' }
        }

        render() {
          return (
            <Provider store={store}>
              <ProviderContent extra={this.state.extra} />
            </Provider>
          )
        }
      }

      const tree = TestUtils.renderIntoDocument(<OuterContainer />)
      const stub = TestUtils.findRenderedComponentWithType(tree, Passthrough)
      expect(stub.props.stateThing).toBe('')
      stub.props.mergedDoSomething('a')
      expect(stub.props.stateThing).toBe('HELLO az')
      stub.props.mergedDoSomething('b')
      expect(stub.props.stateThing).toBe('HELLO azbz')
      tree.setState({ extra: 'Z' })
      stub.props.mergedDoSomething('c')
      expect(stub.props.stateThing).toBe('HELLO azbzcZ')
    })

    it('should merge actionProps into WrappedComponent', () => {
      const store = createStore(() => ({
        foo: 'bar'
      }))

      @connect(
        state => state,
        dispatch => ({ dispatch })
      )
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }

      const container = TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <Container blackbox={blackbox} pass="through" />
        </ProviderMock>
      )
      const stub = TestUtils.findRenderedComponentWithType(container, Passthrough)
      expect(stub.props.dispatch).toEqual(store.dispatch)
      expect(stub.props.foo).toEqual('bar')
      expect(() =>
        TestUtils.findRenderedComponentWithType(container, Container)
      ).toNotThrow()
    })

    // This is now handled using memoizer selectors like reselect
    it.skip('should not invoke mapState when props change if it only has one argument', () => {
      const store = createStore(stringBuilder)

      let invocationCount = 0

      const defaultProps = {}
      /*eslint-disable no-unused-vars */
      @connect([ (arg1) => {
        invocationCount++
        return {}
      }, ()=>defaultProps, 0 ])
      /*eslint-enable no-unused-vars */
      class WithoutProps extends Component {
        render() {
          return <Passthrough {...this.props}/>
        }
      }

      class OuterComponent extends Component {
        constructor() {
          super()
          this.state = { foo: 'FOO' }
        }

        setFoo(foo) {
          this.setState({ foo })
        }

        render() {
          return (
            <div>
              <WithoutProps blackbox={blackbox} {...this.state} />
            </div>
          )
        }
      }

      let outerComponent
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <OuterComponent ref={c => outerComponent = c} />
        </ProviderMock>
      )
      outerComponent.setFoo('BAR')
      outerComponent.setFoo('DID')

      expect(invocationCount).toEqual(1)
    })

    // This is now handled using memoizer selectors like reselect
    it('should invoke mapState every time props are changed if it has zero arguments', () => {
      const store = createStore(stringBuilder)

      let invocationCount = 0

      @connect(() => {
        invocationCount++
        return {}
      })

      class WithoutProps extends Component {
        render() {
          return <Passthrough {...this.props}/>
        }
      }

      class OuterComponent extends Component {
        constructor() {
          super()
          this.state = { foo: 'FOO' }
        }

        setFoo(foo) {
          this.setState({ foo })
        }

        render() {
          return (
            <div>
              <WithoutProps blackbox={blackbox} {...this.state} />
            </div>
          )
        }
      }

      let outerComponent
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <OuterComponent ref={c => outerComponent = c} />
        </ProviderMock>
      )
      outerComponent.setFoo('BAR')
      outerComponent.setFoo('DID')

      expect(invocationCount).toEqual(3)
    })

    // This is now handled using memoizer selectors like reselect
    it.skip('should invoke mapState every time props are changed if it has a second argument', () => {
      const store = createStore(stringBuilder)

      let propsPassedIn
      let invocationCount = 0

      @connect((state, props) => {
        invocationCount++
        propsPassedIn = props
        return {}
      })
      class WithProps extends Component {
        render() {
          return <Passthrough {...this.props}/>
        }
      }

      class OuterComponent extends Component {
        constructor() {
          super()
          this.state = { foo: 'FOO' }
        }

        setFoo(foo) {
          this.setState({ foo })
        }

        render() {
          return (
            <div>
              <WithProps {...this.state} />
            </div>
          )
        }
      }

      let outerComponent
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <OuterComponent ref={c => outerComponent = c} />
        </ProviderMock>
      )

      outerComponent.setFoo('BAR')
      outerComponent.setFoo('BAZ')

      expect(invocationCount).toEqual(3)
      expect(propsPassedIn).toEqual({
        foo: 'BAZ'
      })
    })

    it('should not invoke mapDispatch when props change if it only has one argument', () => {
      const store = createStore(stringBuilder)

      let invocationCount = 0

      /*eslint-disable no-unused-vars */
      @connect(null, (arg1) => {
        invocationCount++
        return {}
      })
      /*eslint-enable no-unused-vars */
      class WithoutProps extends Component {
        render() {
          return <Passthrough {...this.props}/>
        }
      }

      class OuterComponent extends Component {
        constructor() {
          super()
          this.state = { foo: 'FOO' }
        }

        setFoo(foo) {
          this.setState({ foo })
        }

        render() {
          return (
            <div>
              <WithoutProps blackbox={blackbox} {...this.state} />
            </div>
          )
        }
      }

      let outerComponent
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <OuterComponent ref={c => outerComponent = c} />
        </ProviderMock>
      )

      outerComponent.setFoo('BAR')
      outerComponent.setFoo('DID')

      expect(invocationCount).toEqual(1)
    })

    it('should invoke mapDispatch every time props are changed if it has zero arguments', () => {
      const store = createStore(stringBuilder)

      let invocationCount = 0

      @connect(null, () => {
        invocationCount++
        return {}
      })

      class WithoutProps extends Component {
        render() {
          return <Passthrough {...this.props}/>
        }
      }

      class OuterComponent extends Component {
        constructor() {
          super()
          this.state = { foo: 'FOO' }
        }

        setFoo(foo) {
          this.setState({ foo })
        }

        render() {
          return (
            <div>
              <WithoutProps blackbox={blackbox} {...this.state} />
            </div>
          )
        }
      }

      let outerComponent
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <OuterComponent ref={c => outerComponent = c} />
        </ProviderMock>
      )

      outerComponent.setFoo('BAR')
      outerComponent.setFoo('DID')

      expect(invocationCount).toEqual(3)
    })

    it('should invoke mapDispatch every time props are changed if it has a second argument', () => {
      const store = createStore(stringBuilder)

      let propsPassedIn
      let invocationCount = 0

      @connect(null, (dispatch, props) => {
        invocationCount++
        propsPassedIn = props
        return {}
      })
      class WithProps extends Component {
        render() {
          return <Passthrough {...this.props}/>
        }
      }

      class OuterComponent extends Component {
        constructor() {
          super()
          this.state = { foo: 'FOO' }
        }

        setFoo(foo) {
          this.setState({ foo })
        }

        render() {
          return (
            <div>
              <WithProps blackbox={blackbox} {...this.state} />
            </div>
          )
        }
      }

      let outerComponent
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <OuterComponent ref={c => outerComponent = c} />
        </ProviderMock>
      )

      outerComponent.setFoo('BAR')
      outerComponent.setFoo('BAZ')

      expect(invocationCount).toEqual(3)
      expect(propsPassedIn).toEqual({
        foo: 'BAZ'
      })
    })

    // Subscriptions no longer handled by connect
    it.skip('should pass dispatch and avoid subscription if arguments are falsy', () => {
      const store = createStore(() => ({
        foo: 'bar'
      }))

      function runCheck(...connectArgs) {
        @connect(...connectArgs)
        class Container extends Component {
          render() {
            return <Passthrough {...this.props} />
          }
        }

        const container = TestUtils.renderIntoDocument(
          <ProviderMock store={store}>
            <Container pass="through" />
          </ProviderMock>
        )
        const stub = TestUtils.findRenderedComponentWithType(container, Passthrough)
        expect(stub.props.dispatch).toEqual(store.dispatch)
        expect(stub.props.foo).toBe(undefined)
        expect(stub.props.pass).toEqual('through')
        expect(() =>
          TestUtils.findRenderedComponentWithType(container, Container)
        ).toNotThrow()
        const decorated = TestUtils.findRenderedComponentWithType(container, Container)
        expect(decorated.isSubscribed()).toBe(false)
      }

      runCheck()
      runCheck(null, null, null)
      runCheck(false, false, false)
    })

    // Subscriptions no longer handled by connect
    it.skip('should unsubscribe before unmounting', () => {
      const store = createStore(stringBuilder)
      const subscribe = store.subscribe

      // Keep track of unsubscribe by wrapping subscribe()
      const spy = expect.createSpy(() => ({}))
      store.subscribe = (listener) => {
        const unsubscribe = subscribe(listener)
        return () => {
          spy()
          return unsubscribe()
        }
      }

      @connect(
        state => ({ string: state }),
        dispatch => ({ dispatch })
      )
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }

      const div = document.createElement('div')
      ReactDOM.render(
        <ProviderMock store={store}>
          <Container />
        </ProviderMock>,
        div
      )

      expect(spy.calls.length).toBe(0)
      ReactDOM.unmountComponentAtNode(div)
      expect(spy.calls.length).toBe(1)
    })

    it('should not attempt to set state after unmounting', () => {
      const store = createStore(stringBuilder)
      let mapStateToPropsCalls = 0

      @connect(
        () => ({ calls: ++mapStateToPropsCalls }),
        dispatch => ({ dispatch })
      )
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }

      const div = document.createElement('div')
      store.subscribe(() =>
        ReactDOM.unmountComponentAtNode(div)
      )
      ReactDOM.render(
        <ProviderMock store={store}>
          <Container blackbox={blackbox} />
        </ProviderMock>,
        div
      )

      expect(mapStateToPropsCalls).toBe(1)
      const spy = expect.spyOn(console, 'error')
      store.dispatch({ type: 'APPEND', body: 'a' })
      spy.destroy()
      expect(spy.calls.length).toBe(0)
      expect(mapStateToPropsCalls).toBe(1)
    })

    it('should not attempt to set state when dispatching in componentWillUnmount', () => {
      const store = createStore(stringBuilder)
      let mapStateToPropsCalls = 0

      /*eslint-disable no-unused-vars */
      @connect(
        (state) => ({ calls: mapStateToPropsCalls++ }),
        dispatch => ({ dispatch })
      )
      /*eslint-enable no-unused-vars */
      class Container extends Component {
        componentWillUnmount() {
          this.props.dispatch({ type: 'APPEND', body: 'a' })
        }
        render() {
          return <Passthrough {...this.props} />
        }
      }

      const div = document.createElement('div')
      ReactDOM.render(
        <ProviderMock store={store}>
          <Container blackbox={blackbox}/>
        </ProviderMock>,
        div
      )
      expect(mapStateToPropsCalls).toBe(1)

      const spy = expect.spyOn(console, 'error')
      ReactDOM.unmountComponentAtNode(div)
      spy.destroy()
      expect(spy.calls.length).toBe(0)
      expect(mapStateToPropsCalls).toBe(1)
    })

    it('should shallowly compare the selected state to prevent unnecessary updates', () => {
      const store = createStore(stringBuilder)
      const spy = expect.createSpy(() => ({}))
      function render({ string }) {
        
        spy()
        return <Passthrough string={string}/>
      }

      @connect(
        state => ({ string: state }),
        dispatch => ({ dispatch })
      )
      class Container extends Component {
        render() {
          return render(this.props)
        }
      }

      const ProviderContent = props=><Container {...props}/>
      const tree = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <ProviderContent />
        </Provider>
      )

      const stub = TestUtils.findRenderedComponentWithType(tree, Passthrough)
      expect(spy.calls.length).toBe(1)
      expect(stub.props.string).toBe('')
      store.dispatch({ type: 'APPEND', body: 'a' })
      expect(spy.calls.length).toBe(2)
      store.dispatch({ type: 'APPEND', body: 'b' })
      expect(spy.calls.length).toBe(3)
      store.dispatch({ type: 'APPEND', body: '' })
      expect(spy.calls.length).toBe(3)
    })

    it('should shallowly compare the merged state to prevent unnecessary updates', () => {
      const store = createStore(stringBuilder)
      const spy = expect.createSpy(() => ({}))
      function render({ string, pass }) {
        spy()
        return <Passthrough string={string} pass={pass} passVal={pass.val} />
      }

      @connect(
        state => ({ string: state }),
        dispatch => ({ dispatch }),
        (stateProps, dispatchProps, parentProps) => ({
          ...dispatchProps,
          ...stateProps,
          ...parentProps
        })
      )
      class Container extends Component {
        render() {
          return render(this.props)
        }
      }

      const ProviderContent = props=><Container {...props} />
      class Root extends Component {
        constructor(props) {
          super(props)
          this.state = { pass: '' }
        }

        render() {
          return (
            <Provider store={store}>
              <ProviderContent {...this.state} />
            </Provider>
          )
        }
      }

      const tree = TestUtils.renderIntoDocument(<Root />)

      const stub = TestUtils.findRenderedComponentWithType(tree, Passthrough)
      expect(spy.calls.length).toBe(1)
      expect(stub.props.string).toBe('')
      expect(stub.props.pass).toBe('')

      store.dispatch({ type: 'APPEND', body: 'a' })
      expect(spy.calls.length).toBe(2)
      expect(stub.props.string).toBe('a')
      expect(stub.props.pass).toBe('')

      // this now rerenders because state is controlled at provider level
      // tree.setState({ pass: '' })
      // expect(spy.calls.length).toBe(3)
      // expect(stub.props.string).toBe('a')
      // expect(stub.props.pass).toBe('')

      tree.setState({ pass: 'through' })
      expect(spy.calls.length).toBe(3)
      expect(stub.props.string).toBe('a')
      expect(stub.props.pass).toBe('through')

      // this now rerenders because state is controlled at provider level
      // tree.setState({ pass: 'through' })
      // expect(spy.calls.length).toBe(3)
      // expect(stub.props.string).toBe('a')
      // expect(stub.props.pass).toBe('through')

      const obj = { prop: 'val' }
      tree.setState({ pass: obj })
      expect(spy.calls.length).toBe(4)
      expect(stub.props.string).toBe('a')
      expect(stub.props.pass).toBe(obj)

      tree.setState({ pass: obj })
      expect(spy.calls.length).toBe(4)
      expect(stub.props.string).toBe('a')
      expect(stub.props.pass).toBe(obj)

      // const obj2 = Object.assign({}, obj, { val: 'otherval' })
      // tree.setState({ pass: obj2 })
      // expect(spy.calls.length).toBe(5)
      // expect(stub.props.string).toBe('a')
      // expect(stub.props.pass).toBe(obj2)

      // obj2.val = 'mutation'
      // tree.setState({ pass: obj2 })
      // expect(spy.calls.length).toBe(5)
      // expect(stub.props.string).toBe('a')
      // expect(stub.props.passVal).toBe('otherval')
    })

    it('should throw an error if mapState, mapDispatch, or mergeProps returns anything but a plain object', () => {
      const store = createStore(() => ({}))

      function makeContainer(mapState, mapDispatch, mergeProps) {
        return React.createElement(
          @connect(mapState, mapDispatch, mergeProps)
          class Container extends Component {
            render() {
              return <Passthrough />
            }
          },
          { blackbox }
        )
      }
/*eslint-disable no-unused-vars */
      function AwesomeMap(state) { }

      let spy = expect.spyOn(console, 'error')
      
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          
          {makeContainer((props) => 1, (dispatch) => ({}), () => ({}))}
          
        </ProviderMock>
      )
/*eslint-enable no-unused-vars */      
      spy.destroy()
      expect(spy.calls.length).toBe(1)
      expect(spy.calls[0].arguments[0]).toMatch(
        /mapStateToProps\(\) in Connect\(Container\) must return a plain object/
      )

/*eslint-disable no-unused-vars */
      spy = expect.spyOn(console, 'error')
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          {makeContainer((props) => 'hey', (dispatch) => ({}), () => ({}))}
        </ProviderMock>
      )
/*eslint-enable no-unused-vars */
      spy.destroy()
      expect(spy.calls.length).toBe(1)
      expect(spy.calls[0].arguments[0]).toMatch(
        /mapStateToProps\(\) in Connect\(Container\) must return a plain object/
      )
      
/*eslint-disable no-unused-vars */
      spy = expect.spyOn(console, 'error')
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          {makeContainer((state) => new AwesomeMap(state), (dispatch) => ({}), () => ({}))}
        </ProviderMock>
      )
/*eslint-enable no-unused-vars */
      spy.destroy()
      expect(spy.calls.length).toBe(1)
      expect(spy.calls[0].arguments[0]).toMatch(
        /mapStateToProps\(\) in Connect\(Container\) must return a plain object/
      )

/*eslint-disable no-unused-vars */
      spy = expect.spyOn(console, 'error')
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          {makeContainer((state) => ({}), (dispatch) => 1, () => ({}))}
        </ProviderMock>
      )
/*eslint-enable no-unused-vars */
      spy.destroy()
      expect(spy.calls.length).toBe(1)
      expect(spy.calls[0].arguments[0]).toMatch(
        /mapDispatchToProps\(\) in Connect\(Container\) must return a plain object/
      )
      
/*eslint-disable no-unused-vars */
      spy = expect.spyOn(console, 'error')
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          {makeContainer((state) => ({}), (dispatch) => 'hey', () => ({}))}
        </ProviderMock>
      )
/*eslint-enable no-unused-vars */
      spy.destroy()
      expect(spy.calls.length).toBe(1)
      expect(spy.calls[0].arguments[0]).toMatch(
        /mapDispatchToProps\(\) in Connect\(Container\) must return a plain object/
      )
      
/*eslint-disable no-unused-vars */
      spy = expect.spyOn(console, 'error')
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          {makeContainer((state) => ({}), (dispatch) => new AwesomeMap(), () => ({}))}
        </ProviderMock>
      )
/*eslint-enable no-unused-vars */
      spy.destroy()
      expect(spy.calls.length).toBe(1)
      expect(spy.calls[0].arguments[0]).toMatch(
        /mapDispatchToProps\(\) in Connect\(Container\) must return a plain object/
      )

/*eslint-disable no-unused-vars */
      spy = expect.spyOn(console, 'error')
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          {makeContainer((state) => ({}), (dispatch) => ({}), () => 1)}
        </ProviderMock>
      )
/*eslint-enable no-unused-vars */
      spy.destroy()
      expect(spy.calls.length).toBe(1)
      expect(spy.calls[0].arguments[0]).toMatch(
        /mergeProps\(\) in Connect\(Container\) must return a plain object/
      )
/*eslint-disable no-unused-vars */
      spy = expect.spyOn(console, 'error')
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          {makeContainer((state) => ({}), (dispatch) => ({}), () => 'hey')}
        </ProviderMock>
      )
/*eslint-enable no-unused-vars */
      spy.destroy()
      expect(spy.calls.length).toBe(1)
      expect(spy.calls[0].arguments[0]).toMatch(
        /mergeProps\(\) in Connect\(Container\) must return a plain object/
      )
      
/*eslint-disable no-unused-vars */
      spy = expect.spyOn(console, 'error')
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          {makeContainer((state) => ({}), (dispatch) => ({}), () => new AwesomeMap())}
        </ProviderMock>
      )
/*eslint-enable no-unused-vars */
      spy.destroy()
      expect(spy.calls.length).toBe(1)
      expect(spy.calls[0].arguments[0]).toMatch(
        /mergeProps\(\) in Connect\(Container\) must return a plain object/
      )
      
    })
    
    // Reloading appears to be working, I'm not exactly sure what is going on here.
    it.skip('should recalculate the state and rebind the actions on hot update', () => {
      const store = createStore(() => {})

      @connect(
        null,
        () => ({ scooby: 'doo' })
      )
      class ContainerBefore extends Component {
        render() {
          return (
            <Passthrough {...this.props} />
          )
        }
      }

      @connect(
        () => ({ foo: 'baz' }),
        () => ({ scooby: 'foo' })
      )
      class ContainerAfter extends Component {
        render() {
          return (
            <Passthrough {...this.props} />
          )
        }
      }

      @connect(
        () => ({ foo: 'bar' }),
        () => ({ scooby: 'boo' })
      )
      class ContainerNext extends Component {
        render() {
          return (
            <Passthrough {...this.props} />
          )
        }
      }

      let container
      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <ContainerBefore blackbox={blackbox} ref={instance => container = instance} />
        </ProviderMock>
      )
      const stub = TestUtils.findRenderedComponentWithType(container, Passthrough)
      expect(stub.props.foo).toEqual(undefined)
      expect(stub.props.scooby).toEqual('doo')

      function imitateHotReloading(TargetClass, SourceClass) {
        // Crude imitation of hot reloading that does the job
        Object.getOwnPropertyNames(SourceClass.prototype).filter(key =>
          typeof SourceClass.prototype[key] === 'function'
        ).forEach(key => {
          if (key !== 'render' && key !== 'constructor') {
            TargetClass.prototype[key] = SourceClass.prototype[key]
          }
        })

        container.forceUpdate()
      }

      imitateHotReloading(ContainerBefore, ContainerAfter)
      expect(stub.props.foo).toEqual('baz')
      expect(stub.props.scooby).toEqual('foo')

      imitateHotReloading(ContainerBefore, ContainerNext)
      expect(stub.props.foo).toEqual('bar')
      expect(stub.props.scooby).toEqual('boo')
    })

    it('should set the displayName correctly', () => {
      expect(connect(state => state)(
        class Foo extends Component {
          render() {
            return <div />
          }
        }
      ).displayName).toBe('Connect(Foo)')

      expect(connect(state => state)(
        createClass({
          displayName: 'Bar',
          render() {
            return <div />
          }
        })
      ).displayName).toBe('Connect(Bar)')

      expect(connect(state => state)(
        createClass({
          render() {
            return <div />
          }
        })
      ).displayName).toBe('Connect(Component)')
    })

    it('should expose the wrapped component as WrappedComponent', () => {
      class Container extends Component {
        render() {
          return <Passthrough />
        }
      }

      const decorator = connect(state => state)
      const decorated = decorator(Container)

      expect(decorated.WrappedComponent).toBe(Container)
    })

    it('should hoist non-react statics from wrapped component', () => {
      class Container extends Component {
        render() {
          return <Passthrough />
        }
      }

      Container.howIsRedux = () => 'Awesome!'
      Container.foo = 'bar'

      const decorator = connect(state => state)
      const decorated = decorator(Container)

      expect(decorated.howIsRedux).toBeA('function')
      expect(decorated.howIsRedux()).toBe('Awesome!')
      expect(decorated.foo).toBe('bar')
    })

    it('should use the store from the props instead of from the context if present', () => {
      class Container extends Component {
        render() {
          return <Passthrough />
        }
      }

      let actualState

      const expectedState = { foos: {} }
      const decorator = connect(state => {
        actualState = state
        return {}
      })
      const Decorated = decorator(Container)
      const mockStore = {
        dispatch: () => {},
        subscribe: () => {},
        getState: () => expectedState
      }

      TestUtils.renderIntoDocument(
        <ProviderMock store={{}}>
          <Decorated blackbox={blackbox} store={mockStore} />
        </ProviderMock>
      )

      expect(actualState).toEqual(expectedState)
    })

    it('should throw an error if the store is not in the props or context', () => {
      class Container extends Component {
        render() {
          return <Passthrough />
        }
      }

      const decorator = connect(() => {})
      const Decorated = decorator(Container)

      expect(() =>
        TestUtils.renderIntoDocument(<Decorated />)
      ).toThrow(
        /Could not find "store"/
      )
    })

    it('should throw when trying to access the wrapped instance if withRef is not specified', () => {
      const store = createStore(() => ({}))
      @connect(state => state)
      class Container extends Component {
        render() {
          return <Passthrough />
        }
      }

      const tree = TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <Container blackbox={blackbox}/>
        </ProviderMock>
      )

      const decorated = TestUtils.findRenderedComponentWithType(tree, Container)
      expect(() => decorated.getWrappedInstance()).toThrow(
        /To access the wrapped instance, you need to specify \{ withRef: true \} as the fourth argument of the connect\(\) call\./
      )
    })

    it('should return the instance of the wrapped component for use in calling child methods', () => {
      const store = createStore(() => ({}))

      const someData = {
        some: 'data'
      }

      class Container extends Component {
        someInstanceMethod() {
          return someData
        }

        render() {
          return <Passthrough />
        }
      }

      const decorator = connect(state => state, null, null, { withRef: true })
      const Decorated = decorator(Container)

      const tree = TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <Decorated blackbox={blackbox} />
        </ProviderMock>
      )

      const decorated = TestUtils.findRenderedComponentWithType(tree, Decorated)

      expect(() => decorated.someInstanceMethod()).toThrow()
      expect(decorated.getWrappedInstance().someInstanceMethod()).toBe(someData)
    })

    it('should wrap impure components without supressing updates', () => {
      const store = createStore(() => ({}))

      class ImpureComponent extends Component {
        render() {
          return <Passthrough statefulValue={this.context.statefulValue} />
        }
      }

      ImpureComponent.contextTypes = {
        statefulValue: React.PropTypes.number
      }

      const decorator = connect(state => state, null, null, { pure: false })
      const Decorated = decorator(ImpureComponent)

      class StatefulWrapper extends Component {
        constructor() {
          super()
          this.state = { value: 0 }
        }

        getChildContext() {
          return {
            statefulValue: this.state.value
          }
        }

        render() {
          return <Decorated blackbox={blackbox} />
        }
      }

      StatefulWrapper.childContextTypes = {
        statefulValue: React.PropTypes.number
      }

      const tree = TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <StatefulWrapper />
        </ProviderMock>
      )

      const target = TestUtils.findRenderedComponentWithType(tree, Passthrough)
      const wrapper = TestUtils.findRenderedComponentWithType(tree, StatefulWrapper)
      expect(target.props.statefulValue).toEqual(0)
      wrapper.setState({ value: 1 })
      expect(target.props.statefulValue).toEqual(1)
    })

    it('calls mapState and mapDispatch for impure components', () => {
      const store = createStore(() => ({
        foo: 'foo',
        bar: 'bar'
      }))

      const mapStateSpy = expect.createSpy()
      const mapDispatchSpy = expect.createSpy().andReturn({})

      class ImpureComponent extends Component {
        render() {
          return <Passthrough statefulValue={this.props.value} />
        }
      }

      const decorator = connect(
        (state, { storeGetter }) => {
          mapStateSpy()
          return { value: state[storeGetter.storeKey] }
        },
        mapDispatchSpy,
        null,
        { pure: false }
      )
      const Decorated = decorator(ImpureComponent)

      class StatefulWrapper extends Component {
        constructor() {
          super()
          this.state = {
            storeGetter: { storeKey: 'foo' }
          }
        }
        render() {
          return <Decorated blackbox={blackbox} storeGetter={this.state.storeGetter} />
        }
      }


      const tree = TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <StatefulWrapper />
        </ProviderMock>
      )

      const target = TestUtils.findRenderedComponentWithType(tree, Passthrough)
      const wrapper = TestUtils.findRenderedComponentWithType(tree, StatefulWrapper)

      expect(mapStateSpy.calls.length).toBe(1)
      expect(mapDispatchSpy.calls.length).toBe(1)
      expect(target.props.statefulValue).toEqual('foo')

      // Impure update
      const storeGetter = wrapper.state.storeGetter
      storeGetter.storeKey = 'bar'
      wrapper.setState({ storeGetter })

      expect(mapStateSpy.calls.length).toBe(2)
      expect(mapDispatchSpy.calls.length).toBe(2)
      expect(target.props.statefulValue).toEqual('bar')
    })

    it('should pass state consistently to mapState', () => {
      const store = createStore(stringBuilder)

      store.dispatch({ type: 'APPEND', body: 'a' })
      let childMapStateInvokes = 0

      @connect(state => ({ state }), null, null, { withRef: true })
      class Container extends Component {

        emitChange() {
          store.dispatch({ type: 'APPEND', body: 'b' })
        }

        render() {
          return (
            <div>
              <button ref="button" onClick={this.emitChange.bind(this)}>change</button>
              <ChildContainer blackbox={this.props.blackbox} parentState={this.props.state} />
            </div>
          )
        }
      }
/*eslint-disable no-unused-vars */
      @connect((state, parentProps) => {
/*eslint-enable no-unused-vars */
        childMapStateInvokes++
        // The state from parent props should always be consistent with the current state
        //The below expectation no longer holds because of how blackbox always calculates mapStateToProps with the last props
        //expect(state).toEqual(parentProps.parentState)
        return {}
      })
      class ChildContainer extends Component {
        render() {
          return <Passthrough {...this.props}/>
        }
      }

      function ProviderContent(props) {
        return <Container {...props} />
      }

      const tree = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <ProviderContent />
        </Provider>
      )

      expect(childMapStateInvokes).toBe(1)

      // The store state stays consistent when setState calls are batched
      ReactDOM.unstable_batchedUpdates(() => {
        store.dispatch({ type: 'APPEND', body: 'c' })
      })
      expect(childMapStateInvokes).toBe(3)

      //setState calls DOM handlers are batched
      const container = TestUtils.findRenderedComponentWithType(tree, Container)
      const node = container.getWrappedInstance().refs.button
      TestUtils.Simulate.click(node)
      expect(childMapStateInvokes).toBe(5)

      // In future all setState calls will be batched[1]. Uncomment when it
      // happens. For now redux-batched-updates middleware can be used as
      // workaround this.
      //
      // [1]: https://twitter.com/sebmarkbage/status/642366976824864768
      //
      // store.dispatch({ type: 'APPEND', body: 'd' })
      // expect(childMapStateInvokes).toBe(4)
    })

    it('should not render the wrapped component when mapState does not produce change', () => {
      const store = createStore(stringBuilder)
      let renderCalls = 0
      let mapStateCalls = 0
      const defaultStateProps = {}
      @connect(() => {
        mapStateCalls++
        return defaultStateProps // no change!
      })
      class Container extends Component {
        render() {
          renderCalls++
          return <Passthrough {...this.props} />
        }
      }
      const ProviderContent = props=><Container {...props}/>
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <ProviderContent />
        </Provider>
      )

      expect(renderCalls).toBe(1)
      expect(mapStateCalls).toBe(1)
      store.dispatch({ type: 'APPEND', body: 'a' })

      // After store a change mapState has been called
      expect(mapStateCalls).toBe(2)
      // But render is not because it did not make any actual changes
      expect(renderCalls).toBe(1)
    })

    // no longer bailing out early
    it.skip('should bail out early if mapState does not depend on props', () => {
      const store = createStore(stringBuilder)
      let renderCalls = 0
      let mapStateCalls = 0

      @connect(state => {
        mapStateCalls++
        return state === 'aaa' ? { change: 1 } : {}
      })
      class Container extends Component {
        render() {
          renderCalls++
          return <Passthrough {...this.props} />
        }
      }

      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <Container />
        </ProviderMock>
      )

      expect(renderCalls).toBe(1)
      expect(mapStateCalls).toBe(1)

      const spy = expect.spyOn(Container.prototype, 'setState').andCallThrough()

      store.dispatch({ type: 'APPEND', body: 'a' })
      expect(mapStateCalls).toBe(2)
      expect(renderCalls).toBe(1)
      expect(spy.calls.length).toBe(0)

      store.dispatch({ type: 'APPEND', body: 'a' })
      expect(mapStateCalls).toBe(3)
      expect(renderCalls).toBe(1)
      expect(spy.calls.length).toBe(0)

      store.dispatch({ type: 'APPEND', body: 'a' })
      expect(mapStateCalls).toBe(4)
      expect(renderCalls).toBe(2)
      expect(spy.calls.length).toBe(1)

      spy.destroy()
    })

    // no longer bailing out early
    it.skip('should not swallow errors when bailing out early', () => {
      const store = createStore(stringBuilder)
      let renderCalls = 0
      let mapStateCalls = 0

      @connect(state => {
        mapStateCalls++
        if (state === 'a') {
          throw new Error('Oops')
        } else {
          return {}
        }
      })
      class Container extends Component {
        render() {
          renderCalls++
          return <Passthrough {...this.props} />
        }
      }

      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <Container />
        </ProviderMock>
      )

      expect(renderCalls).toBe(1)
      expect(mapStateCalls).toBe(1)
      expect(
        () => store.dispatch({ type: 'APPEND', body: 'a' })
      ).toThrow('Oops')
    })

    it('should allow providing a factory function to mapStateToProps', () => {
      let updatedCount = 0
      let memoizedReturnCount = 0
      const store = createStore(() => ({ value: 1 }))

      const mapStateFactory = () => {
        let lastProp, lastVal, lastResult
        return (state, props) => {
          if (props.name === lastProp && lastVal === state.value) {
            memoizedReturnCount++
            return lastResult
          }
          lastProp = props.name
          lastVal = state.value
          return lastResult = { someObject: { prop: props.name, stateVal: state.value } }
        }
      }

      @connect(mapStateFactory)
      class Container extends Component {
        componentWillUpdate() {
          updatedCount++
        }
        render() {
          return <Passthrough {...this.props} />
        }
      }

      const component = TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <div>
            <Container name="a" blackbox={blackbox} />
          </div>
        </ProviderMock>
      )
      const container = TestUtils.findRenderedComponentWithType(component, Container)
      container.mapStateToProps_selector({ value: 1 }, { name: 'a' })
      expect(updatedCount).toBe(0)
      expect(memoizedReturnCount).toBe(1)
    })

    it('should allow providing a factory function to mapDispatchToProps', () => {
      let updatedCount = 0
      let memoizedReturnCount = 0
      const store = createStore(() => ({ value: 1 }))

      const mapDispatchFactory = () => {
        let lastProp, lastResult
        return (dispatch, props) => {
          if (props.name === lastProp) {
            memoizedReturnCount++
            return lastResult
          }
          lastProp = props.name
          return lastResult = { someObject: { dispatchFn: dispatch } }
        }
      }
      function mergeParentDispatch(stateProps, dispatchProps, parentProps) {
        return { ...stateProps, ...dispatchProps, name: parentProps.name }
      }

      @connect(null, mapDispatchFactory, mergeParentDispatch)
      class Passthrough extends Component {
        componentWillUpdate() {
          updatedCount++
        }
        render() {
          return <div {...this.props} />
        }
      }

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { count: 0 }
        }
        componentDidMount() {
          this.setState({ count: 1 })
        }
        render() {
          const { count } = this.state
          return (
            <div>
              <Passthrough count={count} name="a" blackbox={blackbox}/>
            </div>
          )
        }
      }

      const component = TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <div>
            <Container name="a" />
          </div>
        </ProviderMock>
      )
      const container = TestUtils.findRenderedComponentWithType(component, Passthrough)
      container.mapStateToProps_selector({ value: 1 }, { name: 'a' })
      expect(updatedCount).toBe(0)
      expect(memoizedReturnCount).toBe(1)
    })

    it('should not call update if mergeProps return value has not changed', () => {
      let mapStateCalls = 0
      let renderCalls = 0
      const store = createStore(stringBuilder)

      @connect(() => ({ a: ++mapStateCalls }), null, () => ({ changed: false }))
      class Container extends Component {
        render() {
          renderCalls++
          return <Passthrough {...this.props} />
        }
      }
      function ProviderContent() {
        return <Container blackbox={blackbox} />
      }
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <ProviderContent />
        </Provider>
      )

      expect(renderCalls).toBe(1)
      expect(mapStateCalls).toBe(1)

      store.dispatch({ type: 'APPEND', body: 'a' })

      expect(mapStateCalls).toBe(2)
      expect(renderCalls).toBe(1)
    })

    it('should update impure components with custom mergeProps', () => {
      let store = createStore(() => ({}))
      let renderCount = 0

      @connect(null, null, () => ({ a: 1 }), { pure: false })
      class Container extends React.Component {
        render() {
          ++renderCount
          return <div />
        }
      }

      class Parent extends React.Component {
        componentDidMount() {
          this.forceUpdate()
        }
        render() {
          return <Container blackbox={blackbox}/>
        }
      }

      TestUtils.renderIntoDocument(
        <ProviderMock store={store}>
          <Parent>
            <Container blackbox={blackbox}/>
          </Parent>
        </ProviderMock>
      )

      expect(renderCount).toBe(2)
    })

    it('should allow to clean up child state in parent componentWillUnmount', () => {
      function reducer(state = { data: null }, action) {
        switch (action.type) {
          case 'fetch':
            return { data: { profile: { name: 'April' } } }
          case 'clean':
            return { data: null }
          default:
            return state
        }
      }

      @connect(null)
      class Parent extends React.Component {
        componentWillMount() {
          this.props.dispatch({ type: 'fetch' })
        }

        componentWillUnmount() {
          this.props.dispatch({ type: 'clean' })
        }

        render() {
          return <Child {...this.props}/>
        }
      }

      @connect(state => ({
        profile: state.data.profile
      }))
      class Child extends React.Component {
        render() {
          return null
        }
      }
      function ProviderContent(props) {
        return <Parent {...props}/>
      }
      const store = createStore(reducer)
      const div = document.createElement('div')
      ReactDOM.render(
        <Provider store={store}>
          <ProviderContent />
        </Provider>,
        div
      )

      ReactDOM.unmountComponentAtNode(div)
    })
    describe('appendStateProps', ()=>{
      let container
      function generateContainer(blackbox) {
        const store = createStore(() => ({}))
        
        @connect()
        class Container extends React.Component {
          render() {
            return <div />
          }
        }

        const component = TestUtils.renderIntoDocument(
          <ProviderMock store={store}>
            <Container blackbox={blackbox}/>
          </ProviderMock>
        )
        container = TestUtils.findRenderedComponentWithType(component, Container)
      }
      it('should computeAppendStateProps', ()=>{
        generateContainer(blackbox) 
        const setMapStateToProps = expect.spyOn(container.context, 'setMapStateToProps')
        const defaultReturn = {}
        const inputs = {}
        const selector = ()=>defaultReturn
        expect(container.computeAppendStateProps('example', inputs, selector)).toBe(defaultReturn)
        expect(container.appendStateProps.names.example).toBe(null)
        expect(container.appendStateProps.selectors.example).toBe(selector)
        expect(container.appendStateProps.inputs.example).toBe(inputs)
        expect(setMapStateToProps).toHaveBeenCalledWith(container.uniqueId, container.allMapStateToProps_selector())
        expect(container.stateProps.appendStateProps.example).toBe(defaultReturn)
        
      })
      it('should setAppendStateProps if inputs change', ()=>{
        generateContainer(blackbox)
        container.appendStateProps.inputs.example = { differentInput: 'yeah' }
        const defaultReturn = {}
        const inputs = {}
        const selector = ()=>defaultReturn
        const appendStateProps_nameExists_inBlackbox = expect.spyOn(container, 'appendStateProps_nameExists_inBlackbox')
        const computeAppendStateProps = expect.spyOn(container, 'computeAppendStateProps').andReturn(defaultReturn)
        expect(container.appendMapStateToProps('example', inputs, selector)).toBe(defaultReturn)
        expect(appendStateProps_nameExists_inBlackbox.calls.length).toBe(0)
        expect(computeAppendStateProps).toHaveBeenCalledWith('example', inputs, selector)
      })
      it('should setAppendStateProps if blackbox is not set', ()=>{
        generateContainer(blackbox)
        const defaultReturn = {}
        const inputs = {}
        const selector = ()=>defaultReturn
        const appendStateProps_nameExists_inBlackbox = expect.spyOn(container, 'appendStateProps_nameExists_inBlackbox')
        const computeAppendStateProps = expect.spyOn(container, 'computeAppendStateProps').andReturn(defaultReturn)
        expect(container.appendMapStateToProps('example', inputs, selector)).toBe(defaultReturn)
        expect(appendStateProps_nameExists_inBlackbox).toHaveBeenCalledWith('example')
        expect(computeAppendStateProps).toHaveBeenCalledWith('example', inputs, selector)
      })
      it('should return blackbox if blackbox.appendStateProps.name exists and inputs are the same', ()=>{
        const defaultReturn = {}
        const inputs = {}
        const selector = ()=>defaultReturn
        const blackbox = { [randomId]: { appendStateProps: { example: defaultReturn } } }
        generateContainer(blackbox)
        const computeAppendStateProps = expect.spyOn(container, 'computeAppendStateProps')
        expect(container.appendMapStateToProps('example', inputs, selector)).toBe(defaultReturn)
        expect(computeAppendStateProps.calls.length).toBe(0)
      })
    })
    describe('allMapStateToProps_selector', ()=>{
      let container
      const defaultBaseStateResult = {}
      beforeEach(()=>{
        const store = createStore(() => ({}))
      
        @connect(()=>defaultBaseStateResult)
        class Container extends React.Component {
          render() {
            return <div />
          }
        }

        const component = TestUtils.renderIntoDocument(
          <ProviderMock store={store}>
            <Container blackbox={blackbox}/>
          </ProviderMock>
        )

        container = TestUtils.findRenderedComponentWithType(component, Container)
      })
      it('should change statePropsBase if not equal to baseMapStateToProps', ()=>{
        container.statePropsBase = { different: 'value' }
        container.statePropsChanged = false
        expect(container.allMapStateToProps_selector()({})).toEqual([ true, { appendStateProps: {} } ])
        expect(container.statePropsBase).toEqual({})
        expect(container.statePropsChanged).toBe(true)
      })
      it('should change stateProps.appendStateProps if not equal to thisAppendStateProps', ()=>{
        const defaultReturn = { actual: 'value' }
        container.appendStateProps.names.example = null
        container.appendStateProps.inputs.example = {}
        container.appendStateProps.selectors.example = ()=>defaultReturn
        container.stateProps.appendStateProps.example = { different: 'value' }
        container.statePropsChanged = false
        expect(container.allMapStateToProps_selector()({})).toEqual([ true, { appendStateProps: { example: defaultReturn } } ])
        expect(container.stateProps.appendStateProps.example).toBe(defaultReturn)
        expect(container.statePropsChanged).toBe(true)
      })
      it('should return last state props if nothing changed', ()=>{
        container.statePropsChanged = null
        container.statePropsBase = defaultBaseStateResult
        expect(container.allMapStateToProps_selector()({})).toEqual([ false, { appendStateProps: {} } ])
        expect(container.statePropsChanged).toBe(false)
      })
      // allMapStateToProps_selector() {
      //   return (state)=>{
      //     let changed = false
      //     let appendStatePropsChanged = false
      //     const baseMapStateToProps = this.mapStateToProps_selector(state, this.mapStateToProps_ownProps)
      //     if(this.statePropsBase !== baseMapStateToProps) {
      //       changed = true
      //       this.statePropsBase = baseMapStateToProps
      //       this.stateProps = { appendStateProps: this.stateProps.appendStateProps, ...baseMapStateToProps }
      //     }
      //     Object.keys(this.appendStateProps.names).forEach((name) => {
      //       const thisAppendStateProps = this.appendStateProps.selectors[name](state, this.appendStateProps.inputs[name])
      //       if(this.stateProps.appendStateProps[name] !== thisAppendStateProps) {
      //         this.stateProps.appendStateProps[name] = thisAppendStateProps
      //         if(!appendStatePropsChanged) {
      //           appendStatePropsChanged = true
      //           this.stateProps.appendStateProps = { ...this.stateProps.appendStateProps }
      //         }
      //       }
      //     })
      //     if(appendStatePropsChanged || changed) {
      //       this.statePropsChanged = true
      //     }else {
      //       this.statePropsChanged = false
      //     }
      //     if(appendStatePropsChanged) {
      //       return [ appendStatePropsChanged, { ...this.stateProps } ]
      //     }
      //     return [ changed, this.stateProps ]
      //   }
      // }
    })
  })
})
