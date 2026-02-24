# SEI Pro — Changelog de Modificações (v1.6.11)

Extensão de navegador que adiciona funcionalidades avançadas ao Sistema Eletrônico de Informações (SEI).

---

## Novas Funcionalidades

### 1. Suporte ao Ollama como plataforma de IA

**Arquivos alterados:** `js/sei-pro-ai.js`

Adicionado suporte à plataforma [Ollama](https://ollama.com) como terceira opção de IA local, ao lado do ChatGPT (OpenAI) e Gemini (Google). O usuário pode configurar o endpoint local do Ollama e selecionar o modelo desejado.

---

### 2. Exibição e edição do modelo de IA nas configurações

**Arquivos alterados:** `html/options.html`, `html/options.js`, `js/init.js`, `js/sei-pro-ai.js`

A aba **Base de Dados** nas configurações passou a exibir o modelo de IA atualmente configurado para cada plataforma, permitindo que o usuário altere o modelo sem precisar reconfigurar a plataforma inteira.

- Campo `MODEL_AI` adicionado ao formulário de configurações
- Função `changeBaseTipo()` em `options.js` atualiza o campo ao trocar de plataforma
- `configBasePro` em `init.js` inclui `MODEL_AI` na inicialização
- `sei-pro-ai.js` prioriza `perfilPlataform.MODEL_AI` ao definir o modelo ativo

---

### 3. Gerenciamento de prompts de IA

**Arquivos alterados:** `html/options.html`, `html/options.js`, `js/init.js`, `js/sei-pro-ai.js`

Nova aba **Prompts IA** nas configurações da extensão, que permite:

- Visualizar e editar os prompts predefinidos (resumo, encaminhamento, dados sensíveis, erros gramaticais etc.)
- Criar novos prompts personalizados
- Configurar a instrução de sistema (`system instruction`) enviada à IA em todas as conversas

**Funções adicionadas em `options.js`:**
- `getDefaultAIPrompts()` — retorna os prompts padrão do sistema
- `loadAIPrompts()` — carrega os prompts salvos para exibição
- `saveAIPrompts()` — persiste as alterações no storage

**Funções adicionadas em `init.js`:**
- `loadAIPromptsToStorage()` — inicializa os prompts no storage na primeira execução

**Funções adicionadas em `sei-pro-ai.js`:**
- `buildPromptOptions()` — monta o `<select>` de prompts com os valores do storage
- `defaultSystemInstruction` — instrução de sistema substituível pelo usuário

---

### 4. Seleção múltipla de documentos no chat de IA

**Arquivos alterados:** `js/sei-pro-ai.js`

No chat de IA, era possível enviar apenas um documento por vez (ou todo o processo). Agora o usuário pode adicionar vários documentos a uma fila e enviá-los juntos para análise.

**Como funciona:**
- Um botão `+` (`#btnAddDocAI`) ao lado do seletor de documentos adiciona o documento selecionado como uma tag/chip na lista `#docAIMultiList`
- Cada tag exibe o nome do documento e um botão `×` para removê-la
- Quando há 2 ou mais tags na lista, `sendAIRequest` monta um array `multiDocs` com os dados de todos os documentos
- `makeFooterPrompt` itera sobre o array e inclui o conteúdo de cada documento no prompt enviado à IA

**Funções adicionadas:**
- `addDocToMultiList()` — adiciona o documento selecionado à fila, evitando duplicatas
- Atualização de `makeFooterPrompt(data_protocolo, respost_id, multiDocs?)` para suportar múltiplos documentos

---

### 5. Botão "Copiar texto formatado" nas respostas da IA

**Arquivos alterados:** `js/sei-pro-ai.js`

Adicionado um segundo botão de cópia em cada resposta da IA (ícone `fa-file-alt`), que copia o conteúdo com formatação HTML preservada (`text/html` no clipboard). Ao colar em editores de texto rico (como o editor do SEI), a formatação de negrito, itálico, listas e tabelas é mantida.

**Função adicionada:**
- `copyHtmlResponseAI(this_)` — usa `copyToClipboardHTML()` para copiar HTML com MIME type correto

---

## Correções de Bugs

### 1. Erro ao selecionar tipo de documento no novo SEI

**Arquivo:** `js/sei-pro-ai.js`

O novo SEI substituiu os links `<a>` do formulário de tipo de documento por elementos que exigem envio via POST. O código anterior tentava simular um clique em um anchor, o que não funcionava.

**Correção:** A criação de documentos via IA passou a submeter o formulário diretamente via POST, compatível com as versões antiga e nova do SEI.

---

### 2. Popup travado em "Aguarde... Gerando documento"

**Arquivo:** `js/sei-pro-ai.js`

Após a IA criar um documento, o popup ficava preso na mensagem de carregamento. O problema era que o código usava `.text()` do jQuery para detectar o estado da página, que não reconhecia corretamente o conteúdo do documento gerado.

**Correção:** Substituída a detecção por expressão regular (`regex`) aplicada ao HTML bruto da resposta, tornando a identificação do estado mais robusta.

---

### 3. Erros de JavaScript no carregamento

**Arquivo:** `js/sei-functions-pro.js` e outros

Quatro erros corrigidos que causavam falhas silenciosas ou interrupção de funcionalidades:

| Erro | Causa | Correção |
|------|-------|----------|
| `Cannot read properties of null (NAMESPACE_SPRO)` | Referência a namespace antes de ser inicializado | Adicionada verificação de existência antes do acesso |
| Race condition com `moment-duration-format` | Biblioteca carregada de forma assíncrona | Adicionado controle de ordem de carregamento |
| `Cannot read properties of undefined (.replace)` | String `undefined` passada para `.replace()` | Adicionada verificação `typeof` antes da chamada |
| `$(...).resizable is not a function` | Plugin jQuery UI não carregado no contexto | Adicionada verificação de disponibilidade do método |

---

### 4. Botão copiar texto enviava tags HTML como texto literal

**Arquivo:** `js/sei-functions-pro.js` — função `copyToClipboardWithBR` (linha 5730)

O botão "Copiar texto" nas respostas da IA copiava o conteúdo com as tags HTML intactas (ex: `<p>`, `<strong>`, `<h2>`, `<ul>`, `<li>`), que apareciam como texto literal ao colar.

**Correção:** A função foi reescrita para converter elementos de bloco em quebras de linha antes de remover as tags, e decodificar entidades HTML:

```
<p>      →  \n
<h1-h6>  →  \n\n
<li>     →  • (bullet)
<tr>     →  \n
<td>     →  \t (tab)
&nbsp;   →  espaço
&amp;    →  &
```

Quebras de linha excessivas (3+) são colapsadas para no máximo 2.

---

### 5. Botão "Adicionar à seleção múltipla" inativo antes da primeira resposta da IA

**Arquivo:** `js/sei-pro-ai.js`

O handler de clique do botão `#btnAddDocAI` (e do `×` nas tags) estava registrado dentro da função `initFunctionsChat()`, que só é chamada após a primeira resposta da IA chegar. Isso fazia com que o botão parecesse não funcionar logo ao abrir o chat.

**Correção:** Os handlers foram movidos para o callback `open:` do dialog jQuery, sendo registrados assim que a janela de chat é aberta.

---

### 6. Sobreposição de botões na janela de chat de IA

**Arquivo:** `js/sei-pro-ai.js` — template HTML de `boxAIActions`

Os botões de plataforma (`btnMainPlataform`, `btnChangePlataform`, `btnSecondPlataform`) usavam `position: absolute` com valores fixos em pixels (`right: 150px`, `right: 205px`, `right: 240px`), enquanto o botão "Enviar" usava `float: right`. A adição do botão `#btnAddDocAI` deslocou o layout inline, causando sobreposição com os botões absolutamente posicionados.

**Correção:** O container `.input_prompt` foi convertido para **flexbox**:

- Removido `position: absolute` e valores fixos dos botões de plataforma
- Removido `float: right` do botão "Enviar"
- Adicionado `display: flex; align-items: center; flex-wrap: wrap; gap: 4px` ao container
- Inserido `<span style="flex:1">` como espaçador entre os botões de ação (esquerda) e os de plataforma/envio (direita)
- Os botões da direita agora se posicionam naturalmente sem valores hardcoded

---

## Arquivos Modificados

| Arquivo | Tipo de alteração |
|---------|-------------------|
| `js/sei-pro-ai.js` | Novas funcionalidades e correções de bugs |
| `js/sei-functions-pro.js` | Correção do `copyToClipboardWithBR` |
| `html/options.html` | Nova aba "Prompts IA", campo de modelo |
| `html/options.js` | Gerenciamento de prompts e modelo de IA |
| `js/init.js` | Inicialização de prompts e modelo no storage |

