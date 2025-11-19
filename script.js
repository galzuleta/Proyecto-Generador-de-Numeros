let chart = null;
let currentResults = [];
let currentParams = {};

// Valores por defecto
const defaultValues = {
    a: 19,
    c: 33,
    x0: 37,
    n: 100,
    nivelAceptacion: 95
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Configurar campo m como solo lectura y cambiar texto de ayuda
    const mInput = document.getElementById("m");
    const mHelpText = document.querySelector('.form-group:nth-child(3) .help-text');
    
    if (mInput) {
        mInput.readOnly = true;
        mInput.style.backgroundColor = '#f8f9fa';
        mInput.style.cursor = 'not-allowed';
        mInput.style.color = '#6c757d';
        mInput.placeholder = "Calculado automáticamente desde N";
    }
    
    if (mHelpText) {
        mHelpText.textContent = "Calculado automáticamente como 2^g ≥ N";
        mHelpText.style.color = '#4361ee';
        mHelpText.style.fontWeight = 'bold';
    }
    
    // Establecer valores por defecto al cargar
    reiniciarValores();
    
    // Agregar validación en tiempo real para evitar decimales
    document.querySelectorAll('#formLCG input').forEach(input => {
        if (input.id !== 'm' && input.id !== 'nivelAceptacion') {
            input.addEventListener('input', function(e) {
                // Prevenir decimales
                if (this.value.includes('.')) {
                    this.value = this.value.split('.')[0];
                }
                validarCampoEnTiempoReal(e);
                
                // Si es el campo n, actualizar m automáticamente
                if (this.id === 'n') {
                    actualizarModuloDesdeN();
                }
            });
            
            // Prevenir pegado de decimales
            input.addEventListener('paste', function(e) {
                const pastedData = e.clipboardData.getData('text');
                if (pastedData.includes('.')) {
                    e.preventDefault();
                    this.value = pastedData.split('.')[0];
                }
            });
        }
    });
    
    // Validación especial para nivel de aceptación
    const nivelAceptacionInput = document.getElementById('nivelAceptacion');
    if (nivelAceptacionInput) {
        nivelAceptacionInput.addEventListener('input', function(e) {
            const valor = parseFloat(this.value);
            if (isNaN(valor) || valor <= 0 || valor >= 100) {
                this.style.borderColor = '#e63946';
            } else {
                this.style.borderColor = '#4cc9f0';
            }
        });
    }
    
    // Soporte para Enter
    document.getElementById('formLCG').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            generarLCG();
        }
    });
});

function actualizarModuloDesdeN() {
    const nInput = document.getElementById("n");
    const mDisplay = document.getElementById("m");
    
    if (!nInput || !mDisplay) return;
    
    const n = parseInt(nInput.value);
    
    if (!isNaN(n) && n > 0) {
        // Calcular m = 2^g donde g es el menor entero tal que 2^g >= n
        let g = Math.ceil(Math.log2(n));
        let m = Math.pow(2, g);
        
        // Asegurarse de que m sea al menos 16 (mínimo razonable)
        m = Math.max(m, 16);
        
        mDisplay.value = m;
        
        // Actualizar el título para mostrar la relación
        const mLabel = document.querySelector('label[for="m"]');
        if (mLabel) {
            mLabel.innerHTML = `Módulo (m = 2<sup>${g}</sup>):`;
        }
    }
}

function reiniciarValores() {
    try {
        // Restablecer valores por defecto de forma segura
        const aInput = document.getElementById("a");
        const cInput = document.getElementById("c");
        const mInput = document.getElementById("m");
        const x0Input = document.getElementById("x0");
        const nInput = document.getElementById("n");
        const nivelAceptacionInput = document.getElementById("nivelAceptacion");
        
        // Verificar que los elementos existen antes de asignar valores
        if (aInput) aInput.value = defaultValues.a;
        if (cInput) cInput.value = defaultValues.c;
        if (x0Input) x0Input.value = defaultValues.x0;
        if (nInput) nInput.value = defaultValues.n;
        if (nivelAceptacionInput) nivelAceptacionInput.value = defaultValues.nivelAceptacion;
        
        // Calcular m automáticamente desde n
        actualizarModuloDesdeN();
        
        // Limpiar estilos de validación
        document.querySelectorAll('#formLCG input').forEach(input => {
            if (input && input.id !== 'm') {
                input.style.borderColor = '';
            }
        });
        
    } catch (error) {
        mostrarMensaje("❌ Error al reiniciar valores", "error");
    }
}

