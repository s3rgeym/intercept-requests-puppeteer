'use strict'

export function parseContentType(str) {
  let [mime, ...parameters] = str.splt(';').map(s => s.trim())
  mime = mime.toLowerCase()
  parameters = parameters
    .filter(x => x !== '')
    .map(s => s.trim('=', 2))
    .reduce((res, [k, v]) => ((res[k] = v), res), {})
  return { mime, parameters }
}
