let chart = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Aplicación LCG iniciada');
    
    // Establecer valores por defecto al cargar
    reiniciarValores();
    
    // Agregar validación en tiempo real para evitar decimales
    document.querySelectorAll('#formLCG input').forEach(input => {
        input.addEventListener('input', function(e) {
            // Prevenir decimales
            if (this.value.includes('.')) {
                this.value = this.value.split('.')[0];
            }
            validarCampoEnTiempoReal(e);
        });
        
        // Prevenir pegado de decimales
        input.addEventListener('paste', function(e) {
            const pastedData = e.clipboardData.getData('text');
            if (pastedData.includes('.')) {
                e.preventDefault();
                this.value = pastedData.split('.')[0];
            }
        });
    });
    
    // Soporte para Enter
    document.getElementById('formLCG').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            generarLCG();
        }
    });
});

function reiniciarValores() {
    console.log('🔄 Restableciendo valores por defecto');
    
    // Restablecer valores por defecto
    document.getElementById("a").value = defaultValues.a;
    document.getElementById("c").value = defaultValues.c;
    document.getElementById("m").value = defaultValues.m;
    document.getElementById("x0").value = defaultValues.x0;
    document.getElementById("n").value = defaultValues.n;
    
    // Limpiar estilos de validación
    document.querySelectorAll('#formLCG input').forEach(input => {
        input.style.borderColor = '';
    });
}

function validarCampoEnTiempoReal(e) {
    const input = e.target;
    const value = input.value;
    
    if (value === '' || value === '-') {
        input.style.borderColor = '';
        return;
    }
    
    const numero = parseInt(value);
    
    if (isNaN(numero)) {
        input.style.borderColor = 'var(--danger)';
        return false;
    }
    
    if (validarCampoEspecifico(input.id, numero)) {
        input.style.borderColor = 'var(--success)';
    } else {
        input.style.borderColor = 'var(--danger)';
    }
    
    return true;
}

function validarCampoEspecifico(id, valor) {
    const m = parseInt(document.getElementById('m').value) || 0;
    
    switch(id) {
        case 'a':
            return valor > 0;
        case 'c':
            return valor >= 0;
        case 'm':
            return valor > 1;
        case 'x0':
            return !isNaN(m) && valor >= 0 && valor < m;
        case 'n':
            return valor > 0;
        default:
            return true;
    }
}

function mostrarMensaje(mensaje, tipo = 'error') {
    const mensajesDiv = document.getElementById('mensajes');
    mensajesDiv.textContent = mensaje;
    mensajesDiv.className = `mensajes ${tipo}`;
    mensajesDiv.style.display = 'block';
}

function ocultarMensaje() {
    const mensajesDiv = document.getElementById('mensajes');
    mensajesDiv.style.display = 'none';
}

function mostrarLoading(mostrar) {
    const generarBtn = document.getElementById('generarBtn');
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
    
    // Obtener valores y asegurarse de que sean enteros
    const a = parseInt(document.getElementById("a").value);
    const c = parseInt(document.getElementById("c").value);
    const m = parseInt(document.getElementById("m").value);
    const x0 = parseInt(document.getElementById("x0").value);
    const n = parseInt(document.getElementById("n").value);

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

    if (n <= 0) {
        mostrarMensaje("⚠️ La cantidad de números debe ser mayor que 0.", "error");
        return;
    }

    if (n >= 100) {
        const confirmar = confirm("⚠️ Vas a generar más de 100 números. ¿Deseas continuar?");
        if (!confirmar) return;
    }

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

            // Calcular período
            const periodo = calcularPeriodo(a, c, m, x0);

            mostrarResultados(resultados, periodo);
            graficar(resultados);
            
            // Mostrar mensaje de éxito
            mostrarMensaje(`✅ Se generaron ${n} números aleatorios correctamente`, "success");
            
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

function mostrarResultados(resultados, periodo) {
    const contenedor = document.getElementById("output");
    const outputSection = document.getElementById("outputSection");
    const chartSection = document.getElementById("chartSection");

    if (resultados.length === 0) {
        contenedor.innerHTML = "<p style='text-align: center; color: #6c757d; padding: 2rem;'>No se han generado números.</p>";
        outputSection.classList.add('hidden');
        chartSection.classList.add('hidden');
        return;
    }

    // Mostrar secciones
    outputSection.classList.remove('hidden');
    chartSection.classList.remove('hidden');

    // Actualizar estadísticas
    document.getElementById('totalNumbers').textContent = resultados.length;
    document.getElementById('periodoLength').textContent = periodo;

    // Generar tabla
    let html = `
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
    contenedor.innerHTML = html;
}

function graficar(resultados) {
    const ctx = document.getElementById("chart").getContext("2d");
    
    // Destruir gráfico anterior si existe
    if (chart) {
        chart.destroy();
    }

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
                radius: resultados.length > 50 ? 3 : 5,
                hoverRadius: resultados.length > 50 ? 5 : 8
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
                pointRadius: resultados.length > 50 ? 3 : 5,
                pointHoverRadius: resultados.length > 50 ? 5 : 8
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

function reiniciar() {
  document.getElementById("formLCG").reset();
  document.getElementById("output").innerHTML = "";

  // Ocultar secciones de resultados de forma segura
        const outputSection = document.getElementById('outputSection');
        const chartSection = document.getElementById('chartSection');
        const output = document.getElementById('output');
        
        if (outputSection) outputSection.classList.add('hidden');
        if (chartSection) chartSection.classList.add('hidden');
        if (output) output.innerHTML = '';

   if (chart) {
            chart.destroy();
            chart = null;
        }
        
        // Mostrar mensaje de reinicio
    mostrarMensaje("🔄 Formulario reiniciado correctamente", "success");
    setTimeout(ocultarMensaje, 2000);
}





    