function validarCampoEnTiempoReal(e) {
    const input = e.target;
    if (!input || input.id === 'm' || input.id === 'nivelAceptacion') return;
    
    const value = input.value;
    
    if (value === '' || value === '-') {
        input.style.borderColor = '';
        return;
    }
    
    const numero = parseInt(value);
    
    if (isNaN(numero)) {
        input.style.borderColor = '#e63946';
        return false;
    }
    
    if (validarCampoEspecifico(input.id, numero)) {
        input.style.borderColor = '#4cc9f0';
    } else {
        input.style.borderColor = '#e63946';
    }
    
    return true;
}

function validarCampoEspecifico(id, valor) {
    const mInput = document.getElementById('m');
    const m = mInput ? parseInt(mInput.value) || 0 : 0;
    
    switch(id) {
        case 'a':
            return valor > 0;
        case 'c':
            return valor >= 0;
        case 'x0':
            return !isNaN(m) && valor >= 0 && valor < m;
        case 'n':
            return valor >= 99;
        default:
            return true;
    }
}

function mostrarMensaje(mensaje, tipo = 'error') {
    const mensajesDiv = document.getElementById('mensajes');
    if (!mensajesDiv) return;
    
    mensajesDiv.textContent = mensaje;
    mensajesDiv.className = `mensajes ${tipo}`;
    mensajesDiv.style.display = 'block';
}

function ocultarMensaje() {
    const mensajesDiv = document.getElementById('mensajes');
    if (mensajesDiv) {
        mensajesDiv.style.display = 'none';
    }
}

function mostrarLoading(mostrar) {
    const generarBtn = document.getElementById('generarBtn');
    if (!generarBtn) return;
    
    if (mostrar) {
        generarBtn.innerHTML = '<span class="btn-icon">⏳</span> Generando...';
        generarBtn.disabled = true;
    } else {
        generarBtn.innerHTML = '<span class="btn-icon">⚡</span> Generar Números';
        generarBtn.disabled = false;
    }
}

