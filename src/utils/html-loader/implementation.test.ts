import { window } from '../../../test-utils/unit/init-dom.ts'
import { test } from '../../../test-utils/unit/test.ts'
const html = String.raw

test('an HTML page without links, do nothing', async ({ expect }) => {
  const { document } = window

  document.documentElement.innerHTML = html`
    <head>

    </head>
    <body>
      lorem ipsum
    <body>
  `

  await expect(document.querySelectorAll('link').length).toEqual(0)
})
