// @ts-check
/**
 *   A strictier sanitizer that allows only text related tags and attributes as to allow any sort of content formatting,
 * makes no sense to use pictures or forms as html content in i18n, you translate mostly text, so you use data-i18n on the
 * form elements instead of using html as translation value.
 */

/**
 * A set of allowed tags for the sanitizer decide whether to remove an element or not
 * Any element where its tag name is absent on the set is to be removed
 */
export const ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'acronym',
  'address',
  'area',
  'article',
  'aside',
  'b',
  'bdi',
  'bdo',
  'big',
  'blockquote',
  'br',
  'caption',
  'center',
  'cite',
  'code',
  'col',
  'colgroup',
  'content',
  'data',
  'datalist',
  'dd',
  'decorator',
  'del',
  'details',
  'dfn',
  'dir',
  'div',
  'dl',
  'dt',
  'element',
  'em',
  'fieldset',
  'figcaption',
  'figure',
  'font',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'i',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'main',
  'map',
  'mark',
  'marquee',
  'meter',
  'nav',
  'nobr',
  'ol',
  'p',
  'pre',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'section',
  'small',
  'source',
  'spacer',
  'span',
  'strike',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'time',
  'tr',
  'track',
  'tt',
  'u',
  'ul',
  'var',
  'wbr',
])

/**
 *   A set of allowed attribute for the sanitizer decide whether to remove an attribute from an element or not.
 *   Any attribute where its name is absent on the set is to be removed except data-* attribute not related to i18n,
 *  and aria-* attributes
 */
export const ALLOWED_STANDARD_ATTRS = new Set([
  'accept',
  'action',
  'align',
  'alt',
  'autocapitalize',
  'autocomplete',
  'autopictureinpicture',
  'autoplay',
  'background',
  'bgcolor',
  'border',
  'capture',
  'cellpadding',
  'cellspacing',
  'checked',
  'cite',
  'class',
  'clear',
  'color',
  'cols',
  'colspan',
  'controls',
  'controlslist',
  'coords',
  'crossorigin',
  'datetime',
  'decoding',
  'default',
  'dir',
  'disabled',
  'disablepictureinpicture',
  'disableremoteplayback',
  'download',
  'draggable',
  'enctype',
  'enterkeyhint',
  'face',
  'for',
  'headers',
  'height',
  'hidden',
  'high',
  'href',
  'hreflang',
  'id',
  'inputmode',
  'integrity',
  'ismap',
  'kind',
  'label',
  'lang',
  'list',
  'loading',
  'loop',
  'low',
  'max',
  'maxlength',
  'media',
  'method',
  'min',
  'minlength',
  'multiple',
  'muted',
  'name',
  'nonce',
  'noshade',
  'novalidate',
  'nowrap',
  'open',
  'optimum',
  'pattern',
  'placeholder',
  'playsinline',
  'poster',
  'preload',
  'pubdate',
  'radiogroup',
  'readonly',
  'rel',
  'required',
  'rev',
  'reversed',
  'role',
  'rows',
  'rowspan',
  'spellcheck',
  'scope',
  'selected',
  'shape',
  'size',
  'sizes',
  'span',
  'srclang',
  'start',
  'src',
  'srcset',
  'step',
  'style',
  'summary',
  'slot',
  'tabindex',
  'title',
  'translate',
  'type',
  'usemap',
  'valign',
  'value',
  'width',
  'xmlns',
])

/**
 * @typedef RemovedAttr
 * @property {string}     name - removed attribte name
 * @property {Element}    from - target Element where the attribute was removed
 */

/**
 * @typedef SanitizeHtmlResult
 *
 * The result of `sanitizeI18nHtml`, show the sanitized html as well as the actions performed during sanitization
 * @property {string}        html               - sanitized html result
 * @property {Element[]}     removedElements    - list of removed elements
 * @property {RemovedAttr[]} removedAttributes  - list of removed attributes
 */

/**
 * Initializes a Document and shows its body
 * @param   {string}      html - HTML input string to sanitize
 * @returns {HTMLElement}        Sanitized Html string
 */
const _initDocument = (html) => {
  const doc = new DOMParser().parseFromString('<remove></remove>' + html, 'text/html')
  doc.body.firstChild?.remove()
  return doc.body
}

/**
 * @param {object}        param                   - funciton parameters
 * @param {Element}       param.currentElement    - current element being sanitized
 * @param {Element[]}     param.removedElements   - list of removed elements, mutable
 * @param {RemovedAttr[]} param.removedAttributes - list of removed attributes, mutable
 */
const sanitizeElement = ({ currentElement, removedElements, removedAttributes }) => {
  if (!ALLOWED_TAGS.has(currentElement.tagName.toLowerCase())) {
    removedElements.push(currentElement)
    currentElement.remove()
    return
  }
  const { attributes } = currentElement
  for (const attribute of Array.from(attributes)) {
    const name = attribute.name.toLowerCase()
    if (
      name === 'data-i18n' ||
      name.startsWith('data-i18n-') ||
      (!name.startsWith('data-') && !name.startsWith('aria-') && !ALLOWED_STANDARD_ATTRS.has(name))
    ) {
      removedAttributes.push({ name, from: currentElement })
      attributes.removeNamedItem(name)
    }
  }

  for (const child of Array.from(currentElement.children)) {
    sanitizeElement({ removedElements, removedAttributes, currentElement: child })
  }
}

/**
 * Sanitizes The HTML input
 * @param   {string}             html - HTML input string to sanitize
 * @returns {SanitizeHtmlResult} Sanitization result
 */
export function sanitizeI18nHtml (html) {
  /** @type {Element[]} */
  const removedElements = []
  /** @type {RemovedAttr[]} */
  const removedAttributes = []
  const doc = _initDocument(html)
  for (const currentElement of Array.from(doc.children)) {
    sanitizeElement({ removedElements, removedAttributes, currentElement })
  }
  return {
    html: doc.innerHTML,
    removedElements,
    removedAttributes,
  }
}