function generarLCG() {
    // Obtener elementos de forma segura
    const aInput = document.getElementById("a");
    const cInput = document.getElementById("c");
    const mInput = document.getElementById("m");
    const x0Input = document.getElementById("x0");
    const nInput = document.getElementById("n");
    const nivelAceptacionInput = document.getElementById("nivelAceptacion");
    
    if (!aInput || !cInput || !mInput || !x0Input || !nInput || !nivelAceptacionInput) {
        mostrarMensaje("❌ Error: No se pudieron encontrar los campos del formulario", "error");
        return;
    }
    
    // Obtener valores
    const a = parseInt(aInput.value);
    const c = parseInt(cInput.value);
    const m = parseInt(mInput.value);
    const x0 = parseInt(x0Input.value);
    const n = parseInt(nInput.value);
    const nivelAceptacion = parseFloat(nivelAceptacionInput.value);

    // Validar nivel de aceptación
    if (isNaN(nivelAceptacion) || nivelAceptacion <= 0 || nivelAceptacion >= 100) {
        mostrarMensaje("⚠️ El nivel de aceptación debe ser mayor que 0% y menor que 100%", "error");
        return;
    }

    // Calcular alpha = (100 - nivelAceptacion) / 100
    const alpha = (100 - nivelAceptacion) / 100;

    // 🔍 Validaciones - Solo enteros
    if ([a, c, m, x0, n].some(v => isNaN(v))) {
        mostrarMensaje("⚠️ Todos los parámetros deben ser números enteros.", "error");
        return;
    }

    // Validaciones específicas
    if (a <= 0) {
        mostrarMensaje("⚠️ El multiplicador (a) debe ser mayor que 0.", "error");
        return;
    }

    if (c < 0) {
        mostrarMensaje("⚠️ El incremento (c) debe ser un número no negativo.", "error");
        return;
    }

    if (m <= 1) {
        mostrarMensaje("⚠️ El módulo (m) debe ser mayor que 1.", "error");
        return;
    }

    if (x0 < 0 || x0 >= m) {
        mostrarMensaje(`⚠️ La semilla debe cumplir 0 ≤ X₀ < ${m}.`, "error");
        return;
    }

    // 🔥 VALIDACIÓN: Mínimo 99 números
    if (n < 99) {
        mostrarMensaje("⚠️ La cantidad de números debe ser al menos 99.", "error");
        return;
    }

    // Confirmación para números grandes (más de 1000)
    if (n > 1000) {
        const confirmar = confirm(`⚠️ Vas a generar ${n} números. Esto puede tomar unos segundos. ¿Deseas continuar?`);
        if (!confirmar) return;
    }

    // Guardar parámetros actuales para regeneración
    currentParams = { a, c, m, x0, n, nivelAceptacion };

    // Mostrar estado de carga
    mostrarLoading(true);

    // Pequeño delay para mejor UX
    setTimeout(() => {
        try {
            // ⚙️ Implementación del LCG
            let x = x0;
            const resultados = [];

            for (let i = 0; i < n; i++) {
                x = (a * x + c) % m;
                const u = x / (m - 1);
                resultados.push({ index: i + 1, X: x, U: u.toFixed(4) });
            }

            // Guardar resultados actuales
            currentResults = resultados;

            // Calcular período
            const periodo = calcularPeriodo(a, c, m, x0);

            mostrarResultados(resultados, periodo, m, nivelAceptacion, alpha);
            graficar(resultados);
            
            // Ejecutar pruebas de validación
            ejecutarPruebasValidacion(resultados, nivelAceptacion, alpha);
            
            // Mostrar mensaje de éxito con información del módulo
            mostrarMensaje(`✅ Se generaron ${n} números con ${nivelAceptacion}% de confianza (α=${alpha.toFixed(4)})`, "success");
            
        } catch (error) {
            mostrarMensaje("❌ Error al generar números aleatorios", "error");
        } finally {
            // Restaurar botón
            mostrarLoading(false);
        }
    }, 500);
}

function calcularPeriodo(a, c, m, x0) {
    const valoresVistos = new Set();
    let x = x0;
    let iteraciones = 0;
    const maxIteraciones = m * 2;

    while (!valoresVistos.has(x) && iteraciones < maxIteraciones) {
        valoresVistos.add(x);
        x = (a * x + c) % m;
        iteraciones++;
    }

    return valoresVistos.size;
}

