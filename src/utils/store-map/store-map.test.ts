import { test } from '../../../test-utils/unit/test.ts'
import { document } from '../../../test-utils/unit/init-dom.ts'
import { getStoresInfoFromElement, noStoresFound, setStoreFromElement } from './store-map.ts'

const html = String.raw

test('Given a simple document without any store set on any element, getStoresInfoFromElement must return a noMoreStoresFound result', ({ expect }) => {
  // prepare
  document.body.innerHTML = html`
      <div class="level-1" lang="pt">
          <div class="level-2">
              <div class="level-3" lang="en-US">
                  <div class="level-4"></div>
              </div>
          </div>
      </div>
  `

  const level1Div = document.querySelector('.level-1')!
  const level4Div = document.querySelector('.level-4')!

  // act
  const result1 = Array.from(getStoresInfoFromElement(level1Div))
  const result2 = Array.from(getStoresInfoFromElement(level4Div))

  //assert
  expect({ result1, result2 }).toEqual({
    result1: [noStoresFound],
    result2: [noStoresFound],
  })
})
