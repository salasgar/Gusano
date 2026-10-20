"""Valor minimax de Gusano en grafos pequeños.
El maximizador mueve en los turnos impares (empieza), el minimizador en los pares.
Puntuación = número de casillas rellenas al acabar (longitud del camino)."""
import sys, time
from functools import lru_cache
sys.setrecursionlimit(10000)

def grid(n, m, moves):
    idx = {(i, j): i*m + j for i in range(n) for j in range(m)}
    adj = [[] for _ in range(n*m)]
    for (i, j), k in idx.items():
        for di, dj in moves:
            if (i+di, j+dj) in idx:
                adj[k].append(idx[(i+di, j+dj)])
    return adj

def torus(n, m, moves):
    adj = [[] for _ in range(n*m)]
    for i in range(n):
        for j in range(m):
            for di, dj in moves:
                t = ((i+di) % n) * m + (j+dj) % m
                if t != i*m+j and t not in adj[i*m+j]:
                    adj[i*m+j].append(t)
    return adj

M4 = [(0,1),(1,0),(0,-1),(-1,0)]
M8 = M4 + [(1,1),(1,-1),(-1,1),(-1,-1)]
MK = [(1,2),(2,1),(-1,2),(-2,1),(1,-2),(2,-1),(-1,-2),(-2,-1)]

def hexboard(R):
    cells = [(q, r) for q in range(-R, R+1) for r in range(-R, R+1) if abs(q+r) <= R]
    idx = {c: k for k, c in enumerate(cells)}
    dirs = [(1,0),(0,1),(-1,1),(-1,0),(0,-1),(1,-1)]
    adj = [[] for _ in cells]
    for (q, r), k in idx.items():
        for dq, dr in dirs:
            if (q+dq, r+dr) in idx:
                adj[k].append(idx[(q+dq, r+dr)])
    return adj

def icosahedron():  # = caras del dodecaedro (12 casillas, 5 vecinas cada una)
    adj = [[] for _ in range(12)]
    def e(a, b):
        adj[a].append(b); adj[b].append(a)
    for i in range(5):
        e(0, 1+i); e(11, 6+i)
        e(1+i, 1+(i+1) % 5); e(6+i, 6+(i+1) % 5)
        e(1+i, 6+i); e(1+i, 6+(i+1) % 5)
    return adj

def dodecahedron():  # = caras del icosaedro (20 casillas, 3 vecinas): Petersen generalizado G(10,2)
    adj = [[] for _ in range(20)]
    def e(a, b):
        adj[a].append(b); adj[b].append(a)
    for i in range(10):
        e(i, (i+1) % 10); e(i, 10+i); e(10+i, 10+(i+2) % 10)
    return adj

def cube_faces():  # 6 caras, 4 vecinas: octaedro K_{2,2,2}
    adj = [[] for _ in range(6)]
    for a in range(6):
        for b in range(6):
            if a != b and {a, b} not in ({0,1},{2,3},{4,5}):
                adj[a].append(b)
    return adj

def solve(adj, label, limit=None):
    n = len(adj)
    nb = [sum(1 << j for j in a) for a in adj]
    t0 = time.time()
    @lru_cache(maxsize=None)
    def val(mask, head):
        free = nb[head] & ~mask
        k = bin(mask).count('1')
        if not free:
            return k
        best = None
        maxturn = (k % 2 == 0)   # siguiente jugada es la k+1; impar => maximizador
        while free:
            b = free & -free
            free ^= b
            v = val(mask | b, b.bit_length()-1)
            if best is None or (v > best if maxturn else v < best):
                best = v
        return best
    per_start = [val(1 << s, s) for s in range(n)]
    dt = time.time() - t0
    print(f"{label:28s} casillas={n:3d}  max elige inicio={max(per_start):3d}  "
          f"min elige inicio={min(per_start):3d}  media={sum(per_start)/n:5.1f}  "
          f"estados={val.cache_info().currsize:9d}  {dt:5.1f}s")
    return per_start

if __name__ == '__main__':
    which = sys.argv[1:] or ['all']
    jobs = [
        ('cuadrado 3x3, 4 vecinas', lambda: grid(3,3,M4)),
        ('cuadrado 4x4, 4 vecinas', lambda: grid(4,4,M4)),
        ('cuadrado 5x5, 4 vecinas', lambda: grid(5,5,M4)),
        ('cuadrado 4x5, 4 vecinas', lambda: grid(4,5,M4)),
        ('cuadrado 6x6, 4 vecinas', lambda: grid(6,6,M4)),
        ('cuadrado 4x4, 8 vecinas', lambda: grid(4,4,M8)),
        ('cuadrado 5x5, 8 vecinas', lambda: grid(5,5,M8)),
        ('caballo 4x4', lambda: grid(4,4,MK)),
        ('caballo 5x5', lambda: grid(5,5,MK)),
        ('caballo 6x6', lambda: grid(6,6,MK)),
        ('hexagonal radio 2 (19)', lambda: hexboard(2)),
        ('toro 4x4, 4 vecinas', lambda: torus(4,4,M4)),
        ('toro 5x5, 4 vecinas', lambda: torus(5,5,M4)),
        ('caras del cubo (6)', cube_faces),
        ('caras del dodecaedro (12)', icosahedron),
        ('caras del icosaedro (20)', dodecahedron),
    ]
    for label, f in jobs:
        if which != ['all'] and not any(w in label for w in which):
            continue
        ps = solve(f(), label)
        if 'cuadrado' in label and len(ps) <= 36:
            m = int(len(ps) ** 0.5)
            for i in range(m):
                print('   ', ' '.join(f'{ps[i*m+j]:2d}' for j in range(m)))
