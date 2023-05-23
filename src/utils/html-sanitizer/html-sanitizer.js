
/*
 A strictier sanitizer that allows only text related tags and attributes as to allow any sort of formatting content
*/
export const ALLOWED_TAGS = new Set([
    'a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside',
    'b', 'bdi', 'bdo', 'big', 'blockquote', 'br',
    'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content',
    'data', 'datalist', 'dd', 'decorator', 'del', 'details', 'dfn', 'dir', 'div', 'dl', 'dt',
    'element', 'em',
    'fieldset', 'figcaption', 'figure', 'font', 'footer',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr',
    'i', 'ins',
    'kbd',
    'label', 'legend', 'li',
    'main', 'map', 'mark', 'marquee', 'meter',
    'nav', 'nobr',
    'ol', 'output',
    'p', 'picture', 'pre', 'progress',
    'q',
    'rp', 'rt', 'ruby',
    's', 'samp', 'section', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary','sup',
    'table',  'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt',
    'u', 'ul',
    'var',
    'wbr',
  ]);


  export const ALLOWED_STANDARD_ATTRS = new Set([
    'accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay',
    'background', 'bgcolor', 'border', 
    'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'controls', 'controlslist', 'coords', 'crossorigin',
    'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download','draggable',
    'enctype', 'enterkeyhint',
    'face', 'for',
    'headers', 'height', 'hidden', 'high', 'href', 'hreflang',
    'id', 'inputmode', 'integrity', 'ismap',
    'kind',
    'label', 'lang', 'list', 'loading', 'loop', 'low',
    'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted',
    'name', 'nonce', 'noshade', 'novalidate', 'nowrap',
    'open', 'optimum',
    'pattern', 'placeholder', 'playsinline', 'poster', 'preload', 'pubdate',
    'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role','rows', 'rowspan',
    'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'slot',
    'tabindex', 'title', 'translate', 'type',
    'usemap',
    'valign', 'value',
    'width',
    'xmlns',
  ]);



/**
 * Sanitizes The HTML input
 * 
 * 
 * @param   {string} html HTML input string to sanitize
 * @returns {string}           Sanitized Html string  
 */
export function sanitizeI18nHtml(html){
    const domParser = new DOMParser();
    const document = domParser.parseFromString(html, "text/html");
    document.querySelectorAll("*").forEach(element => {
        if(!ALLOWED_TAGS.has(element.tagName.toLowerCase())){
            element.remove()
            return
        }
        for(const attribute of element.attributes){
            const name = attribute.name.toLowerCase()
            if(name.startsWith("data-i18n-")){
                element.removeAttribute(name)
                return    
            }
            if(!name.startsWith("data-") && !ALLOWED_STANDARD_ATTRS.has(name)){
                element.remove()
                return    
            } 
        }

    })
    return document.documentElement.innerHTML

}
