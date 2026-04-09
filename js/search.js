const Search = (function () {
  let currentQuery = '';
  let currentCategory = 'todos';
  let debounceTimer = null;

  function normalize(value) {
    return String(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function filter(query, category) {
    const normalizedQuery = normalize(query || '');
    const normalizedCategory = (category || 'todos').toLowerCase();
    const allProducts = window.PRODUTOS || [];

    return allProducts.filter(produto => {
      const categoryMatches = normalizedCategory === 'todos' || produto.categoria.toLowerCase() === normalizedCategory;
      const haystack = normalize(`${produto.nome} ${produto.descricao} ${produto.categoria}`);
      const searchMatches = normalizedQuery === '' || haystack.includes(normalizedQuery);
      return categoryMatches && searchMatches;
    });
  }

  function updateGrid() {
    const grid = document.getElementById('produtosGrid');
    const countEl = document.getElementById('produtosCount');
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

  function initInlineSearch() {
    const input = document.getElementById('searchProdutos');
    if (!input) return;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentQuery = input.value.trim();
        updateGrid();
      }, 280);
    });

    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        input.value = '';
        currentQuery = '';
        updateGrid();
      }
    });
  }

  function initCategoryFilter() {
    const buttons = document.querySelectorAll('.btn-cat');
    if (!buttons.length) return;

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        buttons.forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        currentCategory = button.dataset.cat || 'todos';
        updateGrid();

        const grid = document.getElementById('produtosGrid');
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initOverlaySearch() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    const openBtn = document.getElementById('btnSearch');
    const closeBtn = document.getElementById('searchClose');
    const resultsEl = document.getElementById('searchResultsOverlay');

    if (!overlay || !input) return;

    openBtn?.addEventListener('click', () => {
      overlay.classList.add('open');
      input.focus();
      document.body.style.overflow = 'hidden';
    });

    function closeOverlay() {
      overlay.classList.remove('open');
      input.value = '';
      if (resultsEl) resultsEl.innerHTML = '';
      document.body.style.overflow = '';
    }

    closeBtn?.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeOverlay();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
    });

    if (!resultsEl) return;

    let overlayTimer = null;
    input.addEventListener('input', () => {
      clearTimeout(overlayTimer);
      overlayTimer = setTimeout(() => {
        const query = input.value.trim();
        if (query.length < 2) {
          resultsEl.innerHTML = '';
          return;
        }

        const lista = filter(query, 'todos').slice(0, 6);

        if (lista.length === 0) {
          resultsEl.innerHTML = `<p style="color:#999;font-size:13px;grid-column:1/-1">Nenhum resultado para "<em>${query}</em>".</p>`;
          return;
        }

        resultsEl.innerHTML = lista.map(produto => `
          <a class="search-result-item" href="/produto?id=${produto.id}">
            <img src="${produto.imagens[0]}" alt="${produto.nome}" loading="lazy"/>
            <div class="search-result-info">
              <p>${produto.nome}</p>
              <span>${Render.formatBRL(produto.preco)}</span>
            </div>
          </a>
        `).join('');
      }, 250);
    });

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && input.value.trim()) {
        window.location.href = `/produtos?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  }

  function readURLParams() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    const category = params.get('cat');

    if (query) {
      currentQuery = query;
      const input = document.getElementById('searchProdutos');
      if (input) input.value = query;
    }

    if (category) {
      currentCategory = category;
      const button = document.querySelector(`[data-cat="${category}"]`);
      if (button) {
        document.querySelectorAll('.btn-cat').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
      }
    }
  }

  function init() {
    initOverlaySearch();
    readURLParams();
    initInlineSearch();
    initCategoryFilter();
    updateGrid();
  }

  return { init, filter, updateGrid };
})();
