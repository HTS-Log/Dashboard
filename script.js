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

function carregarDados() {
  fetch(urlAPI)
    .then((res) => res.json())
    .then((dados) => {
      const hoje = new Date();
      const diaHoje = hoje.getDate();

      // Remove linhas com textos indesejados e filtra pelo dia atual independente do mês/ano
      const dadosFiltrados = dados.filter((linha) => {
        const temTextoIndesejado = Object.values(linha).some((valor) => {
          return excluirPorTexto.some((padrao) =>
            String(valor).toUpperCase().includes(padrao.toUpperCase())
          );
        });
        if (temTextoIndesejado) return false;

        const dataLinha = new Date(linha.DATA);
        if (isNaN(dataLinha)) return false;

        return dataLinha.getDate() === diaHoje;
      });

      if (dadosFiltrados.length === 0) {
        // Se quiser, pode mostrar uma mensagem ou exibir tudo como fallback
        console.warn("Nenhum carregamento encontrado para o dia atual.");
      }

      // Remove coluna "EMBARCADOR"
      const colunas = Object.keys(dadosFiltrados[0] || {})
        .filter((k) => !k.startsWith("COR_") && k !== "EMBARCADOR");

      const cabecalho = document.getElementById("cabecalho");
      const corpo = document.getElementById("corpo-tabela");

      cabecalho.innerHTML = "";
      corpo.innerHTML = "";

      colunas.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col;
        cabecalho.appendChild(th);
      });

      dadosFiltrados.forEach((linha) => {
        const tr = document.createElement("tr");
        colunas.forEach((col) => {
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
    .catch((err) => {
      console.error("Erro ao carregar dados:", err);
    });
}

carregarDados();
setInterval(carregarDados, 20000); // Atualiza a cada 20 segundos

// Eventos dos botões
document.getElementById("recarregar").addEventListener("click", carregarDados);

// Filtragem básica no input produto
document.getElementById("filtro-produto").addEventListener("input", () => {
  const filtro = document.getElementById("filtro-produto").value.toLowerCase();
  const linhas = document.querySelectorAll("#corpo-tabela tr");
  linhas.forEach((tr) => {
    const produto = tr.children[5]?.textContent.toLowerCase() || ""; // Ajuste índice conforme a coluna PRODUTO
    tr.style.display = produto.includes(filtro) ? "" : "none";
  });
});

// Filtragem data pelo input filtro-data
document.getElementById("filtro-data").addEventListener("change", () => {
  const valorData = document.getElementById("filtro-data").value; // formato yyyy-mm-dd
  if (!valorData) {
    carregarDados();
    return;
  }
  const dataFiltro = new Date(valorData);
  const linhas = document.querySelectorAll("#corpo-tabela tr");
  linhas.forEach((tr) => {
    const dataTexto = tr.children[0]?.textContent; // coluna DATA formatada dd/mm/aaaa
    if (!dataTexto) {
      tr.style.display = "none";
      return;
    }
    const [dia, mes, ano] = dataTexto.split("/");
    const dataLinha = new Date(`${ano}-${mes}-${dia}`);
    tr.style.display = dataLinha.getTime() === dataFiltro.getTime() ? "" : "none";
  });
});
