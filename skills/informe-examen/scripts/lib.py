# -*- coding: utf-8 -*-
"""Utilidades comunes: documentos DOCX (A4) con idioma por texto, tablas, etiquetas por idioma y conversión a ODT."""
import json, os, shutil, subprocess
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

CENTER = WD_ALIGN_PARAGRAPH.CENTER
LANG_CODES = {"es": "es-ES", "en": "en-GB", "fr": "fr-FR", "pt": "pt-PT", "it": "it-IT", "de": "de-DE",
              "ro": "ro-RO", "ar": "ar-SA", "zh": "zh-CN", "uk": "uk-UA", "ru": "ru-RU", "pl": "pl-PL"}
CUR = {"lang": "es-ES"}
GREEN, YEL, RED, GREY, BLUE = "C6EFCE", "FFEB9C", "FFC7CE", "F2F2F2", "D9E2F3"
LET_FILL = {"B": GREEN, "R": YEL, "M": RED}

def lang_code(l):
    return LANG_CODES.get(l, l or "es-ES")

def use_lang(l):
    CUR["lang"] = lang_code(l)

# ------------------------------------------------------------------ etiquetas por idioma
LABELS = {
 "es": dict(ejercicio="Ejercicio", pista="Pista", hoja="Hoja personalizada", nombre="Nombre", fecha="Fecha",
            soluciones="Soluciones: compruébalas cuando termines",
            intro_refuerzo="Esta hoja está pensada para ti. Ya dominas {ya}. Ahora vamos a afianzar {vamos}. **Practicar ayuda: ¡ánimo!** "
                           "Escribe los pasos y, si te atascas, mira la pista. Cuando termines, comprueba tus respuestas en el cuadro del final.",
            intro_ampliacion="¡Muy buen examen! Esta hoja es un **reto** para seguir aprendiendo: {vamos}. Si te atascas, mira la pista. "
                             "Cuando termines, comprueba tus respuestas en el cuadro del final.",
            informe="Informe individual", nota="Nota estimada", mapa="Resultado en cada apartado", contenidos="Contenidos",
            criterios="Criterios de evaluación", contenido="Contenido", criterio="Criterio", puntos="Puntos",
            superado="Superado", proceso="En proceso", reforzar="A reforzar", domina="Lo que domina", refuerzo="A reforzar",
            hoja_txt="Hoja personalizada",
            leyenda_estado="Estado: superado desde el {s} %, en proceso entre el {p} y el {s1} %, a reforzar por debajo del {p} %."),
 "en": dict(ejercicio="Exercise", pista="Hint", hoja="Personalised sheet", nombre="Name", fecha="Date",
            soluciones="Solutions: check your answers when you finish",
            intro_refuerzo="This sheet is made for you. You are already good at {ya}. Now let's work on {vamos}. **Practice helps: keep going!** "
                           "Write down your steps and, if you get stuck, read the hint. When you finish, check your answers in the box at the end.",
            intro_ampliacion="Very good exam! This sheet is a **challenge** to keep learning: {vamos}. If you get stuck, read the hint. "
                             "When you finish, check your answers in the box at the end.",
            informe="Individual report", nota="Estimated mark", mapa="Result in each part", contenidos="Content",
            criterios="Assessment criteria", contenido="Content", criterio="Criterion", puntos="Points",
            superado="Achieved", proceso="In progress", reforzar="Needs work", domina="What they do well", refuerzo="To reinforce",
            hoja_txt="Personalised sheet",
            leyenda_estado="Status: achieved from {s} %, in progress between {p} and {s1} %, needs work below {p} %."),
 "fr": dict(ejercicio="Exercice", pista="Indice", hoja="Fiche personnalisée", nombre="Nom", fecha="Date",
            soluciones="Solutions : vérifie tes réponses quand tu as fini",
            intro_refuerzo="Cette fiche est faite pour toi. Tu maîtrises déjà {ya}. Maintenant, nous allons consolider {vamos}. **S'entraîner aide : courage !** "
                           "Écris les étapes et, si tu es bloqué(e), lis l'indice. Quand tu as fini, vérifie tes réponses dans l'encadré final.",
            intro_ampliacion="Très bon examen ! Cette fiche est un **défi** pour continuer à apprendre : {vamos}. Si tu es bloqué(e), lis l'indice. "
                             "Quand tu as fini, vérifie tes réponses dans l'encadré final.",
            informe="Rapport individuel", nota="Note estimée", mapa="Résultat de chaque partie", contenidos="Contenus",
            criterios="Critères d'évaluation", contenido="Contenu", criterio="Critère", puntos="Points",
            superado="Acquis", proceso="En cours", reforzar="À renforcer", domina="Points forts", refuerzo="À renforcer",
            hoja_txt="Fiche personnalisée",
            leyenda_estado="Statut : acquis à partir de {s} %, en cours entre {p} et {s1} %, à renforcer en dessous de {p} %."),
}

