const instituicoes = [
    {
        nome: "Instituição A",
        endereco: "Recife - PE",
        vagas: 12
    },
    {
        nome: "Instituição B",
        endereco: "Olinda - PE",
        vagas: 5
    },
    {
        nome: "Instituição C",
        endereco: "Jaboatão dos Guararapes - PE",
        vagas: 8
    }
];

const lista = document.getElementById("lista-instituicoes");

instituicoes.forEach(instituicao => {

    const card = document.createElement("div");

    card.classList.add("card");

    card.innerHTML = `
        <h3>${instituicao.nome}</h3>
        <p>${instituicao.endereco}</p>
        <p>${instituicao.vagas} vagas disponíveis</p>
        <button>Ver instituição</button>
    `;

    lista.appendChild(card);
});