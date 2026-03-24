var base64Pdf = null;
var nombre_archivo = "constancia";
// Ruta absoluta para Vercel (archivo está en la raíz del deploy)
var pdfLocalPath = "/image.pdf";


document.addEventListener('DOMContentLoaded', async () => {
    // Usar URLSearchParams para obtener todos los parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);

    // Obtener los parámetros de la nueva lógica
    const solicitud = urlParams.get('solicitud');
    const identidad = urlParams.get('identidad');
    const fecha = urlParams.get('fecha');

    // Obtener los parámetros de la lógica antigua (para compatibilidad)
    const nombre_documento = urlParams.get('nombre_documento');
    const nombre_antecedentes = urlParams.get('nombre_antecedentes');

    let nombre_archivo;
   

    try {
        mostrarSpinner(); // Mostrar spinner antes de iniciar las solicitudes

        if (solicitud && identidad && fecha) {
            console.log("Parámetros recibidos:", { solicitud, identidad, fecha });
            // Lógica para los nuevos parámetros (solicitud, identidad, fecha)
            const data = await realizarSolicitud(`api/obtener_constancia.php?solicitud=${solicitud}&identidad=${identidad}&fecha=${fecha}`);
            console.log(data);

            // Verifica si se recibieron datos
            if (data.length > 0) {
                const documento = data[0];
                nombre_archivo = "solicitud_" + documento.numero_solicitud + "_" + documento.nombre_completo + ".pdf";

                // Actualiza los campos del formulario con los datos recibidos
                document.getElementById('nombre').value = documento.nombre_completo;
                document.getElementById('numeroIdentidad').value = documento.identidad;
                document.getElementById('fechaPermiso').value = documento.fecha_sistema;

                if (documento.doc_base64) {
                    const base64String = documento.doc_base64.replace(/^data:application\/pdf;base64,/, "");
                    convertirPdfABase64(base64String);
                    base64Pdf = base64String;
                    document.getElementById('mensaje_descargar').style.display = 'block';
                } else {
                    document.getElementById('notificacion_no_valida').style.display = 'block';
                    console.error('El PDF en base64 no se recibió correctamente.');
                }
            } else {
                document.getElementById('notificacion_no_valida').style.display = 'block';
                console.error('No se encontró ningún documento con esos parámetros.');
            }
        } else if (nombre_documento) {
            // Lógica para el parámetro antiguo 'nombre_documento'
            const data = await realizarSolicitud(`api/obtener_constancia.php?nombre_documento=${nombre_documento}`);
            console.log(data);
            nombre_archivo = "solicitud_" + data[0].numero_solicitud + "_" + data[0].nombre_completo + ".pdf";

            if (data.length > 0) {
                const documento = data[0];
                document.getElementById('nombre').value = documento.nombre_completo;
                document.getElementById('numeroIdentidad').value = documento.identidad;
                document.getElementById('fechaPermiso').value = documento.fecha_sistema;

                if (documento.doc_base64) {
                    const base64String = documento.doc_base64.replace(/^data:application\/pdf;base64,/, "");
                    convertirPdfABase64(base64String);
                    base64Pdf = base64String;
                    document.getElementById('mensaje_descargar').style.display = 'block';
                } else {
                    document.getElementById('notificacion_no_valida').style.display = 'block';
                    console.error('El PDF en base64 no se recibió correctamente.');
                }
            } else {
                document.getElementById('notificacion_no_valida').style.display = 'block';
                console.error('No se encontró ningún documento con ese nombre.');
            }
        } else if (nombre_antecedentes) {
            // Lógica para el parámetro antiguo 'nombre_antecedentes'
            const data = await realizarSolicitud(`api/obtener_constancia.php?nombre_antecedentes=${nombre_antecedentes}`);
            nombre_archivo = "solicitud_" + data.numero_solicitud + "_" + data.nombre_completo + ".pdf";
            console.log("Respuesta de la API:", data);

            if (!data || Object.keys(data).length === 0) {
                document.getElementById('notificacion_no_valida').style.display = 'block';
                console.error('La API no devolvió datos válidos.');
                return;
            }

            console.log("Nombre completo:", data.nombre_completo);
            console.log("DNI:", data.dni);
            console.log("Fecha:", data.fecha_hora_emision);
            console.log("PDF base64:", data.pdf_base64 ? "Recibido" : "No recibido");

            document.getElementById('nombre').value = data.nombre_completo || '';
            document.getElementById('numeroIdentidad').value = formatearDNI(data.dni) || '';
            document.getElementById('fechaPermiso').value = data.fecha_hora_emision || '';

            if (data.pdf_base64) {
                const base64String = data.pdf_base64.replace(/^data:application\/pdf;base64,/, "");
                convertirPdfABase64(base64String);
                base64Pdf = base64String;
                document.getElementById('mensaje_descargar').style.display = 'block';
            } else {
                document.getElementById('notificacion_no_valida').style.display = 'block';
                console.error('El PDF en base64 no se recibió correctamente.');
            }
        } else {
            // Si no hay parámetros válidos
            console.error('No se proporcionó ningún parámetro válido en la URL.');
            document.getElementById('notificacion_no_valida').style.display = 'block';
        }
    } catch (error) {
        console.error('Error en la lógica principal:', error);
        document.getElementById('notificacion_no_valida').style.display = 'block';
    } finally {
        ocultarSpinner(); // Ocultar spinner después de que todo haya terminado
    }
});

 // Función para manejar la solicitud a la API
 async function realizarSolicitud(url) {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error; // Relanzar el error para manejarlo en el bloque catch principal
    }
}

