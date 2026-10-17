# VD BF26 | Página de Captura ALUNOS — Black em Dobro do Concurseiro

Página de captura **para quem já é aluno** do Professor Victor Dalton: revelação da oferta em **28/10, às 20h**, num encontro ao vivo no **Zoom**.
Mesma estrutura e identidade da página de não alunos (`../vd-bf26-black-em-dobro/`), com selo diagonal "Exclusivo para alunos".
As duas páginas têm `noindex` aqui (meta robots), por ser oferta exclusiva para alunos.

Página estática. Não precisa de build no deploy: o CSS já está compilado em `css/styles.css`.

- `index.html` — captura (formulário na dobra 1; todos os botões levam a ele)
- `obrigado.html` — passo 2: entrar no Grupo Exclusivo de Alunos (`noindex`)
- `design-system.html` — tokens, tipografia, componentes e movimento

## 1. Subir no GitHub

    git init
    git add .
    git commit -m "primeira versão"
    git branch -M main
    git remote add origin https://github.com/<usuario>/<repo>.git
    git push -u origin main

## 2. Publicar na Vercel

1. vercel.com → Add New → Project → importe o repositório.
2. Framework Preset: **Other**. Build Command: deixe vazio. Output Directory: deixe vazio (raiz).
3. Deploy. O domínio `.vercel.app` sai em segundos.
4. Domínio próprio: Settings → Domains → adicione e aponte o DNS conforme a instrução da tela.

## 3. Onde mexer

| O quê | Onde |
|---|---|
| Destino do formulário (webhook) | `js/main.js`, linha 1: `const ENDPOINT = '...'` |
| Link do Grupo Exclusivo de Alunos (WhatsApp) | `js/main.js`, linha 2: `const GRUPO_VIP = '...'` |
| Política de privacidade (rodapé) | `js/main.js`, linha 3: `const POLITICA_PRIVACIDADE = '...'` |
| Data/hora da revelação (contador) | `js/main.js`, linha 4: `const REVELACAO = '2026-10-28T20:00:00-03:00'` |
| Para onde mandar quem abrir depois das 20h de 28/10 (ex.: link do Zoom) | `js/main.js`, linha 5: `const DESTINO_POS_REVELACAO = ''` |
| Fundo da dobra 1 (arte com o Victor) | `assets/img/hero-bg.webp` (1960×900) e `hero-bg-mobile.webp` (500×900); posição em `src/input.css`, bloco `.hero` |
| Textos | `index.html` e `obrigado.html` |
| Cores e fontes | `src/input.css`, bloco `:root` (depois recompile) |
| Ícones de Banco Central / ANPD / Câmara | `index.html`, sprite no topo (`#i-landmark`, `#i-shield`, `#i-camara`) |
| GTM / Pixel | `<head>` das duas páginas, no comentário `[FALTA: GTM / Pixel]` |

### Formulário

`POST` com `Content-Type: application/json`. O webhook precisa aceitar CORS do domínio da página
(responder ao `OPTIONS`). Resposta fora de 2xx mostra a mensagem de erro; 2xx mostra "Cadastro feito!"
e leva para `obrigado.html` em 1,2 s. Enquanto o `ENDPOINT` não for uma URL `https://`, o formulário
avisa "Formulário ainda não conectado".

```json
{
  "email": "nome@email.com",
  "whatsapp": "5561991234567",
  "origem": "vd-bf26-captura-alunos",
  "url": "https://.../?utm_source=...",
  "enviado_em": "2026-10-16T18:04:14.283Z",
  "utm_source": "...", "utm_campaign": "..."
}
```

As UTMs da visita (e `fbclid`, `gclid`, `sck`, `src`) ficam guardadas na sessão e vão junto no envio.
No sucesso o `main.js` dispara `lead` no `dataLayer` (se houver GTM) e `Lead` no `fbq` (se houver Pixel).

## 4. Recompilar o CSS

Depois de mexer em `index.html`, `obrigado.html`, `design-system.html` ou `src/input.css`:

    npm install && npm run build

Tudo marcado com `[FALTA: ...]` no HTML e no JS precisa ser preenchido antes de anunciar.
