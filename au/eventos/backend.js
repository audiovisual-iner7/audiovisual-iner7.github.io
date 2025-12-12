/**
 * Registra un nuevo evento en la hoja "EVENTOS_REG" a partir de la fila 5.
 * @param {Object} data - Los datos del evento enviados desde el frontend.
 */
function registrarEvento(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('EVENTOS_REG');
    if (!sheet) {
      throw new Error("No se encontró la hoja 'EVENTOS_REG'. Por favor, créala.");
    }

    // Mapas de columnas (sin cambios)
    const tipoEventoColumnMap = { 'SESION_GENERAL': 6, 'SESION_ENFERMERIA': 7, 'CIENI': 8, 'EDUCACION': 9, 'SEMINARIO_INER': 10, 'CEREMONIAS': 11, 'OTROS': 12 };
    const serviciosColumnMap = { 'CARTEL': 15, 'POSTAL_DIFUSION': 16, 'REEL_VIDEO': 17, 'ENCABEZADO_FORMULARIOS': 18, 'PROGRAMA_PORTADA_INTERIOR': 19, 'BANNER_VERTICAL_PODIUM': 20, 'PROGRAMA_PANTALLA_LOBBY': 21, 'CORTINILLA_GENERAL': 22, 'CORTINILLA_ANIMADA_GENERAL': 23, 'CORTINILLA_ASISTENCIA': 24, 'CORTINILLA_INSCRIPCION_EVAL_INICIAL': 25, 'CORTINILLA_EVAL_CALIDAD_CONOCIMIENTOS': 26, 'SUPERS_SESION_GENERAL': 27, 'SUPERS_ORDEN_DIA': 28, 'SUPERS_PROGRAMA': 29, 'QR_BANDERIN': 30, 'QR_SESION': 31, 'QR_INSCRIPCION_EVAL_INICIAL': 32, 'QR_EVAL_CALIDAD_CONOCIMIENTOS': 33, 'DOC_PREGUNTAS_SESIONES': 34, 'DOC_PREGUNTAS_EVENTO': 35, 'VIDEO_INTRO_PC': 36, 'CORTINILLA_PROX_EVENTOS': 37, 'TRANSMISION_YOUTUBE': 38, 'TRANSMISION_ZOOM': 39, 'APOYO_TECNICO': 40 };
    
    const newRowData = new Array(40).fill('');

    newRowData[1] = data.noEvento || '';     // Columna B
    newRowData[3] = data.fechaInicio;      // Columna D
    newRowData[4] = data.fechaFin;         // Columna E
    newRowData[12] = data.nombreEvento;    // Columna M
    newRowData[13] = data.sede;            // Columna N

    const tipoEventoCol = tipoEventoColumnMap[data.tipoEvento];
    if (tipoEventoCol) {
      newRowData[tipoEventoCol - 1] = 'x';
    }

    for (const servicio in data.servicios) {
      if (data.servicios[servicio] === true) {
        const servicioCol = serviciosColumnMap[servicio];
        if (servicioCol) {
          newRowData[servicioCol - 1] = 'R';
        }
      }
    }
    
    // --- CAMBIO CLAVE: USAR findNextEmptyRow EN LUGAR DE appendRow ---
    // Buscamos la primera fila vacía a partir de la fila 5, usando la columna B como referencia.
    const targetRow = findNextEmptyRow(sheet, 5, 2); 
    
    // Escribimos los datos en la fila encontrada
    sheet.getRange(targetRow, 1, 1, newRowData.length).setValues([newRowData]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Evento registrado con éxito en la fila ' + targetRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error en registrarEvento: ' + error.toString() + ' Stack: ' + error.stack);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'Error en el servidor: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función auxiliar para encontrar la primera fila vacía en una hoja a partir de una fila de inicio.
 * (Es posible que ya la tengas, si no, agrégala).
 * @param {Sheet} sheet - La hoja de cálculo.
 * @param {number} startRow - La fila desde la que se empieza a buscar.
 * @param {number} keyColumnIndex - El índice de la columna a verificar (1 para A, 2 para B, etc.).
 * @returns {number} - El número de la primera fila vacía encontrada.
 */
function findNextEmptyRow(sheet, startRow, keyColumnIndex) {
    const columnValues = sheet.getRange(startRow, keyColumnIndex, sheet.getMaxRows() - startRow + 1, 1).getValues();
    for (let i = 0; i < columnValues.length; i++) {
        if (columnValues[i][0] === '') {
            return i + startRow;
        }
    }
    return sheet.getLastRow() + 1; // Fallback por si todo está lleno
}
