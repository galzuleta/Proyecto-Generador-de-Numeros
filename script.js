let chart = null;
let currentResults = [];
let currentParams = {};


// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Aplicación LCG iniciada');
    
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
        if (input.id !== 'm') { // No validar m ya que es solo lectura
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
        
        console.log(`📊 N=${n} → m=2^${g}=${m}`);
    }
}

function reiniciarValores() {
    console.log('🔄 Restableciendo valores por defecto');
    
    try {
        // Restablecer valores por defecto de forma segura
        const aInput = document.getElementById("a");
        const cInput = document.getElementById("c");
        const mInput = document.getElementById("m");
        const x0Input = document.getElementById("x0");
        const nInput = document.getElementById("n");
        
        // Verificar que los elementos existen antes de asignar valores
        if (aInput) aInput.value = defaultValues.a;
        if (cInput) cInput.value = defaultValues.c;
        if (x0Input) x0Input.value = defaultValues.x0;
        if (nInput) nInput.value = defaultValues.n;
        
        // Calcular m automáticamente desde n
        actualizarModuloDesdeN();
        
        // Limpiar estilos de validación
        document.querySelectorAll('#formLCG input').forEach(input => {
            if (input && input.id !== 'm') {
                input.style.borderColor = '';
            }
        });
        
        console.log('✅ Valores restablecidos correctamente');
    } catch (error) {
        console.error('❌ Error en reiniciarValores:', error);
    }
}

