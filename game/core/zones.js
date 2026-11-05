// ===== ZONAS: tabela de áreas da cidade (Fase 0) =====
// Fase 0: nada aqui altera o mapa. O mundo atual continua 16x16.
// A expansão para 32x32 virá depois; as coordenadas atuais ficam no canto NW
// (i 0..15, j 0..15) para que casas, lojas, caixas, garagem e saves não mudem.

// Tamanho do mundo (Fase 0 mantém 16; a expansão troca para 32)
const MUNDO_W = 16;   // NW: quarteirões na horizontal
const MUNDO_H = 16;   // NH: quarteirões na vertical

// Tabela de áreas. Retângulo em células: i0..i1 e j0..j1 (inclusive).
// ativa: true = já existe no jogo; false = esqueleto (sem comportamento ainda).
const ZONAS = [
  // ----- ÁREAS ATUAIS (ativas) -----
  { id: 'centro', nome: 'Centro (comercial)', i0: 5, i1: 10, j0: 0, j1: 7,
    chao: null, predio: 'alto', clima: 'rico', ativa: true },
  { id: 'industrial', nome: 'Zona industrial', i0: 11, i1: 15, j0: 0, j1: 6,
    chao: '#5f6163', predio: 'galpao', clima: 'trabalho', ativa: true },
  { id: 'periferia', nome: 'Periferia', i0: 0, i1: 4, j0: 8, j1: 15,
    chao: '#7c6a4f', predio: 'simples', clima: 'perigo', ativa: true },
  { id: 'praia', nome: 'Orla / Praia', i0: 11, i1: 15, j0: 10, j1: 15,
    chao: '#e0c08a', predio: 'colorido', clima: 'lazer', ativa: true },

  // ----- NOVAS ÁREAS (esqueleto, sem comportamento ainda) -----
  // Posições de referência dentro do mapa 32x32 da expansão.
  // Parque: entre o Centro e o Financeiro (Centro-Leste).
  { id: 'parque', nome: 'Parque Central / Jardim Botânico', i0: 16, i1: 21, j0: 0, j1: 9,
    chao: '#2f6b3a', predio: 'nenhum', clima: 'lazer_limpo', ativa: false },
  { id: 'financeiro', nome: 'Distrito Financeiro', i0: 22, i1: 31, j0: 0, j1: 9,
    chao: null, predio: 'envidracado', clima: 'rico_perigoso', ativa: false },
  { id: 'porto', nome: 'Zona Portuária / Docas', i0: 0, i1: 7, j0: 0, j1: 6,
    chao: '#4b5563', predio: 'conteineres', clima: 'maresia', ativa: false },
  { id: 'entretenimento', nome: 'Entretenimento / Parque de Diversões', i0: 16, i1: 25, j0: 22, j1: 31,
    chao: '#6d28d9', predio: 'neon', clima: 'festa', ativa: false },
  { id: 'favela', nome: 'Favela Vertical / Beco dos Esquecidos', i0: 0, i1: 5, j0: 16, j1: 25,
    chao: '#78716c', predio: 'vertical', clima: 'vielas', ativa: false },
  { id: 'deserto', nome: 'Deserto / Zona Rural', i0: 6, i1: 15, j0: 0, j1: 0,
    chao: '#d6b77a', predio: 'casas_isoladas', clima: 'neblina', ativa: false },
  { id: 'hospital', nome: 'Distrito Médico / Hospitalar', i0: 6, i1: 10, j0: 9, j1: 15,
    chao: '#e5e7eb', predio: 'branco', clima: 'calmo', ativa: false }
];

// Retorna o registro da zona que contém a célula (i, j), ou null.
// Se áreas se sobrepõem, vale a primeira ativa (a Fase 0 evita sobreposição).
function zonaDe(i, j) {
  for (const z of ZONAS) {
    if (i >= z.i0 && i <= z.i1 && j >= z.j0 && j <= z.j1) return z;
  }
  return null;
}

// Atalho: id da zona ativa em (i, j), ou null. Útil para trocar cellDistrict/districtAt.
function zonaIdDe(i, j) {
  const z = zonaDe(i, j);
  return z && z.ativa ? z.id : null;
}

// Lista só das zonas que já têm comportamento no jogo.
function zonasAtivas() {
  return ZONAS.filter(z => z.ativa);
}