function mostrarResultados(resultados, periodo, m, nivelAceptacion, alpha) {
    const contenedor = document.getElementById("output");
    const outputSection = document.getElementById("outputSection");
    const chartSection = document.getElementById("chartSection");
    const validationSection = document.getElementById("validationSection");

    if (!contenedor || !outputSection || !chartSection || !validationSection) {
        mostrarMensaje("❌ Error: No se encontraron elementos de resultados", "error");
        return;
    }

    if (resultados.length === 0) {
        contenedor.innerHTML = "<p style='text-align: center; color: #6c757d; padding: 2rem;'>No se han generado números.</p>";
        outputSection.classList.add('hidden');
        chartSection.classList.add('hidden');
        validationSection.classList.add('hidden');
        return;
    }

    // Mostrar secciones
    outputSection.classList.remove('hidden');
    chartSection.classList.remove('hidden');
    validationSection.classList.remove('hidden');

    // Actualizar estadísticas de forma segura
    const totalNumbers = document.getElementById('totalNumbers');
    const periodoLength = document.getElementById('periodoLength');
    
    if (totalNumbers) totalNumbers.textContent = resultados.length;
    if (periodoLength) periodoLength.textContent = periodo;

    // Mostrar información del módulo usado y nivel de aceptación
    const g = Math.log2(m);
    const moduloInfo = document.createElement('div');
    moduloInfo.className = 'modulo-info';
    moduloInfo.innerHTML = `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center; border-left: 4px solid #4361ee;">
            <strong>📐 Configuración Automática:</strong><br>
            <span style="font-size: 1.1em;">N = ${resultados.length} → m = 2<sup>${Math.round(g)}</sup> = ${m}</span><br>
            <span style="font-size: 1em; color: #4361ee;">
                Nivel de aceptación: <strong>${nivelAceptacion}%</strong> → 
                α = (100 - ${nivelAceptacion})/100 = <strong>${alpha.toFixed(4)}</strong>
            </span>
        </div>
    `;

    // Generar tabla con scroll para muchos números
    let html = `
        <div class="table-info">
            <p>Mostrando ${resultados.length} números generados con ${nivelAceptacion}% de confianza (α=${alpha.toFixed(4)})</p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Xₖ</th>
                    <th>uₖ = Xₖ / (m-1)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    resultados.forEach(r => {
        html += `
            <tr>
                <td><strong>${r.index}</strong></td>
                <td>${r.X}</td>
                <td>${r.U}</td>
            </tr>
        `;
    });
    
    html += "</tbody></table>";
    
    // Insertar primero la información del módulo
    contenedor.innerHTML = '';
    contenedor.appendChild(moduloInfo);
    contenedor.innerHTML += html;
}

function graficar(resultados) {
    const chartCanvas = document.getElementById("chart");
    if (!chartCanvas) {
        return;
    }
    
    const ctx = chartCanvas.getContext("2d");
    
    // Destruir gráfico anterior si existe
    if (chart) {
        chart.destroy();
    }

    // Ajustar tamaño de puntos según cantidad de datos
    const pointRadius = resultados.length > 200 ? 2 : resultados.length > 100 ? 3 : 4;
    const hoverRadius = resultados.length > 200 ? 4 : resultados.length > 100 ? 5 : 6;

    // Configuración responsive del gráfico
    const responsiveConfig = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 10,
                right: 15,
                bottom: 10,
                left: 15
            }
        },
        plugins: {
            legend: { 
                position: "top",
                labels: {
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { size: 13 },
                bodyFont: { size: 13 },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        return `Índice ${context.parsed.x}: uₖ = ${context.parsed.y.toFixed(4)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: { 
                    display: true, 
                    text: "Índice (k)",
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: { top: 10, bottom: 10 }
                },
                ticks: { 
                    stepSize: Math.max(1, Math.floor(resultados.length / 10)),
                    font: { size: 12 }
                },
                grid: {
                    color: "rgba(0, 0, 0, 0.1)",
                    drawBorder: true
                }
            },
            y: {
                title: { 
                    display: true, 
                    text: "Valor Normalizado (uₖ)",
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: { top: 10, bottom: 10 }
                },
                min: 0,
                max: 1,
                ticks: {
                    font: { size: 12 },
                    stepSize: 0.1
                },
                grid: {
                    color: "rgba(0, 0, 0, 0.1)",
                    drawBorder: true
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        elements: {
            point: {
                radius: pointRadius,
                hoverRadius: hoverRadius
            }
        }
    };

    chart = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [{
                label: "uₖ = Xₖ / (m-1)",
                data: resultados.map((r, i) => ({ x: i + 1, y: parseFloat(r.U) })),
                backgroundColor: "#4361ee",
                borderColor: "#3a56d4",
                borderWidth: 1,
                pointRadius: pointRadius,
                pointHoverRadius: hoverRadius
            }]
        },
        options: responsiveConfig
    });

    // Forzar redimensionamiento
    setTimeout(() => {
        if (chart) {
            chart.resize();
        }
    }, 100);
}

// ===== PRUEBAS DE VALIDACIÓN ESPECÍFICAS =====

