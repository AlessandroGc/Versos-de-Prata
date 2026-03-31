/**
 * VERSOS DE PRATA — cart.js
 * ===========================
 * Gerenciamento completo do carrinho de compras.
 * Persiste dados no localStorage.
 * Gera mensagem e abre WhatsApp para finalizar pedido.
 */

const WHATSAPP_NUMBER = '5593984178850'; // +55 93 98417-8850

const Cart = (function () {

  /* ─── Estado ─── */
  let items = [];   // [{ produto, quantidade }]

  /* ─── Persistência ─── */
  function load() {
    try {
      const saved = localStorage.getItem('vdp_cart');
      items = saved ? JSON.parse(saved) : [];
    } catch (e) {
      items = [];
    }
  }

  function save() {
    try {
      localStorage.setItem('vdp_cart', JSON.stringify(items));
    } catch (e) { /* quota excedida — ignora */ }
  }

  /* ─── Métodos públicos ─── */

  /** Adiciona ou incrementa quantidade de um produto */
  function add(produto, quantidade) {
    quantidade = parseInt(quantidade, 10) || 1;
    const idx = items.findIndex(i => i.produto.id === produto.id);

    if (idx > -1) {
      items[idx].quantidade += quantidade;
    } else {
      // Copia apenas os campos necessários para economizar storage
      items.push({
        produto: {
          id:      produto.id,
          nome:    produto.nome,
          preco:   produto.preco,
          imagens: produto.imagens
        },
        quantidade
      });
    }
    save();
    render();
    updateBadge();
    showToast(`"${produto.nome.substring(0, 30)}..." adicionado ao carrinho`);
  }

  /** Remove um item do carrinho pelo id */
  function remove(produtoId) {
    items = items.filter(i => i.produto.id !== produtoId);
    save();
    render();
    updateBadge();
  }

  /** Altera a quantidade de um item */
  function setQuantidade(produtoId, novaQtd) {
    novaQtd = parseInt(novaQtd, 10);
    if (isNaN(novaQtd) || novaQtd < 1) {
      remove(produtoId);
      return;
    }
    const idx = items.findIndex(i => i.produto.id === produtoId);
    if (idx > -1) {
      items[idx].quantidade = novaQtd;
      save();
      render();
      updateBadge();
    }
  }

  /** Total de itens (soma de quantidades) */
  function totalItens() {
    return items.reduce((acc, i) => acc + i.quantidade, 0);
  }

  /** Subtotal em reais */
  function subtotal() {
    return items.reduce((acc, i) => acc + i.produto.preco * i.quantidade, 0);
  }

  /** Formata preço brasileiro */
  function formatBRL(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /* ─── Atualiza badge numérico ─── */
  function updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const total  = totalItens();
    badges.forEach(b => {
      b.textContent = total;
      b.style.display = total > 0 ? 'flex' : 'none';
      // animação de "bump"
      b.classList.remove('bump');
      void b.offsetWidth;
      b.classList.add('bump');
      setTimeout(() => b.classList.remove('bump'), 250);
    });
  }

  /* ─── Abre / fecha painel ─── */
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

  /* ─── Renderiza lista de itens ─── */
  function render() {
    const body    = document.getElementById('cartBody');
    const footer  = document.getElementById('cartFooter');
    const subEl   = document.getElementById('cartSubtotal');
    const linkEl  = document.getElementById('cartWhatsapp');

    if (!body) return;

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p>Seu carrinho está vazio.</p>
        </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    // Exibe footer
    if (footer) footer.style.display = 'block';

    // Renderiza itens
    body.innerHTML = items.map(({ produto, quantidade }) => `
      <div class="cart-item" data-id="${produto.id}">
        <img
          class="cart-item-img"
          src="${produto.imagens[0]}"
          alt="${produto.nome}"
          loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"76\\" height=\\"76\\"><rect width=\\"76\\" height=\\"76\\" fill=\\"%23f0f0f0\\"/></svg>'"
        />
        <div class="cart-item-info">
          <p class="cart-item-name">${produto.nome}</p>
          <p class="cart-item-price">${formatBRL(produto.preco)} / un.</p>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-action="dec" data-id="${produto.id}"
                    aria-label="Diminuir quantidade">−</button>
            <div class="cart-qty-val">${quantidade}</div>
            <button class="cart-qty-btn" data-action="inc" data-id="${produto.id}"
                    aria-label="Aumentar quantidade">+</button>
          </div>
        </div>
        <button class="btn-remove-item" data-id="${produto.id}"
                aria-label="Remover do carrinho">✕</button>
      </div>
    `).join('');

    // Subtotal
    if (subEl) subEl.textContent = formatBRL(subtotal());

    // Link WhatsApp
    if (linkEl) linkEl.href = buildWhatsAppLink();

    // Eventos nos botões renderizados
    body.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id  = btn.dataset.id;
        const idx = items.findIndex(i => i.produto.id === id);
        if (idx === -1) return;
        const delta = btn.dataset.action === 'inc' ? 1 : -1;
        setQuantidade(id, items[idx].quantidade + delta);
      });
    });

    body.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', () => remove(btn.dataset.id));
    });
  }

  /* ─── Monta link do WhatsApp ─── */
  function buildWhatsAppLink() {
    if (items.length === 0) return '#';

    const linhas = items.map(({ produto, quantidade }) =>
      `• Produto: ${produto.nome} | Quantidade: ${quantidade}`
    ).join('\n');

    const mensagem =
      `Olá! Gostaria de comprar os seguintes produtos:\n\n` +
      `${linhas}\n\n` +
      `Poderia me informar a disponibilidade e o valor total, por favor?`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
  }

  /* ─── Toast de feedback ─── */
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

  /* ─── Init ─── */
  function init() {
    load();
    updateBadge();
    render();

    // Botão abrir carrinho
    document.querySelectorAll('.btn-cart, .cart-wrapper').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        open();
      });
    });

    // Fechar overlay e botão X
    document.getElementById('cartOverlay')?.addEventListener('click', close);
    document.getElementById('btnCartClose')?.addEventListener('click', close);
    document.getElementById('btnContinueShopping')?.addEventListener('click', close);

    // ESC fecha carrinho
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  /* ─── API pública ─── */
  return { init, add, remove, setQuantidade, open, close, showToast };

})();
