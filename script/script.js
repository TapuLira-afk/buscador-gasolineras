const form = document.querySelector("#form");
const provincias = document.querySelector("#provincias");
const municipios = document.querySelector("#municipios");
const combustibles = document.querySelector("#combustibles");
const abierto = document.querySelector("#abierto");
const orden = document.querySelector("#orden");
const button = document.querySelector("#button");
const resultados = document.querySelector("#resultados");
const cargando = document.querySelector("#cargando");
const mensaje = document.querySelector("#mensaje");
const tabla = document.querySelector("#tabla-gasolineras");
const cuerpoTabla = document.getElementById("cuerpo-tabla");

const apiProvincias = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/Provincias/";
const apiMunicipios = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/MunicipiosPorProvincia/";
const apiCombustible = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/ProductosPetroliferos/";
const apiGasolineras = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroMunicipioProducto/";

let ocupados = 0;

function actualizarControles() {
    const tieneProvincias = provincias.options.length > 1;
    const tieneMunicipios = municipios.options.length > 1;
    const tieneCombustibles = combustibles.options.length > 1;

    provincias.disabled = ocupados > 0 || !tieneProvincias;
    municipios.disabled = ocupados > 0 || !tieneMunicipios;
    combustibles.disabled = ocupados > 0 || !tieneCombustibles;
    button.disabled = ocupados > 0 || !tieneProvincias || !tieneMunicipios || !tieneCombustibles;
}

function setCargando(texto) {
    cargando.textContent = texto || "";
}

function limpiarResultados() {
    cuerpoTabla.textContent = "";
    mensaje.textContent = "";
    tabla.hidden = true;
}

function mostrarMensaje(texto) {
    resultados.hidden = false;
    tabla.hidden = true;
    mensaje.textContent = texto;
}

function limpiarSelect(select) {
    const primera = select.options[0];
    select.innerHTML = "";
    select.appendChild(primera);
    actualizarControles();
}

function añadirOpcion(select, content, valor) {
    if (valor === undefined || valor === null || valor === "") return;
    if (select.querySelector(`option[value="${valor}"]`) === null) {
        const option = document.createElement("option");
        option.setAttribute("value", valor);
        option.textContent = content;
        select.appendChild(option);
    }
}

async function pedirJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
}

async function cargarProvincias() {
    ocupados++;
    actualizarControles();
    setCargando("Cargando provincias...");

    try {
        const data = await pedirJson(apiProvincias);
        if (!Array.isArray(data)) throw new Error("Respuesta no válida");

        data.forEach(p => {
            añadirOpcion(provincias, p.Provincia, p.IDPovincia);
        });
    } catch (error) {
        console.error("Error cargando provincias:", error);
        mostrarMensaje("Error al cargar las provincias.");
    } finally {
        ocupados--;
        setCargando("");
        actualizarControles();
    }
}

async function cargarMunicipios(idProvincia) {
    ocupados++;
    actualizarControles();
    setCargando("Cargando municipios...");

    try {
        const data = await pedirJson(apiMunicipios + idProvincia);
        if (!Array.isArray(data)) throw new Error("Respuesta no válida");

        data.forEach(m => {
            añadirOpcion(municipios, m.Municipio, m.IDMunicipio);
        });
    } catch (error) {
        console.error("Error cargando municipios:", error);
        mostrarMensaje("Error al cargar los municipios.");
    } finally {
        ocupados--;
        setCargando("");
        actualizarControles();
    }
}

async function cargarCombustibles() {
    ocupados++;
    actualizarControles();
    setCargando("Cargando combustibles...");

    try {
        const data = await pedirJson(apiCombustible);
        if (!Array.isArray(data)) throw new Error("Respuesta no válida");

        data.forEach(c => {
            añadirOpcion(combustibles, c.NombreProducto, c.IDProducto);
        });
    } catch (error) {
        console.error("Error cargando combustibles:", error);
        mostrarMensaje("Error al cargar los combustibles.");
    } finally {
        ocupados--;
        setCargando("");
        actualizarControles();
    }
}