function ejecutarPruebasValidacion(resultados, nivelAceptacion, alpha) {
    // Obtener solo los valores U (números aleatorios)
    const valoresU = resultados.map(r => parseFloat(r.U));
    const n = valoresU.length;
    
    // Ejecutar pruebas específicas
    const pruebaMedia = pruebaUniformidadMedia(valoresU, n, nivelAceptacion, alpha);
    const pruebaVarianza = pruebaUniformidadVarianza(valoresU, n, nivelAceptacion, alpha);
    const pruebaChiCuadrado = pruebaUniformidadChiCuadrado(valoresU, n, nivelAceptacion, alpha);
    const pruebaCorridas = pruebaIndependenciaCorridas(valoresU, n, nivelAceptacion, alpha);
    
    // Mostrar resultados
    mostrarResultadosValidacionEspecificos(pruebaMedia, pruebaVarianza, pruebaChiCuadrado, pruebaCorridas, nivelAceptacion, alpha);
}

function pruebaUniformidadMedia(valoresU, n, nivelAceptacion, alpha) {
    // Calcular media
    const media = valoresU.reduce((sum, val) => sum + val, 0) / n;
    
    // FÓRMULAS EXACTAS DE LA IMAGEN:
    // LI = 1/2 - z_(α/2) * (1/√(12n))
    // LS = 1/2 + z_(α/2) * (1/√(12n))
    const z_alpha_2 = calcularZScoreInverso(1 - alpha/2);
    const termino = z_alpha_2 * (1 / Math.sqrt(12 * n));
    
    const limiteInferior = 0.5 - termino;
    const limiteSuperior = 0.5 + termino;
    
    const esValido = media >= limiteInferior && media <= limiteSuperior;
    
    return {
        nombre: "Uniformidad - Media",
        valorCalculado: media,
        limiteInferior: limiteInferior,
        limiteSuperior: limiteSuperior,
        esValido: esValido
    };
}

function pruebaUniformidadVarianza(valoresU, n, nivelAceptacion, alpha) {
    // Calcular varianza muestral
    const media = valoresU.reduce((sum, val) => sum + val, 0) / n;
    const varianza = valoresU.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / (n - 1);
    
    const gl = n - 1;
    
    // FÓRMULAS EXACTAS:
    // LS = χ²(α/2, n-1) / [12(n-1)]
    // LI = χ²((1-α)/2, n-1) / [12(n-1)]
    const chi2_alpha_2 = calcularChiCuadrado(alpha/2, gl);
    const chi2_1_alpha_2 = calcularChiCuadrado(1 - alpha/2, gl);
    
    const limiteSuperior = chi2_alpha_2 / (12 * gl);
    const limiteInferior = chi2_1_alpha_2 / (12 * gl);
    
    const esValido = varianza >= limiteInferior && varianza <= limiteSuperior;
    
    return {
        nombre: "Uniformidad - Varianza",
        valorCalculado: varianza,
        limiteInferior: limiteInferior,
        limiteSuperior: limiteSuperior,
        esValido: esValido,
        alpha: alpha
    };
}

function pruebaUniformidadChiCuadrado(valoresU, n, nivelAceptacion, alpha) {
    // 1. Dividir el intervalo (0,1) en m sub-intervalos
    const m = Math.floor(Math.sqrt(n)); // m = √n
    
    // 2. Clasificar cada número en los m intervalos
    const frecuenciasObservadas = new Array(m).fill(0);
    
    valoresU.forEach(valor => {
        const intervalo = Math.floor(valor * m);
        const indice = Math.min(intervalo, m - 1);
        frecuenciasObservadas[indice]++;
    });
    
    // 3. Calcular frecuencia esperada E_i = n/m
    const frecuenciaEsperada = n / m;
    
    // 4. Calcular estadístico chi-cuadrado: x₀² = Σ[(E_i - O_i)² / E_i]
    let chiCuadradoCalculado = 0;
    for (let i = 0; i < m; i++) {
        const termino = Math.pow(frecuenciaEsperada - frecuenciasObservadas[i], 2) / frecuenciaEsperada;
        chiCuadradoCalculado += termino;
    }
    
    // 5. Obtener valor crítico de chi-cuadrado: χ²(α, m-1)
    const gradosLibertad = m - 1;
    const chiCuadradoCritico = calcularChiCuadrado(alpha, gradosLibertad);
    
    // 6. Decisión: Si x₀² < χ²(α, m-1) → NO RECHAZAR uniformidad
    const esValido = chiCuadradoCalculado < chiCuadradoCritico;
    
    return {
        nombre: "Uniformidad - Chi Cuadrado",
        valorCalculado: chiCuadradoCalculado,
        limiteInferior: 0,
        limiteSuperior: chiCuadradoCritico,
        esValido: esValido,
        gradosLibertad: gradosLibertad,
        m: m
    };
}

