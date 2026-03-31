/**
 * VERSOS DE PRATA — produto.js
 * ==============================
 * Lógica da página de detalhe de produto.
 * Lê o ID da URL (?id=...) e monta toda a página dinamicamente.
 */

const ProdutoPage = (function () {

  let currentProduto = null;
  let thumbOffset    = 0;

  /* ─── Inicialização ─── */
  function init() {
    const params = new URLSearchParams(window.location.search);
    const id     = params.get('id');

    if (!id) {
      redirectNotFound();
      return;
    }

    const produto = (window.PRODUTOS || []).find(p => p.id === id);

    if (!produto) {
      redirectNotFound();
      return;
    }

    currentProduto = produto;
    render(produto);
    initEvents(produto);
    updatePageMeta(produto);
  }

  /* ─── Redireciona se produto não encontrado ─── */
  function redirectNotFound() {
    document.getElementById('produtoConteudo').innerHTML = `
      <div class="empty-state" style="padding:80px 20px">
        <p>Produto não encontrado.</p>
        <a href="produtos.html" class="btn-outline" style="margin-top:24px;display:inline-block">
          Ver todos os produtos
        </a>
      </div>`;
  }

  /* ─── Renderiza toda a página do produto ─── */
  function render(p) {
    const container = document.getElementById('produtoConteudo');
    if (!container) return;

    const preco = p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Aviso de estoque
    let estoqueHTML = '';
    if (p.estoque <= 3 && p.estoque > 0) {
      estoqueHTML = `<p class="produto-estoque-aviso urgente">⚠ Atenção, últimas ${p.estoque} peça${p.estoque > 1 ? 's' : ''}!</p>`;
    } else if (p.estoque === 0) {
      estoqueHTML = `<p class="produto-estoque-aviso urgente">✕ Produto indisponível no momento.</p>`;
    }

    // Thumbnails
    const thumbsHTML = p.imagens.map((img, i) => `
      <div class="thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" data-src="${img}">
        <img src="${img}" alt="${p.nome} - foto ${i + 1}" loading="lazy"/>
      </div>
    `).join('');

    // Botão de comprar (desabilitado se sem estoque)
    const btnDisabled  = p.estoque === 0 ? 'disabled style="opacity:.4;cursor:not-allowed"' : '';
    const btnLabel     = p.estoque === 0 ? 'Indisponível' : 'Comprar';

    container.innerHTML = `
      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Navegação estrutural">
        <a href="index.html">Início</a>
        <span class="sep">›</span>
        <a href="produtos.html?cat=${p.categoria}">${capitalize(p.categoria)}s</a>
        <span class="sep">›</span>
        <span class="current">${p.nome}</span>
      </nav>

      <!-- Layout -->
      <div class="produto-layout">

        <!-- Galeria -->
        <div class="gallery">
          <!-- Coluna de thumbnails -->
          <div class="thumb-col">
            <div class="thumb-scroll" id="thumbScroll">${thumbsHTML}</div>
            ${p.imagens.length > 3 ? `
              <div class="thumb-nav">
                <button class="btn-thumb-nav" id="btnThumbUp" aria-label="Foto anterior">
                  <svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
                </button>
                <button class="btn-thumb-nav" id="btnThumbDown" aria-label="Próxima foto">
                  <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>` : ''}
          </div>

          <!-- Imagem principal -->
          <div class="gallery-main">
            <span class="badge-frete">Frete grátis</span>
            <img
              id="mainImg"
              class="gallery-main-img"
              src="${p.imagens[0]}"
              alt="${p.nome}"
            />
          </div>
        </div>

        <!-- Painel de informações -->
        <div class="produto-info-panel">
          <h1 class="produto-nome">${p.nome}</h1>
          <p class="produto-preco">${preco}</p>
          <p class="produto-frete">Frete grátis para todo o Brasil</p>
          ${estoqueHTML}

          <div class="comprar-row">
            <div class="qty-ctrl">
              <button class="qty-btn" id="btnMinus" aria-label="Diminuir">−</button>
              <input class="qty-num" id="qtyInput" type="number"
                     value="1" min="1" max="${p.estoque || 99}"
                     readonly aria-label="Quantidade"/>
              <button class="qty-btn" id="btnPlus" aria-label="Aumentar">+</button>
            </div>
            <button class="btn-comprar" id="btnComprar" ${btnDisabled}>
              ${btnLabel}
            </button>
          </div>

          <div class="produto-desc">
            <h3>Sobre o produto</h3>
            <p>${p.descricao}</p>
          </div>
        </div>
      </div>
    `;
  }

  /* ─── Inicializa eventos da página de produto ─── */
  function initEvents(produto) {
    const container = document.getElementById('produtoConteudo');
    if (!container) return;

    // Quantidade
    const btnMinus = document.getElementById('btnMinus');
    const btnPlus  = document.getElementById('btnPlus');
    const qtyInput = document.getElementById('qtyInput');

    btnMinus?.addEventListener('click', () => {
      const val = parseInt(qtyInput.value, 10);
      if (val > 1) qtyInput.value = val - 1;
    });

    btnPlus?.addEventListener('click', () => {
      const val = parseInt(qtyInput.value, 10);
      const max = parseInt(qtyInput.max, 10) || 99;
      if (val < max) qtyInput.value = val + 1;
    });

    qtyInput?.addEventListener('change', () => {
      let val = parseInt(qtyInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      qtyInput.value = val;
    });

    // Botão Comprar → adiciona ao carrinho e abre painel
    const btnComprar = document.getElementById('btnComprar');
    btnComprar?.addEventListener('click', () => {
      if (produto.estoque === 0) return;
      const qty = parseInt(qtyInput.value, 10) || 1;
      Cart.add(produto, qty);
      Cart.open();
    });

    // Galeria de thumbnails
    container.querySelectorAll('.thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        container.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');

        const mainImg = document.getElementById('mainImg');
        if (mainImg) {
          mainImg.style.opacity = '0';
          mainImg.src = thumb.dataset.src;
          mainImg.onload = () => { mainImg.style.opacity = '1'; };
        }
      });
    });

    // Navegação de thumbnails (setas)
    const thumbScroll = document.getElementById('thumbScroll');
    document.getElementById('btnThumbUp')?.addEventListener('click', () => {
      if (thumbOffset > 0) {
        thumbOffset--;
        scrollThumbs(thumbScroll);
      }
    });
    document.getElementById('btnThumbDown')?.addEventListener('click', () => {
      const thumbs = thumbScroll?.querySelectorAll('.thumb');
      if (thumbs && thumbOffset < thumbs.length - 3) {
        thumbOffset++;
        scrollThumbs(thumbScroll);
      }
    });
  }

  function scrollThumbs(container) {
    if (!container) return;
    const firstThumb = container.querySelector('.thumb');
    if (!firstThumb) return;
    const itemH = firstThumb.offsetHeight + 8;
    container.style.transform = `translateY(-${thumbOffset * itemH}px)`;
    container.style.transition = 'transform .28s ease';
  }

  /* ─── Atualiza título e meta da página ─── */
  function updatePageMeta(produto) {
    document.title = `${produto.nome} — Versos de Prata`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = produto.descricao.substring(0, 155);
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return { init };

})();
