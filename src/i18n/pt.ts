const pt = {
  common: {
    appName: 'Bolão da Copa',
    loading: 'Carregando…',
    save: 'Salvar',
    language: 'Idioma',
  },
  settings: {
    heading: 'Bolão da Copa (Protótipo)',
    description:
      'Este é um teste simples: um único número armazenado no Supabase. Qualquer pessoa pode ler e atualizar (ainda sem autenticação).',
    valueLabel: 'Valor no banco de dados:',
    saved: 'Salvo!',
    saveError: 'Falha ao salvar o valor.',
    loadError: 'Falha ao carregar o valor do banco.',
    invalidNumber: 'Por favor, digite um número válido.',
  },
}

export default pt
export type PtMessages = typeof pt