function pruebaIndependenciaCorridas(valoresU, n, nivelAceptacion, alpha) {
    // 1. Generar secuencia de unos y ceros (1 si r_i > r_{i-1}, 0 si r_i < r_{i-1})
    const secuencia = [];
    for (let i = 1; i < n; i++) {
        secuencia.push(valoresU[i] > valoresU[i-1] ? 1 : 0);
    }
    
    // 2. Contar número de corridas (grupos consecutivos de unos o ceros)
    let corridasObservadas = 1;
    for (let i = 1; i < secuencia.length; i++) {
        if (secuencia[i] !== secuencia[i-1]) {
            corridasObservadas++;
        }
    }
    
    // 3. Calcular valores esperados
    const mu_C0 = (2 * n - 1) / 3;
    const sigma2_C0 = (16 * n - 29) / 90;
    const sigma_C0 = Math.sqrt(sigma2_C0);
    
    // 4. Calcular estadístico Z0
    const Z0 = Math.abs((corridasObservadas - mu_C0) / sigma_C0);
    
    // 5. Obtener valor crítico Z_(α/2)
    const Z_alpha_2 = calcularZScoreInverso(1 - alpha/2);
    
    // 6. Decisión: Si Z0 < Z_(α/2) → NO RECHAZAR independencia
    const esValido = Z0 < Z_alpha_2;
    
    return {
        nombre: "Independencia - Corridas",
        valorCalculado: Z0,
        limiteInferior: 0,
        limiteSuperior: Z_alpha_2,
        esValido: esValido,
        corridasObservadas: corridasObservadas,
        mediaEsperada: mu_C0
    };
}

// Función para calcular chi-cuadrado crítico
function calcularChiCuadrado(alpha, gradosLibertad) {
    const gl = gradosLibertad;
    const z = calcularZScoreInverso(1 - alpha);
    
    const h = 1 - (2 / (9 * gl));
    const term = h + z * Math.sqrt(2 / (9 * gl));
    
    return gl * Math.pow(term, 3);
}

// Función precisa para Z-score inverso
function calcularZScoreInverso(p) {
    if (p <= 0 || p >= 1) return 0;
    
    if (p < 0.02425) {
        const q = Math.sqrt(-2 * Math.log(p));
        return -((((2.50662823884 * q + -30.6647980661) * q + 138.357751867) * q + -275.928510473) * q + 220.946098424) / 
               ((((q + -13.280700552) * q + 66.801311887) * q + -155.69897986) * q + 161.585836858);
    } else if (p > 0.97575) {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        return ((((2.50662823884 * q + -30.6647980661) * q + 138.357751867) * q + -275.928510473) * q + 220.946098424) / 
               ((((q + -13.280700552) * q + 66.801311887) * q + -155.69897986) * q + 161.585836858);
    } else {
        const q = p - 0.5;
        const r = q * q;
        return (((((-3.969683028665376e1 * r + 2.209460984245205e2) * r + -2.759285104469687e2) * r + 1.383577518672690e2) * r + -3.066479806614716e1) * r + 2.506628277459239) * q /
               (((((-5.447609879822406e1 * r + 1.615858368580409e2) * r + -1.556989798598866e2) * r + 6.680131188771972e1) * r + -1.328068155288572e1) * r + 1);
    }
}

