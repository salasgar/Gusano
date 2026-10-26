from functools import lru_cache
import sys
sys.setrecursionlimit(10000)
# --- toro hexagonal: hexágono de radio r con lados opuestos pegados ---
DIRS=[(1,0),(1,-1),(0,-1),(-1,0),(-1,1),(0,1)]
def hexcells(r): return [(q,s) for q in range(-r,r+1) for s in range(-r,r+1) if abs(q+s)<=r]
def hextoro(r):
    cells=hexcells(r); idx={c:i for i,c in enumerate(cells)}
    a=(2*r+1,-r); b=(r,r+1)  # vectores de la red de traslaciones
    def red(q,s):
        for m in range(-3,4):
            for n in range(-3,4):
                c=(q+m*a[0]+n*b[0], s+m*a[1]+n*b[1])
                if c in idx: return idx[c]
        return None
    vec=[]
    for (q,s) in cells:
        v=set()
        for dq,ds in DIRS:
            j=red(q+dq,s+ds); assert j is not None; v.add(j)
        vec.append(v)
    return cells,vec
for r in (1,2,3):
    cells,vec=hextoro(r); n=len(cells)
    sim=all(i in vec[j] for i in range(n) for j in vec[i])
    grados={len(v) for v in vec}
    # ¿circulante con saltos 1, 3r+1, 3r+2? buscar un orden: lineal q + (3r+1)*? -> comprobar isomorfía por invariante simple
    print(f"hex toro r={r}: {n} casillas, grados {grados}, simétrico {sim}, sin bucles {all(i not in vec[i] for i in range(n))}")
# --- minimax clásico (gusano maximiza longitud) en grafo dirigido ---
def valor(vec, inicio):
    n=len(vec)
    @lru_cache(None)
    def v(mask, cab, gus):
        legales=[j for j in vec[cab] if not mask>>j&1]
        if not legales: return bin(mask).count('1')
        res=[v(mask|1<<j, j, not gus) for j in legales]
        return max(res) if gus else min(res)
    return v(1<<inicio, inicio, False)  # tras la inicial mueve el pájaro
def rejilla(alto,lado,patron,toro=False):
    idx=lambda f,c:f*lado+c
    vec=[set() for _ in range(alto*lado)]
    for f in range(alto):
        for c in range(lado):
            i=idx(f,c)
            # horizontal
            c2=c+1
            if c2<lado or toro:
                j=idx(f,c2%lado)
                if patron=='manhattan': (vec[i].add(j) if f%2==0 else vec[j].add(i))
                elif patron=='corriente': vec[i].add(j)
                else: vec[i].add(j); vec[j].add(i)
            f2=f+1
            if f2<alto or toro:
                j=idx(f2%alto,c)
                if patron=='manhattan': (vec[i].add(j) if c%2==0 else vec[j].add(i))
                elif patron=='corriente': vec[i].add(j)
                else: vec[i].add(j); vec[j].add(i)
    return [sorted(v) for v in vec]
for nombre,(al,la,pat,toro) in {'4x4 doble':(4,4,'',False),'4x4 manhattan':(4,4,'manhattan',False),'4x4 manhattan toro':(4,4,'manhattan',True),'4x4 corriente toro':(4,4,'corriente',True),'5x5 manhattan':(5,5,'manhattan',False),'4x4 corriente plano':(4,4,'corriente',False)}.items():
    vec=rejilla(al,la,pat,toro); n=len(vec)
    sin_salida=sum(1 for v in vec if not v)
    vals=[valor(vec,i) for i in range(n)]
    print(f"{nombre}: valores por inicio min {min(vals)} max {max(vals)} de {n}; casillas sin salida {sin_salida}")
# tres corrientes en hexagonal radio 2 (direcciones 0, 2, 4 de DIRS hacia delante)
cells=hexcells(2); idx={c:i for i,c in enumerate(cells)}
vec=[set() for _ in cells]
for (q,s),i in idx.items():
    for k in (0,2,4):
        dq,ds=DIRS[k]; j=idx.get((q+dq,s+ds))
        if j is not None: vec[i].add(j)
vec=[sorted(v) for v in vec]
vals=[valor(vec,i) for i in range(len(vec))]
print(f"hex r=2 tres corrientes: min {min(vals)} max {max(vals)} de {len(vec)}; sin salida {sum(1 for v in vec if not v)}")
