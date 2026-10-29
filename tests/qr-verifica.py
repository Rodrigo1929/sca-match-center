# Verificador independente dos QR gerados por src/js/qr.js (sem bibliotecas externas).
# Lê cada matriz: confirma a informação de formato (BCH e tabela da norma para o nível M), tira a máscara,
# lê as palavras de código, separa os blocos, confirma o Reed-Solomon (síndromes a zero) e descodifica o texto.
# Uso: python tests/qr-verifica.py <ficheiro.json com [{"texto": ..., "m": [[0/1...]...]}]>
import json, sys

ECC_M = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26]
BLOCOS_M = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16]
FORMATO_M = {0: "101010000010010", 1: "101000100100101", 2: "101111001111100", 3: "101101101001011",
             4: "100010111111001", 5: "100000011001110", 6: "100111110010111", 7: "100101010100000"}

# GF(256) com o polinómio 0x11D
EXP, LOG = [0] * 512, [0] * 256
x = 1
for i in range(255):
    EXP[i] = x; LOG[x] = i; x <<= 1
    if x & 0x100: x ^= 0x11D
for i in range(255, 512): EXP[i] = EXP[i - 255]
def gmul(a, b): return 0 if a == 0 or b == 0 else EXP[LOG[a] + LOG[b]]

def funcoes(n, v):
    f = [[False] * n for _ in range(n)]
    for i in range(n): f[6][i] = f[i][6] = True
    for cx, cy in ((3, 3), (n - 4, 3), (3, n - 4)):
        for dy in range(-4, 5):
            for dx in range(-4, 5):
                if 0 <= cx + dx < n and 0 <= cy + dy < n: f[cy + dy][cx + dx] = True
    if v > 1:
        na = v // 7 + 2
        passo = -(-(v * 4 + 4) // (na * 2 - 2)) * 2
        pos = [6] + sorted([n - 7 - passo * i for i in range(na - 1)])
        for i, a in enumerate(pos):
            for j, b in enumerate(pos):
                if (i, j) in ((0, 0), (0, na - 1), (na - 1, 0)): continue
                for dy in range(-2, 3):
                    for dx in range(-2, 3): f[b + dy][a + dx] = True
    for i in range(9): f[8][i] = f[i][8] = True
    for i in range(8): f[8][n - 1 - i] = True; f[n - 1 - i][8] = True
    if v >= 7:
        for i in range(18): f[i // 3][n - 11 + i % 3] = True; f[n - 11 + i % 3][i // 3] = True
    return f

def verifica(texto, m):
    n = len(m); v = (n - 17) // 4
    assert n == 4 * v + 17 and 1 <= v <= 20, "tamanho"
    # formato (cópia à volta do canto superior esquerdo)
    pos = [(8, i) for i in range(6)] + [(8, 7), (8, 8), (7, 8)] + [(14 - i, 8) for i in range(9, 15)]
    bits = sum(m[y][x] << i for i, (x, y) in enumerate(pos))
    s = format(bits, "015b")
    mask = [k for k, t in FORMATO_M.items() if t == s]
    assert mask, "formato não é do nível M: " + s
    mask = mask[0]
    # segunda cópia tem de ser igual
    pos2 = [(n - 1 - i, 8) for i in range(8)] + [(8, n - 15 + i) for i in range(8, 15)]
    assert sum(m[y][x] << i for i, (x, y) in enumerate(pos2)) == bits, "2.ª cópia do formato diferente"
    assert m[n - 8][8] == 1, "módulo escuro"
    cond = [lambda x, y: (x + y) % 2 == 0, lambda x, y: y % 2 == 0, lambda x, y: x % 3 == 0, lambda x, y: (x + y) % 3 == 0,
            lambda x, y: (x // 3 + y // 2) % 2 == 0, lambda x, y: x * y % 2 + x * y % 3 == 0,
            lambda x, y: (x * y % 2 + x * y % 3) % 2 == 0, lambda x, y: ((x + y) % 2 + x * y % 3) % 2 == 0][mask]
    f = funcoes(n, v)
    lidos = []
    col = n - 1
    while col >= 1:
        if col == 6: col = 5
        sobe = ((col + 1) & 2) == 0
        for k in range(n):
            y = n - 1 - k if sobe else k
            for j in range(2):
                x_ = col - j
                if not f[y][x_]: lidos.append(m[y][x_] ^ (1 if cond(x_, y) else 0))
        col -= 2
    cw = [int("".join(map(str, lidos[i:i + 8])), 2) for i in range(0, len(lidos) - len(lidos) % 8, 8)]
    nb, ecc = BLOCOS_M[v - 1], ECC_M[v - 1]
    total = len(cw); curtos = nb - total % nb; lc = total // nb
    tam = [lc - ecc + (0 if i < curtos else 1) for i in range(nb)]
    blocos = [[] for _ in range(nb)]; k = 0
    for i in range(max(tam)):
        for j in range(nb):
            if i < tam[j]: blocos[j].append(cw[k]); k += 1
    for i in range(ecc):
        for j in range(nb): blocos[j].append(cw[k]); k += 1
    dados = []
    for j, b in enumerate(blocos):
        for r in range(ecc):  # síndrome: o polinómio do bloco avaliado em alfa^r tem de dar zero
            acc = 0
            for c in b: acc = gmul(acc, EXP[r]) ^ c
            assert acc == 0, f"Reed-Solomon falhou no bloco {j}"
        dados += b[:tam[j]]
    bs = "".join(format(c, "08b") for c in dados)
    assert bs[:4] == "0100", "modo não é byte"
    cb = 8 if v <= 9 else 16
    ln = int(bs[4:4 + cb], 2)
    txt = bytes(int(bs[4 + cb + 8 * i:12 + cb + 8 * i], 2) for i in range(ln)).decode("utf8")
    assert txt == texto, f"texto lido diferente: {txt!r}"
    return v, mask

# vetor conhecido do Reed-Solomon (1-M «HELLO WORLD», tutorial da thonky.com): dados → correção
def rs(dados, g):
    div = [0] * g; div[g - 1] = 1; raiz = 1
    for i in range(g):
        for j in range(g):
            div[j] = gmul(div[j], raiz)
            if j + 1 < g: div[j] ^= div[j + 1]
        raiz = gmul(raiz, 2)
    r = [0] * g
    for b in dados:
        fct = b ^ r.pop(0); r.append(0)
        for i in range(g): r[i] ^= gmul(div[i], fct)
    return r
assert rs([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17], 10) == [196, 35, 39, 119, 235, 215, 231, 226, 93, 23], "vetor RS"

casos = json.load(open(sys.argv[1], encoding="utf8"))
for c in casos:
    v, mask = verifica(c["texto"], c["m"])
    print(f"OK v{v} máscara {mask}: {c['texto'][:60]}")
print(f"{len(casos)} QR lidos e conferidos")
