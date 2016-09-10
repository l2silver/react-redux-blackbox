import setSome from '../../src/utils/setSome'
import expect from 'expect'

describe('Utils', () => {
  describe('setSome', () => {
    it('should return false', () => {
      expect(setSome(new Set([ 1,2,3 ]), val=>val===4)).toBe(false)
    })
    it('should return true', () => {
      let interator = 0
      function fn(val) {
        ++interator
        return val===2
      }
      expect(setSome(new Set([ 1,2,3 ]), fn)).toBe(true)
      expect(interator).toBe(2)
    })
  })
})
