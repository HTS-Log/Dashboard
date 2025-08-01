const urlAPI = "https://script.google.com/macros/s/AKfycbwBYJ0da3oE--S7T9lbBAZR2DvWSgjCeC-N1HDxfAXGNn0ZPYHRsS1HVuNUI3GjthnU/exec";

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
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function carregarDados(filtroData = null) {
  fetch(urlAPI)
    .then((res) => res.json())
    .then((dados) => {
      const dadosFiltrados = dados.filter((linha) => {
        const temTextoIndesejado = Object.values(linha).some((valor) => {
          return excluirPorTexto.some((padrao) =>
            String(valor).toUpperCase().includes(padrao.toUpperCase())
          );
        });
        if (temTextoIndesejado) return false;

        if (filtroData) {
          const dataLinha = new Date(linha.DATA);
          return (
            dataLinha.getDate() === filtroData.getDate() &&
            dataLinha.getMonth() === filtroData.getMonth() &&
            dataLinha.getFullYear() === filtroData.getFullYear()
          );
        }

        return true;
      });

      const cabecalho = document.getElementById("cabecalho");
      const corpo = document.getElementById("corpo-tabela");

      cabecalho.innerHTML = "";
      corpo.innerHTML = "";

      if (dadosFiltrados.length === 0) {
        corpo.innerHTML = `<tr><td colspan="100%">Nenhum dado encontrado.</td></tr>`;
        return;
      }

      const colunas = Object.keys(dadosFiltrados[0] || {})
        .filter((k) => !k.startsWith("COR_") && k !== "EMBARCADOR");

      colunas.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col;
        cabecalho.appendChild(th);
      });

      dadosFiltrados.forEach((linha) => {
        const tr = document.createElement("tr");
        colunas.forEach((col) => {
          const td = document.createElement("td");
          td.textContent = col === "DATA" ? formatarData(linha[col]) : linha[col];
          td.style.backgroundColor = linha["COR_" + col] || "transparent";
          tr.appendChild(td);
        });
        corpo.appendChild(tr);
      });
    })
    .catch((err) => {
      console.error("Erro ao carregar dados:", err);
    });
}

carregarDados();
setInterval(() => carregarDados(), 20000);

// Botão "Recarregar" - limpa filtro e carrega todos os dados
document.getElementById("recarregar").addEventListener("click", () => {
  document.getElementById("filtro-data").value = "";
  carregarDados();
});

// Filtro por data (yyyy-mm-dd)
document.getElementById("filtro-data").addEventListener("change", () => {
  const valorData = document.getElementById("filtro-data").value;
  if (!valorData) {
    carregarDados();
  } else {
    const dataFiltro = new Date(valorData);
    carregarDados(dataFiltro);
  }
});
