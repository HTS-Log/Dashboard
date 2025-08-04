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

function formatarData(dataStr) {
  // Criar a data a partir do string (que vem em UTC da planilha)
  const data = new Date(dataStr);
  if (isNaN(data)) return dataStr;

  // Usar os componentes da data no fuso horário local para exibição correta
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function carregarDados() {
  fetch(urlAPI)
    .then((res) => {
        if (!res.ok) {
            throw new Error(`Erro na rede: ${res.statusText}`);
        }
        return res.json();
    })
    .then((dados) => {
        
      // Se o servidor retornou um erro (ex: aba não encontrada), exiba-o.
      if (dados.erro) {
          throw new Error(dados.erro);
      }

      const hoje = new Date();

      const dadosFiltrados = dados.filter((linha) => {
        const temTextoIndesejado = Object.values(linha).some((valor) =>
          excluirPorTexto.some((padrao) =>
            String(valor).toUpperCase().includes(padrao.toUpperCase())
          )
        );
        if (temTextoIndesejado) return false;

        if (!linha.DATA) return false;
        
        // ===== ESTA É A CORREÇÃO MAIS IMPORTANTE =====
        // Cria um objeto Date a partir do dado da planilha.
        // O navegador converte automaticamente o horário UTC para o fuso local.
        const dataLinha = new Date(linha.DATA);
        if (isNaN(dataLinha)) return false;

        // Comparamos ano, mês e dia no fuso horário local. Esta é a forma mais segura.
        return (
          dataLinha.getFullYear() === hoje.getFullYear() &&
          dataLinha.getMonth() === hoje.getMonth() &&
          dataLinha.getDate() === hoje.getDate()
        );
      });

      const corpo = document.getElementById("corpo-tabela");
      const cabecalho = document.getElementById("cabecalho");
      corpo.innerHTML = "";
      cabecalho.innerHTML = "";

      if (dadosFiltrados.length === 0) {
        console.warn("Nenhum carregamento encontrado para o dia atual.");
        corpo.innerHTML = '<tr><td colspan="12" style="text-align:center;">Nenhum carregamento para hoje.</td></tr>';
        return;
      }
      
      const colunas = Object.keys(dadosFiltrados[0] || {}).filter(
        (k) => !k.startsWith("COR_") && k !== "EMBARCADOR"
      );

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
      const corpo = document.getElementById("corpo-tabela");
      corpo.innerHTML = `<tr><td colspan="12" style="text-align:center;">Erro: ${err.message}</td></tr>`;
    });
}

// Rotinas de inicialização
carregarDados();
setInterval(carregarDados, 5000);

// Event Listeners (sem alterações)
document.getElementById("recarregar")?.addEventListener("click", carregarDados);

document.getElementById("filtro-produto")?.addEventListener("input", () => {
  const filtro = document.getElementById("filtro-produto").value.toLowerCase();
  const linhas = document.querySelectorAll("#corpo-tabela tr");
  linhas.forEach((tr) => {
    const produto = tr.children[5]?.textContent.toLowerCase() || "";
    tr.style.display = produto.includes(filtro) ? "" : "none";
  });
});

document.getElementById("filtro-data")?.addEventListener("change", () => {
  const valorData = document.getElementById("filtro-data").value;
  if (!valorData) {
    // Apenas remove o filtro visual, não recarrega os dados
    document.querySelectorAll("#corpo-tabela tr").forEach(tr => tr.style.display = "");
    return;
  }
  const dataFiltro = new Date(valorData + "T00:00:00"); // Adiciona T00:00 para evitar problemas de fuso
  const linhas = document.querySelectorAll("#corpo-tabela tr");
  linhas.forEach((tr) => {
    const dataTexto = tr.children[0]?.textContent;
    if (!dataTexto) {
      tr.style.display = "none";
      return;
    }
    const [dia, mes, ano] = dataTexto.split("/");
    const dataLinha = new Date(`${ano}-${mes}-${dia}T00:00:00`);
    tr.style.display = dataLinha.getTime() === dataFiltro.getTime() ? "" : "none";
  });
});