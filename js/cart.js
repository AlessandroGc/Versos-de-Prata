const WHATSAPP_NUMBER = '5593984178850';

const Cart = (function () {
  let items = [];

  function load() {
    try {
      const saved = localStorage.getItem('vdp_cart');
      items = saved ? JSON.parse(saved) : [];
      items = items.map(item => normalizeItem(item)).filter(Boolean);
    } catch (error) {
      items = [];
    }
  }

  function save() {
    try {
      localStorage.setItem('vdp_cart', JSON.stringify(items));
    } catch (error) {}
  }

  function getItemKey(produtoId, tamanho) {
    return `${produtoId}::${tamanho || 'sem-tamanho'}`;
  }

  function getCatalogProduct(produtoId) {
    return (window.PRODUTOS || []).find(produto => produto.id === produtoId) || null;
  }

  function getItemStock(produtoId) {
    const catalogProduto = getCatalogProduct(produtoId);
    const stock = parseInt(catalogProduto?.estoque, 10);
    return Number.isFinite(stock) && stock > 0 ? stock : 99;
  }

  function normalizeItem(item) {
    if (!item?.produto?.id) return null;
    const tamanho = item.tamanho || null;
    const catalogProduto = getCatalogProduct(item.produto.id);

    return {
      key: item.key || getItemKey(item.produto.id, tamanho),
      produto: {
        id: item.produto.id,
        nome: catalogProduto?.nome || item.produto.nome,
        preco: catalogProduto?.preco ?? item.produto.preco,
        imagens: Array.isArray(catalogProduto?.imagens)
          ? catalogProduto.imagens
          : (Array.isArray(item.produto.imagens) ? item.produto.imagens : []),
        estoque: Number.isFinite(catalogProduto?.estoque)
          ? catalogProduto.estoque
          : (parseInt(item.produto.estoque, 10) || 99)
      },
      tamanho,
      quantidade: parseInt(item.quantidade, 10) || 1
    };
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getTamanhoLabel(tamanho) {
    return tamanho || 'Nao se aplica';
  }

  function add(produto, quantidade, tamanho = null) {
    quantidade = parseInt(quantidade, 10) || 1;
    const key = getItemKey(produto.id, tamanho);
    const index = items.findIndex(item => item.key === key);
    const stock = getItemStock(produto.id);

    if (index > -1) {
      const nextQuantity = Math.min(items[index].quantidade + quantidade, stock);
      const reachedLimit = nextQuantity === items[index].quantidade;
      items[index].quantidade = nextQuantity;
      save();
      render();
      updateBadge();

      if (reachedLimit) {
        showToast(`Estoque m\u00e1ximo dispon\u00edvel para "${produto.nome.substring(0, 24)}..."`);
        return;
      }
    } else {
      items.push({
        key,
        produto: {
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco,
          imagens: produto.imagens,
          estoque: stock
        },
        tamanho,
        quantidade: Math.min(quantidade, stock)
      });
    }

    save();
    render();
    updateBadge();
    const sizeText = tamanho ? ` - Tamanho ${tamanho}` : '';
    showToast(`"${produto.nome.substring(0, 24)}..."${sizeText} adicionado ao carrinho`);
  }

  function remove(itemKey) {
    items = items.filter(item => item.key !== itemKey);
    save();
    render();
    updateBadge();
  }

  function setQuantidade(itemKey, novaQtd) {
    novaQtd = parseInt(novaQtd, 10);
    if (isNaN(novaQtd) || novaQtd < 1) {
      remove(itemKey);
      return;
    }

    const index = items.findIndex(item => item.key === itemKey);
    if (index > -1) {
      const stock = getItemStock(items[index].produto.id);
      const nextQuantity = Math.min(novaQtd, stock);
      items[index].quantidade = nextQuantity;
      save();
      render();
      updateBadge();

      if (nextQuantity < novaQtd) {
        showToast(`Estoque m\u00e1ximo dispon\u00edvel: ${stock}`);
      }
    }
  }

  function totalItens() {
    return items.reduce((total, item) => total + item.quantidade, 0);
  }

  function subtotal() {
    return items.reduce((total, item) => total + item.produto.preco * item.quantidade, 0);
  }

  function formatBRL(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const total = totalItens();
    badges.forEach(badge => {
      badge.textContent = total;
      badge.style.display = total > 0 ? 'flex' : 'none';
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
      setTimeout(() => badge.classList.remove('bump'), 250);
    });
  }

  function open() {
    document.getElementById('cartPanel')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('cartPanel')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function render() {
    const body = document.getElementById('cartBody');
    const footer = document.getElementById('cartFooter');
    const subEl = document.getElementById('cartSubtotal');
    const linkEl = document.getElementById('cartWhatsapp');

    if (!body) return;

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p>Seu carrinho est\u00e1 vazio.</p>
        </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    body.innerHTML = items.map(({ key, produto, quantidade, tamanho }) => `
      <div class="cart-item" data-key="${escapeHTML(key)}">
        <img class="cart-item-img" src="${produto.imagens[0] || ''}" alt="${escapeHTML(produto.nome)}" loading="lazy"/>
        <div class="cart-item-info">
          <p class="cart-item-name">${escapeHTML(produto.nome)}</p>
          <p class="cart-item-size">Tamanho: ${escapeHTML(getTamanhoLabel(tamanho))}</p>
          <p class="cart-item-price">${formatBRL(produto.preco)} / un.</p>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-action="dec" data-key="${escapeHTML(key)}" aria-label="Diminuir quantidade">-</button>
            <div class="cart-qty-val">${quantidade}</div>
            <button class="cart-qty-btn" data-action="inc" data-key="${escapeHTML(key)}" aria-label="Aumentar quantidade">+</button>
          </div>
        </div>
      </div>
    `).join('');

    if (subEl) subEl.textContent = formatBRL(subtotal());
    if (linkEl) linkEl.href = buildWhatsAppLink();

    body.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const index = items.findIndex(item => item.key === key);
        if (index === -1) return;
        const delta = btn.dataset.action === 'inc' ? 1 : -1;
        setQuantidade(key, items[index].quantidade + delta);
      });
    });

    body.querySelectorAll('.cart-item-img').forEach(img => {
      img.addEventListener('error', () => {
        img.src = 'data:image/svg+xml,' +
          encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76"><rect width="76" height="76" fill="#f0f0f0"/></svg>');
      }, { once: true });
    });
  }

  function buildWhatsAppLink() {
    if (items.length === 0) return '#';

    const linhas = items.map(({ produto, quantidade, tamanho }) => [
      `Produto: ${produto.nome}`,
      `Tamanho: ${getTamanhoLabel(tamanho)}`,
      `Quantidade: ${quantidade}`,
      ''
    ].join('\n')).join('\n');

    const mensagem = [
      'Ol\u00e1! Gostaria de fazer um pedido:',
      '',
      'Produtos selecionados:',
      '',
      linhas.trim(),
      '',
      'Poderia me informar disponibilidade e prazo de entrega?',
      '',
      'Obrigada!'
    ].join('\n');

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
  }

  function showToast(msg) {
    let toast = document.getElementById('cartToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cartToast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function init() {
    load();
    updateBadge();
    render();

    document.querySelectorAll('.btn-cart, .cart-wrapper').forEach(element => {
      element.addEventListener('click', event => {
        event.preventDefault();
        open();
      });
    });

    document.getElementById('cartOverlay')?.addEventListener('click', close);
    document.getElementById('btnCartClose')?.addEventListener('click', close);
    document.getElementById('btnContinueShopping')?.addEventListener('click', close);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });
  }

  return { init, add, remove, setQuantidade, open, close, showToast };
})();
