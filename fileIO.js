// fileIO.js

// module of functions to support drop and fileIO of data into and out of an html page

class FileIO {

  /**
   * Generic Event handler for ondrop
   * @param {object} event 
   * @param {function} fnImportToUI // see FileIO.as_dropFile()
   */
  static async as_eh_dropFile(event, fnImportToUI) {
    event.preventDefault(); // prevents drop from going to new tab in browser
    FileIO.as_dropFile(event.dataTransfer.files[0], fnImportToUI);
  }
  
  /**
   * Called like this:
   * <input type="file" onchange="FileIO.importFromFile(this, fnImportToUI);">
   * or attach an event listener that does the equivalent.
   * @param {HTMLElement} elFileInput
   * @param {function} fnImportToUI // see FileIO.as_dropFile
   */
  static importFromFile(elFileInput, fnImportToUI) {
    const fileHandle = elFileInput.files[0];
    if (fileHandle) {
      FileIO.as_dropFile(fileHandle, fnImportToUI);
    }
  }
  
  /**
   * Worker for drag/drop operation - called by as_eh_dropFile() or directly
   * @param {number} fileHandle // FileHandle of dropped file
   * @param {function} fnImportToUI
   * Where:
   * fnImportToUI(fileName, sData)
   *   Uses sData to place the read data into the UI or DB
   *   Uses fileName to present to the user a successful load from fileName
   *   filename == '' on error.
   */
  static async as_dropFile(fileHandle, fnImportToUI) {
    var reader = new FileReader();
    reader.onload = function(readerLoadedEvent) {
      const sData = readerLoadedEvent.target.result;
      fnImportToUI(fileHandle.name, sData);
    };
    try {
      reader.readAsText(fileHandle, "UTF-8");
    } catch (e) {
      fnImportToUI('', e.message);
    }
  }
  
  /**
   * Used to import after a call to window.showOpenFilePicker();
   * Give the returned fileHandle to this API.  
   * This is because calling this from an async function as_
   * (like this one) breaks the "user gesture" security context.
   * @param {*} fileHandle 
   * @param {*} fnImportToUI // Takes (fileName, sData) or ('', sError)
   */
  static async as_importFromFileOpenPicker(fileHandle, fnImportToUI) {
    if (!fileHandle.getFile) {
      fileHandle = fileHandle[0];
    }
    const file = await fileHandle.getFile();
    const reader = new FileReader();
    reader.addEventListener('loadend', (event) => {
      fnImportToUI(file.name, event.target.result)
    });
    reader.readAsText(file);
  }
  
  /**
   * callable from a button click
   * @param {fileHandle} fileHandle // as returned from showSaveFilePicker()
   * @param {string} sData 
   * @param {function} fnExportToUI 
   * fnExportToUI(fileName, sData_or_sError)
   * fileName == '' on error
   */
  static as_exportToFile = async (fileHandle, sData, fnExportToUI) => {
    try {
      await FileIO.as_writeFile(fileHandle, sData);
      fnExportToUI(fileHandle.name, sData);
    } catch(e) {
      fnExportToUI('', e.message);
    }
  }

  static async as_writeFile(fileHandle, sData) {
    const writable = await fileHandle.createWritable();
    await writable.write(sData);
    await writable.close();
  }

}; // class FileIO

