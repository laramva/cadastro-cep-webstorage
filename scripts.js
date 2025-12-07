"use strict";

/* Seleção dos elementos do formulário */
const formCadastro = document.getElementById("form-cadastro");
const inputs = formCadastro.querySelectorAll("input");

const cepInput = document.getElementById("cep");
const btnBuscarCep = document.getElementById("btn-buscar-cep");
const mensagemCep = document.getElementById("mensagem-cep");

const logradouroInput = document.getElementById("logradouro");
const bairroInput = document.getElementById("bairro");
const cidadeInput = document.getElementById("cidade");
const estadoInput = document.getElementById("estado");

const mensagemForm = document.getElementById("mensagem-form");
const statusStorage = document.getElementById("status-storage");

const STORAGE_KEY = "formCadastroUsuario";

/* Normaliza CEP mantendo apenas dígitos */
function limparCep(cep) {
    if (!cep) {
        return "";
    }
    return cep.replace(/\D/g, "");
}

/* Formata o CEP com hífen para exibição */
function formatarCep(cepLimpo) {
    if (cepLimpo.length !== 8) {
        return cepLimpo;
    }
    return cepLimpo.slice(0, 5) + "-" + cepLimpo.slice(5);
}

/* Busca endereço na API ViaCEP usando Fetch API */
async function buscarEnderecoPorCep(cepBruto) {
    const cepLimpo = limparCep(cepBruto);

    if (cepLimpo.length !== 8) {
        mensagemCep.textContent = "CEP deve ter 8 dígitos.";
        cepInput.classList.add("shake");
        setTimeout(() => cepInput.classList.remove("shake"), 180);
        return;
    }

    const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;

    mensagemCep.textContent = "Buscando endereço...";
    mensagemCep.style.color = "#6b7280";

    try {
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error("Erro ao consultar o CEP.");
        }

        const dados = await resposta.json();

        if (dados.erro) {
            mensagemCep.textContent = "CEP não encontrado.";
            mensagemCep.style.color = "#b91c1c";
            limparCamposEndereco();
            return;
        }

        preencherCamposEndereco(dados);
        mensagemCep.textContent = "Endereço preenchido automaticamente.";
        mensagemCep.style.color = "#15803d";

        cepInput.value = formatarCep(cepLimpo);

        salvarFormularioNoStorage();
        destacarStatusStorage();

    } catch (erro) {
        console.error(erro);
        mensagemCep.textContent = "Não foi possível buscar o CEP no momento.";
        mensagemCep.style.color = "#b91c1c";
    }
}

/* Preenche os campos de endereço a partir da resposta do ViaCEP */
function preencherCamposEndereco(dados) {
    logradouroInput.value = dados.logradouro || "";
    bairroInput.value = dados.bairro || "";
    cidadeInput.value = dados.localidade || "";
    estadoInput.value = dados.uf || "";
}

/* Limpa os campos de endereço */
function limparCamposEndereco() {
    logradouroInput.value = "";
    bairroInput.value = "";
    cidadeInput.value = "";
    estadoInput.value = "";
}

/* Salva todos os campos do formulário no localStorage */
function salvarFormularioNoStorage() {
    const dados = {};

    inputs.forEach((input) => {
        dados[input.name] = input.value;
    });

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
        atualizarStatusStorage(dados);
    } catch (erro) {
        console.error("Erro ao salvar no localStorage:", erro);
    }
}

/* Carrega os dados do formulário do localStorage ao abrir a página */
function restaurarFormularioDoStorage() {
    const salvo = localStorage.getItem(STORAGE_KEY);

    if (!salvo) {
        statusStorage.textContent = "Formulário ainda não preenchido.";
        return;
    }

    try {
        const dados = JSON.parse(salvo);

        inputs.forEach((input) => {
            if (Object.prototype.hasOwnProperty.call(dados, input.name)) {
                input.value = dados[input.name];
            }
        });

        if (dados.cep) {
            const cepLimpo = limparCep(dados.cep);
            cepInput.value = formatarCep(cepLimpo);
        }

        atualizarStatusStorage(dados);
    } catch (erro) {
        console.error("Erro ao ler dados do localStorage:", erro);
        statusStorage.textContent = "Não foi possível restaurar os dados salvos.";
    }
}

/* Atualiza o texto de status de acordo com os campos preenchidos */
function atualizarStatusStorage(dados) {
    const valores = Object.values(dados || {});
    const preenchidos = valores.filter((v) => v && v.trim().length > 0).length;

    if (preenchidos === 0) {
        statusStorage.textContent = "Formulário ainda não preenchido.";
        return;
    }

    statusStorage.textContent = `Formulário salvo com ${preenchidos} campo(s) preenchido(s).`;
}

/* Dá um destaque visual no status quando algo é salvo */
function destacarStatusStorage() {
    statusStorage.classList.add("highlight");
    setTimeout(() => {
        statusStorage.classList.remove("highlight");
    }, 550);
}

/* Limpa o formulário e o storage */
function limparFormularioEStorage() {
    formCadastro.reset();
    limparCamposEndereco();
    mensagemCep.textContent = "";
    mensagemForm.textContent = "";
    localStorage.removeItem(STORAGE_KEY);
    statusStorage.textContent = "Formulário ainda não preenchido.";
}

/* Eventos */

document.addEventListener("DOMContentLoaded", () => {
    restaurarFormularioDoStorage();
});

btnBuscarCep.addEventListener("click", () => {
    buscarEnderecoPorCep(cepInput.value);
});

cepInput.addEventListener("blur", () => {
    if (cepInput.value.trim() !== "") {
        buscarEnderecoPorCep(cepInput.value);
    }
});

/* Salva no storage sempre que qualquer input muda */
inputs.forEach((input) => {
    input.addEventListener("input", () => {
        salvarFormularioNoStorage();
    });
});

/* Botão de limpar formulário */
const btnLimpar = document.getElementById("btn-limpar");
btnLimpar.addEventListener("click", () => {
    limparFormularioEStorage();
});

/* Simula um envio de formulário apenas para feedback visual */
formCadastro.addEventListener("submit", (event) => {
    event.preventDefault();

    mensagemForm.textContent = "Dados simulados como enviados. Eles continuam salvos no navegador.";
    mensagemForm.classList.add("highlight");

    setTimeout(() => {
        mensagemForm.classList.remove("highlight");
    }, 600);
});
