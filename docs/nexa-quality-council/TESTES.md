# Testes e validações

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

Os scripts e workflow ainda precisam ser executados pelo GitHub Actions após a abertura do pull request. Não afirmo aprovação de CI antes do resultado.

A suíte estática não substitui testes de navegador. Não comprova renderização visual, comportamento real de foco, acessibilidade com leitor de tela, envio ao WhatsApp ou compatibilidade em dispositivos físicos. Esses itens permanecem pendentes até execução em navegador.
