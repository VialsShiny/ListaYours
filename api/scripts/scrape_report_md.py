"""Markdown rendering of the scraper report: tables plus Mermaid xychart bars, before vs after."""

from __future__ import annotations

from datetime import date

from scrape_report_rules import FIELDS

Results = dict[str, dict[str, bool]]
REPRESENTATIVE = "amazon_real_B0CZ762XQ3"


def pages_of(results: Results) -> Results:
    return {name: page for name, page in results.items() if not name.startswith("_")}


def rates(results: Results) -> dict[str, float]:
    pages = pages_of(results)
    return {field: round(100 * sum(page[field] for page in pages.values()) / (len(pages) or 1), 1) for field in FIELDS}


def per_page(results: Results) -> dict[str, float]:
    return {name: round(100 * sum(page.values()) / len(page), 1) for name, page in pages_of(results).items()}


def xychart(title: str, labels: list[str], series: dict[str, list[float]], y_label: str) -> str:
    quoted = ", ".join(f'"{label}"' for label in labels)
    lines = [
        "```mermaid",
        "xychart-beta",
        f'    title "{title}"',
        f"    x-axis [{quoted}]",
        f'    y-axis "{y_label}" 0 --> 100',
    ]
    lines += [f"    bar [{', '.join(str(value) for value in values)}]" for values in series.values()]
    lines += ["```", "", "Séries, dans l'ordre : " + ", ".join(series), ""]
    return "\n".join(lines)


def table(header: list[str], rows: list[list[str]]) -> str:
    lines = ["| " + " | ".join(header) + " |", "|" + "---|" * len(header)]
    lines += ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join(lines) + "\n"


def render(before: Results | None, after: Results) -> str:
    pages = len(pages_of(after))
    after_rates, after_pages = rates(after), per_page(after)
    before_rates = rates(before) if before else None
    before_pages = per_page(before) if before else {}
    out = [
        "# Rapport du scraper : taux d'obtention par champ",
        "",
        f"Généré le {date.today():%Y-%m-%d} par `api/scripts/scrape_report.py` sur {pages} pages enregistrées "
        "(`api/tests/scraper/fixtures/corpus.json`). Un champ est réussi quand la valeur extraite est présente et "
        "égale à la valeur relevée à la main sur la page (`scrape_report_rules.py`). « Avant » est le parser de "
        "`main` avant cette branche, « après » celui de cette branche.",
        "",
        f"Temps d'analyse du corpus (parser seul, HTML déjà téléchargé) : avant {before['_seconds']['parse']} s, "
        f"après {after['_seconds']['parse']} s."
        if before
        else "",
        "",
        "## 1. Par champ",
        "",
    ]
    rows = [
        [
            field,
            f"{before_rates[field]:.1f} %" if before_rates else "—",
            f"{after_rates[field]:.1f} %",
            f"{after_rates[field] - before_rates[field]:+.1f}" if before_rates else "—",
        ]
        for field in FIELDS
    ]
    out.append(table(["Champ", "Avant", "Après", "Écart"], rows))
    series = {"après": list(after_rates.values())}
    if before_rates:
        series = {"avant": list(before_rates.values()), **series}
    out.append(xychart("Réussite par champ (% des pages)", FIELDS, series, "% pages"))
    out += ["## 2. Par page (% des 10 champs obtenus)", ""]
    rows = [
        [name, f"{before_pages[name]:.1f} %" if before_pages else "—", f"{after_pages[name]:.1f} %"]
        for name in after_pages
    ]
    out.append(table(["Page", "Avant", "Après"], rows))
    names = list(after_pages)
    series = {"après": [after_pages[name] for name in names]}
    if before_pages:
        series = {"avant": [before_pages[name] for name in names], **series}
    out.append(xychart("Champs obtenus par page (%)", names, series, "% champs"))
    if REPRESENTATIVE in after:
        out += [
            f"## 3. Un article représentatif : `{REPRESENTATIVE}`",
            "",
            "Pour chaque champ, 100 % = obtenu et exact, 0 % = absent ou faux.",
            "",
        ]
        series = {"après": [100.0 if after[REPRESENTATIVE][field] else 0.0 for field in FIELDS]}
        if before:
            series = {"avant": [100.0 if before[REPRESENTATIVE][field] else 0.0 for field in FIELDS], **series}
        out.append(xychart(f"{REPRESENTATIVE} : réussite par champ", FIELDS, series, "%"))
    out += [
        "## Limites",
        "",
        "- Le corpus est biaisé vers Amazon (24 pages sur 40) ; les pages amazon.fr et amazon.de ont été récupérées par la "
        "stratégie Playwright du scraper, car HTTPX reçoit un interstitiel depuis ce réseau (gardé comme page `amazon_fr_interstitial`).",
        "- La vérité (« relevée à la main ») suit ce qu'un lecteur voit sur la page : prix de la boîte d'achat, puces "
        "« À propos de cet article », photos du bloc image. Une description ne compte que si elle commence comme celle de la page.",
        "- Le temps d'analyse est mesuré sur une machine chargée : indicatif, pas un benchmark.",
        "",
    ]
    return "\n".join(out)
