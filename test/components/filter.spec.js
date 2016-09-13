import expect from 'expect'
import React, { PropTypes, Component } from 'react'
import { filter } from '../../src/index'

describe('React', () => {
  describe('filter', () => {
    function getBlackboxFacsimiles() {
      return
    }
    class Passthrough extends Component {
      render() {
        return <div {...this.props} />
      }
    }

    class ProviderMock extends Component {
      getChildContext() {
        return { 
          addConnectIds() {},
          removeConnectIds() {},
          getBlackboxFacsimiles() {}
        }
      }

      render() {
        return this.props.children
      }
    }

    ProviderMock.childContextTypes = {
      addConnectIds: PropTypes.func,
      removeConnectIds: PropTypes.func,
      getBlackboxFacsimiles: PropTypes.func

    }
    const blackbox = {}
    const anotherProp = 'example'
    
    describe('constructor', () => {
      @filter
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      it('should generate default properties', () => {
        const container = new Container({ blackbox, anotherProp }, { getBlackboxFacsimiles })
        expect(container.blackbox).toBe(blackbox)
        expect(container.otherProps).toEqual({ anotherProp })
        expect(container.connectIds).toEqual(new Set())
      })
    })
    describe('addConnectIds', () => {
      @filter
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      it('should add ids', () => {
        const container = new Container({ blackbox }, { getBlackboxFacsimiles })
        expect(container.connectIds).toEqual(new Set())
        container.addConnectIds([ 1 ])
        expect(container.connectIds).toEqual(new Set([ 1 ]))
      })
      it('should add ids and call context addConnectIds', () => {
        const addConnectIds = expect.createSpy(() => ({}))
        const container = new Container({ blackbox }, { addConnectIds, getBlackboxFacsimiles })
        expect(container.connectIds).toEqual(new Set())
        container.addConnectIds([ 1 ])
        expect(container.connectIds).toEqual(new Set([ 1 ]))
        expect(addConnectIds).toHaveBeenCalledWith(new Set([ 1 ]))
      })
    })
    describe('removeConnectIds', () => {
      @filter
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      it('should remove ids', () => {
        const container = new Container({ blackbox }, { getBlackboxFacsimiles })
        container.connectIds = new Set([ 1 ])
        expect(container.connectIds).toEqual(new Set([ 1 ]))
        container.removeConnectIds([ 1 ])
        expect(container.connectIds).toEqual(new Set())
      })
      it('should remove ids and call context removeConnectIds', () => {
        const removeConnectIds = expect.createSpy(() => ({}))
        const container = new Container({ blackbox }, { removeConnectIds, getBlackboxFacsimiles })
        container.connectIds = new Set([ 1 ])
        expect(container.connectIds).toEqual(new Set([ 1 ]))
        container.removeConnectIds([ 1 ])
        expect(container.connectIds).toEqual(new Set([ ]))
        expect(removeConnectIds).toHaveBeenCalledWith([ 1 ])
      })
    })
    describe('otherProps_changed', () => {
      @filter
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      it('should not have changed', () => {
        const container = new Container({ blackbox }, { getBlackboxFacsimiles })
        expect(container.otherProps_changed({})).toBe(false)
      })
      it('should have changed', () => {
        const container = new Container({ blackbox }, { getBlackboxFacsimiles })
        const nextOtherProps = { newValue: 1 }
        expect(container.otherProps).toEqual({})
        expect(container.otherProps_changed(nextOtherProps)).toBe(true)
        expect(container.otherProps).toEqual(nextOtherProps)
      })
    })
    describe('filteredBlackbox_changed', () => {
      let blackboxFacsimiles = {}
      function getBlackboxFacsimiles(id) {
        return !!blackboxFacsimiles[id]
      }
      @filter
      class Container extends Component {
        render() {
          return <Passthrough {...this.props} />
        }
      }
      it('should not have changed', () => {
        blackboxFacsimiles = { [1]: true }
        const container = new Container({ blackbox }, { getBlackboxFacsimiles })
        container.connectIds = new Set([ 1 ])
        expect(container.blackbox).toBe(blackbox)
        expect(container.filteredBlackbox_changed({})).toBe(false)
        expect(container.blackbox).toBe(blackbox)
      })
      it('should have changed', () => {
        blackboxFacsimiles = {}
        const container = new Container({ blackbox }, { getBlackboxFacsimiles })
        const nextBlackbox = { [1]: { newProp: 'example' } }
        container.connectIds = new Set([ '1' ])
        expect(container.blackbox).toBe(blackbox)
        expect(container.filteredBlackbox_changed(nextBlackbox)).toBe(true)
        expect(container.blackbox).toEqual(nextBlackbox)
      })
    })
  })
})
