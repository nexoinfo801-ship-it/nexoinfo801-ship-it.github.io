import fs from "node:fs";
import vm from "node:vm";

const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = (path) => {
  check(fs.existsSync(path), "Arquivo obrigatório ausente: " + path);
  return fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
};

function validateHtml(file, options = {}) {
  const html = read(file);
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((m) => m[1]);
  const idSet = new Set(ids);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  check(duplicates.length === 0, file + ": IDs duplicados: " + [...new Set(duplicates)].join(", "));

  const anchors = [...html.matchAll(/href=["']#([^"'\s]+)["']/gi)].map((m) => m[1]);
  const brokenAnchors = [...new Set(anchors.filter((id) => !idSet.has(id)))];
  check(brokenAnchors.length === 0, file + ": âncoras sem destino: " + brokenAnchors.join(", "));

  check(/<html\b[^>]*\blang=["']pt-BR["']/i.test(html), file + ": idioma pt-BR ausente.");
  check(/<title>\s*[^<]+\s*<\/title>/i.test(html), file + ": título ausente.");
  check(/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']{40,}["']/i.test(html), file + ": meta description ausente ou curta.");
  check((html.match(/<main\b/gi) || []).length === 1, file + ": deve existir exatamente um main.");
  check(idSet.has("conteudo"), file + ": destino #conteudo ausente.");
  check(/class=["'][^"']*skip-link[^"']*["'][^>]*href=["']#conteudo["']/i.test(html) || /href=["']#conteudo["'][^>]*class=["'][^"']*skip-link/i.test(html), file + ": link para pular ao conteúdo ausente.");
  check(!/^\s*er noreferrer">/m.test(html), file + ": fragmento de atributo HTML órfão.");

  const labels = new Set([...html.matchAll(/<label\b[^>]*\bfor=["']([^"']+)["']/gi)].map((m) => m[1]));
  const controls = [...html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)];
  for (const [index, match] of controls.entries()) {
    const attrs = match[2];
    if (/\btype=["']hidden["']/i.test(attrs)) continue;
    const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
    const ariaName = /\baria-label=["'][^"']+["']/i.test(attrs) || /\baria-labelledby=["'][^"']+["']/i.test(attrs);
    check(Boolean(ariaName || (id && labels.has(id))), file + ": campo sem nome acessível (" + (id || "controle " + (index + 1)) + ").");
  }

  const images = [...html.matchAll(/<img\b([^>]*)>/gi)];
  for (const [index, match] of images.entries()) {
    check(/\balt=["'][^"']*["']/i.test(match[1]), file + ": imagem sem atributo alt (imagem " + (index + 1) + ").");
  }

  const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
  for (const [index, match] of buttons.entries()) {
    const attrs = match[1];
    const textContent = match[2].replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").trim();
    const ariaName = /\baria-label=["'][^"']+["']/i.test(attrs) || /\baria-labelledby=["'][^"']+["']/i.test(attrs);
    const titleName = /\btitle=["'][^"']+["']/i.test(attrs);
    check(Boolean(ariaName || titleName || textContent), file + ": botão sem nome acessível (botão " + (index + 1) + ").");
  }

  const externalBlank = [...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)].map((m) => m[0]);
  check(externalBlank.every((tag) => /\brel=["'][^"']*noopener/i.test(tag)), file + ": link target=_blank sem rel=noopener.");

  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  let executableScripts = 0;
  for (const [index, match] of scripts.entries()) {
    if (/application\/ld\+json/i.test(match[1])) continue;
    executableScripts += 1;
    try { new vm.Script(match[2], { filename: file + "-script-" + (index + 1) + ".js" }); }
    catch (error) { errors.push(file + ": erro de sintaxe no script " + (index + 1) + ": " + error.message); }
  }

  if (options.mainPage) {
    check(idSet.has("conteudo"), "index.html: destino #conteudo ausente.");
    check(/class=["'][^"']*skip-link[^"']*["'][^>]*href=["']#conteudo["']/i.test(html) || /href=["']#conteudo["'][^>]*class=["'][^"']*skip-link/i.test(html), "index.html: link para pular ao conteúdo ausente.");
    check(/<a\b[^>]*class=["'][^"']*skip-link[^"']*["'][^>]*href=["']#conteudo["'][^>]*>\s*Pular para o conteúdo principal\s*<\/a>/i.test(html), "index.html: link de salto não possui texto claro ou destino correto.");
    check(/:focus-visible\s*\{[^}]*outline/i.test(html), "index.html: estilo de foco visível ausente.");
    check(/@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(html), "index.html: preferência de movimento reduzido não contemplada.");
    check(/event\.key===['"]ArrowDown['"]|event\.key===['"]ArrowRight['"]/i.test(html) && /event\.key===['"]ArrowUp['"]|event\.key===['"]ArrowLeft['"]/i.test(html), "index.html: navegação por setas nas abas da demonstração ausente.");
    check(/event\.key===['"]Home['"]/.test(html) && /event\.key===['"]End['"]/.test(html), "index.html: atalhos Home/End nas abas da demonstração ausentes.");
    check(/setAttribute\(['"]aria-selected['"],active\?['"]true['"]:['"]false['"]\)/i.test(html) && /\.tabIndex=active\?0:-1/i.test(html), "index.html: atualização do estado acessível e foco das abas ausente.");
    check(/id=["']chatLaunch["'][^>]*aria-controls=["']nexoChat["'][^>]*aria-expanded=["']false["']/i.test(html), "index.html: botão da Cleópatra sem controles ou estado inicial acessível.");
    check(/id=["']nexoChat["'][^>]*role=["']dialog["'][^>]*aria-labelledby=["']chatTitle["'][^>]*aria-describedby=["']chatDisclaimer["']/i.test(html), "index.html: painel da Cleópatra sem semântica de diálogo e descrição.");
    check(/id=["']chatLog["'][^>]*role=["']log["'][^>]*aria-live=["']polite["']/i.test(html), "index.html: conversa da Cleópatra sem região viva acessível.");
    check(/id=["']chatInput["'][^>]*aria-label=["']Escreva sua dúvida["']/i.test(html) && /id=["']chatInput["'][^>]*maxlength=["']500["']/i.test(html), "index.html: campo de mensagem da Cleópatra sem nome acessível ou limite de tamanho.");
    check(/event\.key===['"]Escape['"][\\s\\S]{0,300}nexoCloseChat/i.test(html), "index.html: fechamento da Cleópatra pela tecla Escape ausente.");
    check(/nexoCloseChat[\\s\\S]{0,300}launch\.focus\(\)/i.test(html), "index.html: foco não retorna ao botão ao fechar a Cleópatra.");
    check(/if\(opening\)[\\s\\S]{0,180}input\.focus\(\)/i.test(html), "index.html: foco inicial no campo de mensagem ao abrir a Cleópatra ausente.");

    const references = [...html.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
    const missingReferences = [...new Set(references.filter((id) => !idSet.has(id)))];
    check(missingReferences.length === 0, "index.html: getElementById sem destino: " + missingReferences.join(", "));

    const tabs = [...html.matchAll(/<button\b([^>]*\brole=["']tab["'][^>]*)>/gi)].map((m) => m[1]);
    const tabIds = new Set(tabs.map((attrs) => attrs.match(/\bid=["']([^"']+)["']/i)?.[1]).filter(Boolean));
    check(tabs.length > 0, "index.html: nenhuma aba acessível encontrada.");
    for (const attrs of tabs) {
      const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
      const panelId = attrs.match(/\baria-controls=["']([^"']+)["']/i)?.[1];
      check(Boolean(id && panelId && idSet.has(panelId)), "index.html: aba sem aria-controls válido (" + (id || "sem ID") + ").");
      if (panelId) {
        const panelTag = [...html.matchAll(/<([a-z0-9]+)\b([^>]*\brole=["']tabpanel["'][^>]*)>/gi)]
          .find((m) => m[2].includes('id="' + panelId + '"') || m[2].includes("id='" + panelId + "'"));
        check(Boolean(panelTag), "index.html: painel associado à aba não encontrado (" + panelId + ").");
        if (panelTag) {
          const labelledBy = panelTag[2].match(/\baria-labelledby=["']([^"']+)["']/i)?.[1];
          check(labelledBy === id && tabIds.has(labelledBy), "index.html: aria-labelledby do painel não corresponde à aba (" + panelId + ").");
        }
      }
    }

    const localLinks = [...html.matchAll(/\b(?:href|src)=["']([^"'#][^"']*)["']/gi)]
      .map((m) => m[1])
      .filter((url) => !/^(?:[a-z]+:|\/\/|data:|mailto:|tel:)/i.test(url));
    for (const url of [...new Set(localLinks)]) {
      const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
      const target = pathname === "" || pathname.endsWith("/") ? pathname + "index.html" : pathname;
      check(fs.existsSync(target), "index.html: arquivo local referenciado não encontrado: " + url);
    }
    check(executableScripts > 0, "index.html: nenhum script executável encontrado.");
    console.log("- index.html: " + ids.length + " IDs, " + references.length + " referências JS, " + anchors.length + " âncoras, " + tabs.length + " abas e " + controls.length + " campos.");
  } else {
    check(/Aviso de privacidade/i.test(html), "privacidade.html: conteúdo de privacidade não identificado.");
    check(/nexoinfo801@gmail\.com/i.test(html), "privacidade.html: e-mail de contato ausente.");
    check(/wa\.me\/5514998356762/i.test(html), "privacidade.html: contato WhatsApp ausente.");
    console.log("- " + file + ": " + ids.length + " IDs e " + controls.length + " campos.");
  }
}

validateHtml("index.html", { mainPage: true });
validateHtml("privacidade.html");

const homeHtml = read("index.html");

const privacyHtml = read("privacidade.html");
check(/id=["']diagnosticForm["']/.test(homeHtml), "index.html: formulário comercial ausente.");
check(/id=["']diagnosticForm["'][\s\S]*?type=["']submit["'][\s\S]*?Continuar pelo WhatsApp/i.test(homeHtml), "index.html: ação principal do formulário comercial ausente.");
check(/id=["']diagnosticForm["'][\s\S]*?não envia nem salva os dados em um servidor/i.test(homeHtml), "index.html: aviso de privacidade do formulário ausente ou divergente.");
check(/id=["']diagnosticForm["'][\s\S]*?wa\.me\/5514998356762/i.test(homeHtml), "index.html: destino WhatsApp do formulário não encontrado.");
check(/simulação interativa com dados fictícios/i.test(homeHtml), "index.html: demonstração não identifica claramente os dados fictícios.");
check(/não está conectada ao sistema NEXO real/i.test(homeHtml), "index.html: demonstração não informa que não está conectada ao sistema real.");
check(/não grava vendas ou altera estoques/i.test(homeHtml), "index.html: limites da simulação de vendas e estoque não estão informados.");
check(/respostas programadas/i.test(homeHtml) && /não consulta o sistema NEXO real/i.test(privacyHtml), "Cleópatra: transparência sobre respostas demonstrativas ausente.");
check(/não envia esses campos a um servidor próprio/i.test(privacyHtml), "Privacidade: explicação sobre o envio dos campos do formulário ausente.");


check(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/nexoinfo801-ship-it\.github\.io\/["']/i.test(homeHtml), "index.html: URL canonical ausente ou incorreta.");
check(/<meta\b[^>]*property=["']og:title["'][^>]*content=["'][^"']+["']/i.test(homeHtml), "index.html: Open Graph title ausente.");
check(/<meta\b[^>]*property=["']og:description["'][^>]*content=["'][^"']+["']/i.test(homeHtml), "index.html: Open Graph description ausente.");
check(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']https:\/\/nexoinfo801-ship-it\.github\.io\/["']/i.test(homeHtml), "index.html: Open Graph URL ausente ou incorreta.");
const jsonLdBlocks = [...homeHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter((match) => /application\/ld\+json/i.test(match[1]));
check(jsonLdBlocks.length > 0, "index.html: bloco JSON-LD ausente.");
for (const [index, block] of jsonLdBlocks.entries()) {
  try {
    const structured = JSON.parse(block[2]);
    const graph = Array.isArray(structured["@graph"]) ? structured["@graph"] : [structured];
    check(graph.some((entry) => entry["@type"] === "Organization" && entry.name && entry.url), "index.html: entidade Organization incompleta no JSON-LD.");
    check(graph.some((entry) => entry["@type"] === "SoftwareApplication" && entry.name && entry.applicationCategory), "index.html: entidade SoftwareApplication incompleta no JSON-LD.");
  } catch (error) {
    errors.push("index.html: JSON-LD inválido no bloco " + (index + 1) + ": " + error.message);
  }
}

check(/"logo":\s*"https:\/\/nexoinfo801-ship-it\.github\.io\/favicon\.svg"/.test(homeHtml), "index.html: logo da organização ausente nos dados estruturados.");
check(/"contactPoint":\s*\{[\s\S]*?"contactType":\s*"sales"/.test(homeHtml), "index.html: contato comercial ausente nos dados estruturados.");

const robots = read("robots.txt");
check(/Sitemap:\s*https:\/\/nexoinfo801-ship-it\.github\.io\/sitemap\.xml/i.test(robots), "robots.txt: referência ao sitemap ausente.");

const sitemap = read("sitemap.xml");
for (const url of [
  "https://nexoinfo801-ship-it.github.io/",
  "https://nexoinfo801-ship-it.github.io/privacidade.html"
]) check(sitemap.includes("<loc>" + url + "</loc>"), "sitemap.xml: URL obrigatória ausente: " + url);

if (errors.length) {
  console.error("Falhas na validação estática do NEXO:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("Validação estática ampliada do NEXO concluída sem falhas.");
