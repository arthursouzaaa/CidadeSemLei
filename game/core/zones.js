// ===== ZONAS: tabela de áreas da cidade =====
// MAPA 16x16: apenas as 4 zonas ativas originais.
// As zonas "esqueleto" (parque, financeiro, porto, etc.) foram removidas
// porque ficavam fora do mapa 16x16 e não seriam acessíveis.

const MUNDO_W = 16;   // NW: quarteirões na horizontal
const MUNDO_H = 16;   // NH: quarteirões na vertical

const ZONAS = [
  { id: 'centro', nome: 'Centro (comercial)', i0: 5, i1: 10, j0: 0, j1: 7,
    chao: null, predio: 'alto', clima: 'rico', ativa: true },
  { id: 'industrial', nome: 'Zona industrial', i0: 11, i1: 15, j0: 0, j1: 6,
    chao: '#5f6163', predio: 'galpao', clima: 'trabalho', ativa: true },
  { id: 'periferia', nome: 'Periferia', i0: 0, i1: 4, j0: 8, j1: 15,
    chao: '#7c6a4f', predio: 'simples', clima: 'perigo', ativa: true },
  { id: 'praia', nome: 'Orla / Praia', i0: 11, i1: 15, j0: 10, j1: 15,
    chao: '#e0c08a', predio: 'colorido', clima: 'lazer', ativa: true }
];

function zonaDe(i, j) {
  for (const z of ZONAS) {
    if (i >= z.i0 && i <= z.i1 && j >= z.j0 && j <= z.j1) return z;
  }
  return null;
}

function zonaIdDe(i, j) {
  const z = zonaDe(i, j);
  return z && z.ativa ? z.id : null;
}

function zonasAtivas() {
  return ZONAS.filter(z => z.ativa);
}