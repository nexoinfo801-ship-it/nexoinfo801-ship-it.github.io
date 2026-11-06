# Testes e validações

## Resultado do CI

- Workflow: **Site quality checks**
- Execução: **#38**
- Resultado: **success**
- Commit validado: `da0c9c2ee657324105c830b5df4b9a161c3901fd`
- Execução: https://github.com/nexoinfo801-ship-it/nexoinfo801-ship-it.github.io/actions/runs/42253145409

Passos confirmados como concluídos:
1. Checkout do repositório.
2. Configuração do Node.js 22.
3. `node scripts/validate-site.mjs` — sucesso.
4. `node scripts/test-site-model.mjs` — sucesso.

Trechos de saída:
- `Validação estática ampliada do NEXO concluída sem falhas.`
- `Testes de modelo aprovados: 8 ramos, catálogos, integridade de preços/estoque e 15 limites da calculadora.`

## Automação existente e ampliada

O repositório já possuía:
- `scripts/validate-site.mjs`: validações estáticas de HTML, referências, acessibilidade estrutural e sintaxe dos scripts inline.
- `scripts/test-site-model.mjs`: testes dos oito catálogos e dos limites da calculadora.
- `.github/workflows/site-quality.yml`: workflow do GitHub Actions para pull requests e execução manual.

Nesta branch, `scripts/test-site-model.mjs` foi ampliado para verificar:
- modo correto de cada um dos oito segmentos;
- presença e validade dos indicadores demonstrativos;
- rótulos específicos por segmento;
- quantidade de alertas de estoque calculada para cada catálogo;
- separação entre orçamento, ordem de serviço e venda;
- ocultação do pagamento nos fluxos de serviço;
- correspondência entre quantidade apresentada e catálogo;
- coerência básica dos preços publicados.

## Limites

A suíte automatizada passou no GitHub Actions. Ela não substitui testes de navegador. Não comprova renderização visual, comportamento real de foco, acessibilidade com leitor de tela, envio ao WhatsApp ou compatibilidade em dispositivos físicos. Esses itens permanecem pendentes até execução em navegador.
