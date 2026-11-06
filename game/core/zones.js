// ===== ZONAS: tabela de áreas da cidade =====
// Fase 0.5b (ajustada): mundo 32x32. O 16x16 original (canto NW) mantém as 4 zonas ativas.
// Áreas novas entram como esqueleto (ativa: false) até terem comportamento próprio.

const MUNDO_W = 32;   // NW: quarteirões na horizontal
const MUNDO_H = 32;   // NH: quarteirões na vertical

const ZONAS = [
  // ----- ÁREAS ATUAIS (ativas, dentro do 16x16 original) -----
  { id: 'centro', nome: 'Centro (comercial)', i0: 5, i1: 10, j0: 0, j1: 7,
    chao: null, predio: 'alto', clima: 'rico', ativa: true },
  { id: 'industrial', nome: 'Zona industrial', i0: 11, i1: 15, j0: 0, j1: 6,
    chao: '#5f6163', predio: 'galpao', clima: 'trabalho', ativa: true },
  { id: 'periferia', nome: 'Periferia', i0: 0, i1: 4, j0: 8, j1: 15,
    chao: '#7c6a4f', predio: 'simples', clima: 'perigo', ativa: true },
  { id: 'praia', nome: 'Orla / Praia', i0: 11, i1: 15, j0: 10, j1: 15,
    chao: '#e0c08a', predio: 'colorido', clima: 'lazer', ativa: true },

  // ----- NOVAS ÁREAS (esqueleto, coordenadas no mapa 32x32) -----
  // Parque: entre o Centro e o Financeiro (Centro-Leste)
  { id: 'parque', nome: 'Parque Central / Jardim Botânico', i0: 16, i1: 25, j0: 0, j1: 11,
    chao: '#2f6b3a', predio: 'nenhum', clima: 'lazer_limpo', ativa: false },
  // Financeiro: borda leste
  { id: 'financeiro', nome: 'Distrito Financeiro', i0: 26, i1: 31, j0: 0, j1: 11,
    chao: null, predio: 'envidracado', clima: 'rico_perigoso', ativa: false },
  // Porto: oeste/norte (sobre o terreno neutro, fora do 16x16)
  { id: 'porto', nome: 'Zona Portuária / Docas', i0: 0, i1: 9, j0: 0, j1: 7,
    chao: '#4b5563', predio: 'conteineres', clima: 'maresia', ativa: false },
  // Entretenimento: sul, perto da praia
  { id: 'entretenimento', nome: 'Entretenimento / Parque de Diversões', i0: 16, i1: 27, j0: 24, j1: 31,
    chao: '#6d28d9', predio: 'neon', clima: 'festa', ativa: false },
  // Favela: extremo oeste
  { id: 'favela', nome: 'Favela Vertical / Beco dos Esquecidos', i0: 0, i1: 7, j0: 16, j1: 27,
    chao: '#78716c', predio: 'vertical', clima: 'vielas', ativa: false },
  // Deserto: faixa norte
  { id: 'deserto', nome: 'Deserto / Zona Rural', i0: 16, i1: 31, j0: 0, j1: 0,
    chao: '#d6b77a', predio: 'casas_isoladas', clima: 'neblina', ativa: false },
  // Hospital: centro-sul, fora do 16x16 original
  { id: 'hospital', nome: 'Distrito Médico / Hospitalar', i0: 16, i1: 22, j0: 28, j1: 31,
    chao: '#e5e7eb', predio: 'branco', clima: 'calmo', ativa: false }
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