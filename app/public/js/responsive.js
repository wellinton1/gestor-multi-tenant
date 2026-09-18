/* ============================================================================
   RESPONSIVE.JS — camada de UI mobile (painel admin) — SEM LOGICA DE NEGOCIO
   - Injeta topbar (hamburger + marca), drawer backdrop e bottom nav.
   - Injeta data-label em tabelas a partir dos <th> (tabelas -> cards no mobile).
   - Tudo e re-injetado apos cada re-render via MutationObserver, porque o
     app.js reconstroi o shell (innerHTML) a cada navegacao/tema.
   - Nao altera nenhum seletor, evento ou comportamento existente do app.js.
   ============================================================================ */
(function () {
  'use strict';

  var MOBILE_MAX = 768; // px — precisa casar com o responsive.css
  var BOTTOM_NAV_ROUTES = [
    // rotas principais cloneadas da sidebar (ordem visual do app)
    '#/dashboard',
    '#/pedidos',
    '#/clientes',
    '#/configuracoes'
  ];

  function mqMobile() {
    return window.matchMedia('(max-width: ' + MOBILE_MAX + 'px)').matches;
  }

  /* ---------- helpers ---------- */

  function h(tag, className, html) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (html != null) el.innerHTML = html;
    return el;
  }

  /* ---------- tabelas -> data-label ---------- */

  // Copia o texto de cada <th> para o data-label dos <td> correspondentes.
  function labelTables(context) {
    var tables = (context || document).querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var ths = tables[i].querySelectorAll('thead th');
      if (!ths.length) continue;
      var rows = tables[i].querySelectorAll('tbody tr');
      for (var r = 0; r < rows.length; r++) {
        var tds = rows[r].querySelectorAll('td');
        for (var c = 0; c < tds.length && c < ths.length; c++) {
          var label = ths[c].textContent.trim().replace(/\s+/g, ' ');
          if (label) tds[c].setAttribute('data-label', label);
          // action col do app usa th sem texto as vezes — deixa sem label
        }
      }
    }
  }

  /* ---------- topbar + hamburger ---------- */

  function ensureTopbar(shell) {
    if (shell.querySelector('.res-topbar')) return;
    var brand = shell.querySelector('.sidebar-brand .brand-name');
    var niche = shell.querySelector('.sidebar-brand .brand-niche');
    var bar = h('div', 'res-topbar');
    bar.setAttribute('role', 'banner');

    var burger = h('button', 'res-hamburger');
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Abrir menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span class="bars" aria-hidden="true"><span></span></span>';
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('sidebar-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    bar.appendChild(burger);

    var brandBox = h('div', 'res-topbar-brand');
    if (brand) {
      brandBox.appendChild(h('strong', null, brand.textContent.trim()));
      if (niche) brandBox.appendChild(h('small', null, niche.textContent.trim()));
    }
    bar.appendChild(brandBox);

    // espelha o botao de tema da sidebar (so icone) para acesso rapido
    var themeBtn = shell.querySelector('.theme-toggle-btn');
    if (themeBtn) {
      var themeClone = themeBtn.cloneNode(true);
      themeClone.removeAttribute('id'); // nao duplica id usado pelo app.js
      // o app re-habilita o proprio botao original; o clone delega o clique a ele
      themeClone.setAttribute('aria-label', 'Alternar tema');
      themeClone.addEventListener('click', function () { themeBtn.click(); });
      bar.appendChild(themeClone);
    }

    shell.insertBefore(bar, shell.firstChild);
  }

  /* ---------- backdrop do drawer ---------- */

  function ensureBackdrop(shell) {
    if (shell.querySelector('.res-drawer-backdrop')) return;
    var bd = h('div', 'res-drawer-backdrop');
    bd.setAttribute('aria-hidden', 'true');
    bd.addEventListener('click', closeDrawer);
    shell.appendChild(bd);
  }

  /* ---------- bottom nav ---------- */

  function ensureBottomNav(shell) {
    if (shell.querySelector('.res-bottom-nav')) return;
    var nav = shell.querySelector('.sidebar-nav');
    if (!nav) return;

    var bottom = h('nav', 'res-bottom-nav');
    bottom.setAttribute('aria-label', 'Navigacao principal');

    var items = nav.querySelectorAll('a.nav-item');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var hash = (item.getAttribute('href') || '').split('#')[1];
      if (BOTTOM_NAV_ROUTES.indexOf('#' + hash) === -1) continue;
      var clone = item.cloneNode(true);            // class ativa vem junto
      var icEl = clone.querySelector('.ic');
      var icon = icEl ? icEl.innerHTML : '';
      var label = icEl ? icEl.nextSibling.nodeValue : clone.textContent;
      clone.className = item.className;
      clone.setAttribute('aria-label', String(label).trim());
      clone.innerHTML =
        '<span class="ic" aria-hidden="true">' + icon + '</span>' +
        '<span class="lbl">' + label + '</span>';
      clone.classList.remove('active');            // ativo e recalculado por rota
      bottom.appendChild(clone);
    }
    // so injeta se achou pelo menos 1 rota principal
    if (bottom.children.length) shell.appendChild(bottom);
    syncBottomNavActive(bottom);
  }

  function syncBottomNavActive(bottom) {
    var hash = location.hash || '#/dashboard';
    var links = (bottom || document.querySelector('.res-bottom-nav'));
    if (!links) return;
    for (var i = 0; i < links.children.length; i++) {
      var a = links.children[i];
      if (a.getAttribute('href') === hash) a.classList.add('active');
      else a.classList.remove('active');
    }
  }

  /* ---------- comportamento do drawer ---------- */

  function closeDrawer() {
    if (!document.body.classList.contains('sidebar-open')) return;
    document.body.classList.remove('sidebar-open');
    var burger = document.querySelector('.res-hamburger');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }

  // fechar ao clicar em qualquer link (navegou => fecha)
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#/"]') : null;
    if (a && a.closest('.sidebar, .res-bottom-nav')) closeDrawer();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  window.addEventListener('hashchange', closeDrawer);

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!mqMobile()) {
        closeDrawer(); // desktop: remove classes mobile
      } else {
        syncBottomNavActive();
      }
    }, 120);
  });

  /* ---------- injecao no shell ---------- */

  function apply() {
    var shell = document.querySelector('.app-shell');
    if (!shell || !shell.querySelector('.sidebar')) return; // telas sem shell (login, selector)
    ensureTopbar(shell);
    ensureBackdrop(shell);
    ensureBottomNav(shell);
    labelTables();
  }

  // Re-render do app.js troca innerHTML do #root e de #main-content
  // (navegacao entre paginas): observa os dois niveis e reinjeta.
  var mo = new MutationObserver(function () { apply(); });
  mo.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });

  apply();
})();
