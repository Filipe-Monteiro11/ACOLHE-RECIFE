/* ==========================================================
   instituicoes.js  (pasta /js)
   Dados FICTÍCIOS + busca por nome + filtros de bairro e serviço.
   Não mexe no menu (isso é do main.js).
   Para ligar ao back-end depois, troque o array INSTITUICOES
   por um fetch e chame aplicarFiltros().
   ========================================================== */
(function () {
  'use strict';

  // Página de detalhes (ajuste para o nome real da rota)
  const PAGINA_DETALHES = 'instituicao.html';

  const BAIRROS = ['Boa Vista', 'Santo Amaro', 'Imbiribeira', 'Cordeiro'];
  const SERVICOS = ['Acolhimento', 'Alimentação', 'Higiene', 'Saúde', 'Psicossocial', 'Oficinas'];

  // Dados fictícios
  const INSTITUICOES = [
    { id: 1, nome: 'Casa Esperança', bairro: 'Boa Vista',
      descricao: 'Abrigo temporário com pernoite, refeições e orientação para retomada de documentos.',
      servicos: ['Acolhimento', 'Alimentação', 'Higiene'] },
    { id: 2, nome: 'Refeitório Pão Partilhado', bairro: 'Santo Amaro',
      descricao: 'Almoço e jantar diários, abertos a qualquer pessoa em situação de vulnerabilidade.',
      servicos: ['Alimentação'] },
    { id: 3, nome: 'Centro de Apoio Maré Viva', bairro: 'Imbiribeira',
      descricao: 'Atendimento psicossocial, grupos de escuta e encaminhamento para a rede de saúde.',
      servicos: ['Psicossocial', 'Saúde'] },
    { id: 4, nome: 'Espaço Recomeço', bairro: 'Cordeiro',
      descricao: 'Oficinas de geração de renda e acolhimento para pessoas em reinserção social.',
      servicos: ['Oficinas', 'Acolhimento'] },
    { id: 5, nome: 'Ponto de Higiene Dignidade', bairro: 'Boa Vista',
      descricao: 'Banho, troca de roupas, kit de higiene e lavanderia solidária.',
      servicos: ['Higiene'] },
    { id: 6, nome: 'Abrigo Frei Caneca', bairro: 'Santo Amaro',
      descricao: 'Acolhimento 24 horas para adultos, com refeições e acompanhamento social.',
      servicos: ['Acolhimento', 'Alimentação', 'Psicossocial'] },
    { id: 7, nome: 'Clínica Solidária Cuidar', bairro: 'Imbiribeira',
      descricao: 'Consultas básicas, aferição de pressão, curativos e distribuição de medicamentos.',
      servicos: ['Saúde', 'Higiene'] },
    { id: 8, nome: 'Casa Mãos Abertas', bairro: 'Cordeiro',
      descricao: 'Acolhimento de mulheres e crianças, com apoio psicológico e oficinas.',
      servicos: ['Acolhimento', 'Psicossocial', 'Oficinas'] },
    { id: 9, nome: 'Cozinha Comunitária Sabor da Rua', bairro: 'Boa Vista',
      descricao: 'Refeições quentes à noite e cestas básicas para famílias cadastradas.',
      servicos: ['Alimentação'] }
  ];

  const $ = (id) => document.getElementById(id);
  const form = $('inst-form');
  const inputNome = $('inst-nome');
  const selectBairro = $('inst-bairro');
  const chipsBox = $('inst-chips');
  const grid = $('inst-grid');
  const count = $('inst-count');
  const empty = $('inst-empty');

  if (!form || !grid) return;

  let servicoAtivo = '';

  // Remove acentos e maiúsculas para a busca
  const normalizar = (t) =>
    String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const esc = (t) =>
    String(t).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function montarFiltros() {
    BAIRROS.forEach((b) => selectBairro.add(new Option(b, b)));

    ['Todos'].concat(SERVICOS).forEach((s) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inst-chip';
      btn.textContent = s;
      btn.dataset.servico = s === 'Todos' ? '' : s;
      btn.setAttribute('aria-pressed', s === 'Todos' ? 'true' : 'false');
      chipsBox.appendChild(btn);
    });
  }

  function marcarChip() {
    chipsBox.querySelectorAll('.inst-chip').forEach((c) =>
      c.setAttribute('aria-pressed', c.dataset.servico === servicoAtivo ? 'true' : 'false'));
  }

  function cardHTML(i) {
    return `
      <article class="inst-card">
        <h2>${esc(i.nome)}</h2>
        <p class="inst-card__bairro"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${esc(i.bairro)}</p>
        <p class="inst-card__desc">${esc(i.descricao)}</p>
        <ul class="inst-card__tags" aria-label="Serviços oferecidos">
          ${i.servicos.map((s) => `<li>${esc(s)}</li>`).join('')}
        </ul>
        <a class="inst-btn inst-btn--primary" href="${PAGINA_DETALHES}?id=${i.id}"
           aria-label="Ver detalhes de ${esc(i.nome)}">Ver detalhes</a>
      </article>`;
  }

  function aplicarFiltros() {
    const nome = normalizar(inputNome.value);
    const bairro = selectBairro.value;

    const lista = INSTITUICOES.filter((i) =>
      (!nome || normalizar(i.nome).includes(nome)) &&
      (!bairro || i.bairro === bairro) &&
      (!servicoAtivo || i.servicos.includes(servicoAtivo)));

    grid.innerHTML = lista.map(cardHTML).join('');
    empty.hidden = lista.length > 0;
    count.textContent = lista.length === 1
      ? '1 instituição encontrada'
      : `${lista.length} instituições encontradas`;
  }

  function limpar() {
    inputNome.value = '';
    selectBairro.value = '';
    servicoAtivo = '';
    marcarChip();
    aplicarFiltros();
    inputNome.focus();
  }

  // Eventos
  inputNome.addEventListener('input', aplicarFiltros);
  selectBairro.addEventListener('change', aplicarFiltros);
  chipsBox.addEventListener('click', (e) => {
    const chip = e.target.closest('.inst-chip');
    if (!chip) return;
    servicoAtivo = chip.dataset.servico;
    marcarChip();
    aplicarFiltros();
  });
  $('inst-limpar').addEventListener('click', limpar);
  $('inst-limpar-vazio').addEventListener('click', limpar);
  form.addEventListener('submit', (e) => e.preventDefault());

  // Início: aceita ?nome=...&regiao=...&servico=... vindo da busca da Home
  montarFiltros();
  const p = new URLSearchParams(window.location.search);
  inputNome.value = p.get('nome') || '';
  if (BAIRROS.includes(p.get('regiao'))) selectBairro.value = p.get('regiao');
  if (SERVICOS.includes(p.get('servico'))) { servicoAtivo = p.get('servico'); marcarChip(); }
  aplicarFiltros();
})();