def labels(lang, override=None):
    base = dict(LABELS.get(lang, LABELS["en"]))
    if override:
        base.update(override)
    return base

# ------------------------------------------------------------------ documento
def _run_lang(run):
    rPr = run._r.get_or_add_rPr()
    for old in rPr.findall(qn("w:lang")):
        rPr.remove(old)
    lg = OxmlElement("w:lang")
    lg.set(qn("w:val"), CUR["lang"]); lg.set(qn("w:eastAsia"), CUR["lang"])
    rPr.append(lg)

def new_doc(base_pt=12, lang="es", landscape=False, margins=(2, 2, 2, 2), footer_number=True):
    use_lang(lang)
    doc = Document()
    sec = doc.sections[0]
    w, h = (29.7, 21) if landscape else (21, 29.7)
    sec.page_width, sec.page_height = Cm(w), Cm(h)
    if landscape:
        from docx.enum.section import WD_ORIENT
        sec.orientation = WD_ORIENT.LANDSCAPE
    sec.left_margin, sec.right_margin, sec.top_margin, sec.bottom_margin = [Cm(m) for m in margins]
    st = doc.styles["Normal"]
    st.font.name = "Arial"; st.font.size = Pt(base_pt)
    rpr = st.element.get_or_add_rPr()
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts"); rpr.append(rf)
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), "Arial")
    st.paragraph_format.space_after = Pt(4)
    st.paragraph_format.line_spacing = 1.15
    dd = doc.styles.element.find(qn("w:docDefaults"))
    rpr_def = dd.find(qn("w:rPrDefault")).find(qn("w:rPr"))
    for old in rpr_def.findall(qn("w:lang")):
        rpr_def.remove(old)
    lg = OxmlElement("w:lang")
    lg.set(qn("w:val"), lang_code(lang)); lg.set(qn("w:eastAsia"), lang_code(lang)); lg.set(qn("w:bidi"), "ar-SA")
    rpr_def.append(lg)
    p = sec.footer.paragraphs[0]
    p.alignment = CENTER
    if footer_number:
        fld = OxmlElement("w:fldSimple"); fld.set(qn("w:instr"), "PAGE")
        rr = OxmlElement("w:r"); rp = OxmlElement("w:rPr")
        sz = OxmlElement("w:sz"); sz.set(qn("w:val"), "18"); rp.append(sz); rr.append(rp)
        t = OxmlElement("w:t"); t.text = "1"; rr.append(t); fld.append(rr)
        p._p.append(fld)
    return doc

def runs(p, text, size=None, bold=False, italic=False, color=None):
    """Texto con **negrita** inline."""
    for i, part in enumerate(str(text).split("**")):
        if not part:
            continue
        r = p.add_run(part)
        r.bold = bold or (i % 2 == 1); r.italic = italic
        if size: r.font.size = Pt(size)
        if color: r.font.color.rgb = RGBColor.from_string(color)
        _run_lang(r)
    return p

def para(doc, text="", size=None, bold=False, italic=False, align=None, before=0, after=4, keep=False, indent=None):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(before); pf.space_after = Pt(after); pf.keep_with_next = keep
    if indent is not None: pf.left_indent = Cm(indent)
    if align is not None: p.alignment = align
    if text: runs(p, text, size, bold, italic)
    return p

def border(p, sides=("bottom",), color="808080", sz=4, space=1):
    pPr = p._p.get_or_add_pPr()
    b = OxmlElement("w:pBdr")
    for s in sides:
        e = OxmlElement("w:" + s)
        e.set(qn("w:val"), "single"); e.set(qn("w:sz"), str(sz)); e.set(qn("w:space"), str(space)); e.set(qn("w:color"), color)
        b.append(e)
    pPr.append(b)

def shade_par(p, fill):
    s = OxmlElement("w:shd"); s.set(qn("w:val"), "clear"); s.set(qn("w:color"), "auto"); s.set(qn("w:fill"), fill)
    p._p.get_or_add_pPr().append(s)

def shade_cell(cell, fill):
    s = OxmlElement("w:shd"); s.set(qn("w:val"), "clear"); s.set(qn("w:color"), "auto"); s.set(qn("w:fill"), fill)
    cell._tc.get_or_add_tcPr().append(s)

