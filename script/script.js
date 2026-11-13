const provincias = document.querySelector("#provincias")
const municipios = document.querySelector("#municipios")
const combustibles = document.querySelector("#combustibles")
const abierto = document.querySelector("#abierto")
const button = document.querySelector("#button")

const apiProvincias = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/Provincias/"
const apiMunicipios = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/MunicipiosPorProvincia/"
const apiCombustible = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/ProductosPetroliferos/"

async function getProvincias() {
    try {
        const response = await fetch(apiProvincias);

        if (!response.ok) {
            const error_ = new Error(response.statusText);
            error_.status = response.status
            throw error_
        }

        const data = await response.json()

        console.log(data)
        return data
    } catch (error_) {
        console.error('Hubo un problema con la solicitud:', error_);
    }
}

async function getMunicipios(provincia) {
    const api = apiMunicipios + provincia
    try {
        const response = await fetch(api);

        if (!response.ok) {
            const error_ = new Error(response.statusText);
            error_.status = response.status
            throw error_
        }

        const data = await response.json()

        console.log(data)
        return data
    } catch (error_) {
        console.error('Hubo un problema con la solicitud:', error_);
    }
}

async function getCombustibles() {
    const api = apiCombustible
    try {
        const response = await fetch(api);

        if (!response.ok) {
            const error_ = new Error(response.statusText);
            error_.status = response.status
            throw error_
        }

        const data = await response.json()

        return data
    } catch (error_) {
        console.error('Hubo un problema con la solicitud:', error_);
    }
}

function añadirOpcion(select, opcion){
    const option = document.createElement("option")
    option.setAttribute("value", opcion)
    option.textContent = opcion

    select.appendChild(option)
}

function añadirProvincias(){
    let provinciasApi = getProvincias()
    console.log(provinciasApi)

    void provinciasApi.then(data =>{
        data.forEach(p => {
            añadirOpcion(provincias, p.Provincia)
        });
    })
}

function añadirMunicipios(idProvincia){
    let municipiosApi = getMunicipios(idProvincia)

    void municipiosApi.then(data =>{
        data.forEach(p => {
            añadirOpcion(municipios, p.Municipio)
        });
    })
}

function añadirCombustibles(){
    let combustibleApi = getCombustibles()

    void combustibleApi.then(data =>{
        data.forEach(c => {
            añadirOpcion(combustibles, c.NombreProducto)
        });
    })
}

añadirProvincias()

provincias.addEventListener('change', () => {
    if (provincias.value != "") {
        console.log(provincias.value)
        añadirMunicipios(provincias.value)
        añadirCombustibles()
    }
        
})