function validarCampoEnTiempoReal(e) {
    const input = e.target;
    if (!input || input.id === 'm') return; // No validar m
    
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
            // Mínimo 99 números
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
    console.log('🎲 Iniciando generación LCG');
    
    // Obtener elementos de forma segura
    const aInput = document.getElementById("a");
    const cInput = document.getElementById("c");
    const mInput = document.getElementById("m");
    const x0Input = document.getElementById("x0");
    const nInput = document.getElementById("n");
    
    if (!aInput || !cInput || !mInput || !x0Input || !nInput) {
        mostrarMensaje("❌ Error: No se pudieron encontrar los campos del formulario", "error");
        return;
    }
    
    // Obtener valores y asegurarse de que sean enteros
    const a = parseInt(aInput.value);
    const c = parseInt(cInput.value);
    const m = parseInt(mInput.value);
    const x0 = parseInt(x0Input.value);
    const n = parseInt(nInput.value);

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

    // Mostrar información del módulo calculado
    const g = Math.log2(m);
    console.log(`📐 Parámetros: N=${n}, m=2^${g.toFixed(2)}=${m}`);

    // Guardar parámetros actuales para regeneración
    currentParams = { a, c, m, x0, n };

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

            mostrarResultados(resultados, periodo, m);
            graficar(resultados);
            
            // Ejecutar pruebas de validación
            ejecutarPruebasValidacion(resultados);
            
            // Mostrar mensaje de éxito con información del módulo
            const g = Math.log2(m);
            mostrarMensaje(`✅ Se generaron ${n} números usando m=2^${Math.round(g)}=${m}`, "success");
            
        } catch (error) {
            console.error('Error en generación LCG:', error);
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

function mostrarResultados(resultados, periodo, m) {
    const contenedor = document.getElementById("output");
    const outputSection = document.getElementById("outputSection");
    const chartSection = document.getElementById("chartSection");
    const validationSection = document.getElementById("validationSection");

    if (!contenedor || !outputSection || !chartSection || !validationSection) {
        console.error('❌ No se encontraron elementos de resultados');
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

    // Mostrar información del módulo usado
    const g = Math.log2(m);
    const moduloInfo = document.createElement('div');
    moduloInfo.className = 'modulo-info';
    moduloInfo.innerHTML = `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center; border-left: 4px solid #4361ee;">
            <strong>📐 Configuración Automática:</strong><br>
            <span style="font-size: 1.1em;">N = ${resultados.length} → m = 2<sup>${Math.round(g)}</sup> = ${m}</span>
        </div>
    `;

    // Generar tabla con scroll para muchos números
    let html = `
        <div class="table-info">
            <p>Mostrando ${resultados.length} números generados</p>
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
        console.error('❌ No se encontró el elemento canvas del gráfico');
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

function ejecutarPruebasValidacion(resultados) {
    console.log('🧪 Ejecutando pruebas de validación específicas');
    
    // Obtener solo los valores U (números aleatorios)
    const valoresU = resultados.map(r => parseFloat(r.U));
    const n = valoresU.length;
    
    // Ejecutar pruebas específicas
    const pruebaMedia = pruebaUniformidadMedia(valoresU, n);
    const pruebaVarianza = pruebaUniformidadVarianza(valoresU, n);
    const pruebaCorrelacion = pruebaIndependenciaCorrelacion(valoresU, n);
    
    // Mostrar resultados
    mostrarResultadosValidacionEspecificos(pruebaMedia, pruebaVarianza, pruebaCorrelacion);
}

function pruebaUniformidadMedia(valoresU, n) {
    // Calcular media
    const media = valoresU.reduce((sum, val) => sum + val, 0) / n;
    
    // Límites para la media con α=0.05
    // Para una distribución uniforme U(0,1), la media teórica es 0.5
    // El intervalo de confianza al 95% es: 0.5 ± Z_(1-α/2) * σ/√n
    const z = 1.96; // Valor Z para α=0.05
    const sigma = 1 / Math.sqrt(12); // Desviación estándar teórica de U(0,1)
    const margenError = z * sigma / Math.sqrt(n);
    
    const limiteInferior = 0.5 - margenError;
    const limiteSuperior = 0.5 + margenError;
    
    const esValido = media >= limiteInferior && media <= limiteSuperior;
    
    return {
        nombre: "Uniformidad - Media",
        valorCalculado: media,
        limiteInferior: limiteInferior,
        limiteSuperior: limiteSuperior,
        esValido: esValido
    };
}

function pruebaUniformidadVarianza(valoresU, n) {
    // Calcular varianza muestral
    const media = valoresU.reduce((sum, val) => sum + val, 0) / n;
    const varianza = valoresU.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / (n - 1);
    
    // Límites para la varianza con α=0.05
    // Para una distribución uniforme U(0,1), la varianza teórica es 1/12 ≈ 0.08333
    // Usamos distribución chi-cuadrado para el intervalo de confianza
    const varianzaTeorica = 1/12;
    const chi2Inferior = 77.046; // χ²(0.025, n-1) para n=100
    const chi2Superior = 123.225; // χ²(0.975, n-1) para n=100
    
    const limiteInferior = (n - 1) * varianzaTeorica / chi2Superior;
    const limiteSuperior = (n - 1) * varianzaTeorica / chi2Inferior;
    
    const esValido = varianza >= limiteInferior && varianza <= limiteSuperior;
    
    return {
        nombre: "Uniformidad - Varianza",
        valorCalculado: varianza,
        limiteInferior: limiteInferior,
        limiteSuperior: limiteSuperior,
        esValido: esValido
    };
}

function pruebaIndependenciaCorrelacion(valoresU, n) {
    // Prueba de correlación serial (lag-1)
    let sumaProductos = 0;
    
    for (let i = 0; i < n - 1; i++) {
        sumaProductos += valoresU[i] * valoresU[i + 1];
    }
    
    // Calcular coeficiente de correlación
    const media = valoresU.reduce((sum, val) => sum + val, 0) / n;
    const varianza = valoresU.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / (n - 1);
    
    const covarianza = (sumaProductos / (n - 1)) - Math.pow(media, 2);
    const correlacion = covarianza / varianza;
    
    // Límites para correlación con α=0.05
    // Bajo independencia, el coeficiente de correlación debería estar cerca de 0
    const z = 1.96; // Valor Z para α=0.05
    const limite = z / Math.sqrt(n);
    
    const limiteInferior = -limite;
    const limiteSuperior = limite;
    
    const esValido = correlacion >= limiteInferior && correlacion <= limiteSuperior;
    
    return {
        nombre: "Independencia - Correlación",
        valorCalculado: correlacion,
        limiteInferior: limiteInferior,
        limiteSuperior: limiteSuperior,
        esValido: esValido
    };
}

function mostrarResultadosValidacionEspecificos(pruebaMedia, pruebaVarianza, pruebaCorrelacion) {
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
        mediaDescription.textContent = pruebaMedia.esValido 
            ? "La media está dentro del intervalo de confianza esperado."
            : "La media está fuera del intervalo de confianza esperado.";
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
        varianzaDescription.textContent = pruebaVarianza.esValido
            ? "La varianza está dentro del intervalo de confianza esperado."
            : "La varianza está fuera del intervalo de confianza esperado.";
    }
    
    if (varianzaValor) varianzaValor.textContent = pruebaVarianza.valorCalculado.toFixed(4);
    if (varanzaLimiteInf) varanzaLimiteInf.textContent = pruebaVarianza.limiteInferior.toFixed(4);
    if (varanzaLimiteSup) varanzaLimiteSup.textContent = pruebaVarianza.limiteSuperior.toFixed(4);
    
    // Actualizar prueba de correlación
    const correlacionStatus = document.getElementById('correlacionStatus');
    const correlacionDescription = document.getElementById('correlacionDescription');
    const correlacionValor = document.getElementById('correlacionValor');
    const correlacionLimiteInf = document.getElementById('correlacionLimiteInf');
    const correlacionLimiteSup = document.getElementById('correlacionLimiteSup');
    
    if (correlacionStatus) {
        correlacionStatus.textContent = pruebaCorrelacion.esValido ? "✅ APRUEBA" : "❌ NO APRUEBA";
        correlacionStatus.className = `validation-status ${pruebaCorrelacion.esValido ? 'pass' : 'fail'}`;
    }
    
    if (correlacionDescription) {
        correlacionDescription.textContent = pruebaCorrelacion.esValido
            ? "La correlación está dentro del intervalo de confianza esperado."
            : "La correlación está fuera del intervalo de confianza esperado.";
    }
    
    if (correlacionValor) correlacionValor.textContent = pruebaCorrelacion.valorCalculado.toFixed(4);
    if (correlacionLimiteInf) correlacionLimiteInf.textContent = pruebaCorrelacion.limiteInferior.toFixed(4);
    if (correlacionLimiteSup) correlacionLimiteSup.textContent = pruebaCorrelacion.limiteSuperior.toFixed(4);
    
    // Actualizar estado general
    const overallStatus = document.getElementById('overallStatus');
    const overallDescription = document.getElementById('overallDescription');
    const regenerarBtn = document.getElementById('regenerarBtn');
    
    const esValidoGeneral = pruebaMedia.esValido && pruebaVarianza.esValido && pruebaCorrelacion.esValido;
    
    if (overallStatus) {
        overallStatus.textContent = esValidoGeneral ? "VÁLIDO" : "NO VÁLIDO";
        overallStatus.className = `overall-status ${esValidoGeneral ? 'valid' : 'invalid'}`;
    }
    
    if (overallDescription) {
        overallDescription.textContent = esValidoGeneral
            ? "Los números generados cumplen con todas las pruebas de validación."
            : "Los números generados NO cumplen con una o más pruebas de validación.";
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
    console.log('🔄 Regenerando números con mismos parámetros');
    
    // Usar los mismos parámetros pero con una semilla diferente
    const { a, c, m, n } = currentParams;
    
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
    console.log('🔄 Reiniciando aplicación');
    
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
        
        // Mostrar mensaje de reinicio
        mostrarMensaje("🔄 Formulario reiniciado correctamente", "success");
        
        // Ocultar mensaje después de 2 segundos
        setTimeout(ocultarMensaje, 2000);
        
        console.log('✅ Aplicación reiniciada correctamente');
    } catch (error) {
        console.error('❌ Error en reiniciar:', error);
        mostrarMensaje("❌ Error al reiniciar la aplicación", "error");
    }
}


