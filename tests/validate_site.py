from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CNPJ = "37418913000132"


def cnpj_is_valid(value: str) -> bool:
    digits = re.sub(r"\D", "", value)
    if len(digits) != 14 or len(set(digits)) == 1:
        return False

    def digit(base: str, weights: tuple[int, ...]) -> str:
        total = sum(int(number) * weight for number, weight in zip(base, weights))
        remainder = total % 11
        return str(0 if remainder < 2 else 11 - remainder)

    first = digit(digits[:12], (5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2))
    second = digit(digits[:12] + first, (6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2))
    return digits[-2:] == first + second


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title_text = False
        self.title = ""
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "title":
            self.title_text = True
        for key in ("href", "src"):
            value = values.get(key)
            if value:
                self.links.append(value)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.title_text = False

    def handle_data(self, data: str) -> None:
        if self.title_text:
            self.title += data


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def main() -> None:
    required_pages = ("index.html", "privacidade.html", "termos.html")
    parsed: dict[str, PageParser] = {}

    for name in required_pages:
        path = ROOT / name
        if not path.is_file():
            fail(f"página obrigatória ausente: {name}")
        source = path.read_text(encoding="utf-8")
        parser = PageParser()
        parser.feed(source)
        if not parser.title.strip():
            fail(f"título HTML ausente: {name}")
        parsed[name] = parser

        for link in parser.links:
            url = urlsplit(link)
            if url.scheme or url.netloc or not url.path:
                continue
            local_path = unquote(url.path)
            if local_path.startswith("/"):
                local_path = local_path.lstrip("/")
            target = (ROOT / local_path).resolve()
            if target.suffix.lower() == ".html" and not target.is_file():
                fail(f"link interno quebrado em {name}: {link}")

    cnpj_display = "37.418.913/0001-32"
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    privacy = (ROOT / "privacidade.html").read_text(encoding="utf-8")
    terms = (ROOT / "termos.html").read_text(encoding="utf-8")

    if not cnpj_is_valid(CNPJ):
        fail("dígitos verificadores do CNPJ não conferem")
    if cnpj_display not in index or cnpj_display not in privacy or cnpj_display not in terms:
        fail("CNPJ não aparece em todas as páginas institucionais exigidas")
    unverified_claims = (
        "comprovante cadastral informado para a empresa individual atual indica",
        "situação cadastral ativa na data do documento consultado",
    )
    if any(claim in index.lower() for claim in unverified_claims):
        fail("a página afirma consulta ou situação cadastral oficial sem comprovação")
    if "consulte o comprovante oficial diretamente na receita federal" not in index.lower():
        fail("a resposta de confiança não orienta a conferir o cadastro na Receita Federal")
    if 'href="termos.html"' not in index:
        fail("termos de uso não estão ligados no rodapé da página inicial")
    if 'href="privacidade.html"' not in index:
        fail("aviso de privacidade não está ligado na página inicial")

    cname = (ROOT / "CNAME").read_text(encoding="utf-8").strip().lower()
    if cname != "nexoerp.dev":
        fail(f"CNAME inesperado: {cname}")

    sitemap = ET.parse(ROOT / "sitemap.xml").getroot()
    locs = {
        element.text.strip()
        for element in sitemap.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
        if element.text and element.text.strip()
    }
    expected_urls = {
        "https://nexoerp.dev/",
        "https://nexoerp.dev/privacidade.html",
        "https://nexoerp.dev/termos.html",
    }
    missing = expected_urls - locs
    if missing:
        fail(f"sitemap sem URLs obrigatórias: {sorted(missing)}")

    print("OK: páginas obrigatórias, links internos, CNPJ, CNAME e sitemap validados.")


if __name__ == "__main__":
    main()
