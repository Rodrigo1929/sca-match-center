# SCA Performance (antes SCA Match Center)

App da equipa técnica do SC Angrense: quadros de bolas paradas, Modelo de Jogo animado, ficha e banco de jogo, estatística ao vivo, análise pós-jogo por vídeo, histórico, PDF e modo TV.

A app publicada é um único ficheiro HTML, aberto no link privado da app no claude.ai (PC e iPad), com os dados guardados na base de dados partilhada desse link.

## Começar
```bash
npm install                       # só para os testes
npm run build                     # gera dist/index.html
npm run check                     # build + verificação de sintaxe
npx playwright install chromium   # uma vez
npm test                          # teste no browser, capturas em tests/capturas/
```

## Documentação
- `CLAUDE.md` — como trabalhar no projeto (lido automaticamente pelo Claude Code)
- `docs/regras.md` — regras de negócio decididas
- `docs/dados.md` — modelo de dados
- `CHANGELOG.md` — histórico de versões
