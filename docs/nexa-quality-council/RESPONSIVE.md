# Responsividade e acessibilidade responsiva

## Correção implementada
- O menu das abas passa à orientação horizontal até 680 px.
- O JavaScript atualiza `aria-orientation` usando o mesmo limite de 680 px.
- O wrapper do pagamento ocupa as duas colunas do pedido quando o layout tablet usa grade; em fluxos de orçamento/ordem de serviço fica oculto.

## Verificação pendente
A inspeção de código não substitui captura e inspeção visual. Ainda é necessário testar 320, 360, 375, 390, 414, 480, 600, 620, 680, 760, 768, 900, 1024, 1280, 1440 e 1920 px, além de zoom 100%, 125% e 150%.
