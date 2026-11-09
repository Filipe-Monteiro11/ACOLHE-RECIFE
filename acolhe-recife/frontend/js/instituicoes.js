/* ==========================================================
   instituicoes.js  (pasta /js)
   Dados FICTÍCIOS + busca por nome + filtros de bairro e serviço
   + janela "Ver detalhes" (descrição, horário, contato, como ajudar).
   Não mexe no menu (isso é do main.js).
   Para ligar ao back-end depois, troque o array INSTITUICOES
   por um fetch e chame aplicarFiltros().
   ========================================================== */
(function () {
  'use strict';

  const BAIRROS_FIXOS = ['Boa Vista', 'Santo Amaro', 'Imbiribeira', 'Cordeiro'];
  const SERVICOS = ['Acolhimento', 'Alimentação', 'Higiene', 'Saúde', 'Psicossocial', 'Oficinas'];

  const AJUDA_PADRAO = 'Entre em contato com a instituição para saber como doar ou ser voluntário.';

  // DADOS FICTÍCIOS (nomes, endereços, telefones e horários inventados)
  const INSTITUICOES = [
    { id: 1, nome: 'Casa Esperança', bairro: 'Boa Vista', tipo: 'ONG',
      descricao: 'Abrigo temporário com pernoite, refeições e orientação para retomada de documentos.',
      publico: 'Adultos em situação de rua',
      servicos: ['Acolhimento', 'Alimentação', 'Higiene'],
      endereco: 'Rua das Acácias, 120', horario: 'Todos os dias, 24 horas', telefones: ['(81) 90000-0001'],
      comoAjudar: 'Aceita doações de roupas, cobertores e produtos de higiene, de segunda a sexta, das 9h às 16h. Voluntários ajudam no jantar e na triagem de doações.' },
    { id: 2, nome: 'Refeitório Pão Partilhado', bairro: 'Santo Amaro', tipo: 'Associação comunitária',
      descricao: 'Almoço e jantar diários, abertos a qualquer pessoa em situação de vulnerabilidade.',
      publico: 'Qualquer pessoa em vulnerabilidade, sem cadastro',
      servicos: ['Alimentação'],
      endereco: 'Avenida dos Ipês, 450', horario: 'Almoço 11h30 às 13h30 e jantar 18h às 19h30', telefones: ['(81) 90000-0002'],
      comoAjudar: 'Recebe alimentos não perecíveis e precisa de voluntários para cozinhar e servir, principalmente aos fins de semana.' },
    { id: 3, nome: 'Centro de Apoio Maré Viva', bairro: 'Imbiribeira', tipo: 'ONG',
      descricao: 'Atendimento psicossocial, grupos de escuta e encaminhamento para a rede de saúde.',
      publico: 'Adultos e jovens a partir de 16 anos',
      servicos: ['Psicossocial', 'Saúde'],
      endereco: 'Rua do Farol, 88', horario: 'Segunda a sexta, 8h às 17h', telefones: ['(81) 90000-0003'],
      comoAjudar: 'Psicólogos e assistentes sociais podem se voluntariar para os grupos de escuta. Também aceita doações em dinheiro.' },
    { id: 4, nome: 'Espaço Recomeço', bairro: 'Cordeiro', tipo: 'Instituição filantrópica',
      descricao: 'Oficinas de geração de renda e acolhimento para pessoas em reinserção social.',
      publico: 'Adultos em reinserção social',
      servicos: ['Oficinas', 'Acolhimento'],
      endereco: 'Rua das Palmeiras, 300', horario: 'Segunda a sábado, 8h às 18h', telefones: ['(81) 90000-0004'],
      comoAjudar: 'Procura instrutores voluntários para oficinas de costura, panificação e informática, além de doações de máquinas e materiais.' },
    { id: 5, nome: 'Ponto de Higiene Dignidade', bairro: 'Boa Vista', tipo: 'Projeto social',
      descricao: 'Banho, troca de roupas, kit de higiene e lavanderia solidária.',
      publico: 'Pessoas em situação de rua',
      servicos: ['Higiene'],
      endereco: 'Praça da Estação, 15', horario: 'Terça a sábado, 8h às 14h', telefones: ['(81) 90000-0005'],
      comoAjudar: 'Doações de toalhas, sabonetes, escovas de dente e roupas íntimas novas são sempre bem-vindas.' },
    { id: 6, nome: 'Abrigo Frei Caneca', bairro: 'Santo Amaro', tipo: 'Serviço público municipal',
      descricao: 'Acolhimento 24 horas para adultos, com refeições e acompanhamento social.',
      publico: 'Adultos, homens e mulheres',
      servicos: ['Acolhimento', 'Alimentação', 'Psicossocial'],
      endereco: 'Rua Frei Caneca, 700', horario: 'Todos os dias, 24 horas', telefones: ['(81) 90000-0006'],
      comoAjudar: 'As doações devem ser entregues na recepção, das 8h às 17h. Não há cadastro de voluntários no momento.' },
    { id: 7, nome: 'Clínica Solidária Cuidar', bairro: 'Imbiribeira', tipo: 'Clínica filantrópica',
      descricao: 'Consultas básicas, aferição de pressão, curativos e distribuição de medicamentos.',
      publico: 'Pessoas sem plano de saúde',
      servicos: ['Saúde', 'Higiene'],
      endereco: 'Avenida Mar Azul, 1020', horario: 'Segunda a sexta, 7h às 15h', telefones: ['(81) 90000-0007'],
      comoAjudar: 'Aceita medicamentos dentro da validade e materiais de curativo. Profissionais de saúde podem se voluntariar aos sábados.' },
    { id: 8, nome: 'Casa Mãos Abertas', bairro: 'Cordeiro', tipo: 'ONG',
      descricao: 'Acolhimento de mulheres e crianças, com apoio psicológico e oficinas.',
      publico: 'Mulheres e seus filhos',
      servicos: ['Acolhimento', 'Psicossocial', 'Oficinas'],
      endereco: 'Rua dos Girassóis, 45', horario: 'Todos os dias, 24 horas', telefones: ['(81) 90000-0008'],
      aviso: 'Por segurança, o endereço completo é informado após o primeiro contato.',
      comoAjudar: 'Precisa de fraldas, material escolar e roupas infantis. Voluntárias ajudam com reforço escolar e brincadeiras.' },
    { id: 9, nome: 'Cozinha Comunitária Sabor da Rua', bairro: 'Boa Vista', tipo: 'Coletivo de voluntários',
      descricao: 'Refeições quentes à noite e cestas básicas para famílias cadastradas.',
      publico: 'Pessoas em situação de rua e famílias cadastradas',
      servicos: ['Alimentação'],
      endereco: 'Rua da Aurora, 210', horario: 'Segunda a sábado, 18h às 21h', telefones: ['(81) 90000-0009'],
      comoAjudar: 'Aceita arroz, feijão, óleo e legumes. Voluntários podem ajudar a cozinhar ou a distribuir marmitas à noite.' }
  ];

  const BAIRROS = BAIRROS_FIXOS;

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

  const normalizar = (t) =>
    String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const esc = (t) =>
    String(t).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Filtros e cards ---------- */
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
        <button type="button" class="inst-btn inst-btn--primary" data-detalhes="${i.id}"
           aria-label="Ver detalhes de ${esc(i.nome)}">Ver detalhes</button>
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

  /* ---------- Janela de detalhes ---------- */
  const NAO_INFORMADO = '<span class="inst-modal__nd">Não informado. Consulte a instituição.</span>';
  const telHref = (t) => 'tel:+55' + t.replace(/\D/g, '');

  function linha(icone, rotulo, valorHTML) {
    return `<div class="inst-modal__row">
      <dt><i class="fa-solid ${icone}" aria-hidden="true"></i>${rotulo}</dt>
      <dd>${valorHTML}</dd></div>`;
  }

  function modalHTML(i) {
    const mapa = i.endereco
      ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(i.endereco + ', Recife - PE')
      : '';
    const tels = i.telefones.length
      ? i.telefones.map((t) => `<a href="${telHref(t)}">${esc(t)}</a>`).join(' &nbsp;/&nbsp; ')
      : NAO_INFORMADO;

    return `
      <div class="inst-modal__panel" role="dialog" aria-modal="true" aria-labelledby="inst-modal-titulo" tabindex="-1">
        <button type="button" class="inst-modal__close" data-fechar aria-label="Fechar detalhes">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
        <p class="inst-modal__tipo">${esc(i.tipo)}</p>
        <h2 id="inst-modal-titulo">${esc(i.nome)}</h2>
        <p class="inst-modal__desc">${esc(i.descricao)}</p>
        <ul class="inst-card__tags" aria-label="Serviços oferecidos">
          ${i.servicos.map((s) => `<li>${esc(s)}</li>`).join('')}
        </ul>
        <dl class="inst-modal__lista">
          ${linha('fa-people-group', 'Quem é atendido', esc(i.publico))}
          ${linha('fa-location-dot', 'Endereço', i.endereco ? `${esc(i.endereco)}<br><small>${esc(i.bairro)}, Recife - PE</small>` : NAO_INFORMADO)}
          ${linha('fa-clock', 'Horário', i.horario ? esc(i.horario) : NAO_INFORMADO)}
          ${linha('fa-phone', 'Telefone', tels)}
          ${linha('fa-hand-holding-heart', 'Como ajudar', esc(i.comoAjudar || AJUDA_PADRAO))}
        </dl>
        ${i.aviso ? `<p class="inst-modal__aviso"><i class="fa-solid fa-circle-info" aria-hidden="true"></i>${esc(i.aviso)}</p>` : ''}
        <p class="inst-modal__fonte">Informações fictícias, apenas para demonstração do projeto.</p>
        <div class="inst-modal__acoes">
          ${mapa ? `<a class="inst-btn inst-btn--primary" href="${mapa}" target="_blank" rel="noopener">
            <i class="fa-solid fa-route" aria-hidden="true"></i>Como chegar</a>` : ''}
          ${i.telefones[0] ? `<a class="inst-btn inst-btn--outline" href="${telHref(i.telefones[0])}">
            <i class="fa-solid fa-phone" aria-hidden="true"></i>Ligar</a>` : ''}
        </div>
      </div>`;
  }

  const modal = document.createElement('div');
  modal.className = 'inst-modal';
  modal.hidden = true;
  (document.querySelector('.inst-main') || document.body).appendChild(modal);

  let ultimoFoco = null;
  const FOCAVEIS = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function abrir(id, gatilho) {
    const inst = INSTITUICOES.find((x) => x.id === Number(id));
    if (!inst) return;
    ultimoFoco = gatilho || document.activeElement;
    modal.innerHTML = modalHTML(inst);
    modal.hidden = false;
    document.body.classList.add('inst-travado');
    history.replaceState(null, '', '#inst-' + inst.id);
    modal.querySelector('[data-fechar]').focus();
  }

  function fechar() {
    if (modal.hidden) return;
    modal.hidden = true;
    modal.innerHTML = '';
    document.body.classList.remove('inst-travado');
    history.replaceState(null, '', location.pathname + location.search);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-detalhes]');
    if (b) abrir(b.dataset.detalhes, b);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-fechar]')) fechar();
  });

  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') { fechar(); return; }
    if (e.key !== 'Tab') return;
    const itens = modal.querySelectorAll(FOCAVEIS);
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });

  /* ---------- Eventos e início ---------- */
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

  // Aceita ?nome=...&regiao=...&servico=... vindo da busca da Home
  montarFiltros();
  const p = new URLSearchParams(window.location.search);
  inputNome.value = p.get('nome') || '';
  if (BAIRROS.includes(p.get('regiao'))) selectBairro.value = p.get('regiao');
  if (SERVICOS.includes(p.get('servico'))) { servicoAtivo = p.get('servico'); marcarChip(); }
  aplicarFiltros();

  // Link direto: instituicoes.html#inst-7 abre os detalhes da instituição 7
  const m = /^#inst-(\d+)$/.exec(location.hash);
  if (m) abrir(m[1]);
})();