function mostrarResultadosValidacionEspecificos(pruebaMedia, pruebaVarianza, pruebaChiCuadrado, pruebaCorridas, nivelAceptacion, alpha) {
    // Actualizar prueba de media
    const mediaStatus = document.getElementById('mediaStatus');
    const mediaDescription = document.getElementById('mediaDescription');
    const mediaValor = document.getElementById('mediaValor');
    const mediaLimiteInf = document.getElementById('mediaLimiteInf');
    const mediaLimiteSup = document.getElementById('mediaLimiteSup');
    
    if (mediaStatus) {
        mediaStatus.textContent = pruebaMedia.esValido ? "✅ APRUEBA" : "❌ NO APRUEBA";
        mediaStatus.className = `validation-status ${pruebaMedia.esValido ? 'pass' : 'fail'}`;
    }
    
    if (mediaDescription) {
        mediaDescription.textContent = `Nivel de confianza: ${nivelAceptacion}% (α=${alpha.toFixed(4)}) - ${pruebaMedia.esValido 
            ? "La media está dentro del intervalo de confianza esperado."
            : "La media está fuera del intervalo de confianza esperado."}`;
    }
    
    if (mediaValor) mediaValor.textContent = pruebaMedia.valorCalculado.toFixed(4);
    if (mediaLimiteInf) mediaLimiteInf.textContent = pruebaMedia.limiteInferior.toFixed(4);
    if (mediaLimiteSup) mediaLimiteSup.textContent = pruebaMedia.limiteSuperior.toFixed(4);
    
    // Actualizar prueba de varianza
    const varianzaStatus = document.getElementById('varianzaStatus');
    const varianzaDescription = document.getElementById('varianzaDescription');
    const varianzaValor = document.getElementById('varianzaValor');
    const varanzaLimiteInf = document.getElementById('varanzaLimiteInf');
    const varanzaLimiteSup = document.getElementById('varanzaLimiteSup');
    
    if (varianzaStatus) {
        varianzaStatus.textContent = pruebaVarianza.esValido ? "✅ APRUEBA" : "❌ NO APRUEBA";
        varianzaStatus.className = `validation-status ${pruebaVarianza.esValido ? 'pass' : 'fail'}`;
    }
    
    if (varianzaDescription) {
        varianzaDescription.textContent = `Nivel de confianza: ${nivelAceptacion}% (α=${alpha.toFixed(4)}) - ${pruebaVarianza.esValido
            ? "La varianza está dentro del intervalo de confianza esperado."
            : "La varianza está fuera del intervalo de confianza esperado."}`;
    }
    
    if (varianzaValor) varianzaValor.textContent = pruebaVarianza.valorCalculado.toFixed(4);
    if (varanzaLimiteInf) varanzaLimiteInf.textContent = pruebaVarianza.limiteInferior.toFixed(4);
    if (varanzaLimiteSup) varanzaLimiteSup.textContent = pruebaVarianza.limiteSuperior.toFixed(4);
    
    // Actualizar prueba de chi-cuadrado
    const chiStatus = document.getElementById('chiStatus');
    const chiDescription = document.getElementById('chiDescription');
    const chiValor = document.getElementById('chiValor');
    const chiLimiteSup = document.getElementById('chiLimiteSup');
    
    if (chiStatus) {
        chiStatus.textContent = pruebaChiCuadrado.esValido ? "✅ APRUEBA" : "❌ NO APRUEBA";
        chiStatus.className = `validation-status ${pruebaChiCuadrado.esValido ? 'pass' : 'fail'}`;
    }
    
    if (chiDescription) {
        chiDescription.textContent = `Nivel de confianza: ${nivelAceptacion}% (α=${alpha.toFixed(4)}) - ${pruebaChiCuadrado.esValido
            ? "Los números siguen una distribución uniforme (Chi-cuadrado)."
            : "Los números NO siguen una distribución uniforme (Chi-cuadrado)."}`;
    }
    
    if (chiValor) chiValor.textContent = pruebaChiCuadrado.valorCalculado.toFixed(4);
    if (chiLimiteSup) chiLimiteSup.textContent = pruebaChiCuadrado.limiteSuperior.toFixed(4);
    
    // Actualizar prueba de corridas
    const corridasStatus = document.getElementById('corridasStatus');
    const corridasDescription = document.getElementById('corridasDescription');
    const corridasValor = document.getElementById('corridasValor');
    const corridasLimiteSup = document.getElementById('corridasLimiteSup');
    
    if (corridasStatus) {
        corridasStatus.textContent = pruebaCorridas.esValido ? "✅ APRUEBA" : "❌ NO APRUEBA";
        corridasStatus.className = `validation-status ${pruebaCorridas.esValido ? 'pass' : 'fail'}`;
    }
    
    if (corridasDescription) {
        corridasDescription.textContent = `Nivel de confianza: ${nivelAceptacion}% (α=${alpha.toFixed(4)}) - ${pruebaCorridas.esValido
            ? "Los números son independientes (prueba de corridas)."
            : "Los números NO son independientes (prueba de corridas)."}`;
    }
    
    if (corridasValor) corridasValor.textContent = pruebaCorridas.valorCalculado.toFixed(4);
    if (corridasLimiteSup) corridasLimiteSup.textContent = pruebaCorridas.limiteSuperior.toFixed(4);
    
    // Actualizar estado general
    const overallStatus = document.getElementById('overallStatus');
    const overallDescription = document.getElementById('overallDescription');
    const regenerarBtn = document.getElementById('regenerarBtn');
    
    const esValidoGeneral = pruebaMedia.esValido && pruebaVarianza.esValido && pruebaChiCuadrado.esValido && pruebaCorridas.esValido;
    
    if (overallStatus) {
        overallStatus.textContent = esValidoGeneral ? "VÁLIDO" : "NO VÁLIDO";
        overallStatus.className = `overall-status ${esValidoGeneral ? 'valid' : 'invalid'}`;
    }
    
    if (overallDescription) {
        overallDescription.textContent = esValidoGeneral
            ? `Los números generados cumplen con todas las pruebas de validación al ${nivelAceptacion}% de confianza.`
            : `Los números generados NO cumplen con una o más pruebas de validación al ${nivelAceptacion}% de confianza.`;
    }

    // Para Corridas - Corridas observadas
    const corridasObservadas = document.getElementById('corridasObservadas');
    if (corridasObservadas && pruebaCorridas.corridasObservadas) {
        corridasObservadas.textContent = pruebaCorridas.corridasObservadas;
    }
    
    // Mostrar botón de regenerar si no es válido
    if (regenerarBtn) {
        if (!esValidoGeneral) {
            regenerarBtn.classList.remove('hidden');
        } else {
            regenerarBtn.classList.add('hidden');
        }
    }
}

