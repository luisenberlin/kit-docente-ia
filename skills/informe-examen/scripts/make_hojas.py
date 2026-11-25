#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hojas personalizadas (una por alumno, en SU idioma) con soluciones en letra pequeña al final.
Uso: python make_hojas.py hojas.json --out hojas.docx [--paginas-max 2]
El script ajusta solo el espacio de respuesta para que cada hoja no pase de --paginas-max páginas (necesita soffice y pdftotext).
"""
import argparse, os, sys, shutil, subprocess, tempfile, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib as L

def render(spec, out, cuts):
    default_lang = spec.get("idioma_defecto", "es")
    doc = L.new_doc(12, default_lang, footer_number=True)
    first = True
    for al in spec["alumnos"]:
        lang = al.get("idioma", default_lang)
        S = L.labels(lang, spec.get("etiquetas", {}).get(lang))
        L.use_lang(lang)
        if not first: doc.add_page_break()
        first = False
        L.para(doc, "%s · %s" % (S["hoja"], L.pick(spec.get("unidad", ""), lang)), size=14, bold=True, align=L.CENTER, after=0)
        cab = L.pick(spec.get("cabecera", "%s · %s" % (spec.get("asignatura", ""), spec.get("centro", ""))), lang)
        L.para(doc, cab, size=10.5, align=L.CENTER, after=4)
        L.para(doc, "%s: **%s**     %s: ____________" % (S["nombre"], al["nombre"], S["fecha"]), size=11, after=6)
        # mensaje de apertura
        tipo = al.get("tipo", "refuerzo")
        msg = al.get("mensaje") or S["intro_ampliacion" if tipo == "ampliacion" else "intro_refuerzo"].format(
            ya=al.get("ya", ""), vamos=al.get("vamos", ""))
        box = L.para(doc, "", after=6, keep=True)
        L.runs(box, msg, size=10.5)
        L.border(box, ("top", "left", "bottom", "right"), color="1F3864", sz=6, space=4)
        L.shade_par(box, "EAF1FB")
        cut = cuts.get(al["nombre"], 1 if tipo != "ampliacion" else 2)
        for i, ej in enumerate(al["ejercicios"]):
            h = L.para(doc, "%s %d · %s" % (S["ejercicio"], i + 1, ej["titulo"]), size=12.5, bold=True, before=10, after=3, keep=True)
            L.border(h, ("bottom",), color="1F3864", sz=8, space=1)
            if ej.get("intro"): L.para(doc, ej["intro"], keep=True, after=4)
            if ej.get("tabla"):
                t = L.make_table(doc, ej["tabla"][0], ej["tabla"][1:], ej.get("anchos", [2.4, 6.1, 8.5]), size=11)
                for row in t.rows:
                    for c in row.cells:
                        for p in c.paragraphs: p.paragraph_format.keep_with_next = True
                L.para(doc, "", after=2, keep=True)
            partes = ej["partes"]
            for j, pa in enumerate(partes):
                last = j == len(partes) - 1
                L.para(doc, "**%s)** %s" % ("abcdefgh"[j], pa["texto"]), keep=True, after=2, indent=0.3)
                if pa.get("pista"): L.pista_box(doc, S["pista"], pa["pista"])
                L.answer_lines(doc, max(1, pa.get("lineas", 2) - cut), last_keep=not last)
            L.para(doc, "", after=2)
        # soluciones en pequeño
        hd = L.para(doc, S["soluciones"], size=8.5, bold=True, before=8, after=1, keep=True)
        L.border(hd, ("top",), color="808080", sz=6, space=3)
        n = len(al["ejercicios"])
        for i, ej in enumerate(al["ejercicios"]):
            sol = " · ".join("%s) %s" % ("abcdefgh"[j], pa.get("solucion", "")) for j, pa in enumerate(ej["partes"]))
            L.para(doc, "**%d. %s:** %s" % (i + 1, ej["titulo"], sol), size=7.5, after=0, keep=(i < n - 1))
    doc.save(out)

def pages_per_student(docx, spec):
    """Convierte a PDF y cuenta páginas por alumno (busca el título de cada hoja). Devuelve dict o None."""
    exe = shutil.which("soffice") or shutil.which("libreoffice")
    if not exe or not shutil.which("pdftotext"):
        return None
    d = tempfile.mkdtemp()
    subprocess.run([exe, "--headless", "--convert-to", "pdf", "--outdir", d, docx], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=240)
    pdf = os.path.join(d, os.path.splitext(os.path.basename(docx))[0] + ".pdf")
    if not os.path.exists(pdf): return None
    txt = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout
    pages = txt.split("\f")
    counts, cur = {}, None
    names = [a["nombre"] for a in spec["alumnos"]]
    for pg in pages:
        if not pg.strip(): continue
        found = None
        for nm in names:
            if re.search(r"\b%s\b" % re.escape(nm), pg.split("\n\n")[0] + pg[:600]) and re.search(r":\s*%s\b" % re.escape(nm), pg[:600]):
                found = nm; break
        if found: cur = found
        if cur: counts[cur] = counts.get(cur, 0) + 1
    return counts

def build(spec, out, pmax=2):
    cuts = {}
    for it in range(5):
        render(spec, out, cuts)
        cnt = pages_per_student(out, spec)
        if cnt is None:
            print("Aviso: no se pudo medir el nº de páginas (falta soffice/pdftotext); revisa la maquetación a mano.")
            break
        over = [n for n, c in cnt.items() if c > pmax]
        print("iteración", it + 1, "páginas:", cnt)
        if not over: break
        for n in over:
            base = [a for a in spec["alumnos"] if a["nombre"] == n][0].get("tipo", "refuerzo")
            cuts[n] = cuts.get(n, 1 if base != "ampliacion" else 2) + 1
    return out

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("hojas"); ap.add_argument("--out", default="hojas_personalizadas.docx")
    ap.add_argument("--paginas-max", type=int, default=2); ap.add_argument("--no-odt", action="store_true")
    a = ap.parse_args()
    out = build(L.load(a.hojas), a.out, a.paginas_max)
    print(out if a.no_odt else L.to_odt(out))
