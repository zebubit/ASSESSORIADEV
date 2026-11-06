/* Idioma PT/EN/ES das páginas do site Zebubit (a home tem o sistema próprio).
   Uso, no fim do <body>:
     <script src="/assets/i18n/NOME-DA-PAGINA.js"></script>
     <script src="/assets/zb-lang.js"></script>
   O dicionário da página é window.ZB_PAGE = {
     en: { "texto em PT": "text in EN", ... },
     es: { "texto em PT": "texto en ES", ... },
     href: { "link original": { en: "...", es: "..." } }   // opcional (ex.: mensagens de WhatsApp)
   }
   A chave é o innerHTML do elemento com os espaços colapsados (pode ter <strong>, <em>, <br>, <span>, <a>...).
   Também traduz placeholder, aria-label, alt, title e o <title>/meta description quando o texto deles é chave.
   Idioma: ?lang=en|es|pt  >  escolha salva (lang_zebubit, a mesma da home)  >  idioma do celular  >  PT.
   O seletor aparece fixo no topo à direita; para pôr em outro lugar, coloque <div data-zb-langbar></div> na página.
   Conteúdo criado por JavaScript da página: use window.zbLang() e o evento 'zb:lang' para traduzir também. */
(function () {
  'use strict';
  var D = window.ZB_PAGE || { en: {}, es: {} };
  var LANGS = ['pt', 'en', 'es'];
  var SKIP = 'script,style,noscript,svg,video,canvas,iframe,[data-zb-skip],.zb-langbar,.zebu-orb,.zebu-p';
  var INLINE = { EM: 1, STRONG: 1, B: 1, I: 1, BR: 1, SMALL: 1, MARK: 1, SPAN: 1, A: 1, SVG: 1, PATH: 1, U: 1, SUP: 1, SUB: 1, IMG: 1 };
  var ATTRS = ['placeholder', 'aria-label', 'alt', 'title'];
  var norm = function (s) { return String(s).replace(/\s+/g, ' ').trim(); };
  var temChave = function (k) { return (D.en && D.en[k] !== undefined) || (D.es && D.es[k] !== undefined); };
  var marcados = [], attrsMarcados = [], hrefs = [], meta = [], atual = 'pt';

  function marcar() {
    var achados = [];
    document.body.querySelectorAll('*').forEach(function (el) {
      if (el.closest(SKIP)) return;
      ATTRS.forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && temChave(norm(v))) attrsMarcados.push([el, a, v, norm(v)]);
      });
      if (D.href) {
        var h = el.getAttribute('href');
        if (h && D.href[h]) hrefs.push([el, h]);
      }
      for (var i = 0; i < el.children.length; i++) if (!INLINE[el.children[i].tagName.toUpperCase()]) return;
      var k = norm(el.innerHTML);
      if (k && temChave(k)) achados.push([el, k, el.innerHTML]);
    });
    // se o pai já é traduzido inteiro, o filho não entra
    var set = new Set(achados.map(function (x) { return x[0]; }));
    achados.forEach(function (x) {
      for (var p = x[0].parentElement; p; p = p.parentElement) if (set.has(p)) return;
      marcados.push(x);
    });
    var t = document.querySelector('title');
    if (t && temChave(norm(t.textContent))) meta.push([t, 'text', t.textContent, norm(t.textContent)]);
    var md = document.querySelector('meta[name="description"]');
    if (md && temChave(norm(md.content))) meta.push([md, 'content', md.content, norm(md.content)]);
  }

  function aplicar(l) {
    if (LANGS.indexOf(l) < 0) l = 'pt';
    atual = l;
    var T = D[l] || {};
    marcados.forEach(function (x) { var v = l === 'pt' ? undefined : T[x[1]]; x[0].innerHTML = v !== undefined ? v : x[2]; });
    attrsMarcados.forEach(function (x) { var v = l === 'pt' ? undefined : T[x[3]]; x[0].setAttribute(x[1], v !== undefined ? v : x[2]); });
    hrefs.forEach(function (x) { var v = l === 'pt' ? undefined : D.href[x[1]][l]; x[0].setAttribute('href', v || x[1]); });
    meta.forEach(function (x) {
      var v = l === 'pt' ? undefined : T[x[3]];
      if (x[1] === 'text') x[0].textContent = v !== undefined ? v : x[2]; else x[0].setAttribute('content', v !== undefined ? v : x[2]);
    });
    document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;
    document.querySelectorAll('.zb-langbar button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.l === l); });
    try { localStorage.setItem('lang_zebubit', l); } catch (e) {}
    document.dispatchEvent(new CustomEvent('zb:lang', { detail: l }));
  }

  function seletor() {
    var css = document.createElement('style');
    css.textContent = '.zb-langbar{display:inline-flex;padding:3px;border-radius:999px;background:rgba(10,10,10,.72);'
      + 'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(230,189,79,.4);font-family:system-ui,-apple-system,sans-serif}'
      + '.zb-langbar--fixo{position:fixed;top:calc(10px + env(safe-area-inset-top));right:10px;z-index:2147482000}'
      + '.zb-langbar button{background:none;border:0;color:#d9d6cf;font:700 12px/1 system-ui,-apple-system,sans-serif;letter-spacing:.08em;'
      + 'min-width:42px;min-height:32px;border-radius:999px;cursor:pointer}'
      + '.zb-langbar button[aria-pressed=true]{background:#e6bd4f;color:#111}';
    document.head.appendChild(css);
    var bar = document.createElement('div');
    bar.className = 'zb-langbar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Idioma / Language');
    bar.innerHTML = '<button type="button" data-l="pt">PT</button><button type="button" data-l="en">EN</button><button type="button" data-l="es">ES</button>';
    var lugar = document.querySelector('[data-zb-langbar]');
    if (lugar) lugar.appendChild(bar); else { bar.classList.add('zb-langbar--fixo'); document.body.appendChild(bar); }
    bar.querySelectorAll('button').forEach(function (b) { b.onclick = function () { aplicar(b.dataset.l); }; });
  }

  function inicial() {
    var q = (new URLSearchParams(location.search).get('lang') || '').slice(0, 2).toLowerCase();
    if (LANGS.indexOf(q) >= 0) return q;
    try { var s = localStorage.getItem('lang_zebubit'); if (LANGS.indexOf(s) >= 0) return s; } catch (e) {}
    var n = (navigator.language || 'pt').slice(0, 2).toLowerCase();
    return n === 'en' || n === 'es' ? n : 'pt';
  }

  window.zbLang = function () { return atual; };
  window.zbSetLang = aplicar;

  function iniciar() { marcar(); seletor(); aplicar(inicial()); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