function regenerarNumeros() {
    // Usar los mismos parámetros pero con una semilla diferente
    const { a, c, m, n, nivelAceptacion } = currentParams;
    
    // Generar nueva semilla basada en el tiempo actual
    const nuevaSemilla = Math.floor(Date.now() % m);
    
    // Actualizar campo de semilla
    const x0Input = document.getElementById("x0");
    if (x0Input) {
        x0Input.value = nuevaSemilla;
    }
    
    // Generar números con nueva semilla
    generarLCG();
}

function reiniciar() {
    try {
        const outputSection = document.getElementById('outputSection');
        const chartSection = document.getElementById('chartSection');
        const validationSection = document.getElementById('validationSection');
        const output = document.getElementById('output');
        const regenerarBtn = document.getElementById('regenerarBtn');
        
        if (outputSection) outputSection.classList.add('hidden');
        if (chartSection) chartSection.classList.add('hidden');
        if (validationSection) validationSection.classList.add('hidden');
        if (output) output.innerHTML = '';
        if (regenerarBtn) regenerarBtn.classList.add('hidden');
        
        // Destruir gráfico si existe
        if (chart) {
            chart.destroy();
            chart = null;
        }
        
        // Restablecer valores por defecto
        reiniciarValores();
        
        // Mostrar mensaje de reinicio
        mostrarMensaje("🔄 Formulario reiniciado correctamente", "success");
        
        // Ocultar mensaje después de 2 segundos
        setTimeout(ocultarMensaje, 2000);
        
    } catch (error) {
        mostrarMensaje("❌ Error al reiniciar la aplicación", "error");
    }
}