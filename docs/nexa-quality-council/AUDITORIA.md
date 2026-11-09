# NEXO Quality Council — Auditoria

**Data:** 6 de novembro de 2026  
**Repositório:** `nexoinfo801-ship-it/nexoinfo801-ship-it.github.io`  
**Branch:** `nexa-quality-corrections-2026-11-06`  
**Base:** `main`  
**Escopo:** página institucional, demonstração interativa, calculadora comercial, atendimento Cleópatra e aviso de privacidade.

## Resultado desta rodada

Foram implementadas correções para os problemas identificados na análise estática do código publicado:

1. Distinção entre preço de referência do NEXO Essencial e condição promocional.
2. Indicadores do painel da demonstração específicos por ramo.
3. Quantidade de produtos derivada do catálogo apresentado.
4. Alertas de estoque calculados a partir das quantidades de cada ramo, excluindo serviços.
5. Separação de fluxos de venda, orçamento de funilaria e ordem de serviço.
6. Ocultação da forma de pagamento em orçamentos e ordens de serviço.
7. Atualização dos rótulos dos relatórios para pedidos, vendas, orçamentos ou atendimentos.
8. Ajuste do breakpoint ARIA para acompanhar o menu horizontal até 680 px.
9. Semântica de imagem aplicada aos gráficos ilustrativos e à prévia visual.
10. Ampliação dos testes de modelo para validar metadados, alertas e fluxos específicos dos oito segmentos.

## Ressalvas

- Não foram inventados recursos do ERP real; toda a demonstração continua identificada como fictícia.
- Os valores e contagens por segmento são dados de demonstração, não dados de clientes ou de produção.
- A diferença entre números de contato encontrados em páginas públicas não foi alterada; precisa de confirmação do responsável.
- A validação visual em navegador real e a matriz física de resoluções dependem de execução em navegador. Não são declaradas como aprovadas nesta rodada.
- O aviso de privacidade foi preservado. A revisão jurídica do conteúdo não está incluída.

## Proteção de produção

As alterações foram feitas em branch separada. A branch `main` e o site publicado não foram modificados nem atualizados por esta rodada.
