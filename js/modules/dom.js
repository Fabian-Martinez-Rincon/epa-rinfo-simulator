// Helpers genericos de DOM, sin dependencias de la app.

export function $(sel, root) { return (root || document).querySelector(sel); }
export function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

export function el(tag, attrs, children) {
  var e = document.createElement(tag);
  attrs = attrs || {};
  Object.keys(attrs).forEach(function (k) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  });
  (children || []).forEach(function (c) {
    if (c == null) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

export function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
