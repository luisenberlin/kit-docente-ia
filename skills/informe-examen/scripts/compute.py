#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Calcula notas y estado por contenido y criterio.
Uso: python compute.py plan.json resultados.json --out res.json [--r 0.5] [--superado 70] [--proceso 40]
"""
import argparse, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib as L

def compute(plan, results, wB=1.0, wR=0.5, wM=0.0, sup=70, pro=40):
    V = {"B": wB, "R": wR, "M": wM, "": 0.0, None: 0.0}
    ap = plan["apartados"]
    ids = [a["id"] for a in ap]
    total = sum(float(a["puntos"]) for a in ap)
    alumnos = results["alumnos"]
    out = {"plan": plan.get("titulo", ""), "total": total, "umbrales": {"superado": sup, "proceso": pro},
           "pesos": {"B": wB, "R": wR, "M": wM}, "alumnos": []}
    avisos = []
    for al in alumnos:
        resp = al["respuestas"]
        for i in ids:
            v = (resp.get(i) or "").strip().upper()
            if v not in ("B", "R", "M", ""):
                avisos.append("%s: valor raro en %s: %r" % (al["nombre"], i, v))
        faltan = [i for i in ids if i not in resp]
        if faltan: avisos.append("%s: sin dato en %s (se cuenta como en blanco)" % (al["nombre"], ", ".join(faltan)))
        def agg(sel):
            got = sum(float(a["puntos"]) * V[(resp.get(a["id"]) or "").strip().upper()] for a in ap if sel(a))
            tot = sum(float(a["puntos"]) for a in ap if sel(a))
            return got, tot
        nota = sum(float(a["puntos"]) * V[(resp.get(a["id"]) or "").strip().upper()] for a in ap)
        al_out = {"nombre": al["nombre"], "idioma": al.get("idioma", "es"), "idioma_informe": al.get("idioma_informe", "es"),
                  "nota": round(nota, 2), "respuestas": {i: (resp.get(i) or "").strip().upper() for i in ids}, "contenidos": {}, "criterios": {}}
        for k in plan.get("contenidos", {}):
            g, t = agg(lambda a, k=k: k in a.get("contenidos", []))
            if t:
                pc = round(100 * g / t)
                al_out["contenidos"][k] = dict(got=round(g, 2), tot=round(t, 2), pct=pc, estado="superado" if pc >= sup else ("proceso" if pc >= pro else "reforzar"))
        for k in plan.get("criterios", {}):
            g, t = agg(lambda a, k=k: k in a.get("criterios", []))
            if t:
                pc = round(100 * g / t)
                al_out["criterios"][k] = dict(got=round(g, 2), tot=round(t, 2), pct=pc, estado="superado" if pc >= sup else ("proceso" if pc >= pro else "reforzar"))
        out["alumnos"].append(al_out)
    out["media"] = round(sum(a["nota"] for a in out["alumnos"]) / max(1, len(out["alumnos"])), 2)
    out["por_apartado"] = {i: round(100 * sum(V[(a["respuestas"].get(i) or "")] for a in out["alumnos"]) / max(1, len(out["alumnos"]))) for i in ids}
    out["avisos"] = avisos
    return out

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("plan"); ap.add_argument("resultados"); ap.add_argument("--out", default="res.json")
    ap.add_argument("--r", type=float, default=0.5, help="valor de R (regular), por defecto 0,5")
    ap.add_argument("--superado", type=float, default=70); ap.add_argument("--proceso", type=float, default=40)
    a = ap.parse_args()
    res = compute(L.load(a.plan), L.load(a.resultados), wR=a.r, sup=a.superado, pro=a.proceso)
    json.dump(res, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for al in res["alumnos"]:
        print("%-12s nota %5.2f  contenidos %s" % (al["nombre"], al["nota"], {k: v["pct"] for k, v in al["contenidos"].items()}))
    print("media", res["media"])
    for w in res["avisos"]: print("AVISO:", w)
