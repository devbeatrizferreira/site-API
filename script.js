const form = document.getElementById("freteForm");

const cepInput = document.getElementById("cep");

const loading = document.getElementById("loading");

const errorBox = document.getElementById("error");

const resultado = document.getElementById("resultado");


// ==========================================
// CONFIGURAÇÕES
// ==========================================

// UNINASSAU Fortaleza - Aguanambi
const origem = {
    latitude: -3.7447,
    longitude: -38.5237
};


// Tarifas utilizadas na estimativa
const TARIFA_BASE = 4.00;

const PRECO_POR_KM = 1.80;


// ==========================================
// FORMATAÇÃO DO CEP
// ==========================================

cepInput.addEventListener("input", function () {

    let cep = this.value.replace(/\D/g, "");

    if (cep.length > 5) {
        cep = cep.substring(0, 5) + "-" + cep.substring(5, 8);
    }

    this.value = cep;

});


// ==========================================
// ENVIO DO FORMULÁRIO
// ==========================================

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    limparErro();

    const cep = cepInput.value.replace(/\D/g, "");


    if (cep.length !== 8) {

        mostrarErro(
            "Digite um CEP válido com 8 números."
        );

        return;
    }


    mostrarLoading(true);


    try {

        // ------------------------------------------
        // 1. CONSULTA CEP
        // ------------------------------------------

        const respostaCep = await fetch(
            `https://viacep.com.br/ws/${cep}/json/`
        );


        if (!respostaCep.ok) {
            throw new Error(
                "Não foi possível consultar o CEP."
            );
        }


        const dadosCep = await respostaCep.json();


        if (dadosCep.erro) {

            throw new Error(
                "CEP não encontrado."
            );

        }


        const enderecoCompleto = [
            dadosCep.logradouro,
            dadosCep.bairro,
            dadosCep.localidade,
            dadosCep.uf
        ]
        .filter(Boolean)
        .join(", ");


        // ------------------------------------------
        // 2. GEOCODIFICAÇÃO
        // ------------------------------------------

        const enderecoBusca =
            `${enderecoCompleto}, Brasil`;


        const urlNominatim =
            "https://nominatim.openstreetmap.org/search?" +
            new URLSearchParams({
                q: enderecoBusca,
                format: "json",
                limit: "1"
            });


        const respostaGeo = await fetch(
            urlNominatim,
            {
                headers: {
                    "Accept-Language": "pt-BR"
                }
            }
        );


        if (!respostaGeo.ok) {

            throw new Error(
                "Não foi possível localizar o endereço no mapa."
            );

        }


        const locais = await respostaGeo.json();


        if (!locais.length) {

            throw new Error(
                "Não foi possível encontrar as coordenadas desse endereço."
            );

        }


        const destino = {

            latitude: parseFloat(
                locais[0].lat
            ),

            longitude: parseFloat(
                locais[0].lon
            )

        };


        // ------------------------------------------
        // 3. CALCULAR ROTA
        // ------------------------------------------

        const coordenadas =
            `${origem.longitude},${origem.latitude};` +
            `${destino.longitude},${destino.latitude}`;


        const urlRota =
            `https://router.project-osrm.org/route/v1/driving/${coordenadas}?overview=false`;


        const respostaRota = await fetch(
            urlRota
        );


        if (!respostaRota.ok) {

            throw new Error(
                "Não foi possível calcular a rota."
            );

        }


        const dadosRota =
            await respostaRota.json();


        if (
            !dadosRota.routes ||
            !dadosRota.routes.length
        ) {

            throw new Error(
                "Não foi encontrada uma rota para esse destino."
            );

        }


        const rota =
            dadosRota.routes[0];


        const distanciaKm =
            rota.distance / 1000;


        const tempoMinutos =
            Math.round(
                rota.duration / 60
            );


        // ------------------------------------------
        // 4. CALCULAR PREÇO
        // ------------------------------------------

        const valorDistancia =
            distanciaKm * PRECO_POR_KM;


        const valorTotal =
            TARIFA_BASE + valorDistancia;


        // ------------------------------------------
        // 5. MOSTRAR RESULTADO
        // ------------------------------------------

        document.getElementById(
            "endereco"
        ).textContent =
            enderecoCompleto;


        document.getElementById(
            "distancia"
        ).textContent =
            `${distanciaKm.toFixed(1)} km`;


        document.getElementById(
            "tempo"
        ).textContent =
            `${tempoMinutos} min`;


        document.getElementById(
            "preco"
        ).textContent =
            formatarMoeda(valorTotal);


        document.getElementById(
            "tarifaBase"
        ).textContent =
            formatarMoeda(TARIFA_BASE);


        document.getElementById(
            "valorDistancia"
        ).textContent =
            formatarMoeda(valorDistancia);


        document.getElementById(
            "valorTotal"
        ).textContent =
            formatarMoeda(valorTotal);


        resultado.classList.remove(
            "hidden"
        );


        resultado.scrollIntoView({
            behavior: "smooth"
        });


    } catch (erro) {

        console.error(erro);

        mostrarErro(
            erro.message ||
            "Ocorreu um erro ao calcular o frete."
        );

    } finally {

        mostrarLoading(false);

    }

});


// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function formatarMoeda(valor) {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function mostrarLoading(ativo) {

    if (ativo) {

        loading.classList.remove(
            "hidden"
        );

    } else {

        loading.classList.add(
            "hidden"
        );

    }

}


function mostrarErro(mensagem) {

    errorBox.textContent = mensagem;

    errorBox.classList.remove(
        "hidden"
    );

}


function limparErro() {

    errorBox.textContent = "";

    errorBox.classList.add(
        "hidden"
    );

}


// ==========================================
// DARK MODE
// ==========================================

const themeButton =
    document.getElementById("themeButton");


themeButton.addEventListener(
    "click",
    function () {

        document.body.classList.toggle(
            "dark"
        );


        const darkMode =
            document.body.classList.contains(
                "dark"
            );


        themeButton.textContent =
            darkMode ? "☀️" : "🌙";


        localStorage.setItem(
            "tema",
            darkMode ? "dark" : "light"
        );

    }
);


// Recuperar tema salvo

const temaSalvo =
    localStorage.getItem("tema");


if (temaSalvo === "dark") {

    document.body.classList.add(
        "dark"
    );

    themeButton.textContent = "☀️";

}
