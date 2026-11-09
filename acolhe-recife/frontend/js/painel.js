/* ===== Painel da instituição – ABRICIFE =====
   Os dados ficam no localStorage até existir integração com o banco.
   Para conectar depois, troque apenas load() e save(). */

(function () {
  'use strict';

  const KEY = 'abricife_instituicao';
  const DIAS = [
    ['seg', 'Segunda-feira'], ['ter', 'Terça-feira'], ['qua', 'Quarta-feira'],
    ['qui', 'Quinta-feira'], ['sex', 'Sexta-feira'], ['sab', 'Sábado'], ['dom', 'Domingo']
  ];
  const PRIORIDADES = { normal: 'Normal', medium: 'Média', urgent: 'Urgente' };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Estado ---------- */
  function estadoInicial() {
    const horarios = {};
    DIAS.forEach(([k]) => {
      horarios[k] = { aberto: ['seg', 'ter', 'qua', 'qui', 'sex'].includes(k), de: '08:00', ate: '17:00' };
    });
    return { dados: {}, servicos: [], necessidades: [], horarios, equipe: [] };
  }

  function load() {
    try {
      const salvo = JSON.parse(localStorage.getItem(KEY));
      return salvo ? { ...estadoInicial(), ...salvo } : estadoInicial();
    } catch (e) {
      return estadoInicial();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      toast('Não foi possível salvar neste navegador.', true);
      return false;
    }
  }

  let state = load();

  /* ---------- Utilidades ---------- */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  let toastTimer;
  function toast(msg, erro = false) {
    const t = $('#toast');
    t.innerHTML = `<i class="fa-solid ${erro ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> ${esc(msg)}`;
    t.classList.toggle('error', erro);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function emptyState(icone, texto) {
    return `<li class="empty"><i class="fa-solid ${icone}"></i>${texto}</li>`;
  }

  /* ---------- Máscaras ---------- */
  const so = v => v.replace(/\D/g, '');
  const mascaras = {
    cnpj: v => so(v).slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2'),
    cep: v => so(v).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'),
    telefone: v => {
      const n = so(v).slice(0, 11);
      if (n.length <= 10) return n.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
      return n.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    },
    uf: v => v.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2)
  };

  /* ---------- Navegação pelos cards ---------- */
  function abrir(id, rolar = true) {
    $$('.panel-section').forEach(s => { s.hidden = s.id !== id; });
    $$('.panel-card').forEach(c => {
      const ativo = c.dataset.target === id;
      c.classList.toggle('is-active', ativo);
      c.setAttribute('aria-pressed', ativo);
    });
    const sec = document.getElementById(id);
    sec.classList.remove('is-entering');
    void sec.offsetWidth;
    sec.classList.add('is-entering');
    if (id === 'sec-geral') renderGeral();
    if (rolar) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id.replace('sec-', ''));
  }

  $$('.panel-card').forEach(c => c.addEventListener('click', () => abrir(c.dataset.target)));

  /* ---------- Minha instituição ---------- */
  const formDados = $('#form-dados');

  function preencherDados() {
    Object.entries(state.dados).forEach(([k, v]) => {
      if (formDados.elements[k]) formDados.elements[k].value = v;
    });
    $('#descricao-count').textContent = formDados.descricao.value.length;
  }

  ['cnpj', 'cep', 'telefone', 'uf'].forEach(nome => {
    formDados.elements[nome].addEventListener('input', e => {
      e.target.value = mascaras[nome](e.target.value);
    });
  });

  formDados.descricao.addEventListener('input', e => {
    $('#descricao-count').textContent = e.target.value.length;
  });

  // Busca de endereço pelo CEP (ViaCEP); se falhar, o preenchimento é manual
  formDados.cep.addEventListener('blur', async () => {
    const cep = so(formDados.cep.value);
    const status = $('#cep-status');
    if (cep.length !== 8) return;
    status.textContent = 'Buscando endereço…';
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (d.erro) { status.textContent = 'CEP não encontrado. Preencha o endereço manualmente.'; return; }
      if (!formDados.rua.value) formDados.rua.value = d.logradouro || '';
      formDados.bairro.value = d.bairro || '';
      formDados.cidade.value = d.localidade || '';
      formDados.uf.value = d.uf || '';
      status.textContent = 'Endereço preenchido. Informe o número.';
      formDados.rua.focus();
    } catch (e) {
      status.textContent = 'Não foi possível buscar o CEP. Preencha manualmente.';
    }
  });

  function validarDados() {
    const f = formDados;
    if (!f.nome.value.trim()) return 'Informe o nome da instituição.';
    if (f.cnpj.value && so(f.cnpj.value).length !== 14) return 'O CNPJ deve ter 14 números.';
    if (f.cep.value && so(f.cep.value).length !== 8) return 'O CEP deve ter 8 números.';
    if (f.email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value)) return 'Digite um e-mail válido.';
    if (f.site.value && !/^https?:\/\/.+/i.test(f.site.value)) return 'O site deve começar com http:// ou https://.';
    return '';
  }

  formDados.addEventListener('submit', e => {
    e.preventDefault();
    const erro = validarDados();
    if (erro) return toast(erro, true);
    const dados = {};
    [...formDados.elements].forEach(el => { if (el.name) dados[el.name] = el.value.trim(); });
    state.dados = dados;
    if (save()) toast('Dados salvos.');
  });

  $('#btn-reset-dados').addEventListener('click', () => {
    formDados.reset();
    preencherDados();
    toast('Alterações desfeitas.');
  });

  /* ---------- Serviços ---------- */
  function renderServicos() {
    const ul = $('#lista-servicos');
    ul.innerHTML = state.servicos.length
      ? state.servicos.map(s => `
        <li class="item">
          <div class="item-main"><strong>${esc(s.nome)}</strong>${s.desc ? `<span>${esc(s.desc)}</span>` : ''}</div>
          <button type="button" class="icon-btn" data-del="${s.id}" aria-label="Remover ${esc(s.nome)}"><i class="fa-solid fa-trash"></i></button>
        </li>`).join('')
      : emptyState('fa-hand-holding-heart', 'Nenhum serviço cadastrado. Adicione o primeiro acima.');
  }

  $('#form-servico').addEventListener('submit', e => {
    e.preventDefault();
    const nome = $('#servico-nome').value.trim();
    if (!nome) return toast('Informe o nome do serviço.', true);
    state.servicos.push({ id: uid(), nome, desc: $('#servico-desc').value.trim() });
    e.target.reset();
    save(); renderServicos(); toast('Serviço adicionado.');
    $('#servico-nome').focus();
  });

  $('#lista-servicos').addEventListener('click', e => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    state.servicos = state.servicos.filter(s => s.id !== b.dataset.del);
    save(); renderServicos(); toast('Serviço removido.');
  });

  /* ---------- Necessidades ---------- */
  function renderNecessidades() {
    const ordem = { urgent: 0, medium: 1, normal: 2 };
    const lista = [...state.necessidades].sort((a, b) => ordem[a.prioridade] - ordem[b.prioridade]);
    $('#lista-necessidades').innerHTML = lista.length
      ? lista.map(n => `
        <li class="item">
          <div class="item-main">
            <strong>${esc(n.item)}</strong>
            <span>${n.qtd ? esc(n.qtd) + ' · ' : ''}<span class="tag ${n.prioridade === 'normal' ? '' : n.prioridade}">${PRIORIDADES[n.prioridade]}</span></span>
          </div>
          <button type="button" class="icon-btn" data-del="${n.id}" aria-label="Remover ${esc(n.item)}"><i class="fa-solid fa-trash"></i></button>
        </li>`).join('')
      : emptyState('fa-box-open', 'Nenhuma necessidade cadastrada. Adicione o primeiro item acima.');
  }

  $('#form-necessidade').addEventListener('submit', e => {
    e.preventDefault();
    const item = $('#nec-item').value.trim();
    if (!item) return toast('Informe o item necessário.', true);
    state.necessidades.push({
      id: uid(), item, qtd: $('#nec-qtd').value.trim(), prioridade: $('#nec-prioridade').value
    });
    e.target.reset();
    save(); renderNecessidades(); toast('Necessidade adicionada.');
    $('#nec-item').focus();
  });

  $('#lista-necessidades').addEventListener('click', e => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    state.necessidades = state.necessidades.filter(n => n.id !== b.dataset.del);
    save(); renderNecessidades(); toast('Necessidade removida.');
  });

  /* ---------- Horários ---------- */
  function renderHorarios() {
    $('#horarios').innerHTML = DIAS.map(([k, nome]) => {
      const h = state.horarios[k];
      return `
        <div class="hours-row ${h.aberto ? '' : 'is-closed'}" data-dia="${k}">
          <label class="switch"><input type="checkbox" ${h.aberto ? 'checked' : ''}> ${nome}</label>
          <div class="hours-times">
            ${h.aberto ? '' : '<span style="opacity:1">Fechado</span>'}
            <input type="time" value="${h.de}" aria-label="${nome}: abre às"> às
            <input type="time" value="${h.ate}" aria-label="${nome}: fecha às">
          </div>
        </div>`;
    }).join('');
  }

  $('#horarios').addEventListener('change', e => {
    const row = e.target.closest('.hours-row');
    if (!row || e.target.type !== 'checkbox') return;
    row.classList.toggle('is-closed', !e.target.checked);
  });

  $('#form-horarios').addEventListener('submit', e => {
    e.preventDefault();
    const novo = {};
    for (const row of $$('.hours-row')) {
      const [de, ate] = $$('input[type=time]', row).map(i => i.value);
      const aberto = $('input[type=checkbox]', row).checked;
      if (aberto && (!de || !ate || de >= ate)) {
        return toast('O horário de fechamento deve ser depois da abertura.', true);
      }
      novo[row.dataset.dia] = { aberto, de: de || '08:00', ate: ate || '17:00' };
    }
    state.horarios = novo;
    if (save()) { toast('Horários salvos.'); renderHorarios(); }
  });

  /* ---------- Equipe ---------- */
  function renderEquipe() {
    $('#lista-equipe').innerHTML = state.equipe.length
      ? state.equipe.map(p => `
        <li class="item">
          <div class="item-main"><strong>${esc(p.nome)}</strong><span>${esc(p.email)} · <span class="tag">${esc(p.papel)}</span></span></div>
          <button type="button" class="icon-btn" data-del="${p.id}" aria-label="Remover ${esc(p.nome)}"><i class="fa-solid fa-trash"></i></button>
        </li>`).join('')
      : emptyState('fa-users', 'Nenhuma pessoa na equipe ainda.');
  }

  $('#form-equipe').addEventListener('submit', e => {
    e.preventDefault();
    const nome = $('#eq-nome').value.trim();
    const email = $('#eq-email').value.trim();
    if (!nome) return toast('Informe o nome.', true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Digite um e-mail válido.', true);
    if (state.equipe.some(p => p.email.toLowerCase() === email.toLowerCase())) return toast('Esse e-mail já está na equipe.', true);
    state.equipe.push({ id: uid(), nome, email, papel: $('#eq-papel').value });
    e.target.reset();
    save(); renderEquipe(); toast('Pessoa adicionada.');
    $('#eq-nome').focus();
  });

  $('#lista-equipe').addEventListener('click', e => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    state.equipe = state.equipe.filter(p => p.id !== b.dataset.del);
    save(); renderEquipe(); toast('Pessoa removida.');
  });

  /* ---------- Visão geral ---------- */
  function renderGeral() {
    $('#stat-servicos').textContent = state.servicos.length;
    $('#stat-necessidades').textContent = state.necessidades.length;
    $('#stat-dias').textContent = Object.values(state.horarios).filter(h => h.aberto).length;
    $('#stat-equipe').textContent = state.equipe.length;

    const d = state.dados;
    const etapas = [
      ['nome e descrição', d.nome && d.descricao],
      ['endereço', d.cep && d.rua && d.cidade],
      ['contato', d.telefone || d.email],
      ['serviços', state.servicos.length],
      ['necessidades', state.necessidades.length],
      ['equipe', state.equipe.length]
    ];
    const feitas = etapas.filter(e => e[1]).length;
    const pct = Math.round((feitas / etapas.length) * 100);
    $('#progress-pct').textContent = pct + '%';
    $('#progress-fill').style.width = pct + '%';
    $('#progress-bar').setAttribute('aria-valuenow', pct);
    const faltam = etapas.filter(e => !e[1]).map(e => e[0]);
    $('#progress-hint').textContent = faltam.length ? 'Falta preencher: ' + faltam.join(', ') + '.' : 'Perfil completo.';
  }

  /* ---------- Início ---------- */
  preencherDados();
  renderServicos();
  renderNecessidades();
  renderHorarios();
  renderEquipe();

  const inicial = 'sec-' + (location.hash.slice(1) || 'geral');
  abrir(document.getElementById(inicial) ? inicial : 'sec-geral', false);
})();