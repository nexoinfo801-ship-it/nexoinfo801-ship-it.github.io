import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length >= 3, "Scripts principais do site devem existir");
const app = scripts[1][2];

function readObject(name) {
  const match = app.match(new RegExp("var\\s+" + name + "\\s*=\\s*(\\{[\\s\\S]*?\\n      \\});"));
  assert.ok(match, "Objeto " + name + " deve existir");
  return vm.runInNewContext("(" + match[1] + ")");
}

const businesses = readObject("businesses");
const copy = readObject("businessCopy");
assert.deepEqual(Object.keys(businesses).sort(), Object.keys(copy).sort(), "Cada ramo deve ter conteúdo e catálogo correspondentes");
assert.equal(Object.keys(businesses).length, 8, "A demonstração deve manter os oito ramos comerciais");

for (const [key, business] of Object.entries(businesses)) {
  assert.ok(business.label && business.items.length >= 4, key + ": identificação e catálogo mínimos");
  assert.ok(copy[key].intro && copy[key].operation && copy[key].inventory && copy[key].report, key + ": textos das áreas essenciais");
  const names = new Set();
  for (const item of business.items) {
    assert.equal(item.length, 5, key + ": cada item deve ter cinco campos");
    assert.ok(typeof item[0] === "string" && typeof item[1] === "string" && item[1].trim(), key + ": ícone e nome");
    assert.ok(Number.isFinite(item[2]) && item[2] >= 0, key + ": preço numérico não negativo");
    assert.ok(typeof item[3] === "string" && item[3].trim(), key + ": categoria");
    assert.ok(Number.isInteger(item[4]) && item[4] >= 0, key + ": estoque inteiro não negativo");
    assert.ok(!names.has(item[1]), key + ": nomes de itens não devem se repetir");
    names.add(item[1]);
  }
}

const calculator = scripts[2][2];
const fn = calculator.match(/function calculate\(count\)\s*\{[\s\S]*?\n      \}/);
assert.ok(fn, "Função de cálculo progressivo deve existir");
const calculate = vm.runInNewContext("(" + fn[0] + ")");
const expected = new Map([[1,49.90],[2,94.80],[5,229.50],[6,269.40],[20,828.00],[21,862.90],[50,1875.00],[51,1904.90],[100,3370.00],[101,3394.90],[250,7105.00],[251,7124.90],[500,12080.00],[501,12094.90],[1000,19530.00]]);
for (const [count, total] of expected) assert.equal(calculate(count), total, "Total progressivo incorreto para " + count + " terminais");
assert.equal(calculate(1.5), 49.90, "Cálculo unitário deve manter a primeira faixa");
console.log("Testes de modelo aprovados: 8 ramos, catálogos, integridade de preços/estoque e 15 limites da calculadora.");

// This suite is executed by the site-quality workflow on pull requests.