function calcularEstadoApertura(horario) {
    if (!horario) return "No disponible";

    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const dias = ["L", "M", "X", "J", "V", "S", "D"];
    const hoy = (ahora.getDay() + 6) % 7;

    let horarioHoy = "";
    let hayDias = false;

    for (const parte of horario.split(";")) {
        const posicion = parte.indexOf(":");
        if (posicion === -1) continue;

        const rango = parte.slice(0, posicion).trim().toUpperCase();
        const horas = parte.slice(posicion + 1);

        const [desde, hasta = desde] = rango.split("-");
        const inicioDias = dias.indexOf(desde.trim());
        const finDias = dias.indexOf(hasta.trim());

        if (inicioDias === -1 || finDias === -1) continue;

        hayDias = true;

        if (inicioDias <= finDias) {
            if (hoy >= inicioDias && hoy <= finDias) horarioHoy += horas + " ";
        } else {
            if (hoy >= inicioDias || hoy <= finDias) horarioHoy += horas + " ";
        }
    }

    if (!hayDias) {
        horarioHoy = horario;
    } else if (horarioHoy === "") {
        return "Cerrado";
    }

    if (/24\s*H/i.test(horarioHoy)) return "Abierto";

    const tramos = horarioHoy.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/g);
    if (!tramos) return "No disponible";

    for (const tramo of tramos) {
        const [h1, m1, h2, m2] = tramo.match(/\d{1,2}/g).map(Number);
        const inicio = h1 * 60 + m1;
        const fin = h2 * 60 + m2;

        if (fin >= inicio) {
            if (minutosActuales >= inicio && minutosActuales <= fin) {
                return "Abierto";
            }
        } else {
            if (minutosActuales >= inicio || minutosActuales <= fin) {
                return "Abierto";
            }
        }
    }

    return "Cerrado";
}

function precioANumero(precio) {
    if (precio === undefined || precio === null || String(precio).trim() === "") {
        return NaN;
    }
    return parseFloat(String(precio).replace(",", "."));
}

function tienePrecioValido(gasolinera) {
    const precio = precioANumero(gasolinera.PrecioProducto);
    return Number.isFinite(precio) && precio > 0;
}

function añadirEntradaTabla(gasolinera, destacada) {
    const estado = calcularEstadoApertura(gasolinera.Horario);
    const tr = document.createElement("tr");

    if (destacada) {
        tr.classList.add("destacada");
        tr.style.backgroundColor = "#d4edda";
    }

    const valores = [
        gasolinera.Rótulo,
        gasolinera.Dirección,
        gasolinera.Municipio,
        gasolinera.Horario,
        estado,
        gasolinera.PrecioProducto + "€/l"
    ];

    valores.forEach(valor => {
        const td = document.createElement("td");
        td.textContent = valor ?? "No disponible";
        tr.appendChild(td);
    });

    cuerpoTabla.appendChild(tr);
}

async function buscarGasolineras(idMunicipio, idProducto, checkEstado, direccionOrden) {
    ocupados++;
    actualizarControles();
    limpiarResultados();
    resultados.hidden = true;
    setCargando("Buscando gasolineras...");

    try {
        const data = await pedirJson(`${apiGasolineras}${idMunicipio}/${idProducto}`);
        if (!data || !Array.isArray(data.ListaEESSPrecio)) {
            throw new Error("Respuesta no válida");
        }

        let estaciones = data.ListaEESSPrecio.filter(tienePrecioValido);

        if (checkEstado) {
            estaciones = estaciones.filter(g => calcularEstadoApertura(g.Horario) === "Abierto");
        }

        if (estaciones.length === 0) {
            mostrarMensaje("No hay estaciones que cumplan los filtros seleccionados.");
            return;
        }

        estaciones.sort((a, b) => {
            if (direccionOrden === "desc") {
                return precioANumero(b.PrecioProducto) - precioANumero(a.PrecioProducto);
            }
            return precioANumero(a.PrecioProducto) - precioANumero(b.PrecioProducto);
        });

        const precioMinimo = Math.min(...estaciones.map(g => precioANumero(g.PrecioProducto)));

        estaciones.forEach(g => {
            añadirEntradaTabla(g, precioANumero(g.PrecioProducto) === precioMinimo);
        });

        resultados.hidden = false;
        tabla.hidden = false;
    } catch (error) {
        console.error("Error al consultar gasolineras:", error);
        mostrarMensaje("La consulta ha fallado. Inténtalo de nuevo más tarde.");
    } finally {
        ocupados--;
        setCargando("");
        actualizarControles();
    }
}

provincias.addEventListener("change", () => {
    limpiarSelect(municipios);
    limpiarSelect(combustibles);
    limpiarResultados();
    resultados.hidden = true;

    if (provincias.value !== "") {
        cargarMunicipios(provincias.value);
    }
});

municipios.addEventListener("change", () => {
    limpiarSelect(combustibles);
    limpiarResultados();
    resultados.hidden = true;

    if (municipios.value !== "") {
        cargarCombustibles();
    }
});

form.addEventListener("submit", event => {
    event.preventDefault();
    limpiarResultados();
    resultados.hidden = true;

    if (provincias.value === "" || municipios.value === "") {
        mostrarMensaje("Selecciona una provincia y un municipio.");
        return;
    }

    if (combustibles.value === "") {
        mostrarMensaje("Selecciona un tipo de combustible.");
        return;
    }

    buscarGasolineras(municipios.value, combustibles.value, abierto.checked, orden.value);
});

cargarProvincias();