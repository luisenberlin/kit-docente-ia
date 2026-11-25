# -*- coding: utf-8 -*-
"""
Script de generación de documentos ODT para exámenes (Modelo de práctica, Examen, Solucionario).
Utiliza python-docx para componer la estructura y LibreOffice (soffice) para la conversión a ODT.
"""
import sys
import os
import json
import subprocess
import argparse
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def crear_documento_base():
    doc = Document()
    # Configurar márgenes A4
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
    return doc

def generar_odt_desde_json(json_path, output_dir):
    if not os.path.exists(json_path):
        print(f"❌ Error: No se encuentra el archivo de datos {json_path}")
        sys.exit(1)

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    os.makedirs(output_dir, exist_ok=True)
    base_name = data.get("slug", "examen")

    # Generar los 3 documentos
    tipos = [
        ("Modelo_practica", "Modelo de Práctica para el Alumnado"),
        ("Examen", "Prueba de Evaluación Oficial"),
        ("Solucionario", "Solucionario y Criterios de Calificación")
    ]

    docx_paths = []
    for prefix, subtitulo in tipos:
        doc = crear_documento_base()
        
        # Cabecera
        p_title = doc.add_paragraph()
        p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_title = p_title.add_run(f"{data.get('institucion', 'Kit Docente con IA')} — {data.get('asignatura', 'Materia')}")
        r_title.bold = True
        r_title.font.size = Pt(14)
        
        p_sub = doc.add_paragraph()
        p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_sub = p_sub.add_run(f"{subtitulo}: {data.get('titulo', 'Tema')}")
        r_sub.font.size = Pt(12)
        r_sub.font.color.rgb = RGBColor(90, 90, 90)

        doc.add_paragraph() # Separador

        # Contenido de ejemplo basado en el JSON
        for i, ej in enumerate(data.get("ejercicios", []), 1):
            p_ej = doc.add_paragraph()
            r_ej = p_ej.add_run(f"Ejercicio {i}: {ej.get('enunciado', '')}")
            r_ej.bold = True
            
            for apto in ej.get("apartados", []):
                p_ap = doc.add_paragraph(style='List Bullet')
                p_ap.add_run(f"{apto.get('letra', 'a')}) {apto.get('texto', '')} ")
                if prefix != "Modelo_practica":
                    r_pt = p_ap.add_run(f"[{apto.get('puntos', 1.0)} ptos]")
                    r_pt.italic = True

        # Guardar DOCX temporal
        docx_path = os.path.join(output_dir, f"{prefix}_{base_name}.docx")
        doc.save(docx_path)
        docx_paths.append(docx_path)

    # Convertir a ODT con soffice
    print("Convertiendo documentos a formato ODT...")
    for docx_p in docx_paths:
        cmd = ["soffice", "--headless", "--convert-to", "odt", docx_p, "--outdir", output_dir]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            odt_p = docx_p.replace(".docx", ".odt")
            print(f"✓ Generado: {odt_p}")
            # Eliminar temporal docx
            os.remove(docx_p)
        else:
            print(f"⚠️ Advertencia en conversión de {docx_p}: {res.stderr}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generador ODT de Exámenes")
    parser.add_argument("--input", required=True, help="Archivo JSON con los datos del examen")
    parser.add_argument("--output-dir", default="examenes", help="Carpeta de salida")
    args = parser.parse_args()
    generar_odt_desde_json(args.input, args.output_dir)
