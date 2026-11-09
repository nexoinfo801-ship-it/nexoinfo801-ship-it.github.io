# Correções implementadas

## Comercial
- O plano NEXO Essencial passou a exibir R$ 149,90/mês como preço de referência.
- A condição de lançamento de R$ 49,90/mês por 12 meses foi explicitada separadamente, mantendo a condição para os primeiros 10 clientes e a validação contratual.

## Demonstração
- Cada ramo possui valores-base fictícios próprios.
- A quantidade cadastrada exibida no painel passa a refletir os itens do catálogo daquele ramo.
- Alertas de estoque baixo são calculados a partir dos itens com quantidade entre 1 e 7; serviços não são tratados como estoque.
- Rótulos de valor e de operações são adaptados para evitar chamar orçamentos ou atendimentos de faturamento/vendas.
- O estado de reinicialização volta a usar os valores demonstrativos-base do ramo selecionado.

## Fluxos de serviço
- Funilaria usa conclusão de orçamento demonstrativo.
- Oficina usa conclusão de ordem de serviço demonstrativa.
- A forma de pagamento é ocultada em ambos os fluxos.
- Orçamentos e ordens de serviço incrementam a contagem de operações, mas seus valores permanecem identificados como estimativas, não como receita ou venda registrada.
- Vendas e pedidos continuam com fluxo de demonstração e pagamento fictício.

## Acessibilidade
- A orientação ARIA das abas agora acompanha o breakpoint visual de 680 px.
- A prévia visual e o gráfico demonstrativo receberam semântica `role="img"` e descrições acessíveis.