// Función para manejar la respuesta de la API
// async function manejarRespuestaAPI(url) {
//     try {
//         mostrarSpinner(); // Mostrar spinner antes de la solicitud

//         const response = await fetch(url, {
//             method: "GET",
//             headers: { "Content-Type": "application/json" }
//         });

//         if (!response.ok) {
//             throw new Error(`Error en la solicitud: ${response.statusText}`);
//         }

//         const data = await response.json();
//         console.log("Respuesta de la API:", data);

//         if (!data || Object.keys(data).length === 0) {
//             throw new Error('La API no devolvió datos válidos.');
//         }

//         // Actualizar el formulario con los datos recibidos
//         actualizarFormulario(data);
//         base64Pdf = data.pdf_base64;
//         // Manejar el PDF en base64 (si está presente)
//         if (data.pdf_base64) {
//             const base64String = data.pdf_base64.replace(/^data:application\/pdf;base64,/, "");
//             convertirPdfABase64(base64String);
//             document.getElementById('mensaje_descargar').style.display = 'block';
//             //base64Pdf = data.pdf_base64;
//         } else {
//             document.getElementById('notificacion_no_valida').style.display = 'block';
//             console.error('El PDF en base64 no se recibió correctamente.');
//         }


//     } catch (error) {
//         console.error('Error:', error);
//         document.getElementById('notificacion_no_valida').style.display = 'block';
//     } finally {
//         ocultarSpinner(); // Ocultar spinner después de la solicitud
//     }
// }

// // Lógica principal
// if (nombre_documento) {
//     await manejarRespuestaAPI(`api/obtener_constancia.php?nombre_documento=${nombre_documento}`);
// } else if (nombre_antecedentes) {
//     await manejarRespuestaAPI(`api/obtener_constancia.php?nombre_antecedentes=${nombre_antecedentes}`);
// } else {
//     console.error('No se proporcionó ningún parámetro válido en la URL.');
//     document.getElementById('notificacion_no_valida').style.display = 'block';
// }


// Mostrar el spinner
function mostrarSpinner() {
    document.getElementById('spinner').style.display = 'block';
}

// Ocultar el spinner
function ocultarSpinner() {
    document.getElementById('spinner').style.display = 'none';
}

// Función para actualizar los campos del formulario
function actualizarFormulario(data) {
    document.getElementById('nombre').value = data.nombre_completo || '';
    document.getElementById('numeroIdentidad').value = formatearDNI(data.dni) || '';
    document.getElementById('fechaPermiso').value = data.fecha_hora_emision || '';
}


function formatearDNI(dni) {
    // Verifica si el DNI tiene al menos 13 dígitos
    if (dni && dni.length === 13) {
        return `${dni.substring(0, 4)}-${dni.substring(4, 8)}-${dni.substring(8, 13)}`;
    }
    return dni; // Devuelve el mismo DNI si no tiene 13 dígitos
}





async function convertirPdfABase64(base64Pdf) {
    const pdfData = atob(base64Pdf);
    const pdfArray = new Uint8Array(pdfData.length);

    for (let i = 0; i < pdfData.length; i++) {
        pdfArray[i] = pdfData.charCodeAt(i);
    }

    const pdf = await pdfjsLib.getDocument({ data: pdfArray }).promise;
    const page = await pdf.getPage(1);

    const scale = 2;
    const viewport = page.getViewport({ scale });

    // Crear un canvas en memoria (sin mostrarlo en el HTML)
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = { canvasContext: context, viewport };
    await page.render(renderContext).promise;

    // Asignar la imagen al <img>
    const img = document.getElementById("pdfImage");
    img.src = canvas.toDataURL("image/png");
}

document.getElementById('btnDescargar').addEventListener('click', () => {
    // Si existe el PDF en base64 (viene de la API), se descarga; si no, usamos el archivo local.
    if (base64Pdf) {
        const pdfUrl = `data:application/pdf;base64,${base64Pdf}`;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = nombre_archivo || 'constancia.pdf';
        link.click();
        link.remove();
        console.log('Descarga completada (base64)');
    } else {
        window.open(pdfLocalPath, '_blank');
        console.log('Descarga local abierta');
    }
});
