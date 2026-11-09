# Revisão de segurança — escopo estático

- O chat demonstrativo utiliza `textContent` para inserir mensagens do usuário.
- Os nomes, preços e ícones que alimentam a renderização da lista da demonstração vêm de estruturas estáticas definidas no próprio código.
- Links com `target="_blank"` foram verificados para presença de `rel="noopener"` na inspeção estática anterior.
- O formulário prepara uma URL do WhatsApp com `encodeURIComponent`; os campos são revistos pelo usuário antes do envio.
- A página continua informando que não armazena leads em banco próprio.

## Pendências
- Teste dinâmico de XSS e de entradas maliciosas no navegador.
- Verificação operacional dos destinos externos.
- Revisão jurídica do aviso de privacidade segundo o tratamento real da empresa.

Esta revisão não equivale a certificação ou garantia de segurança.
