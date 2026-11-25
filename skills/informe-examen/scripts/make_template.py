#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Plantilla impresa (A4 apaisado) para anotar B / R / M por apartado (filas) y alumno (columnas).
Uso: python make_template.py plan.json --out plantilla.docx [--cols 10] [--alumnos "Ana,Luis"] [--hojas 1]
"""
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib as L
from docx.shared import Pt, Cm
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_ROW_HEIGHT_RULE, WD_TABLE_ALIGNMENT

def build(plan, out, cols=10, alumnos=None, hojas=1):
    ap = plan["apartados"]
    n = len(ap)
    doc = L.new_doc(10, "es", landscape=True, margins=(1.5, 1.5, 1.0, 0.8), footer_number=False)
    sec = doc.sections[0]
    sec.footer_distance = Cm(0.3); sec.header_distance = Cm(0.3)
    row_h = 0.68 if n <= 20 else max(0.5, round(13.6 / n, 2))
    usable = 26.7
    wl = [1.3, 1.1, 5.0, 2.4]
    wst = (usable - sum(wl)) / cols
    for h in range(hojas):
        if h: doc.add_page_break()
        L.para(doc, "Registro de resultados · %s · %s · %s" % (plan.get("titulo", "Examen"), plan.get("asignatura", ""), plan.get("centro", "")),
               size=11.5, bold=True, after=1)
        L.para(doc, "Grupo: ______________     Fecha del examen: ______________     Hoja ____ de ____", size=9.5, after=3)
        # lista de alumnado numerada
        per_row = 5 if cols >= 5 else cols
        nrows = (cols + per_row - 1) // per_row
        leg = doc.add_table(rows=nrows, cols=per_row); leg.alignment = WD_TABLE_ALIGNMENT.CENTER; leg.autofit = False
        L.table_borders(leg, outer=8, inner=4)
        for i, row in enumerate(leg.rows):
            row.height = Cm(0.66); row.height_rule = WD_ROW_HEIGHT_RULE.EXACTLY
            for j, c in enumerate(row.cells):
                k = i * per_row + j
                c.width = Cm(usable / per_row)
                nombre = ""
                idx = h * cols + k
                if alumnos and idx < len(alumnos): nombre = " " + alumnos[idx]
                if k < cols: L.put(c, "**%d.**%s" % (k + 1, nombre), size=9)
        L.para(doc, "", after=0, size=3)
        widths = wl + [wst] * cols
        t = doc.add_table(rows=1 + n + 1, cols=len(widths)); t.alignment = WD_TABLE_ALIGNMENT.CENTER; t.autofit = False
        L.table_borders(t)
        for j, w in enumerate(widths): t.columns[j].width = Cm(w)
        for r in t.rows:
            for j, c in enumerate(r.cells): c.width = Cm(widths[j])
            r.height_rule = WD_ROW_HEIGHT_RULE.EXACTLY
            r._tr.get_or_add_trPr().append(__import__("docx").oxml.OxmlElement("w:cantSplit"))
        hdr = t.rows[0]; hdr.height = Cm(0.62)
        for j, tx in enumerate(["Apart.", "Pts", "Contenido", "Criterios"] + [str(k + 1) for k in range(cols)]):
            L.put(hdr.cells[j], tx, size=9, bold=True, align=L.CENTER, fill=L.BLUE)
        hdr._tr.get_or_add_trPr().append(__import__("docx").oxml.OxmlElement("w:tblHeader"))
        for i, a in enumerate(ap):
            r = t.rows[i + 1]; r.height = Cm(row_h)
            ej = str(a["id"]).rstrip("abcdefghijklmnopqrstuvwxyz")
            fill = L.GREY if (ej.isdigit() and int(ej) % 2 == 0) else None
            L.put(r.cells[0], "**%s**" % a["id"], size=9, align=L.CENTER, fill=fill)
            L.put(r.cells[1], L.fnum(a["puntos"]), size=8.5, align=L.CENTER, fill=fill)
            L.put(r.cells[2], a.get("contenido_corto", ""), size=8.5, fill=fill)
            L.put(r.cells[3], ", ".join(a.get("criterios", [])), size=8, align=L.CENTER, fill=fill)
            for j in range(4, 4 + cols): L.put(r.cells[j], "", size=11, align=L.CENTER)
            nxt = ap[i + 1]["id"] if i + 1 < n else None
            if nxt is not None and str(nxt).rstrip("abcdefghijklmnopqrstuvwxyz") != ej:
                for c in r.cells: L.cell_borders(c, bottom=12)
            L.cell_borders(r.cells[4], left=12)
        last = t.rows[-1]; last.height = Cm(0.72)
        tot = sum(float(a["puntos"]) for a in ap)
        L.put(last.cells[0], "**Nota**", size=9, align=L.CENTER, fill=L.BLUE)
        L.put(last.cells[1], L.fnum(tot), size=8.5, align=L.CENTER, fill=L.BLUE)
        L.put(last.cells[2], "Nota total sobre %s (opcional)" % L.fnum(tot), size=8.5, fill=L.BLUE)
        L.put(last.cells[3], "", fill=L.BLUE)
        for c in last.cells: L.cell_borders(c, top=12)
        p = L.para(doc, "", before=3, after=0)
        L.runs(p, "**Cómo anotar:** escribe en cada casilla una letra mayúscula, clara y centrada: **B** = bien (75 % o más de los puntos del apartado) · "
                  "**R** = regular (entre 25 % y 75 %) · **M** = mal (menos del 25 %) · casilla en blanco = no contestado. "
                  "Escribe el nombre de cada alumno/a en la lista de arriba y usa su número como columna.", size=8.5)
    doc.save(out)
    return out

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("plan"); ap.add_argument("--out", default="plantilla_resultados.docx")
    ap.add_argument("--cols", type=int, default=10); ap.add_argument("--alumnos", default="")
    ap.add_argument("--hojas", type=int, default=1, help="número de hojas (cada una con --cols alumnos)")
    ap.add_argument("--no-odt", action="store_true")
    a = ap.parse_args()
    names = [x.strip() for x in a.alumnos.split(",") if x.strip()]
    if names and a.hojas == 1: a.hojas = (len(names) + a.cols - 1) // a.cols
    out = build(L.load(a.plan), a.out, a.cols, names or None, a.hojas)
    print(out if a.no_odt else L.to_odt(out))
