const ProdutoPage = (function () {
  let thumbOffset = 0;
  let selectedSize = null;

  function init() {
    const params = new URLSearchParams(window.location.search);
    const idFromURL = params.get('id');
    let lastProductId = null;

    try {
      lastProductId = sessionStorage.getItem('vdp_last_product_id');
    } catch (error) {}

    const id = idFromURL || lastProductId;

    if (!id) {
      redirectNotFound();
      return;
    }

    const produto = (window.PRODUTOS || []).find(p => p.id === id);

    if (produto && idFromURL) {
      try {
        sessionStorage.setItem('vdp_last_product_id', idFromURL);
      } catch (error) {}
    }

    if (!produto) {
      redirectNotFound();
      return;
    }

    render(produto);
    initEvents(produto);
    updatePageMeta(produto);
  }

  function redirectNotFound() {
    document.getElementById('produtoConteudo').innerHTML = `
      <div class="empty-state" style="padding:80px 20px">
        <p>Produto n\u00e3o encontrado.</p>
        <a href="/produtos/" class="btn-outline" style="margin-top:24px;display:inline-block">
          Ver todos os produtos
        </a>
      </div>`;
  }

  function render(produto) {
    const container = document.getElementById('produtoConteudo');
    if (!container) return;

    const preco = produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const hasSizes = Boolean(produto.tamanho?.enabled && produto.tamanho?.options?.length);
    selectedSize = hasSizes ? String(produto.tamanho.options[0]) : null;

    let estoqueHTML = '';
    if (produto.estoque <= 3 && produto.estoque > 0) {
      estoqueHTML = `<p class="produto-estoque-aviso urgente">\u26A0 Aten\u00e7\u00e3o, \u00faltimas ${produto.estoque} pe\u00e7a${produto.estoque > 1 ? 's' : ''}!</p>`;
    } else if (produto.estoque === 0) {
      estoqueHTML = `<p class="produto-estoque-aviso urgente">\u2715 Produto esgotado.</p>`;
    }

    const thumbsHTML = produto.imagens.map((img, index) => `
      <div class="thumb ${index === 0 ? 'active' : ''}" data-src="${img}">
        <img src="${img}" alt="${produto.nome} - foto ${index + 1}" loading="lazy"/>
      </div>
    `).join('');

    const btnDisabled = produto.estoque === 0 ? 'disabled style="opacity:.4;cursor:not-allowed"' : '';
    const btnLabel = produto.estoque === 0 ? 'Indispon\u00edvel' : 'Comprar';
    const tamanhoHTML = hasSizes ? `
      <div class="produto-size-block">
        <div class="produto-size-header">
          <span class="produto-size-label">Tamanho: <span class="produto-size-selected" id="sizeSelected">${selectedSize}</span></span>
        </div>
        <div class="produto-size-options">
          ${produto.tamanho.options.map((size, index) => `
            <button
              type="button"
              class="size-btn ${index === 0 ? 'active' : ''}"
              data-size="${size}"
              aria-pressed="${index === 0 ? 'true' : 'false'}"
            >
              ${size}
            </button>
          `).join('')}
        </div>
      </div>
    ` : '';

    container.innerHTML = `
      <nav class="breadcrumb" aria-label="Navega\u00e7\u00e3o estrutural">
        <a href="/">In\u00edcio</a>
        <span class="sep">\u203a</span>
        <a href="/produtos/?cat=${encodeURIComponent(produto.categoria)}">${getCategoryLabel(produto.categoria)}</a>
        <span class="sep">\u203a</span>
        <span class="current">${produto.nome}</span>
      </nav>

      <div class="produto-layout">
        <div class="gallery">
          <div class="thumb-col">
            <div class="thumb-scroll" id="thumbScroll">${thumbsHTML}</div>
            ${produto.imagens.length > 3 ? `
              <div class="thumb-nav">
                <button class="btn-thumb-nav" id="btnThumbUp" aria-label="Foto anterior">
                  <svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
                </button>
                <button class="btn-thumb-nav" id="btnThumbDown" aria-label="Pr\u00f3xima foto">
                  <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>` : ''}
          </div>

          <div class="gallery-main">
            <span class="badge-frete">Frete gr\u00e1tis</span>
            <img id="mainImg" class="gallery-main-img" src="${produto.imagens[0]}" alt="${produto.nome}"/>
          </div>
        </div>

        <div class="produto-info-panel">
          <h1 class="produto-nome">${produto.nome}</h1>
          <p class="produto-preco">${preco}</p>
          <p class="produto-frete">Frete gr\u00e1tis | Santarém-PA</p>
          ${estoqueHTML}
          ${tamanhoHTML}

          <div class="comprar-row">
            <div class="qty-ctrl">
              <button class="qty-btn" id="btnMinus" aria-label="Diminuir">-</button>
              <input class="qty-num" id="qtyInput" type="number" value="1" min="1" max="${produto.estoque || 99}" readonly aria-label="Quantidade"/>
              <button class="qty-btn" id="btnPlus" aria-label="Aumentar">+</button>
            </div>
            <button class="btn-comprar" id="btnComprar" ${btnDisabled}>${btnLabel}</button>
          </div>

          <div class="produto-desc">
            <h3>Sobre o produto</h3>
            <p>${produto.descricao}</p>
          </div>
        </div>
      </div>
    `;
  }

  function initEvents(produto) {
    const container = document.getElementById('produtoConteudo');
    if (!container) return;

    const btnMinus = document.getElementById('btnMinus');
    const btnPlus = document.getElementById('btnPlus');
    const qtyInput = document.getElementById('qtyInput');

    btnMinus?.addEventListener('click', () => {
      const value = parseInt(qtyInput.value, 10);
      if (value > 1) qtyInput.value = value - 1;
    });

    btnPlus?.addEventListener('click', () => {
      const value = parseInt(qtyInput.value, 10);
      const max = parseInt(qtyInput.max, 10) || 99;
      if (value < max) qtyInput.value = value + 1;
    });

    qtyInput?.addEventListener('change', () => {
      let value = parseInt(qtyInput.value, 10);
      const max = parseInt(qtyInput.max, 10) || 99;
      if (isNaN(value) || value < 1) value = 1;
      if (value > max) value = max;
      qtyInput.value = value;
    });

    container.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSize = btn.dataset.size || null;
        container.querySelectorAll('.size-btn').forEach(sizeBtn => {
          const isActive = sizeBtn === btn;
          sizeBtn.classList.toggle('active', isActive);
          sizeBtn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        const selectedEl = document.getElementById('sizeSelected');
        if (selectedEl) selectedEl.textContent = selectedSize || '-';
      });
    });

    document.getElementById('btnComprar')?.addEventListener('click', () => {
      if (produto.estoque === 0) return;
      if (produto.tamanho?.enabled && !selectedSize) {
        Cart.showToast('Selecione um tamanho para continuar');
        return;
      }

      const quantity = parseInt(qtyInput.value, 10) || 1;
      Cart.add(produto, quantity, selectedSize);
      Cart.open();
    });

    container.querySelectorAll('.thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        container.querySelectorAll('.thumb').forEach(item => item.classList.remove('active'));
        thumb.classList.add('active');

        const mainImg = document.getElementById('mainImg');
        if (mainImg) {
          mainImg.style.opacity = '0';
          mainImg.src = thumb.dataset.src;
          mainImg.onload = () => {
            mainImg.style.opacity = '1';
          };
        }
      });
    });

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
    const itemHeight = firstThumb.offsetHeight + 8;
    container.style.transform = `translateY(-${thumbOffset * itemHeight}px)`;
    container.style.transition = 'transform .28s ease';
  }

  function updatePageMeta(produto) {
    document.title = `${produto.nome} - Versos de Prata`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = produto.descricao.substring(0, 155);
  }

  function getCategoryLabel(value) {
    const labels = {
      anel: 'Anéis',
      pulseira: 'Pulseiras',
      colar: 'Colares',
      brinco: 'Brincos',
      conjunto: 'Conjuntos'
    };

    return labels[value] || (value.charAt(0).toUpperCase() + value.slice(1));
  }

  return { init };
})();
