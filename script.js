const urlAPI = "https://script.google.com/macros/s/AKfycbzAFVKT14pT_AmstlzlgKVxQm9bH3tNtSPOZrEpmVHqRZQAlDqufaxbXAJXq03ffaZV/exec";

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


// ============================
// FUNÇÕES DE DATA (À PROVA DE 2026)
// ============================

// Retorna data no formato yyyy-mm-dd no fuso do Brasil
function dataLocalISO(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

// Formata data para dd/mm/yyyy (Brasil)
function formatarData(dataStr) {
  const data = new Date(dataStr);
  if (isNaN(data)) return dataStr;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo"
  }).format(data);
}


// ============================
// CARREGAMENTO DE DADOS
// ============================

function carregarDados() {
  fetch(urlAPI + "?t=" + Date.now()) // evita cache
    .then((res) => {
      if (!res.ok) throw new Error(`Erro na rede: ${res.statusText}`);
      return res.json();
    })
    .then((dados) => {
      if (dados.erro) throw new Error(dados.erro);

      const hojeISO = dataLocalISO();

      const dadosFiltrados = dados.filter((linha) => {
        // Excluir textos indesejados
        const temTextoIndesejado = Object.values(linha).some((valor) =>
          excluirPorTexto.some((padrao) =>
            String(valor).toUpperCase().includes(padrao.toUpperCase())
          )
        );
        if (temTextoIndesejado) return false;

        if (!linha.DATA) return false;

        const dataLinhaISO = dataLocalISO(new Date(linha.DATA));
        return dataLinhaISO === hojeISO;
      });

      const corpo = document.getElementById("corpo-tabela");
      const cabecalho = document.getElementById("cabecalho");

      corpo.innerHTML = "";
      cabecalho.innerHTML = "";

      if (dadosFiltrados.length === 0) {
        corpo.innerHTML = `
          <tr>
            <td colspan="20" style="text-align:center;">
              Nenhum carregamento para hoje.
            </td>
          </tr>`;
        return;
      }

      const colunas = Object.keys(dadosFiltrados[0]).filter(
        (k) => !k.startsWith("COR_") && k !== "EMBARCADOR"
      );

      // Cabeçalho
      colunas.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col;
        cabecalho.appendChild(th);
      });

      // Linhas
      dadosFiltrados.forEach((linha) => {
        const tr = document.createElement("tr");

        colunas.forEach((col) => {
          const td = document.createElement("td");

          if (col === "DATA") {
            td.textContent = formatarData(linha[col]);
          } else {
            td.textContent = linha[col] ?? "";
          }

          td.style.backgroundColor = linha["COR_" + col] || "transparent";
          tr.appendChild(td);
        });

        corpo.appendChild(tr);
      });
    })
    .catch((err) => {
      console.error("Erro ao carregar dados:", err);
      const corpo = document.getElementById("corpo-tabela");
      corpo.innerHTML = `
        <tr>
          <td colspan="20" style="text-align:center;color:red;">
            Erro: ${err.message}
          </td>
        </tr>`;
    });
}


// ============================
// INICIALIZAÇÃO
// ============================

carregarDados();
setInterval(carregarDados, 5000);


// ============================
// EVENTOS
// ============================

// Botão recarregar
document.getElementById("recarregar")?.addEventListener("click", carregarDados);

// Filtro por produto
document.getElementById("filtro-produto")?.addEventListener("input", () => {
  const filtro = document.getElementById("filtro-produto").value.toLowerCase();
  document.querySelectorAll("#corpo-tabela tr").forEach((tr) => {
    const produto = tr.children[5]?.textContent.toLowerCase() || "";
    tr.style.display = produto.includes(filtro) ? "" : "none";
  });
});

// Filtro por data manual
document.getElementById("filtro-data")?.addEventListener("change", () => {
  const valorData = document.getElementById("filtro-data").value;

  if (!valorData) {
    document.querySelectorAll("#corpo-tabela tr").forEach(
      (tr) => (tr.style.display = "")
    );
    return;
  }

  const linhas = document.querySelectorAll("#corpo-tabela tr");

  linhas.forEach((tr) => {
    const dataTexto = tr.children[0]?.textContent;
    if (!dataTexto) {
      tr.style.display = "none";
      return;
    }

    const [dia, mes, ano] = dataTexto.split("/");
    const dataLinhaISO = `${ano}-${mes}-${dia}`;

    tr.style.display = dataLinhaISO === valorData ? "" : "none";
  });
});
