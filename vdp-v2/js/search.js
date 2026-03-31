/**
 * VERSOS DE PRATA — search.js
 * ==============================
 * Busca em tempo real e filtro por categoria para a página de Produtos.
 * Também alimenta o search overlay global (header).
 */

const Search = (function () {

  let currentQuery    = '';
  let currentCategory = 'todos';
  let debounceTimer   = null;

  /* ─── Normaliza string para comparação (sem acento, minúsculo) ─── */
  function normalize(str) {
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /* ─── Filtra lista de produtos ─── */
  function filter(query, category) {
    const q   = normalize(query || '');
    const cat = (category || 'todos').toLowerCase();
    const all = window.PRODUTOS || [];

    return all.filter(p => {
      // Filtro de categoria
      const catOk = cat === 'todos' || p.categoria.toLowerCase() === cat;
      // Filtro de busca (nome + descrição + categoria)
      const haystack = normalize(`${p.nome} ${p.descricao} ${p.categoria}`);
      const searchOk = q === '' || haystack.includes(q);
      return catOk && searchOk;
    });
  }

  /* ─── Atualiza o grid principal na página de produtos ─── */
  function updateGrid() {
    const grid      = document.getElementById('produtosGrid');
    const countEl   = document.getElementById('produtosCount');
    if (!grid) return;

    const lista = filter(currentQuery, currentCategory);

    Render.renderGrid(
      grid,
      lista,
      currentQuery
        ? `Nenhum produto encontrado para "<strong>${currentQuery}</strong>".`
        : 'Nenhum produto nesta categoria.'
    );

    if (countEl) {
      countEl.textContent = lista.length === 1
        ? '1 produto encontrado'
        : `${lista.length} produtos encontrados`;
    }
  }

  /* ─── Inicializa busca inline (página produtos) ─── */
  function initInlineSearch() {
    const input = document.getElementById('searchProdutos');
    if (!input) return;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentQuery = input.value.trim();
        updateGrid();
      }, 280); // debounce 280ms
    });

    // Limpa com ESC
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        input.value   = '';
        currentQuery  = '';
        updateGrid();
      }
    });
  }

  /* ─── Inicializa filtros por categoria ─── */
  function initCategoryFilter() {
    const btns = document.querySelectorAll('.btn-cat');
    if (!btns.length) return;

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Atualiza estado visual
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Atualiza filtro
        currentCategory = btn.dataset.cat || 'todos';
        updateGrid();

        // Rola para o grid
        const grid = document.getElementById('produtosGrid');
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ─── Search overlay global (header) ─── */
  function initOverlaySearch() {
    const overlay   = document.getElementById('searchOverlay');
    const input     = document.getElementById('searchInput');
    const openBtn   = document.getElementById('btnSearch');
    const closeBtn  = document.getElementById('searchClose');
    const resultsEl = document.getElementById('searchResultsOverlay');

    if (!overlay || !input) return;

    // Abrir
    openBtn?.addEventListener('click', () => {
      overlay.classList.add('open');
      input.focus();
      document.body.style.overflow = 'hidden';
    });

    // Fechar
    function closeOverlay() {
      overlay.classList.remove('open');
      input.value = '';
      if (resultsEl) resultsEl.innerHTML = '';
      document.body.style.overflow = '';
    }
    closeBtn?.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeOverlay();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
    });

    if (!resultsEl) return;

    // Busca ao digitar
    let overTimer = null;
    input.addEventListener('input', () => {
      clearTimeout(overTimer);
      overTimer = setTimeout(() => {
        const q = input.value.trim();
        if (q.length < 2) { resultsEl.innerHTML = ''; return; }

        const lista = filter(q, 'todos').slice(0, 6);

        if (lista.length === 0) {
          resultsEl.innerHTML = `<p style="color:#999;font-size:13px;grid-column:1/-1">
            Nenhum resultado para "<em>${q}</em>".</p>`;
          return;
        }

        resultsEl.innerHTML = lista.map(p => `
          <a class="search-result-item" href="produto.html?id=${p.id}">
            <img src="${p.imagens[0]}" alt="${p.nome}" loading="lazy"/>
            <div class="search-result-info">
              <p>${p.nome}</p>
              <span>${Render.formatBRL(p.preco)}</span>
            </div>
          </a>
        `).join('');

      }, 250);
    });

    // Enter → vai para página de produtos com filtro
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = `produtos.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  }

  /* ─── Lê parâmetros da URL ao carregar a página de produtos ─── */
  function readURLParams() {
    const params = new URLSearchParams(window.location.search);
    const q      = params.get('q');
    const cat    = params.get('cat');

    if (q) {
      currentQuery = q;
      const input = document.getElementById('searchProdutos');
      if (input) input.value = q;
    }

    if (cat) {
      currentCategory = cat;
      const btn = document.querySelector(`[data-cat="${cat}"]`);
      if (btn) {
        document.querySelectorAll('.btn-cat').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    }
  }

  /* ─── Init ─── */
  function init() {
    initOverlaySearch();
    readURLParams();
    initInlineSearch();
    initCategoryFilter();
    updateGrid(); // primeira renderização
  }

  return { init, filter, updateGrid };

})();
