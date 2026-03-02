/** @import { Expect } from 'expect' */
globalThis[Symbol.for('custom-unit-test-setup')] = async function setupUnitTestsForSystems () {
  const { expect } = await import('./simple-expect.js')
  const { window, resetDom } = await import('./init-dom.js')
  const { setup: setupFetchMock, teardown: teardownFetchMock } = await import('./fetch-mock.js')
  const { gc } = await import('./gc.js')

    /**
     * @param {string} message - message to show on the report on skip
     */
  function SkipException (message) {
    if (!(this instanceof SkipException)) { return new SkipException(message) }
    this.message = message
  }

  async function runTests () {
    const testAmount = unitTests.length
    let failedTestAmount = 0
    let skippedTestAmount = 0

    console.log(`[unit-test] ${testAmount} tests to run`)
    let result = '[unit-test] results: \n'

    for (const { description, test } of unitTests) {
      try {
        await test()
        result += `  [PASS] ${description}\n`
      } catch (e) {
        if (e instanceof SkipException) {
          skippedTestAmount++
          result += `  [SKIP] ${description} : ${e.message}\n`
        } else {
          console.log(e)
          failedTestAmount++
          result += `**[FAIL] ${description}\n`
        }
      }
    }

    console.log(result)
    const skippedTestReport = skippedTestAmount <= 0 ? '' : `, ${skippedTestAmount} tests skipped`

    if (failedTestAmount <= 0) {
      console.log(`[unit-test] All tests passed${skippedTestReport}`)
    } else {
      console.log(`[unit-test] ${failedTestAmount} tests failed${skippedTestReport}`)
    }

    process.exitCode = failedTestAmount > 0 ? 1 : 0
  }

  function scheduleUnitTestRun () {
    if (!scheduleUnitTestRun.alreadyScheduled) {
      setTimeout(runTests, 0)
      scheduleUnitTestRun.alreadyScheduled = true
    }
  }

  const notTestsFoundTimeout = setTimeout(() => {
    console.error('No tests found, aborting')
    process.exit(1)
  }, 250)

  const unitTests = []
  const test = (description, test) => {
    unitTests.push({
      description,
      test: async () => {
        try {
          await test({
            step: async (_, callback) => await callback(),
            expect,
            gc,
            get dom () {
              resetDom()
              return window
            },
            get fetch () {
              return setupFetchMock()
            }
          })
        } finally {
          teardownFetchMock()
        }

      }
    })
    clearTimeout(notTestsFoundTimeout)
    scheduleUnitTestRun()
  }

  return { test, expect }
}
