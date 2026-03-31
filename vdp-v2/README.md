# Versos de Prata — Documentação do Site

## 📁 Estrutura do Projeto

```
versos-de-prata/
├── index.html          → Homepage (produtos em destaque)
├── produtos.html       → Catálogo completo com busca e filtros
├── produto.html        → Detalhe de produto (carregado via ?id=...)
├── contato.html        → Formulário + botão WhatsApp
│
├── data/
│   └── produtos.js     ← ✅ EDITE AQUI PARA ADICIONAR PRODUTOS
│
├── css/
│   └── style.css       → Todo o estilo visual do site
│
└── js/
    ├── cart.js         → Carrinho: adicionar, remover, finalizar
    ├── render.js       → Geração dos cards de produto
    ├── search.js       → Busca em tempo real + filtros por categoria
    ├── produto.js      → Lógica da página de detalhe
    └── app.js          → Inicialização geral, menu, cookie banner
```

---

## ➕ Como adicionar um produto novo

Abra o arquivo `data/produtos.js` e copie este bloco dentro do array `window.PRODUTOS`:

```javascript
{
  id: "nome-do-produto-sem-espacos",        // único, use hífens
  nome: "Nome Completo do Produto",
  preco: 99.90,
  categoria: "anel",                        // anel | pulseira | colar | brinco | conjunto
  destaque: false,                          // true = aparece na homepage
  estoque: 10,                              // quantidade disponível
  imagens: [
    "URL_DA_IMAGEM_PRINCIPAL",
    "URL_DA_IMAGEM_2",                      // opcional
  ],
  descricao: "Descrição detalhada do produto..."
},
```

> **Dica:** Suba suas fotos no Google Drive, Cloudinary, ou qualquer servidor e cole a URL aqui.

---

## ✏️ Alterar número do WhatsApp

No arquivo `js/cart.js`, linha 9:

```javascript
const WHATSAPP_NUMBER = '5593984178850'; // altere aqui
```

---

## 🛒 Funcionalidades implementadas

| Funcionalidade | Status |
|---|---|
| Produtos carregados de arquivo único | ✅ |
| Busca em tempo real (header + página) | ✅ |
| Filtro por categoria | ✅ |
| Carrinho com localStorage | ✅ |
| Adicionar produto ao carrinho | ✅ |
| Alterar quantidade no carrinho | ✅ |
| Remover produto do carrinho | ✅ |
| Subtotal calculado automaticamente | ✅ |
| Finalizar compra via WhatsApp | ✅ |
| Mensagem WhatsApp automática | ✅ |
| Sem sistema de login | ✅ |
| Lazy loading de imagens | ✅ |
| Skeleton loading | ✅ |
| Responsivo (mobile-first) | ✅ |
| Menu hamburger mobile | ✅ |
| Frete grátis em todos | ✅ |

---

## 📱 Abrir no navegador

Basta abrir o arquivo `index.html` diretamente no navegador, ou usar o Live Server no VS Code:

1. Instale a extensão **Live Server** no VS Code
2. Clique com botão direito em `index.html` → **"Open with Live Server"**

---

## 🔧 Personalização rápida

- **Cores:** edite as variáveis em `css/style.css` (seção `:root`)
- **Logo:** substitua o SVG inline nas tags `<header>` de cada página
- **WhatsApp:** altere o número em `js/cart.js` e em `contato.html`
- **Fontes:** troque os links do Google Fonts nos `<head>` dos HTMLs
