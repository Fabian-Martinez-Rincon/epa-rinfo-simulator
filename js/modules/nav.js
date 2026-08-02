// Resalta el link activo del riel de navegacion segun la seccion visible.
import { $all } from './dom.js';

export function setActiveNav(id) {
  $all('.rail nav a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
}

export function initNavObserver() {
  var sections = $all('main > section[id]');
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) setActiveNav(en.target.id); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(function (s) { obs.observe(s); });
}
