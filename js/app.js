/**
 * VERSOS DE PRATA — app.js
 * ==========================
 * Inicialização global: nav mobile, cookie banner, marcação de link ativo.
 * Carrega os módulos corretos conforme a página atual.
 */

document.addEventListener('DOMContentLoaded', function () {

  /* ─── Identifica a página atual ─── */
  const path     = window.location.pathname;
  const pageName = path.split('/').pop().replace('.html', '') || 'index';

  /* ─── Nav: marcar link ativo ─── */
  document.querySelectorAll('.site-nav a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const name = href.replace('.html', '');

    if (
      (name === 'index' && (pageName === 'index' || pageName === '')) ||
      (name === pageName)
    ) {
      link.classList.add('active');
    }
  });

  /* ─── Menu mobile (hamburger) ─── */
  const btnMenu = document.getElementById('btnMenu');
  const siteNav = document.getElementById('siteNav');

  btnMenu?.addEventListener('click', () => {
    btnMenu.classList.toggle('open');
    siteNav?.classList.toggle('open');
    const expanded = siteNav?.classList.contains('open');
    btnMenu.setAttribute('aria-expanded', expanded);
  });

  // Fecha menu ao clicar em link
  siteNav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btnMenu?.classList.remove('open');
      siteNav.classList.remove('open');
    });
  });

  /* ─── Cookie banner ─── */
  const banner    = document.getElementById('cookieBanner');
  const btnAccept = document.getElementById('cookieAccept');

  if (banner) {
    if (!localStorage.getItem('vdp_cookies')) {
      banner.style.display = 'flex';
    }
    btnAccept?.addEventListener('click', () => {
      localStorage.setItem('vdp_cookies', '1');
      banner.style.display = 'none';
    });
  }

  /* ─── Inicia o carrinho em TODAS as páginas ─── */
  Cart.init();

  /* ─── Inicia módulo de busca (overlay) em todas as páginas ─── */
  Search.init();

  /* ─── Homepage: renderiza produtos em destaque ─── */
  if (pageName === 'index' || pageName === '') {
    const grid = document.getElementById('destaquesGrid');
    if (grid) {
      Render.renderSkeletons(grid, 3);
      // Micro-delay para exibir skeleton antes de renderizar
      setTimeout(() => {
        const destaques = (window.PRODUTOS || []).filter(p => p.destaque).slice(0, 3);
        Render.renderGrid(grid, destaques);
      }, 120);
    }
  }

  /* ─── Página de produtos: busca + filtro + grid ─── */
  if (pageName === 'produtos') {
    const grid = document.getElementById('produtosGrid');
    if (grid) {
      Render.renderSkeletons(grid, 8);
      setTimeout(() => {
        Search.updateGrid();
      }, 120);
    }
  }

  /* ─── Página de detalhe do produto ─── */
  if (pageName === 'produto') {
    ProdutoPage.init();
  }

  /* ─── Página de contato ─── */
  if (pageName === 'contato') {
    initContactForm();
  }

  /* ─── Suaviza scroll em âncoras internas ─── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});

/* ─── Formulário de contato ─── */
function initContactForm() {
  const form    = document.getElementById('formContato');
  const btnSend = document.getElementById('btnEnviar');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    btnSend.disabled    = true;
    btnSend.textContent = 'Enviando...';

    // Simulação de envio (integrar com backend/FormSubmit/EmailJS se necessário)
    setTimeout(() => {
      btnSend.textContent = '✓ Mensagem enviada!';
      btnSend.style.background = '#27ae60';
      form.reset();
      setTimeout(() => {
        btnSend.textContent = 'Enviar mensagem';
        btnSend.style.background = '';
        btnSend.disabled = false;
      }, 3500);
    }, 1200);
  });
}