def cell_borders(cell, **kw):
    tcPr = cell._tc.get_or_add_tcPr()
    b = tcPr.find(qn("w:tcBorders"))
    if b is None:
        b = OxmlElement("w:tcBorders"); tcPr.append(b)
    for side, sz in kw.items():
        e = OxmlElement("w:" + side)
        e.set(qn("w:val"), "single"); e.set(qn("w:sz"), str(sz)); e.set(qn("w:space"), "0"); e.set(qn("w:color"), "000000")
        b.append(e)

def table_borders(t, outer=12, inner=6):
    tblPr = t._tbl.tblPr
    b = OxmlElement("w:tblBorders")
    for side, sz in (("top", outer), ("left", outer), ("bottom", outer), ("right", outer), ("insideH", inner), ("insideV", inner)):
        e = OxmlElement("w:" + side)
        e.set(qn("w:val"), "single"); e.set(qn("w:sz"), str(sz)); e.set(qn("w:space"), "0"); e.set(qn("w:color"), "000000")
        b.append(e)
    tblPr.append(b)
    lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)

def put(cell, text, size=8.5, bold=False, align=None, fill=None):
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0); p.paragraph_format.space_before = Pt(0); p.paragraph_format.line_spacing = 1.0
    if align is not None: p.alignment = align
    if text != "" and text is not None: runs(p, text, size, bold=bold)
    cell.vertical_alignment = 1
    if fill: shade_cell(cell, fill)

def make_table(doc, headers, rows, widths_cm, size=10, header_fill=BLUE):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"; t.alignment = WD_TABLE_ALIGNMENT.CENTER; t.autofit = False
    lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); t._tbl.tblPr.append(lay)
    for i, w in enumerate(widths_cm): t.columns[i].width = Cm(w)
    def fill_row(row, vals, bold=False, shade=None):
        row._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))
        for i, v in enumerate(vals):
            c = row.cells[i]; c.width = Cm(widths_cm[i])
            p = c.paragraphs[0]; p.paragraph_format.space_after = Pt(1); p.paragraph_format.line_spacing = 1.05
            runs(p, str(v), size, bold=bold)
            if shade: shade_cell(c, shade)
    hdr = t.rows[0]
    hdr._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))
    fill_row(hdr, headers, bold=True, shade=header_fill)
    for r in rows:
        fill_row(t.add_row(), r)
    return t

def answer_lines(doc, n, last_keep=False):
    for i in range(n):
        p = para(doc, "", after=0, keep=(i < n - 1) or last_keep)
        p.paragraph_format.line_spacing = 1.9
        p.paragraph_format.space_before = Pt(i % 2)
        border(p, ("bottom",), color="BFBFBF", sz=4, space=(0 if i % 2 == 0 else 1))  # alternar para que no se fusionen

def pista_box(doc, label, text, size=None):
    p = para(doc, "", keep=True, indent=0.8, before=2, after=4)
    p.paragraph_format.right_indent = Cm(0.8)
    runs(p, label + ": ", size, bold=True, italic=True)
    runs(p, text, size, italic=True)
    border(p, ("top", "left", "bottom", "right"), color="C9A227", sz=6, space=3)
    shade_par(p, "FFF8DC")

# ------------------------------------------------------------------ utilidades de datos
def pick(x, lang, default=""):
    """x puede ser str o dict {idioma: texto}."""
    if isinstance(x, dict):
        return x.get(lang) or x.get("es") or next(iter(x.values()), default)
    return x if x is not None else default

def fnum(x, lang="es"):
    s = ("%g" % round(float(x), 2))
    return s.replace(".", ",") if lang in ("es", "fr", "pt", "it", "de") else s

def to_odt(docx_path, also_pdf=False):
    """Convierte con LibreOffice. Devuelve la ruta del .odt (o del .docx si no hay soffice)."""
    exe = shutil.which("soffice") or shutil.which("libreoffice")
    if not exe:
        return docx_path
    outdir = os.path.dirname(os.path.abspath(docx_path))
    subprocess.run([exe, "--headless", "--convert-to", "odt", "--outdir", outdir, docx_path],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
    odt = os.path.splitext(docx_path)[0] + ".odt"
    if also_pdf and os.path.exists(odt):
        subprocess.run([exe, "--headless", "--convert-to", "pdf", "--outdir", outdir, odt],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
    return odt if os.path.exists(odt) else docx_path

def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)
