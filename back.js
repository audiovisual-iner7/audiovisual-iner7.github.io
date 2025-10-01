const CORREOS_TEAM = {
  "CARLOS": "carlosmr.iner@gmail.com",
  "DANIEL": "aviladaniel.iner2@gmail.com",
  "DIANA": "dianacampos.iner@gmail.com",
  "GIOVANNY": "audiovisual.iner7@gmail.com",
  "HILDING": "hilding.iner@gmail.com",
  "MARICELA": "aulasyauditoriosiner@gmail.com",
  "MIGUEL": "maegpsicologoorganizacional@gmail.com",
  "SAM": "samglez.iner@gmail.com",
  "SCARLET": "scarletcruz.iner@gmail.com"
};

const DRIVE_FOLDER_ID = "10dpJwJRUOs1x_eVZ0LnXxTv0ZW0opqHB";
const NOTIFICATION_EMAILS = [
  "audiovisual.iner7@gmail.com",
  "dianacampos.iner@gmail.com",
  "hilding.iner@gmail.com"
];

var folioNuevo;
var sigFolio;


// MAIN ENTRYPOINT CON LOGS
function doPost(e) {
  try {
    Logger.log('Iniciando doPost...');
    if (!e || !e.parameter || !e.parameter.data) {
        Logger.log('Error: La solicitud no contiene el parámetro "data".');
        return ContentService.createTextOutput(JSON.stringify({success: false, message: 'Solicitud inválida: falta el parámetro data.'})).setMimeType(ContentService.MimeType.JSON);
    }
    Logger.log('Parámetro "data" recibido: ' + e.parameter.data);
    const data = JSON.parse(e.parameter.data);
    Logger.log('Acción solicitada: ' + data.action);

    switch (data.action) {
      case 'login':
        return authenticateUser(data.username, data.password);
      case 'getPendientes':
        return getPendientes();
      case 'getRegPendientes':
        return getRegPendientes();
      case 'assignTask':
        return assignTaskToUser(data.taskData, data.elaboro, data.comentarios, data.asignadoPor);
      case 'solicitud':
        return solicitudesRecibidas(data);
      case 'getPendientesUsuario':
        return getPendientesUsuario(data);
      case 'solicitudFolio':
        return buscarPorFolio(data);
      case 'getAllPendientes':
        return getAllPendientes();
      case 'crearSolicitudAdmin':
        Logger.log('Entrando al case "crearSolicitudAdmin"...');
        return crearSolicitudAdmin(data);
      case 'getSolicitudDetails':
        return getSolicitudDetails(data.folio);
      case 'deliverTask':
        return deliverTask(data.folio, data.recibe, data.fechaEntrega, data.deliveredBy, data.observaciones);
      default:
        Logger.log('Error: Acción no reconocida en el switch: ' + data.action);
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Acción no válida'}))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('ERROR CATASTRÓFICO en doPost: ' + error.toString() + ' Stack: ' + error.stack);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Error del servidor: ' + error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

//Solicitudes
function solicitudesRecibidas(data) {
  try{
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Solicitudes');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Solicitudes');
      // Removí la columna 'Tipo de Trabajo'
      sheet.appendRow(['Folio','Timestamp', 'Email', 'Nombre', 'Area', 'Telefono', 'Descripcion', 'Items Adicionales', 'Archivos Adjuntos']);
    }


    var fileUrls = [];

    // Procesar archivos adjuntos
    if (DRIVE_FOLDER_ID && data.files && data.files.length > 0) {
      var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      for (var i = 0; i < data.files.length; i++) {
        var file = data.files[i];
        var decodedData = Utilities.base64Decode(file.data);
        var blob = Utilities.newBlob(decodedData, file.mimeType, file.filename);
        var driveFile = folder.createFile(blob);
        fileUrls.push(driveFile.getUrl());
      }
    }

    var clave = 'S-' + new Date().getFullYear()+"-";
    var folio = PropertiesService.getScriptProperties().getProperty('folio') || '0';
    folio =  parseInt(folio, 10) + 1;
    folioNuevo = clave + folio.toString();

    // Agregar datos a la hoja (sin workType)
    var newRow = [
      folioNuevo,
      data.timestamp || new Date(),
      data.email || '',
      data.requesterName || '',
      data.area || '',
      data.phone || '',
      data.description || '',
      data.items || '',
      fileUrls.join(', ')
    ];
    Logger.log(JSON.stringify(newRow));
    sheet.appendRow(newRow);

    if (data.recibe) {
      // Obtenemos el número de la última fila, que es la que acabamos de agregar.
      var lastRow = sheet.getLastRow();
      // Colocamos el valor de 'recibe' en la columna N (que es la columna número 14) de esa fila.
      sheet.getRange(lastRow, 14).setValue(data.recibe);
      Logger.log('Se ha registrado a "' + data.recibe + '" como receptor en la columna N, fila ' + lastRow);
    }

    PropertiesService.getScriptProperties().setProperty('folio', folio);
    PropertiesService.getScriptProperties().setProperty('ultimoFolio', folioNuevo);

    // Enviar notificaciones por email
    sendNotificationEmails(data, fileUrls);
    sendConfirmationEmail(data);

    // SIN headers de CORS
    return ContentService
      .createTextOutput(JSON.stringify({
        'result': 'success',
        'folio': folioNuevo
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // SIN headers de CORS
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Función para enviar notificación a los administradores
function sendNotificationEmails(data, fileUrls) {
  try {
    var subject = "Nueva Solicitud de Trabajo - " + (data.requesterName || "Sin nombre");

    var htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003C7D; color: white; padding: 20px; text-align: center;">
        <h2>Nueva Solicitud de Trabajo Recibida ${folioNuevo}</h2>
      </div>

      <div style="padding: 20px; background-color: #f9f9f9;">
        <h3 style="color: #003C7D; border-bottom: 2px solid #003C7D; padding-bottom: 5px;">
          📋 Información del Solicitante
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 30%;">Nombre:</td>
            <td style="padding: 8px;">${data.requesterName || 'No especificado'}</td>
          </tr>
          <tr style="background-color: #f0f0f0;">
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;">${data.email || 'No especificado'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Área:</td>
            <td style="padding: 8px;">${data.area || 'No especificado'}</td>
          </tr>
          <tr style="background-color: #f0f0f0;">
            <td style="padding: 8px; font-weight: bold;">Teléfono:</td>
            <td style="padding: 8px;">${data.phone || 'No especificado'}</td>
          </tr>
        </table>

        <h3 style="color: #003C7D; border-bottom: 2px solid #003C7D; padding-bottom: 5px; margin-top: 25px;">
          🔧 Detalles del Trabajo
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; vertical-align: top;">Descripción:</td>
            <td style="padding: 8px;">${data.description || 'No especificado'}</td>
          </tr>
          ${data.items ? `
          <tr style="background-color: #f0f0f0;">
            <td style="padding: 8px; font-weight: bold; vertical-align: top;">Items Adicionales:</td>
            <td style="padding: 8px;">${data.items}</td>
          </tr>
          ` : ''}
        </table>

        ${fileUrls.length > 0 ? `
        <h3 style="color: #003C7D; border-bottom: 2px solid #003C7D; padding-bottom: 5px; margin-top: 25px;">
          📎 Archivos Adjuntos
        </h3>
        <ul style="padding-left: 20px;">
          ${fileUrls.map(url => `<li><a href="${url}" target="_blank" style="color: #003C7D;">Ver archivo en Drive</a></li>`).join('')}
        </ul>
        ` : ''}

        <div style="margin-top: 25px; padding: 15px; background-color: #e8f4f8; border-left: 4px solid #003C7D;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Fecha de solicitud:</strong> ${data.timestamp || new Date().toLocaleString('es-MX')}
          </p>
        </div>
      </div>

      <div style="background-color: #003C7D; color: white; padding: 15px; text-align: center; font-size: 12px;">
        Portal de Solicitudes de la Oficina de Audiovisual - Sistema Automatizado
      </div>
    </div>
    `;

    // Enviar email a cada destinatario
    NOTIFICATION_EMAILS.forEach(function(email) {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        htmlBody: htmlBody,
        name: 'Oficina de Audiovisual'

      });
    });

  } catch (emailError) {
    console.error('Error enviando emails de notificación:', emailError);
  }
}

// Función para enviar confirmación al solicitante
function sendConfirmationEmail(data) {
  try {
    if (!data.email) return; // No enviar si no hay email del solicitante

    var subject = "Confirmación de Solicitud Recibida - Oficina de Audiovisual";

    var htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
        <h2>✅ Solicitud Recibida Exitosamente</h2>
      </div>

      <div style="padding: 20px; background-color: #f9f9f9;">
        <p style="font-size: 16px; color: #333;">
          Estimado/a <strong>${data.requesterName || 'Usuario'}</strong>,
        </p>

        <p style="font-size: 14px; color: #555; line-height: 1.6;">
          Queremos confirmarle que la
          <strong>Oficina de Audiovisual</strong> ha recibido su solicitud de trabajo.
        </p>

        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h4 style="color: #28a745; margin: 0 0 10px 0;">📋 Resumen de su solicitud:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #555;">
            <li><strong>Folio:</strong> ${folioNuevo}</li>
            <li><strong>Área solicitante:</strong> ${data.area || 'No especificado'}</li>
            <li><strong>Fecha de solicitud:</strong> ${data.timestamp || new Date().toLocaleString('es-MX')}</li>
            ${data.items ? `<li><strong>Items adicionales:</strong> Sí</li>` : ''}
          </ul>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin: 0 0 10px 0;">⏱️ Próximos pasos:</h4>
          <p style="margin: 0; color: #856404; font-size: 14px;">
            Nuestro equipo revisará su solicitud y se pondrá en contacto con usted
            a través del teléfono <strong>${data.phone || 'proporcionado'}</strong>
            para coordinar los detalles y tiempos de ejecución.
          </p>
        </div>

        <p style="font-size: 14px; color: #555; line-height: 1.6;">
          Si tiene alguna pregunta urgente o necesita hacer alguna modificación a su solicitud,
          puede contactarnos directamente la extensión 5147 y 5239.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            Gracias por utilizar nuestro portal de solicitudes.
          </p>
        </div>
      </div>

      <div style="background-color: #003C7D; color: white; padding: 15px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">
          <strong>Oficina de Audiovisual</strong><br>
          Portal de Solicitudes de la Oficina de Audiovisual
        </p>
        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">
          Este es un mensaje automático, por favor no responda a este correo.
        </p>
      </div>
    </div>
    `;

    // Enviar email de confirmación al solicitante
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      htmlBody: htmlBody,
      name: 'Oficina de Audiovisual'
    });

  } catch (emailError) {
    console.error('Error enviando email de confirmación:', emailError);
  }
}

// LOGIN
function authenticateUser(username, password) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
    if (!sheet) throw new Error('Hoja "Usuarios" no encontrada');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === username && row[1] === password) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            name: row[2] || username,
            message: 'Login exitoso'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Credenciales incorrectas'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Error de autenticación: ' + error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET PENDIENTES
function getPendientes() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Solicitudes');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var pendientes = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var estatus = row[headers.indexOf('ESTATUS')] || '';
      if (estatus.toLowerCase() !== 'asignado') {
        var solicitud = {
          rowIndex: i + 1,
          folio: row[headers.indexOf('Folio')]|| '',
          fecha: row[headers.indexOf('Timestamp')] || '',
          email: row[headers.indexOf('Email')] || '',
          nombre: row[headers.indexOf('Nombre')] || '',
          area: row[headers.indexOf('Area')] || '',
          telefono: row[headers.indexOf('Telefono')] || '',
          descripcion: row[headers.indexOf('Descripcion')] || '',
          tipo: row[headers.indexOf('TIPO')] || '',
          articulos: row[headers.indexOf('Items')] || '',
          estatus: estatus || 'Pendiente'
        };
        pendientes.push(solicitud);
      }
    }
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'data': pendientes }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


function getRegPendientes() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('REGISTROS');
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow < 13) {
      return ContentService
        .createTextOutput(JSON.stringify({ 'result': 'success', 'data': [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = sheet.getRange(12, 1, 1, lastCol).getValues()[0];
    const data = sheet.getRange(13, 1, lastRow - 12, lastCol).getValues();
    const pendientes = [];
    
    // CAMBIO CLAVE: Se ajustó el nombre del encabezado a "FOLIO" en mayúsculas.
    const folioIndex = headers.indexOf('FOLIO');
    let entregoIndex = headers.indexOf('ENTREGÓ');

    if (entregoIndex === -1) { entregoIndex = 13; } // Columna N
    if (folioIndex === -1) { 
      // Este error es el que estaba ocurriendo.
      throw new Error("No se encontró el encabezado 'FOLIO' en la fila 12 de la hoja 'REGISTROS'.");
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      const entregado = row[entregoIndex] || '';
      const folio = row[folioIndex] || '';
      const estado = (row[1] || '').toString().toUpperCase();

      if (folio !== '' && entregado === '' && estado !== 'CANCELADO') {
        const rowIndexInSheet = i + 13;

        const registro = {
          rowIndex: rowIndexInSheet,
          folio: folio,
          fecha: row[headers.indexOf('FECHA DE SOLICITUD')] || '',
          nombre: row[headers.indexOf('NOMBRE DE SOLICITANTE')] || '',
          area: row[headers.indexOf('AREA')] || '',
          telefono: row[headers.indexOf('EXTENSIÓN O TELÉFONO')] || '',
          descripcion: row[headers.indexOf('DESCRIPCIÓN DE TRABAJO')] || '',
          tipo: row[headers.indexOf('TIPO DE TRABAJO (DESC)')] || '',
          vale: row[headers.indexOf('CON VALE ')] || '',
          elaboro: row[headers.indexOf('ELABORÓ ')] || '',
          estatus: 'Pendiente'
        };
        pendientes.push(registro);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'data': pendientes }))
      .setMimeType(ContentService.MimeType.JSON);
  
  } catch (error) {
    Logger.log(`Error en getRegPendientes: ${error.toString()}`);
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ASIGNAR TAREA
function assignTaskToUser(taskData, assignedTo, comments, assignedBy) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const solicitudesSheet = ss.getSheetByName('Solicitudes');
    const pendientesSheet = ss.getSheetByName('Pendientes');

    if (!solicitudesSheet) throw new Error('Hoja "Solicitudes" no encontrada');

    const rowIndex = taskData.rowIndex;

    // Actualizar hoja de Solicitudes
    solicitudesSheet.getRange(rowIndex, 10).setValue(assignedTo); // TEAM
    if (comments) solicitudesSheet.getRange(rowIndex, 12).setValue(comments); // COMENTARIOS
    solicitudesSheet.getRange(rowIndex, 13).setValue('Asignado'); // ESTATUS

    // Agregar a hoja Pendientes
    if (pendientesSheet) {
      const ultimaFilaDestino = pendientesSheet.getLastRow();
      const nuevaFilaDestino = ultimaFilaDestino + 1;

      let ultimoId = 0;
      if (ultimaFilaDestino > 0) {
        const valorUltimoId = pendientesSheet.getRange(ultimaFilaDestino, 1).getValue();
        if (typeof valorUltimoId === 'number') ultimoId = valorUltimoId;
      }
      const nuevoId = ultimoId + 1;

      const folio = taskData.folio || '';
      const fechaOriginal = new Date(taskData.fecha);
      const fechaDestino = Utilities.formatDate(fechaOriginal, Session.getScriptTimeZone(), "yyyy-MM-dd");
      const horaDestino = Utilities.formatDate(fechaOriginal, Session.getScriptTimeZone(), "HH:mm:ss");

      const datosParaDestino = [
        nuevoId,                // No. (A)
        folio,                  // Folio (B)
        fechaDestino,           // FECHA DE SOLICITUD (C)
        horaDestino,            // HORA (D)
        taskData.nombre,        // PERSONA O AREA SOLICITANTE (E)
        taskData.descripcion,   // DESCRIPCION DEL TRABAJO (F)
        assignedTo,             // ASIGNADO A (G)
        '',                     // FECHA DE ENTREGA (H)
        '',                     // EN PROCESO (I)
        '',                     // TERMINADO (J)
        comments || ''          // COMENTARIOS (K)
      ];

      // Ahora sí son 11 columnas (A-K)
      pendientesSheet.getRange(nuevaFilaDestino, 1, 1, 11).setValues([datosParaDestino]);
    }

    // Notificación por correo
    const emailDestinatario = CORREOS_TEAM[assignedTo.toUpperCase()];
    let mensajeEmail = '';

    if (emailDestinatario) {
      try {
        const asunto = `Nueva Tarea Asignada - ${taskData.folio}`;
        const cuerpoMensajeHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #003C7D; color: white; padding: 20px; text-align: center;">
              <h2>Nueva Tarea Asignada</h2>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
              <p><strong>Folio:</strong> ${taskData.folio || ''}</p>
              <p>Hola <strong>${assignedTo}</strong>,</p>
              <p>Se te ha asignado una nueva tarea con los siguientes detalles:</p>
              <ul>
                <li><strong>Solicitante:</strong> ${taskData.nombre}</li>
                <li><strong>Área:</strong> ${taskData.area}</li>
                <li><strong>Fecha de Solicitud:</strong> ${new Date(taskData.fecha).toLocaleDateString('es-MX')}</li>
                <li><strong>Descripción:</strong> ${taskData.descripcion}</li>
                <li><strong>Artículos:</strong> ${taskData.articulos}</li>
                ${comments ? `<li><strong>Comentarios del Administrador:</strong> ${comments}</li>` : ''}
              </ul>
              <p>Por favor, revisa el sitio https://audiovisual-iner7.github.io/add/panel/' para más detalles.</p>
              <p><em>Asignado por: ${assignedBy}</em></p>
            </div>
          </div>
        `;

        MailApp.sendEmail({
          to: emailDestinatario,
          subject: asunto,
          htmlBody: cuerpoMensajeHtml,
          name: 'Oficina de Audiovisual'
        });
        mensajeEmail = ' Se envió notificación por correo.';
      } catch (emailError) {
        mensajeEmail = ' (Error al enviar correo de notificación)';
      }
    } else {
      mensajeEmail = ` (No se encontró correo para ${assignedTo})`;
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: `Tarea asignada exitosamente a ${assignedTo}.${mensajeEmail}`
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Error al asignar tarea: ' + error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getPendientesUsuario(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var nombre = (data.nombre || '').toString().trim().toLowerCase();
    
    // 1. Leer la hoja 'Solicitudes' y crear un mapa de Folio -> Área para una búsqueda rápida
    const solicitudesSheet = ss.getSheetByName('Solicitudes');
    const solicitudesData = solicitudesSheet.getDataRange().getValues();
    const areaMap = {};
    // Asumimos que Folio está en la columna 1 (A) y Área en la 5 (E) en la hoja Solicitudes
    // El bucle empieza en 1 para saltar la cabecera
    for (let i = 1; i < solicitudesData.length; i++) {
        const row = solicitudesData[i];
        const folio = row[0];
        const area = row[4];
        if (folio) {
            areaMap[folio] = area;
        }
    }

    // 2. Procesar la hoja 'Pendientes' como antes
    var sheet = ss.getSheetByName('Pendientes');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ result: 'success', pendientes: [] })).setMimeType(ContentService.MimeType.JSON);
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return ContentService.createTextOutput(JSON.stringify({ result: 'success', pendientes: [] })).setMimeType(ContentService.MimeType.JSON);

    var values = sheet.getRange(39, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    var pendientes = [];
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var rowIndexEnHoja = i + 2; // El número de fila real
      var entregado = (row[9] || '').toString().trim().toLowerCase(); // Columna J
      var persona = (row[6] || '').toString().trim().toLowerCase();   // Columna G
      
      if (entregado !== 'x' && persona === nombre) {
        const folioPendiente = row[1];
        pendientes.push({
          rowIndex: rowIndexEnHoja, // Usamos el número de fila real
          folio: folioPendiente,
          fecha: row[2],
          solicitante: row[4],
          area: areaMap[folioPendiente] || 'No encontrado', // <-- DATO AÑADIDO DESDE EL MAPA
          descripcion: row[5],
          comentarios: row[10] || ''
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ result: 'success', pendientes: pendientes })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log("Error en getPendientesUsuario: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSolicitudDetails(folio) {
  try {
    if (!folio) {
      throw new Error("No se proporcionó un folio.");
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Solicitudes");
    if (!sheet) {
      throw new Error("No se encontró la hoja 'Solicitudes'");
    }
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim());
    
    // Encontrar la fila que coincide con el folio
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[0].toString().trim() === folio.toString().trim()) {
        const result = {};
        headers.forEach((header, index) => {
          result[header] = row[index] instanceof Date ? row[index].toLocaleDateString('es-MX') : row[index];
        });
        return ContentService.createTextOutput(JSON.stringify({ success: true, data: result })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    throw new Error(`No se encontró ninguna solicitud con el folio: ${folio}`);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}


function buscarPorFolio(data) {
  try {
    const folio = data.folio;
    if (!folio) {
      return {"error": "No se proporcionó el folio"};
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Solicitudes");

    if (!sheet) {
      return {"error": "No se encontró la hoja 'Solicitudes'"};
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (row[0] && row[0].toString().trim() === folio.toString().trim()) {
        const resultado = {
          "folio": folio,
          "email": row[2] || '',      // Columna C
          "nombre": row[3] || '',     // Columna D
          "area": row[4] || '',       // Columna E
          "telefono": row[5] || '',   // Columna F
          "descripcion": row[6] || '',// Columna G <-- CAMBIO AQUÍ
          "archivos": row[8] || ''    // Columna I
        };
        return resultado;
      }
    }
    return {"error": `No se encontró ninguna solicitud con el folio: ${folio}`};
  } catch (error) {
    return {"error": `Error al buscar el folio: ${error.toString()}`};
  }
}





// GET SIMPLE
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 'status': 'API  ASIG funcionando correctamente' }))
    .setMimeType(ContentService.MimeType.JSON);
}



function findNextEmptyRow(sheet, startRow, keyColumnIndex) {
  const maxRows = sheet.getMaxRows();
  let targetRow = -1;

  // --- OPTIMIZACIÓN APLICADA ---
  // Lee toda la columna clave en una sola llamada para máxima velocidad.
  const range = sheet.getRange(startRow, keyColumnIndex, maxRows - startRow + 1, 1);
  const values = range.getValues();
  // --- FIN DE OPTIMIZACIÓN ---

  // Busca de abajo hacia arriba en el array de JavaScript (esto es casi instantáneo).
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i][0] === '' || values[i][0] === null) {
      targetRow = i + startRow; // Convierte el índice del array a número de fila real.
      break; 
    }
  }

  // Si no se encontró ninguna fila vacía, insertamos una nueva al principio del rango de datos.
  if (targetRow === -1) {
    sheet.insertRowBefore(startRow);
    targetRow = startRow;
  }
  
  Logger.log(`Siguiente fila vacía encontrada en la hoja "${sheet.getName()}": fila ${targetRow}`);
  return targetRow;
}

/**
 * Función auxiliar para obtener los encabezados de una hoja y crear un mapa de nombre a índice.
 * @param {Sheet} sheet El objeto de la hoja.
 * @param {number} headerRow El número de la fila donde se encuentran los encabezados.
 * @returns {Object} Un objeto que mapea el nombre del encabezado a su índice de columna (base 1).
 */
function getHeaderMap(sheet, headerRow) {
  const headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  headers.forEach((header, index) => {
    if (header) {
      const cleanHeader = header.toString().replace(/\n/g, ' ').trim().toUpperCase();
      headerMap[cleanHeader] = index + 1;
    }
  });
  return headerMap;
}


// CONFIRMAR ENTREGA DE TAREA
function deliverTask(folio, recibe, fechaEntregaStr, deliveredBy, observaciones) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const registrosSheet = ss.getSheetByName('REGISTROS');
    const pendientesSheet = ss.getSheetByName('PENDIENTES');
    
    const fechaEntrega = fechaEntregaStr;

    // --- 1. Actualizar la hoja REGISTROS ---
    if (registrosSheet) {
      const registrosHeaderMap = getHeaderMap(registrosSheet, 12);
      const registrosValues = registrosSheet.getDataRange().getValues();
      let rowFound = false;

      // Buscar la fila por el número de folio
      for (let i = 12; i < registrosValues.length; i++) {
        // Asumiendo que FOLIO está en la columna C
        if (registrosValues[i][registrosHeaderMap['FOLIO'] - 1] == folio) {
          const targetRow = i + 1;
          
          // Escribir en la columna 'ENTREGADO A' (que asumimos es 'RECIBIÓ' en el mapa)
          const entregadoAColumnName = 'ENTREGADO A'; // O 'RECIBIÓ' si así se llama
          if (registrosHeaderMap[entregadoAColumnName]) {
              registrosSheet.getRange(targetRow, registrosHeaderMap[entregadoAColumnName]).setValue(recibe);
          } else {
              Logger.log(`ADVERTENCIA: No se encontró la columna '${entregadoAColumnName}' en la hoja REGISTROS.`);
          }
          
          // Escribir la fecha de entrega
          if (registrosHeaderMap['FECHA DE ENTREGA']) {
            registrosSheet.getRange(targetRow, registrosHeaderMap['FECHA DE ENTREGA']).setValue(fechaEntrega);
          }
           if(registrosHeaderMap['ENTREGÓ']) {
            registrosSheet.getRange(targetRow, registrosHeaderMap['ENTREGÓ']).setValue(deliveredBy);
          }
          
          rowFound = true;
          break;
        }
      }
      if (!rowFound) Logger.log(`No se encontró el folio ${folio} en la hoja REGISTROS.`);
    }

    // --- 2. Actualizar la hoja PENDIENTES ---
    if (pendientesSheet) {
        const pendientesValues = pendientesSheet.getDataRange().getValues();
        let rowFoundPendientes = false;
        // Buscar la fila por el número de folio en la columna B (índice 1)
        for (let i = 1; i < pendientesValues.length; i++) {
            if (pendientesValues[i][1] == folio) {
                const targetRow = i + 1;
                pendientesSheet.getRange(targetRow, 8).setValue(fechaEntrega); // Columna H: FECHA DE ENTREGA
                pendientesSheet.getRange(targetRow, 10).setValue('x');        // Columna J: TERMINADO
                pendientesSheet.getRange(targetRow, 12).setValue(observaciones || ''); // Columna L: OBSERVACIONES
                rowFoundPendientes = true;
                break;
            }
        }
        if (!rowFoundPendientes) Logger.log(`No se encontró el folio ${folio} en la hoja PENDIENTES.`);
    }

    const infoSolicitud = buscarPorFolio({ folio: folio });
    if (infoSolicitud && !infoSolicitud.error) {
      const fechaEntregaDate = new Date(fechaEntregaStr + 'T06:00:00'); // Convertir a objeto Fecha
      
      // Enviar correo al solicitante
      sendDeliveryConfirmationEmail(
        infoSolicitud.email,
        folio,
        infoSolicitud.nombre,
        recibe,
        fechaEntregaDate
      );
      
      // Enviar correo a los administradores
      sendAdminDeliveryNotification(
        folio,
        infoSolicitud,
        recibe,
        fechaEntregaDate,
        deliveredBy
      );

    } else {
      Logger.log(`No se pudieron enviar correos para el folio ${folio} porque no se encontró la información del solicitante.`);
    }


    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: `Folio ${folio} marcado como entregado.` }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error en deliverTask: ' + error.toString() + ' Stack: ' + error.stack);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'Error al marcar la entrega: ' + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


/**
 * Función principal para crear una nueva solicitud desde el panel de administración.
 * Decide si usar un folio existente o generar uno nuevo.
 * @param {Object} data El objeto de datos recibido desde el frontend.
 */
function crearSolicitudAdmin(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let nuevoFolio;



    // 1. Decidir o generar el folio Y VALIDAR SI YA EXISTE
    if (data.folio && data.folio !== 'NUEVO') {
        nuevoFolio = data.folio;

        // --- INICIO DE LA NUEVA VALIDACIÓN ---
        // Antes de continuar, revisamos si el folio seleccionado ya existe en la hoja REGISTROS.
        const registrosSheetCheck = ss.getSheetByName('REGISTROS');
        if (registrosSheetCheck) {
            // Lee toda la columna C (FOLIO) desde la fila 13 para buscar coincidencias.
            const folioColumnValues = registrosSheetCheck.getRange("C13:C").getValues().flat();
            if (folioColumnValues.includes(nuevoFolio)) {
                // Si el folio ya existe, detenemos todo y mandamos un mensaje de error.
                return ContentService.createTextOutput(JSON.stringify({ 
                    success: false, 
                    message: `El folio ${nuevoFolio} ya ha sido registrado. Por favor, seleccione "Crear Nueva Solicitud" para generar uno nuevo, o elija un folio que no se haya procesado.` 
                })).setMimeType(ContentService.MimeType.JSON);
            }
        }
        // --- FIN DE LA VALIDACIÓN ---

    }  else {
        const clave = 'S-' + new Date().getFullYear() + "-";
        let folioCounter = PropertiesService.getScriptProperties().getProperty('folio') || '0';
        folioCounter = parseInt(folioCounter, 10) + 1;
        nuevoFolio = clave + folioCounter.toString();
        PropertiesService.getScriptProperties().setProperty('folio', folioCounter.toString()); 
    }

    let emailDelSolicitante = data.email || '';
    if (!emailDelSolicitante && data.folio && data.folio !== 'NUEVO') {
        const infoSolicitud = buscarPorFolio({ folio: data.folio });
        if (infoSolicitud && !infoSolicitud.error) {
            emailDelSolicitante = infoSolicitud.email;
        }
    }

    
    const fechaSolicitud = data.fechaSolicitud; // Se mantiene como texto 'YYYY-MM-DD'
    const fechaEntrega = data.fechaEntrega || '';   // Se mantiene como texto o vacío

    const mes = new Date(fechaSolicitud + 'T06:00:00').toLocaleString('es-MX', { month: 'short' }).toUpperCase().replace('.', '');
      
    // 2. Procesar Hoja "REGISTROS"
    const registrosSheet = ss.getSheetByName('REGISTROS');
    if (!registrosSheet) throw new Error("No se encontró la hoja 'REGISTROS'.");
    const registrosHeaderMap = getHeaderMap(registrosSheet, 12);
    const registrosKeyColumnName = 'FECHA DE SOLICITUD';
    if (!registrosHeaderMap[registrosKeyColumnName]) {
      throw new Error(`No se pudo encontrar el encabezado '${registrosKeyColumnName}' en la fila 12 de la hoja 'REGISTROS'.`);
    }
    const targetRow = findNextEmptyRow(registrosSheet, 13, registrosHeaderMap[registrosKeyColumnName]);
    const registrosRowData = new Array(registrosSheet.getLastColumn()).fill('');
    
    // Mapeo de datos para REGISTROS...
    registrosRowData[registrosHeaderMap['FOLIO'] - 1] = nuevoFolio;
    registrosRowData[registrosHeaderMap['MES'] - 1] = mes;
    registrosRowData[registrosHeaderMap['FECHA DE SOLICITUD'] - 1] = fechaSolicitud;
    registrosRowData[registrosHeaderMap['FECHA DE ENTREGA'] - 1] = fechaEntrega;
    registrosRowData[registrosHeaderMap['NOMBRE DE SOLICITANTE'] - 1] = data.nombreSolicitante;
    registrosRowData[registrosHeaderMap['AREA'] - 1] = data.area;
    registrosRowData[registrosHeaderMap['ELABORÓ'] - 1] = data.elaboro;
    registrosRowData[registrosHeaderMap['DESCRIPCIÓN DE TRABAJO'] - 1] = data.descripcion;
    registrosRowData[registrosHeaderMap['EXTENSIÓN O TELÉFONO'] - 1] = data.telefono || '';
    registrosRowData[registrosHeaderMap['TIPO DE TRABAJO'] - 1] = data.tipoTrabajo || 'NA';
    registrosRowData[registrosHeaderMap['EMAIL'] - 1] = emailDelSolicitante;

    if (registrosHeaderMap['REGISTRÓ']) {
        registrosRowData[registrosHeaderMap['REGISTRÓ'] - 1] = data.asignadoPor;
    }

    const totalFormula = `=SUM(R${targetRow}:AY${targetRow})`;
    registrosRowData[registrosHeaderMap['TOTAL'] - 1] = totalFormula;
    const descColumnName = 'TIPO DE TRABAJO (DESC)';
    if (registrosHeaderMap[descColumnName]) {
      const vlookupFormula = `=VLOOKUP($O${targetRow},TT!A:B,2,FALSE)`;
      registrosRowData[registrosHeaderMap[descColumnName] - 1] = vlookupFormula;
    }
    if (data.vale === 'con_vale') registrosRowData[registrosHeaderMap['CON VALE'] - 1] = 'x';
    if (data.vale === 'vale_pendiente') registrosRowData[registrosHeaderMap['VALE PENDIENTE'] - 1] = 'x';
    if (data.vale === 'no_requiere') registrosRowData[registrosHeaderMap['NO REQUIERE VALE'] - 1] = 'x';
    
    const registrosAggregator = {};

    data.servicios.forEach(s => {
      const sName = s.name.toUpperCase();
      
      if (sName === 'IMPRESIONES SIN HOJAS') {
        const colNameImpresiones = `IMPRESIONES ${s.tamaño}`.toUpperCase();
        registrosAggregator[colNameImpresiones] = (registrosAggregator[colNameImpresiones] || 0) + s.quantity;
      } 
      else if (sName === 'COPIAS') {
        const colNameHojas = `HOJAS ${s.tamaño}`.toUpperCase();
        registrosAggregator[colNameHojas] = (registrosAggregator[colNameHojas] || 0) + s.numHojas;
        if (!data.duplicadorDigital) {
          const colNameImpresiones = `IMPRESIONES ${s.tamaño}`.toUpperCase();
          registrosAggregator[colNameImpresiones] = (registrosAggregator[colNameImpresiones] || 0) + s.quantity;
        }
      } 
      else if (s.hasOwnProperty('numHojas') && sName.includes('IMPRESION')) {
        const colNameImpresiones = s.name.toUpperCase();
        const colNameHojas = s.name.replace('IMPRESIONES', 'HOJAS').toUpperCase();
        registrosAggregator[colNameImpresiones] = (registrosAggregator[colNameImpresiones] || 0) + s.quantity;
        registrosAggregator[colNameHojas] = (registrosAggregator[colNameHojas] || 0) + s.numHojas;
      }
      else {
        // Para otros servicios que solo registran cantidad (ej. ENGARGOLADO, HOJAS, PLOTTER)
        const colName = s.name.toUpperCase();
        registrosAggregator[colName] = (registrosAggregator[colName] || 0) + s.quantity;
      }
    });

    // Ahora, escribir los valores agregados en la fila de datos
    for (const key in registrosAggregator) {
      if (registrosHeaderMap[key]) {
        registrosRowData[registrosHeaderMap[key] - 1] = registrosAggregator[key];
      }
    }


    registrosSheet.getRange(targetRow, 1, 1, registrosRowData.length).setValues([registrosRowData]);
    Logger.log(`Datos escritos en la hoja "REGISTROS" en la fila ${targetRow}`);


    // --- 3. Procesar Hoja "TPAPEL" ---
    const tpapelSheet = ss.getSheetByName('TPAPEL');
    if (!tpapelSheet) throw new Error("No se encontró la hoja 'TPAPEL'.");
    const tpapelHeaderMap = getHeaderMap(tpapelSheet, 4); // Asumiendo fila 4
    const tpapelAggregator = {};
    let hayMateriales = false;
    
    data.servicios.forEach(s => {
      const sName = s.name.toUpperCase();
      let cantidadHojas = s.hasOwnProperty('numHojas') ? s.numHojas : s.quantity;

      if (sName === 'COPIAS') {
          hayMateriales = true;
          const formatoHoja = `HOJAS ${s.tamaño}`.toUpperCase();
          tpapelAggregator[formatoHoja] = (tpapelAggregator[formatoHoja] || 0) + s.numHojas;
          tpapelAggregator['BOND'] = (tpapelAggregator['BOND'] || 0) + s.numHojas;
      } 
      else if (sName.includes('REUSO')) {
          hayMateriales = true;
          tpapelAggregator['HOJAS DE REUSO'] = (tpapelAggregator['HOJAS DE REUSO'] || 0) + cantidadHojas;
      }
      else if (s.hasOwnProperty('tipoPapel')) {
          hayMateriales = true;
          const formatoHoja = (sName.includes('CARTA') ? 'HOJAS CARTA' : sName.includes('OFICIO') ? 'HOJAS OFICIO' : sName.includes('TABLOIDE') ? 'HOJAS TABLOIDE' : 'HOJAS PAPEL ESPECIAL').toUpperCase();
          tpapelAggregator[formatoHoja] = (tpapelAggregator[formatoHoja] || 0) + cantidadHojas;
          // Se convierte el tipo de papel a MAYÚSCULAS antes de usarlo como clave
          tpapelAggregator[s.tipoPapel.toUpperCase()] = (tpapelAggregator[s.tipoPapel.toUpperCase()] || 0) + cantidadHojas;
      }
      
      if (s.hasOwnProperty('tipoRollo')) {
        hayMateriales = true;
        tpapelAggregator['CENTÍMETROS PLOTTER'] = (tpapelAggregator['CENTÍMETROS PLOTTER'] || 0) + s.quantity;
        // Se convierte el tipo de rollo a MAYÚSCULAS antes de usarlo como clave
        tpapelAggregator[s.tipoRollo.toUpperCase()] = (tpapelAggregator[s.tipoRollo.toUpperCase()] || 0) + s.quantity;
      }
    });



    if (hayMateriales) {
      const targetRowTpapel = findNextEmptyRow(tpapelSheet, 5, 2); 
      tpapelSheet.getRange(targetRowTpapel, 2).setValue(nuevoFolio);
      for (const key in tpapelAggregator) {
        if (tpapelHeaderMap[key]) {
          const colIndex = tpapelHeaderMap[key];
          tpapelSheet.getRange(targetRowTpapel, colIndex).setValue(tpapelAggregator[key]);
        } else {
          Logger.log(`ADVERTENCIA: No se encontró el encabezado "${key}" en la hoja TPAPEL.`);
        }
      }
    }

    // --- 4. Procesar Hoja "DUPLICADOR DIGITAL" (Condicional) ---
    if (data.duplicadorDigital) {
      const dupSheet = ss.getSheetByName('DUPLICADOR DIGITAL');
      if (!dupSheet) throw new Error("No se encontró la hoja 'DUPLICADOR DIGITAL'.");
      
      const dupHeaderMap = getHeaderMap(dupSheet, 4); // Asumiendo encabezados en fila 4, ajustar si es necesario
      const dupKeyColumn = 3; // Columna C para el FOLIO

      const targetRowDup = findNextEmptyRow(dupSheet, 5, dupKeyColumn); // Empezar a buscar desde la fila 5

      // Escribir celda por celda SOLO los datos necesarios
      dupSheet.getRange(targetRowDup, dupKeyColumn).setValue(nuevoFolio); // Folio en Columna C

      if (dupHeaderMap['MASTERS']) {
        dupSheet.getRange(targetRowDup, dupHeaderMap['MASTERS']).setValue(data.cantidadMasters);
      }
      if (dupHeaderMap['CLAVE DE FORMATO']) {
        dupSheet.getRange(targetRowDup, dupHeaderMap['CLAVE DE FORMATO']).setValue(data.clave || '');
      }
      
      // Busca el servicio 'COPIAS' y usa su 'tamaño' para llenar las columnas correctas
      data.servicios.forEach(s => {
        const sName = s.name.toUpperCase();
        if (sName === "COPIAS") {
          const tamaño = s.tamaño.toUpperCase(); // CARTA, OFICIO, o TABLOIDE
          const colNameCopias = `COPIAS ${tamaño}`; // ej: "COPIAS CARTA"
          const colNameHojas = `HOJAS ${tamaño}`;   // ej: "HOJAS CARTA"

          if (dupHeaderMap[colNameCopias]) {
            dupSheet.getRange(targetRowDup, dupHeaderMap[colNameCopias]).setValue(s.quantity);
          }
          if (dupHeaderMap[colNameHojas]) {
            dupSheet.getRange(targetRowDup, dupHeaderMap[colNameHojas]).setValue(s.numHojas);
          }
        }
      });
    }
    
    // --- 5. Procesar Hoja "AUDIOGRABACIONES" (Condicional) ---
    const audioService = data.servicios.find(s => s.name.toUpperCase() === 'AUDIOGRABACIÓN');
    if (audioService) {
        const audioSheet = ss.getSheetByName('AUDIOGRABACIONES');
        if (!audioSheet) throw new Error("No se encontró la hoja 'AUDIOGRABACIONES'.");
        
        // CORRECCIÓN: Leer encabezados de la fila 4
        const audioHeaderMap = getHeaderMap(audioSheet, 4);
        const audioKeyColumn = 3; // Columna C para el FOLIO

        // Empezar a buscar desde la fila 5 hacia abajo
        const targetRowAudio = findNextEmptyRow(audioSheet, 5, audioKeyColumn);

        // Escribir celda por celda
        // 1. Poner el folio en la columna C
        audioSheet.getRange(targetRowAudio, audioKeyColumn).setValue(nuevoFolio);

        // 2. Poner un "1" en la columna del comité seleccionado
        const selectedCommittee = audioService.comite.toUpperCase();
        
        if (audioHeaderMap[selectedCommittee]) {
            const colIndex = audioHeaderMap[selectedCommittee];
            audioSheet.getRange(targetRowAudio, colIndex).setValue(1);
        } else if (audioHeaderMap['OTROS']) {
            // Si no se encuentra el comité, se marca en "OTROS" como fallback
            const colIndex = audioHeaderMap['OTROS'];
            audioSheet.getRange(targetRowAudio, colIndex).setValue(1);
            Logger.log(`ADVERTENCIA: No se encontró el encabezado del comité "${selectedCommittee}". Se marcó en la columna "OTROS".`);
        }
    }

    // --- 6. Finalizar y Responder ---
    /* const emailDestinatario = CORREOS_TEAM[data.elaboro.toUpperCase()];
    if (emailDestinatario) {
      MailApp.sendEmail(emailDestinatario, `Nueva Tarea Registrada - ${nuevoFolio}`, `Se ha registrado una nueva tarea a tu nombre desde el panel por ${data.asignadoPor}.\n\nSolicitante: ${data.nombreSolicitante}\nDescripción: ${data.descripcion}`);
    } */

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Solicitud registrada con éxito.', folio: nuevoFolio })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error en crearSolicitudAdmin: ' + error.toString() + ' Stack: ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Error al crear la solicitud: ' + error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Envía un correo de confirmación de entrega al solicitante original.
 */
function sendDeliveryConfirmationEmail(recipientEmail, folio, requesterName, recibe, fechaEntrega) {
  try {
    if (!recipientEmail) {
      Logger.log(`No se envió correo para el folio ${folio} porque no se encontró un email de destinatario.`);
      return;
    }

    const subject = `✅ Tu Solicitud ${folio} ha sido Completada`;
    const fechaFormateada = fechaEntrega.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
        <p>Estimado/a <strong>${requesterName || 'Usuario'}</strong>,</p>
        <p>Te informamos que tu solicitud con folio <strong>${folio}</strong> ha sido marcada como completada y el trabajo ha sido entregado a <strong>${recibe}</strong> el día <strong>${fechaFormateada}</strong>.</p>
        <p>Por favor, si tienes alguna observación o comentario, puedes responder directamente a este correo.</p>
        <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #6c757d;">
            <p style="margin: 0; font-size: 14px; color: #495057;">
                <strong>Importante:</strong> Si no recibimos respuesta en un plazo de 3 días hábiles, daremos por entendido que el servicio ha sido aceptado y procederemos a cerrar el folio.
            </p>
        </div>
        <p style="margin-top: 25px;">Saludos cordiales.</p>
    </div>
    `;

    MailApp.sendEmail({ to: recipientEmail, subject: subject, htmlBody: htmlBody, name: 'Oficina de Audiovisual' });
    Logger.log(`Correo de confirmación de entrega enviado a ${recipientEmail} para el folio ${folio}.`);

  } catch (error) {
    Logger.log(`Error al enviar el correo de confirmación de entrega para el folio ${folio}: ${error.toString()}`);
  }
}


/**
 * Envía una notificación interna a los administradores sobre la entrega de un trabajo.
 */
function sendAdminDeliveryNotification(folio, infoSolicitud, recibe, fechaEntrega, deliveredBy) {
  try {
    const recipients = NOTIFICATION_EMAILS.join(',');
    if (!recipients) return;

    const subject = `[Notificación Interna] Entrega Completada - Folio ${folio}`;
    const fechaFormateada = fechaEntrega.toLocaleDateString('es-MX', { dateStyle: 'full' });

    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #003C7D; color: white; padding: 20px; text-align: center;">
            <h2>Notificación de Entrega</h2>
        </div>
        <div style="padding: 20px;">
            <p>Se ha registrado la entrega del siguiente trabajo:</p>
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                <tr style="background-color: #f2f2f2;"><th style="padding: 8px; width: 30%;">Folio</th><td style="padding: 8px;">${folio}</td></tr>
                <tr><th style="padding: 8px;">Solicitante</th><td style="padding: 8px;">${infoSolicitud.nombre}</td></tr>
                <tr style="background-color: #f2f2f2;"><th style="padding: 8px;">Área</th><td style="padding: 8px;">${infoSolicitud.area}</td></tr>
                <tr><th style="padding: 8px; vertical-align: top;">Descripción</th><td style="padding: 8px;">${infoSolicitud.descripcion}</td></tr>
                <tr style="background-color: #f2f2f2;"><th style="padding: 8px;">Entregado a</th><td style="padding: 8px;"><strong>${recibe}</strong></td></tr>
                <tr><th style="padding: 8px;">Fecha de Entrega</th><td style="padding: 8px;">${fechaFormateada}</td></tr>
                <tr style="background-color: #f2f2f2;"><th style="padding: 8px;">Entregado por</th><td style="padding: 8px;">${deliveredBy}</td></tr>
            </table>
        </div>
    </div>
    `;

    MailApp.sendEmail({ to: recipients, subject: subject, htmlBody: htmlBody, name: 'Sistema de Registros' });
    Logger.log(`Notificación de entrega para el folio ${folio} enviada a los administradores.`);

  } catch (error) {
    Logger.log(`Error al enviar la notificación de entrega a administradores para el folio ${folio}: ${error.toString()}`);
  }
}


/**
 * Obtiene todos los trabajos pendientes de la hoja "Pendientes"
 * y los devuelve agrupados por la persona asignada.
 * @returns {ContentService} Un objeto JSON con los datos agrupados.
 */
function getAllPendientes() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PENDIENTES');
    if (!sheet) {
      throw new Error("La hoja 'PENDIENTES' no fue encontrada.");
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[4]; // Asumimos que la primera fila son los encabezados

    // Encontrar dinámicamente los índices de las columnas que nos interesan
    const asignadoAIndex = headers.indexOf('ASIGNADO A');
    const terminadoIndex = headers.indexOf('TERMINADO');
    const folioIndex = headers.indexOf('FOLIO');
    const fechaIndex = headers.indexOf('FECHA DE SOLICITUD');
    const solicitanteIndex = headers.indexOf('PERSONA O AREA SOLICITANTE');
    const descripcionIndex = headers.indexOf('DESCRIPCION DEL TRABAJO');

    if (asignadoAIndex === -1 || terminadoIndex === -1) {
        throw new Error("No se encontraron las columnas 'ASIGNADO A' o 'TERMINADO' en la hoja 'PENDIENTES'.");
    }

    const pendientesAgrupados = {};

    // Empezamos en 1 para saltarnos la fila de encabezados
    for (let i = 39; i < data.length; i++) {
      const row = data[i];
      const asignadoA = row[asignadoAIndex];
      const terminado = row[terminadoIndex] ? row[terminadoIndex].toString().trim().toLowerCase() : '';

      // Procesamos la fila solo si está asignada a alguien y no está marcada como terminada
      if (asignadoA && terminado !== 'x') {
        
        const pendiente = {
          folio: row[folioIndex] || 'N/A',
          fecha: row[fechaIndex] instanceof Date ? row[fechaIndex].toISOString() : (row[fechaIndex] || ''),
          solicitante: row[solicitanteIndex] || '',
          descripcion: row[descripcionIndex] || ''
        };

        // Si es la primera vez que vemos a esta persona, creamos su entrada en el objeto
        if (!pendientesAgrupados[asignadoA]) {
          pendientesAgrupados[asignadoA] = [];
        }
        
        // Añadimos el pendiente a la lista de la persona correspondiente
        pendientesAgrupados[asignadoA].push(pendiente);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: pendientesAgrupados }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error en getAllPendientes: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}