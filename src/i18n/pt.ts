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
  sandbox: {
    heading: 'Simulador de pagamentos',
    description:
      'Teste diferentes blinds, apostas e resultados para ver como o pote e os pagamentos são calculados.',
    blindLabel: 'Blind (T$)',
    winningOutcomeLabel: 'Resultado vencedor',
    parametersSectionTitle: 'Parâmetros',
    betsSectionTitle: 'Apostas',
    playerIdLabel: 'Jogador',
    outcomeLabel: 'Resultado',
    stakeLabel: 'Valor (T$)',
    payoutLabel: 'Pagamento (T$)',
    addBet: 'Adicionar aposta',
    removeBet: 'Remover',
    calculateButton: 'Calcular pagamentos',
    resultsSectionTitle: 'Resultados',
    totalWageredLabel: 'Total apostado',
    totalPotLabel: 'Pote total',
    removedFromGameLabel: 'Removido do jogo',
    payoutsSectionTitle: 'Pagamentos',
    noResults: 'Nenhum resultado ainda. Preencha os dados e calcule.',
  },
}

export default pt
export type PtMessages = typeof pt
