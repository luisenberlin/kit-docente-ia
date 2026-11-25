#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Informe general de la clase + un informe individual por alumno (una página cada uno).
Uso: python make_informe.py plan.json res.json --narrativas narrativas.json --out informe.docx [--idioma-grupo es]
El idioma de cada informe individual es el campo idioma_informe del alumno (por defecto es).
"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib as L
from docx.shared import Pt, Cm
from docx.enum.table import WD_TABLE_ALIGNMENT

EST_FILL = {"superado": L.GREEN, "proceso": L.YEL, "reforzar": L.RED}
EST_KEY = {"superado": "superado", "proceso": "proceso", "reforzar": "reforzar"}

def build(plan, res, narr, out, gl="es"):
    G = L.labels(gl)
    doc = L.new_doc(10.5, gl)
    tot = res["total"]; sup = res["umbrales"]["superado"]; pro = res["umbrales"]["proceso"]
    titulo = plan.get("titulo", "Examen")
    # ---------------- resumen de grupo
    L.use_lang(gl)
    L.para(doc, "Informe de resultados · %s" % titulo if gl == "es" else "Results report · %s" % titulo, size=15, bold=True, after=0)
    L.para(doc, "%s · %s" % (plan.get("asignatura", ""), plan.get("centro", "")), size=10, after=8)
    L.para(doc, "Resumen del grupo" if gl == "es" else "Class summary", size=12.5, bold=True, after=3, keep=True)
    pasa = tot / 2
    rows = []
    for a in res["alumnos"]:
        rows.append([a["nombre"], L.fnum(a["nota"], gl) if False else ("%.2f" % a["nota"]).replace(".", ",") if gl == "es" else "%.2f" % a["nota"],
                     ("Superado" if a["nota"] >= pasa else "No superado") if gl == "es" else ("Pass" if a["nota"] >= pasa else "Below pass")])
    n_ok = sum(1 for a in res["alumnos"] if a["nota"] >= pasa)
    rows.append(["**%s**" % ("Media del grupo" if gl == "es" else "Class average"), "**%.2f**" % res["media"],
                 ("%d de %d con %s o más" % (n_ok, len(res["alumnos"]), L.fnum(pasa))) if gl == "es" else "%d of %d at %s or above" % (n_ok, len(res["alumnos"]), L.fnum(pasa))])
    t = L.make_table(doc, ["Alumno/a", "Nota estimada (sobre %s)" % L.fnum(tot), "Resultado"] if gl == "es" else ["Student", "Estimated mark (out of %s)" % L.fnum(tot), "Result"],
                     rows, [6, 5, 5], size=10)
    for i, a in enumerate(res["alumnos"]):
        L.shade_cell(t.rows[i + 1].cells[2], L.GREEN if a["nota"] >= pasa else L.RED)
    pw = res["pesos"]
    L.para(doc, ("Cómo se calcula la nota: cada apartado vale sus puntos del examen; B cuenta el %d %%, R el %d %% y M el %d %%. "
                 "Como R recoge cualquier resultado entre el 25 %% y el 75 %%, la nota es orientativa.") % (pw["B"] * 100, pw["R"] * 100, pw["M"] * 100)
           if gl == "es" else
           ("How the mark is worked out: each part is worth its exam points; B counts %d %%, R %d %% and M %d %%. "
            "Because R covers anything between 25 %% and 75 %%, the mark is approximate.") % (pw["B"] * 100, pw["R"] * 100, pw["M"] * 100),
           size=9, italic=True, before=4, after=6)
    g = narr.get("grupo", {})
    if g.get("lectura"):
        L.para(doc, "Lectura rápida del grupo" if gl == "es" else "Quick reading of the class", size=12.5, bold=True, before=4, after=3, keep=True)
        for s in g["lectura"]:
            L.para(doc, "· " + s, indent=0.3, after=2)
    # ---------------- matriz
    doc.add_page_break()
    L.para(doc, "Resultados por apartado" if gl == "es" else "Results by part", size=12.5, bold=True, after=3, keep=True)
    L.para(doc, "Transcripción de las B, R y M. Revisa por si alguna casilla se ha leído mal." if gl == "es" else
           "Transcription of the B, R and M marks. Check in case any cell was misread.", size=9, italic=True, after=3)
    al = res["alumnos"]
    cw = min(1.45, 8.6 / max(1, len(al)))
    head = ["Apart.", "Pts", "Contenido" if gl == "es" else "Content"] + [a["nombre"] for a in al] + ["% grupo" if gl == "es" else "% class"]
    rows = []
    for a_ in plan["apartados"]:
        rows.append([a_["id"], L.fnum(a_["puntos"], gl), a_.get("contenido_corto", "")] + [x["respuestas"].get(a_["id"], "") or "–" for x in al] + ["%d %%" % res["por_apartado"][a_["id"]]])
    wd = [1.5, 1.1, 4.1] + [cw] * len(al) + [1.5]
    t = L.make_table(doc, head, rows, wd, size=9 if len(al) <= 10 else 8)
    for i, a_ in enumerate(plan["apartados"]):
        for j, x in enumerate(al):
            c = t.rows[i + 1].cells[3 + j]
            v = x["respuestas"].get(a_["id"], "")
            if v in L.LET_FILL: L.shade_cell(c, L.LET_FILL[v])
            c.paragraphs[0].alignment = L.CENTER
    # ---------------- individuales
    for x in al:
        il = x.get("idioma_informe", "es")
        S = L.labels(il)
        L.use_lang(il)
        doc.add_page_break()
        L.para(doc, "%s · %s" % (S["informe"], x["nombre"]), size=15, bold=True, after=0)
        L.para(doc, "%s · %s" % (titulo, plan.get("asignatura", "")), size=9.5, after=6)
        p = L.para(doc, "", after=6)
        L.runs(p, "%s: **%s / %s**" % (S["nota"], L.fnum(x["nota"], il).replace(",0", ",0") if False else ("%.2f" % x["nota"]).replace(".", ",") if il == "es" else "%.2f" % x["nota"], L.fnum(tot, il)), size=14)
        L.para(doc, S["mapa"], size=11, bold=True, after=2, keep=True)
        ids = [a_["id"] for a_ in plan["apartados"]]
        n = len(ids)
        mt = doc.add_table(rows=2, cols=n); mt.style = "Table Grid"; mt.alignment = WD_TABLE_ALIGNMENT.CENTER; mt.autofit = False
        w = min(0.85, 17.0 / n)
        for j, i in enumerate(ids):
            c0, c1 = mt.rows[0].cells[j], mt.rows[1].cells[j]
            for c in (c0, c1): c.width = Cm(w)
            v = x["respuestas"].get(i, "") or "–"
            for c, tx in ((c0, i), (c1, v)):
                pa = c.paragraphs[0]; pa.alignment = L.CENTER; pa.paragraph_format.space_after = Pt(0)
                L.runs(pa, tx, 8 if n <= 24 else 6.5, bold=(c is c1))
            L.shade_cell(c1, L.LET_FILL.get(v, "FFFFFF")); L.shade_cell(c0, L.GREY)
        L.para(doc, "", after=2, size=4)
        for titulo_t, key, names, head_l in ((S["contenidos"], "contenidos", plan.get("contenidos", {}), S["contenido"]),
                                              (S["criterios"], "criterios", plan.get("criterios", {}), S["criterio"])):
            if not x[key]: continue
            L.para(doc, titulo_t, size=11, bold=True, before=4, after=2, keep=True)
            rr = []
            for k, v in x[key].items():
                nm = L.pick(names.get(k, k), il)
                rr.append([nm, "%s / %s" % (L.fnum(v["got"], il), L.fnum(v["tot"], il)), "%d %%" % v["pct"], S[EST_KEY[v["estado"]]]])
            t = L.make_table(doc, [head_l, S["puntos"], "%", "Estado" if il == "es" else ("Status" if il == "en" else "Statut")], rr, [9.3, 2.4, 1.9, 3.1], size=9.5)
            for i, (k, v) in enumerate(x[key].items()): L.shade_cell(t.rows[i + 1].cells[3], EST_FILL[v["estado"]])
            L.para(doc, "", after=2, size=4)
        L.para(doc, S["leyenda_estado"].format(s=int(sup), p=int(pro), s1=int(sup) - 1), size=8.5, italic=True, before=2, after=4)
        nar = narr.get("alumnos", {}).get(x["nombre"], {})
        for lab, key in ((S["domina"], "domina"), (S["refuerzo"], "refuerzo"), (S["hoja_txt"], "hoja")):
            if nar.get(key):
                q = L.para(doc, "", after=3)
                L.runs(q, "**%s:** %s" % (lab, nar[key]))
    doc.save(out)
    return out

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("plan"); ap.add_argument("res"); ap.add_argument("--narrativas", default=None)
    ap.add_argument("--out", default="informe.docx"); ap.add_argument("--idioma-grupo", default="es")
    ap.add_argument("--no-odt", action="store_true")
    a = ap.parse_args()
    narr = L.load(a.narrativas) if a.narrativas else {}
    out = build(L.load(a.plan), L.load(a.res), narr, a.out, a.idioma_grupo)
    print(out if a.no_odt else L.to_odt(out))
