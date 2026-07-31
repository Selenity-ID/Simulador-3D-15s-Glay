function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Simulador 3D Glaymar')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Escanea recursivamente la carpeta y devuelve un diccionario:
 * { "Ruta/Archivo.ext": "ID_DRIVE" }
 */
function getDriveFolderDictionary(rootFolderId) {
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  const dict = {};
  
  function scanFolder(folder, currentPath) {
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const path = currentPath + file.getName();
      dict[path] = file.getId();
    }
    
    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      const subfolder = subfolders.next();
      scanFolder(subfolder, currentPath + subfolder.getName() + '/');
    }
  }
  
  scanFolder(rootFolder, '');
  return {
    dictionary: dict,
    token: ScriptApp.getOAuthToken()
  };
}

function getAudioAsBase64(fileId) {
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  const base64Data = Utilities.base64Encode(blob.getBytes());
  const mimeType = blob.getContentType();
  return "data:" + mimeType + ";base64," + base64Data;
}
