/**
 * VERSOS DE PRATA — render.js
 * ==============================
 * Funções de renderização de cards de produto reutilizadas
 * em todas as páginas do site.
 */

const Render = (function () {

  /** Formata preço em BRL */
  function formatBRL(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Gera o HTML de um card de produto.
   * @param {Object} produto - objeto do catálogo
   * @param {boolean} [showAddBtn=true] - exibe botão "Adicionar ao carrinho"
   */
  function cardHTML(produto, showAddBtn = true) {
    const img = produto.imagens[0] || '';
    const preco = formatBRL(produto.preco);
    const hasSizes = Boolean(produto.tamanho?.enabled && produto.tamanho?.options?.length);
    const addBtn = showAddBtn
      ? `<div class="product-card-actions">
           <button class="btn-add-card"
                   data-id="${produto.id}"
                   data-has-sizes="${hasSizes ? 'true' : 'false'}"
                   aria-label="Adicionar ao carrinho">
             ${hasSizes ? 'Escolher tamanho' : '+ Adicionar ao carrinho'}
           </button>
         </div>`
      : '';

    return `
      <article class="product-card fade-in" role="article">
        <a href="produto.html?id=${produto.id}" class="product-card-link">
          <div class="product-img-wrap">
            <span class="badge-frete">Frete grátis</span>
            <img
              class="product-img lazy"
              data-src="${img}"
              src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              alt="${produto.nome}"
            />
          </div>
          <div class="product-info">
            <p class="product-name">${produto.nome}</p>
            <p class="product-price">${preco}</p>
          </div>
        </a>
        ${addBtn}
      </article>
    `;
  }

  /**
   * Renderiza lista de produtos num container.
   * @param {HTMLElement} container
   * @param {Array} lista - produtos filtrados
   * @param {string} [emptyMsg] - texto quando não há resultados
   */
  function renderGrid(container, lista, emptyMsg = 'Nenhum produto encontrado.') {
    if (!container) return;

    if (lista.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>${emptyMsg}</p>
        </div>`;
      initLazyLoad();
      bindAddButtons(container);
      return;
    }

    container.innerHTML = lista.map(p => cardHTML(p)).join('');
    initLazyLoad();
    bindAddButtons(container);
  }

  /**
   * Lazy load de imagens via IntersectionObserver.
   * Substitui o src placeholder pelo data-src real.
   */
  function initLazyLoad() {
    const imgs = document.querySelectorAll('img.lazy:not(.loaded)');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.onload  = () => img.classList.add('loaded');
            img.onerror = () => {
              img.src = 'data:image/svg+xml,' +
                encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg"
                  width="400" height="533"><rect width="400" height="533"
                  fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle"
                  fill="#bbb" font-family="sans-serif" font-size="14">
                  Imagem indisponível</text></svg>`);
              img.classList.add('loaded');
            };
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });

      imgs.forEach(img => observer.observe(img));
    } else {
      // Fallback para browsers sem suporte
      imgs.forEach(img => {
        img.src = img.dataset.src;
        img.classList.add('loaded');
      });
    }
  }

  /**
   * Vincula os botões "Adicionar ao carrinho" dos cards ao Cart.
   * @param {HTMLElement} scope - container pai (para não re-buscar no document todo)
   */
  function bindAddButtons(scope) {
    scope = scope || document;
    scope.querySelectorAll('.btn-add-card').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.id;
        const produto = (window.PRODUTOS || []).find(p => p.id === id);
        if (produto) {
          if (btn.dataset.hasSizes === 'true') {
            window.location.href = `produto.html?id=${encodeURIComponent(produto.id)}`;
            return;
          }
          Cart.add(produto, 1);
        }
      });
    });
  }

  /** Renderiza skeletons enquanto carrega */
  function renderSkeletons(container, count = 4) {
    if (!container) return;
    container.innerHTML = Array(count).fill(`
      <div class="product-card">
        <div class="product-img-wrap skeleton" style="aspect-ratio:3/4"></div>
        <div style="padding:12px 0 6px">
          <div class="skeleton" style="height:12px;margin-bottom:6px;width:90%"></div>
          <div class="skeleton" style="height:12px;width:50%"></div>
        </div>
      </div>
    `).join('');
  }

  return { cardHTML, renderGrid, initLazyLoad, bindAddButtons, renderSkeletons, formatBRL };

})();
