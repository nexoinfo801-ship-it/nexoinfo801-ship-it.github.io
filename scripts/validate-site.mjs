import fs from "node:fs";
import vm from "node:vm";

const file = "index.html";
if (!fs.existsSync(file)) throw new Error("index.html não encontrado.");
const html = fs.readFileSync(file, "utf8");
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((m) => m[1]);
const idSet = new Set(ids);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
check(duplicates.length === 0, `IDs duplicados: ${[...new Set(duplicates)].join(", ")}`);

const references = [...html.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
const missingReferences = [...new Set(references.filter((id) => !idSet.has(id)))];
check(missingReferences.length === 0, `Referências getElementById sem elemento: ${missingReferences.join(", ")}`);

const anchors = [...html.matchAll(/href=["']#([^"'\s]+)["']/gi)].map((m) => m[1]);
const brokenAnchors = [...new Set(anchors.filter((id) => !idSet.has(id)))];
check(brokenAnchors.length === 0, `Âncoras internas sem destino: ${brokenAnchors.join(", ")}`);

check(/<html\b[^>]*\blang=["']pt-BR["']/i.test(html), "Idioma pt-BR ausente no elemento html.");
check(/<title>\s*[^<]+\s*<\/title>/i.test(html), "Título da página ausente.");
check(/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']{40,}["']/i.test(html), "Meta description ausente ou muito curta.");
check((html.match(/<main\b/gi) || []).length === 1, "A página deve conter exatamente um elemento main.");
check(/class=["'][^"']*skip-link[^"']*["'][^>]*href=["']#conteudo["']/i.test(html) || /href=["']#conteudo["'][^>]*class=["'][^"']*skip-link/i.test(html), "Link para pular ao conteúdo principal ausente.");
check(idSet.has("conteudo"), "Destino #conteudo do link de acessibilidade ausente.");
check(!/^\\s*er noreferrer">/m.test(html), "Fragmento de atributo HTML órfão encontrado.");

const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let executableScripts = 0;
for (const [index, match] of scripts.entries()) {
  if (/application\/ld\+json/i.test(match[1])) continue;
  executableScripts += 1;
  try { new vm.Script(match[2], { filename: `inline-script-${index + 1}.js` }); }
  catch (error) { errors.push(`Erro de sintaxe no script ${index + 1}: ${error.message}`); }
}
check(executableScripts > 0, "Nenhum script executável foi encontrado.");

const localLinks = [...html.matchAll(/\b(?:href|src)=["']([^"'#][^"']*)["']/gi)]
  .map((m) => m[1])
  .filter((url) => !/^(?:[a-z]+:|\/\/|data:|mailto:|tel:)/i.test(url));
for (const url of [...new Set(localLinks)]) {
  const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  const target = pathname === "" || pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  check(fs.existsSync(target), `Arquivo local referenciado não encontrado: ${url}`);
}

const controls = [...html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)];
for (const [index, match] of controls.entries()) {
  const attrs = match[2];
  if (/\btype=["']hidden["']/i.test(attrs)) continue;
  const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
  const hasAriaName = /\baria-label=["'][^"']+["']/i.test(attrs) || /\baria-labelledby=["'][^"']+["']/i.test(attrs);
  const hasLabel = id && new RegExp(`<label\\b[^>]*\\bfor=["']${id.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}["']`, "i").test(html);
  check(Boolean(hasAriaName || hasLabel), `Campo de formulário sem nome acessível (controle ${index + 1}${id ? `, #${id}` : ""}).`);
}

const externalBlank = [...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)].map((m) => m[0]);
check(externalBlank.every((tag) => /\brel=["'][^"']*noopener/i.test(tag)), "Link target=_blank sem rel=noopener encontrado.");

if (errors.length) {
  console.error("Falhas na validação estática do NEXO:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("Validação estática do NEXO concluída.");
console.log(`- ${ids.length} IDs únicos verificados`);
console.log(`- ${new Set(references).size} referências getElementById verificadas`);
console.log(`- ${anchors.length} âncoras internas verificadas`);
console.log(`- ${executableScripts} scripts JavaScript analisados`);
console.log(`- ${controls.length} campos de formulário verificados`);
console.log(`- ${new Set(localLinks).size} destinos locais verificados`);
