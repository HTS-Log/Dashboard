const urlAPI = "https://script.google.com/macros/s/AKfycbyGkJkHTSc3nWsqVijjmYsDTuqLwdvtEugWEBXOZvTYETJS4QxG3d_4kbSKGhjdJMFu/exec";

const excluirPorTexto = [
  "CRIAR ORDEM",
  "SUBIR ORDEM PORTAL",
  "AGUARDANDO CARREGAMENTO",
  "AGUARDANDO AGENDAMENTO",
  "NOTA/AGENDAMENTO ADIANTADO",
  "VEICULO CARREGADO ESPERANDO NOTA",
  "AGUARDANDO PAGAMENTO ADIANTAMENTO",
  "VEICULO LIBERADO",
  "VEICULO AGUARDANDO COMPLEMENTO (EMBARQUE FEITO)",
  "AGUARDANDO SEGURO (BUONY, F&F, FRETEBRAS.)",
  "CIDADE",
  "DESCARGA",
  "NOME",
  "🚚 HTS LOGISTICA E TRANSPORTES LTDA"
];

function formatarData(dataStr) {
  const data = new Date(dataStr);
  if (isNaN(data)) return dataStr;
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const mesNome = meses[data.getMonth()];
  return mesNome; // só o nome do mês
}

function carregarDados() {
  fetch(urlAPI)
    .then(res => res.json())
    .then(dados => {
      const mesFiltro = 8; // Agosto

      const dadosFiltrados = dados.filter(linha => {
        const temTextoIndesejado = Object.values(linha).some(valor =>
          excluirPorTexto.some(padrao =>
            String(valor).toUpperCase().includes(padrao.toUpperCase())
          )
        );
        if (temTextoIndesejado) return false;

        const dataLinha = new Date(linha.DATA);
        if (isNaN(dataLinha)) return false;

        return (dataLinha.getMonth() + 1) === mesFiltro;
      });

      if (dadosFiltrados.length === 0) {
        console.warn("Nenhum carregamento encontrado para o mês selecionado.");
      }

      const colunas = Object.keys(dadosFiltrados[0] || {})
        .filter(k => !k.startsWith("COR_") && k !== "EMBARCADOR");

      const cabecalho = document.getElementById("cabecalho");
      const corpo = document.getElementById("corpo-tabela");

      cabecalho.innerHTML = "";
      corpo.innerHTML = "";

      colunas.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        cabecalho.appendChild(th);
      });

      dadosFiltrados.forEach(linha => {
        const tr = document.createElement("tr");
        colunas.forEach(col => {
          const td = document.createElement("td");
          if (col === "DATA") {
            td.textContent = formatarData(linha[col]);
          } else {
            td.textContent = linha[col];
          }
          td.style.backgroundColor = linha["COR_" + col] || "transparent";
          tr.appendChild(td);
        });
        corpo.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("Erro ao carregar dados:", err);
    });
}

carregarDados();
setInterval(carregarDados, 20000);
