// tables.js

// requires genSort()

/*
  A table is an array of row arrays where the first row array 
  contains unique heading names followed by data rows.
  All sub-rows are of the same length.
  By convention, all table variable names start with "tbl".
 */

class Table {
  /**
   * @param {table} tbl
   * @returns An object who's keys are the first row headings
   * and who's values are indexes into that key's column.
   */
  static getTableColIndexesObject(tbl) {
    console.assert(Array.isArray(tbl));
    console.assert(Array.isArray(tbl[0]));
    return Table.getHeadingsToIndexObject(tbl[0]);
  }

  /**
   * Used to create an (R)ow (I)ndex (O)bject which allows easy lookup of 
   * columns in a table row.  Headings are the keys, indexes are the values.
   * @param {*[]} aHeadings 
   * @returns object who's keys are the headings and values are indexes
   */
  static getHeadingsToIndexObject(aHeadings) {
    const oIndexes = {};
    aHeadings.forEach(
      function (heading, idx) {
        console.assert(typeof (heading) == 'string');
        oIndexes[heading] = idx;
      }
    );
    return oIndexes;
  }
  
  /**
   * Check if the table contains rows with the specified values.
   *
   * @param {Array} tbl - the table to search
   * @param {Object} oValues - the values to search for
   * @param {Function} fnSort - the sorting function (optional)
   * @return {boolean} true if the table contains the values, false otherwise
   */
  static doesTableContain(tbl, oValues, fnSort = genSort) {
    console.assert(Array.isArray(tbl));
    console.assert(Array.isArray(tbl[0]));
    const ri = Table.getTableColIndexesObject(tbl);
    const aHeadings = Object.keys(oValues);
    return !!tbl.find(
      function (aRow, idx) {
        if (idx == 0) return false;
        let fMatch = true;
        aHeadings.forEach(
          function (heading) {
            if (fnSort(oValues[heading], aRow[ri[heading]]) != 0) {
              fMatch = false;
            }
          }
        );
        return fMatch;
      }
    );
  }
  
  /**
   * This returns a new table with only the aHeadingsToKeep columns present.
   * This can be used to re-order columns as well.
   * @param {*[][]} tblIn an array of arrays who's first row are the headings
   * @param {string[]} aHeadingsToKeep The array of column headings to keep
   * @param {*=} missingValue: Defaults to '' but can be whatever to insert
   * should the headingsToKeep include a column not in tbl which creates
   * a new column.
   * @returns {*[][]} a new table with only and all the specified columns.
   * Columns whos heading is not found in the given table are created and
   * the data rows are filled with the given default value.
   * Note: to create columns with values derived from the table, consider
   * using Table.deriveNewColumnFromRows.
   */
  static filterTableColumns(
    tblIn, 
    aHeadingsToKeep, 
    missingValue = '') {
    console.assert(tblIn.length >= 1); // must have a heading
    const riFrom = Table.getTableColIndexesObject(tblIn);
    const riTo = Table.getTableColIndexesObject([ aHeadingsToKeep ]);
    const tblOut = tblIn.map(
      function (aRowFrom, iRow) {
        const aRowTo = [];
        aHeadingsToKeep.forEach(
          function (headingToKeep) {
            if (undefined == riFrom[headingToKeep]) {
              // keeping a heading not in the table
              aRowTo[riTo[headingToKeep]] = iRow == 0 ? headingToKeep : missingValue;
            } else {
              aRowTo[riTo[headingToKeep]] = iRow == 0 ? headingToKeep : aRowFrom[riFrom[headingToKeep]];
            }
          }
        );
        return aRowTo;
      }
    );
    return tblOut;
  }
  
  /**
   * @param {table} tbl
   * @param {function=} fnRowFilter a function that takes a table row and
   * returns true if the row is to be kept.
   * It may be the Table.stdFilterTableRowFilter function which also uses
   * the oValues and fnCompare parameters.
   * fnRowFilter(aRow, ri, oValues, fnCompare)
   * @param {object=} oValues Optional parameter passed onto fnRowFilter()
   * { colName: compareValue }
   * @param {function=} fnCompare - optional sort function to compare values
   * passed onto fnRowFilter
   * fnRowFilter(aRow, oIndexs, oValues)
   * @returns a new table containing only the kept and sorted rows .
   */
  static filterTableRows(
    tbl,
    fnRowFilter = Table.stdFilterTableRowFilter,
    oValues = null,
    fnCompare = genSort
  ) {
    if (tbl.length < 2) {
      return tbl; // nothing to do with an empty table.
    }
    console.assert(Array.isArray(tbl));
    console.assert(Array.isArray(tbl[0]));
  
    const ri = Table.getHeadingsToIndexObject(tbl[0]);
    const tblOut = [ tbl[0] ]; // headings
    for (let i = 1; i < tbl.length; i++) {
      const aRow = tbl[i];
      console.assert(Array.isArray(aRow));
      console.assert(aRow.length == tbl[0].length);
      if (fnRowFilter(aRow, ri, oValues, fnCompare)) {
        tblOut.push(aRow);
      }
    }
    return tblOut;
  }
  
  /**
   * Filters a table row based on given values and a comparison function.
   *
   * @param {*[]} aRow - the row to filter
   * @param {{}} ri - the index of the row
   * @param {{}} oValues - the values to compare against
   * @param {function=} fnCompare(value, rowValue) - the comparison function
   * @returns {boolean} true if the row matches the filter, false otherwise
   */
  static stdFilterTableRowFilter(
    aRow, 
    ri, 
    oValues, 
    fnCompare=genSort) 
  {
    let fMatch = true;
    console.assert(ri);
    console.assert(typeof (ri) == 'object');
    console.assert(oValues);
    console.assert(typeof (oValues) == 'object');
    console.assert(fnCompare);
    console.assert(typeof (fnCompare) == 'function');
    Object.entries(oValues).forEach(
      function (aKV) {
        if (undefined != oValues[aKV[0]]) { // only compare values given
          if (fnCompare(oValues[aKV[0]], aRow[ri[aKV[0]]]) != 0) {
            fMatch = false;
          }
        }
      }
    );
    return fMatch;
  }

  /**
   * Returns a copy of all the filtered rows in a given table
   * @param {[][]} tbl 
   * @param {=function} fnFilter(aRow) (null == return all rows)
   * @returns {[][]} all appropriate rows in the given table or 
   * null if none found.
   */
  static rowsFromTable(tbl, fnFilter=null) {
    if (tbl.length < 2) {
      return null;
    }
    let aRows = tbl.deepCopy();
    aRows.splice(0, 1)
    if (fnFilter) {
      aRows = aRows.filter(
        fnFilter
      )
    }

    if (!aRows.length) {
      aRows = null;
    }

    return aRows;
  }

  /**
   * Replaces the row that fits the filter with aNewRow
   * @param {[][]} tbl - table to search and replace row
   * @param {[]} aNewRow - row to replace found row
   * @param {function} fnFilter - filter function
   * @returns {fReplaced} - false if the filter failed to 
   * find just one matching row or no matching row 
   * was found.
   */
  static replaceRow(tbl, aNewRow, fnFilter) {
    let moreThanOneRowMatched = false;
    let idxFound = -1;
    tbl.filter(
      function (aRow, idx) {
        console.assert(aRow.length == aNewRow.length);
        if (idx == 0) {
          return false; // skip headings
        }
        if (!moreThanOneRowMatched && fnFilter(aRow)) {
          if (idxFound == -1) {
            idxFound = idx;
          } else {
            moreThanOneRowMatched = true;
          }
        }
      }
    );
    if (moreThanOneRowMatched || idxFound == -1) {
      return false;
    }
    tbl[idxFound] = aNewRow;
    return true;
  }

  // some common sort functions
  
  /**
   * @param {*[]]} rowA
   * @param {*[]} rowB
   * @returns 0 if rows are exactly the same
   */
  static defaultRowSort(rowA, rowB) {
    console.assert(Array.isArray(rowA));
    console.assert(Array.isArray(rowB));
    return genSort(JSON.stringify(rowA), JSON.stringify(rowB));
  }
  
  /**
   * @param {*[]} rowA
   * @param {*[]} rowB
   * @returns 0 if rows are exactly the same but case insensitive
   */
  static caseInsensitiveRowSort(rowA, rowB) {
    console.assert(Array.isArray(rowA));
    console.assert(Array.isArray(rowB));
    return caseInsensitiveSort(JSON.stringify(rowA), JSON.stringify(rowB));
  }
  
  /**
   * @param {*[][]} tbl
   * @param {function=} fnSortRows row comparison function
   * Default is Table.defaultRowSort()
   * @returns a new table who's rows are sorted IAW fnSortRows
   * The original tbl is not changed
   */
  static sortTableRows(tbl, fnSortRows ) {
    tbl = deepCopy(tbl);  // deepCopy
    const aHeadings = tbl.shift(); // just the data maam
    if (tbl.length) {
      tbl.sort(fnSortRows);
    }
    tbl.unshift(aHeadings);
    return tbl;
  }

  /**
   * @param {array} tbl
   * @param {function=} fnSortRows row comparison function
   * Default is Table.defaultRowSort()
   * @returns a new table with duplicate rows removed.
   * if the table has less than 2 data rows, the input table is returned.
   */
  static getUniqueTable(tbl, fnSortRows = Table.defaultRowSort) {
    console.assert(tbl.length >= 1); // must have a heading
    if (tbl.length < 3) {
      return tbl; // only one data row or less - no sort needed
    }
    const tblSorted = Table.sortTableRows(tbl, fnSortRows);
    const tblUnique = [];
    tblSorted.forEach(
      function (aRow, idx) {
        if (idx < 2 || (fnSortRows(tblSorted[idx - 1], aRow) != 0)) {
          tblUnique.push(aRow);
        }
      }
    );
    return tblUnique;
  }
  
  /**
   * @param {[][]} tbl1
   * @param {*[][]} tbl2
   * @param {function=} fnSortRows row comparison function
   * for the unique union of both tables rows.
   * Default=Table.defaultRowSort()
   * @returns a sorted table that contains only the columns who's
   * Headings are common to both tables with the unique union 
   * of both tables rows.
   */
  static mergeTables(tbl1, tbl2, fnSortRows = Table.defaultRowSort) {
    const aHeadings1 = tbl1[0];
    const aHeadings2 = tbl2[0];
    const aMergedHeadings = [];
    aHeadings1.forEach(
      function (heading1) {
        if (aHeadings2.includes(heading1)) {
          aMergedHeadings.push(heading1);
        }
      }
    );
    const tblFiltered1 = Table.filterTableColumns(tbl1, aMergedHeadings);
    const tblFiltered2 = Table.filterTableColumns(tbl2, aMergedHeadings);
    tblFiltered2.shift();
    const tblMerged = tblFiltered1.concat(tblFiltered2);
    return Table.getUniqueTable(tblMerged, fnSortRows);
  }

  /**
   * Transforms the given table of headings and data rows into the HTML for 
   * rendering the table.
   * @param {*[][]} tbl - the table to render
   * @param {string=} id - id of the table or '' to not have one.
   * @param {string=} tblClass - the class(s) to render with the <taable> tag.
   * @param {function=} fnCellRenderer - a function to render cells
   * which takes (sHeading, value) and returns the HTML to render.
   * By default this function simply returns value.toString();
   * @param {function=} fnHeadingRenderer - a function to render header cells
   * which takes (sHeading) and returns the HTML to render.
   * By default this function simply returns sHeading;
   */
  static getHTML(
    tbl, 
    id='',
    tblClass='', 
    fnCellRenderer=(sHeading, value)=>value ? value.toString() : '',
    fnHeadingRenderer=(sHeading)=>sHeading) 
  {
    let html = `<table ${
      tblClass ? 'class="' + tblClass + '"' : ''
    }${
      id ? 'id="' + id +'"' : '' 
    }><tbody>`;

    // heading row
    html += '\n<tr>';
    for (const heading of tbl[0]) {
      html += `\n<th>${
        fnHeadingRenderer(heading)
      }</th>`;
    }
    html += '</tr>';

    // data rows
    for (let iRow = 1; iRow < tbl.length; iRow++) {
      const aRow = tbl[iRow];
      console.assert(aRow.length <= tbl[0].length);

      // if a row is shorter than the first table row we make 
      // the last column
      // take extra columns so the table is still a rectangle.
      // This covers rendering of the photo merge table dialog
      // where all the photos are combined into the last column.
      const cMissingColumns = tbl[0].length - aRow.length;

      html += '\n<tr>';
      for (let iCol = 0; iCol < aRow.length; iCol++) {
        html += `\n<td`;
        if (iCol == aRow.length - 1 && cMissingColumns > 0) {
          html += ' colspan="' + cMissingColumns + '"';
        }
        html += `>${
          fnCellRenderer(tbl[0][iCol], aRow[iCol])
        }</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';

    return html;
  }

  /**
   * This is a standard boiler-plate table HTML renderer that is
   * the default renderer for Table.customRender().
   * It handles both the role of headingRenderer and dataRenderer.
   * Use this as a model to start from for custom table rendering
   * @param {string[]} heading 
   * @param {object} oHeadingMap - Row Index Object for the tbl (not the aHeadings!)
   * @param {number} idxCol - 0 based index of column being rendered.
   * This allows rows starting with pseudo headings to be rendered
   * properly where a separator (such as in CSV format) is not needed
   * before the first column.
   * @param {*} value - value for data or '' for pseudo columns.
   * @param {*} aRow - null if headingRendering, otherwise it
   * is the entire data row which is provided along with the oRI
   * to allow deriving new pseudoColumns or altering value output
   * based on row context.  Your renderer can call this one for
   * the standard cases it doesn't need to handle.
   */
  static boilerPlateTableRenderer(heading, oHeadingMap, idxCol, value, aRow) {
    console.assert(typeof(heading) == 'string');
    switch (heading) {
      case '#OpenTable':
        return '<table><tbody>';
      case '#CloseTable':
        return '</tbody></table>';
      case '#HeaderRowOpen':
      case '#DataRowOpen':
        return '<tr>';
      case '#HeaderRowClose':
      case '#DataRowClose':
        return '</tr>';
      case '#MoreHeaderRows?':
        return '';  // just one header row
    }
    if (aRow) {
      // data row rendering
      if (Object.keys(oHeadingMap).includes(heading)) {
        return `<td>${value.toString()}</td>`;
      } else {
        return '<td>Pseudo</td>';
      }
    } else {
      // heading
      return `<th>${heading}</th>`;
    }
  }

/**
 * This is a standard boiler-plate csv text renderer.
 * It handles both the role of headingRenderer and dataRenderer.
 * @param {string[]} heading 
 * @param {object} oRI - Row Index Object
 * @param {number} idxCol - 0 based index of column being rendered.
 * This allows rows starting with pseudo headings to be rendered
 * properly where a separator (such as in CSV format) is not needed
 * before the first column.
 * @param {*} value - value for data or '' for pseudo columns.
 * @param {*} aRow - null if headingRendering, otherwise it
 * is the entire data row which is provided along with the oRI
 * to allow deriving new pseudoColumns or altering value output
 * based on row context.  Your renderer can call this one for
 * the standard cases it doesn't need to handle.
 */
  static boilerPlateCSVRenderer(heading, oRI, idxCol, value, aRow) {
    console.assert(typeof(heading) == 'string');
    switch (heading) {
      case '#OpenTable':
      case '#CloseTable':
      case '#HeaderRowOpen':
      case '#DataRowOpen':
        return '';
      case '#HeaderRowClose':
      case '#DataRowClose':
        return '\n';
      case '#MoreHeaderRows?':
        return '';  // just one header row
    }

    if (aRow) {
      const comma = idxCol == 0 ? '' : ',';
      value = value.toString();
      const quotedValue = (value == Number(value)) ? value : `"${value.replace(/"/g, "'")}"`;
      // data row rendering
      if (Object.keys(oRI).includes(heading)) {
        return `${comma}${quotedValue}`;
      } else {
        return `${comma}Pseudo`;
      }
    } else {
      const comma = idxCol == 0 ? '' : ',';
      const quotedHeading = heading.indexOf(',') == -1 ? heading : `"${heading.replace(/"/g, "'")}"`;
      // heading
      return `${comma}"${quotedHeading}"`;
    }
  }

/**
 * This is a more flexible version of getHTML()
 * Rather than assume the output is an HTML <table> element
 * it lets the renderers do their thing and simply provides
 * calls to it to render each piece of the table
 * in whatever form (text/HTML/markup etc.) is desired.
 * @param {*[][]} tbl The table being rendered
 * @param {string[]} aHeadingsToRender a list of headings
 * or pseudo-heading names to call the renderer functions
 * with.  A pseudo heading is one that does not exist
 * within the table's first row (aHeadings) and has 
 * special meaning to the renderer function.
 * There are some pre-defined pseudo-headings which 
 * always start with a '#' character as follows:
 * 
 * '#OpenTable' - is always sent first to the heading
 *   renderer for it to output anything needed to preceed
 *  the headings. If it were doing an HTML table 
 *  this would return something like:
 *  '<table id="foo" class="bar"><tbody>' but it might
 *  output anything or a blank string.
 * 
 * '#HeaderRowOpen - sent to the heading renderer
 *  preceeding one or more header row headings
 * 
 * After the above call, the heading renderer is
 * called with each cell specified in the aHeadingsToRender
 * array of string names, each of which may or may not 
 * be a heading in the given table.
 * The heading renderer should respond with whatever text
 * is needed for each heading.  Use your own psdudo-headings
 * to create signals for state changes etc. to the headings
 * renderer.  If you are rendering a table you must include
 * the <th> and </th> tags in each returned string.
 * 
 * '#HeaderRowClose' - sent to the heading renderer
 * after all cells in the aHeadingsToRender have been
 * passed to the heading renderer.  (</tr> for tables)
 * 
 * '#MoreHeaderRows?' - Sent after each '#HeaderRowClose'
 * call which asks the heading renderer if it wants to
 * do another row of headers.
 * The heading renderer should return a non-blank string
 * if the answer is YES.  This will cause the same 
 * serices of calls for outputing the headers as was
 * done before.  The heading renderer needs to keep 
 * track of which header row it is rendering and return 
 * a '' string when done.
 * 
 * This function then proceeds to call the data renderer.
 * Preceeding each data row the data renderer is called
 * with the heading '#DataRowOpen'.
 * 
 * The data renderer is then called with each value 
 * listed in the aHeadingsToRender array.
 * 
 * Finally, after each data row, the data renderer
 * is called with '#DataRowClose'.
 * 
 * After the last data row is rendered, the header 
 * renderer is called with: '#CloseTable'
 * 
 * See the boilerPlate renderers code for details.
 * 
 * It is recommended that all pseudo-headings start with
 * a special character so they do not conflict with 
 * actual table headings.
 * 
 * @param {string[]} fnHeadingRenderer - the headings renderer function
 * (header, oRI, idxCol) => string
 * @param {function=} fnDataRenderer = the data renderer function
 * (header, oRI, idxCol, value, aRow) => string
 * 
 * @returns {string} The accumulated values returned by the
 * heading and data renderers.
 */
  static customRender(
    tbl, 
    aHeadingsToRender,
    fnHeadingRenderer=Table.boilerPlateTableRenderer,
    fnDataRenderer=Table.boilerPlateTableRenderer)
  {
    const oRI = Table.getTableColIndexesObject(tbl);
    let html = fnHeadingRenderer('#OpenTable', oRI, 0);

    // heading rows
    while (true) {
      // typically returns  '<tr>'
      html += fnHeadingRenderer('#HeaderRowOpen', oRI, 0);

      for (let idxCol = 0; idxCol < aHeadingsToRender.length; idxCol++) {
        const heading = aHeadingsToRender[idxCol];
        // typically would return '<th>Heading</th>'
        // but heading could be a pseudo-heading
        html += fnHeadingRenderer(heading, oRI, idxCol);
      }

      // typically returns '</tr>'
      html += fnHeadingRenderer('#HeaderRowClose', oRI, 0);

      const shallIDoAnother = fnHeadingRenderer('#MoreHeaderRows?', oRI, 0);
      if (!shallIDoAnother) {
        break;
      }
    }

    // data rows
    for (let iRow = 1; iRow < tbl.length; iRow++) {
      const aRow = tbl[iRow];

      // typically would return '<tr>'
      html += fnDataRenderer('#DataRowOpen', oRI, 0, '', null);

      for (let idxCol = 0; idxCol < aHeadingsToRender.length; idxCol++) {
        const heading = aHeadingsToRender[idxCol];
        let value = '';
        if (tbl[0].includes(heading)) {
          value = aRow[oRI[heading]];
        }
        // typically would return '<td>value</td>'
        html += fnDataRenderer(heading, oRI, idxCol, value, aRow);
      }

      // typically would return '</tr>'
      html += fnDataRenderer('#DataRowClose', oRI, 0, '', null);
    }
    
    // typically would return </tbody></table>';
    html += fnHeadingRenderer('#CloseTable', oRI, 0);

    return html;
  }

  /**
   * Applies the fnDerive function to each data row of the table,
   * the result of each call sets the new column(s) values.
   * The original table is unchanged.
   * @param {*[][]} tbl 
   * @param {function} fnDerive(aRow, aHeadings). returns [] values
   * in the same order as aNewColumnHeadings
   * @param {string[]} aNewColumnHeadings 
   * @returns a new table with appended column(s) with headings 
   * aNewColumnHeadings
   */
  static deriveNewColumnFromRows(
    tbl, 
    fnDerive,
    aNewColumnHeadings)
  {
    const newTbl = deepCopy(tbl);
    newTbl[0].push(aNewColumnHeadings);
    for (let iRow = 1; iRow < newTbl[0].length; iRow++) {
      const aValues = fnDerive(newTbl[iRow], newTbl[0]);
      for (const value of aValues) {
        newTbl[iRow].push(value);
      }
    }
    return newTbl;
  }

  /**
   * Takes an array of objects, each one of which is assumed to contain
   * roughly the same keys as the first object in the array which
   * determines the table headings (keys).  Then each object's values
   * are pushed as a row into the returned table.
   * @param {[]{}]} ao 
   * @returns {[][]} table
   */
  static objectArrayToTable(ao) {
    const tbl = [];
    tbl.push(Object.keys(ao[0]));
    for (const o of ao) { 
      const aRow = [];
      for (const heading of tbl[0]) {
        aRow.push(o[heading]);
      }
      tbl.push(aRow);
    }

    return tbl;
  }

  /**
   * Returns true if the table is not proper or has no data.
   * @param {[][]} tbl 
   * @returns fIsEmpty
   */
  static isTableEmpty(tbl) {
    return (!tbl || !Array.isArray(tbl) || tbl.length < 2);
  }

  /**
   * Compares two rows of values for equality but skips some
   * columns 
   * @param {[]} aRow1 
   * @param {[]} aRow2 
   * @param {[number]} aColumnIdxsToSkip 
   * @returns fAreEqual
   */
  static compareRowsExceptSomeColumns(aRow1, aRow2, aColumnIdxsToSkip) {
    console.assert(Array.isArray(aRow1));
    console.assert(Array.isArray(aRow2));
    console.assert(aRow1.length == aRow2.length);
    console.assert(Array.isArray(aColumnIdxsToSkip));
    let fAreEqual = true;
    for (let idx = 0; idx < aRow1.length; idx++) {
      if (aColumnIdxsToSkip.includes(idx)) {
        continue; // don't compare this column
      }
      fAreEqual &&= isEqualTo(aRow1[idx], aRow2[idx]);
      if (!fAreEqual) {
        break;
      }
    }

    return fAreEqual;
  }

  /**
   * Translates an array of heading names into their
   * indexs into the given aHeadings.
   * !we assume all aHeadingsToProcess are included in aHeadings.
   * !if not, the corresponding idx will be -1
   * @param {[string]} aHeadings 
   * @param {[string]} aHeadingsToProcess 
   * @returns [number] aIdxs
   */
  static getIdxsOfHeadings(aHeadings, aHeadingsToProcess) {
    const aIdxs = [];
    for (const aHeading of aHeadingsToProcess) {
      aIdxs.push(aHeadings.indexOf(aHeading));
    }
    return aIdxs;
  }

  /**
   * Deletes a row form the table if it exists.
   * @param {[][]} tbl 
   * @param {[]} aRowToDelete 
   * @returns fRemoved
   */
  static deleteRow(tbl, aRowToDelete) {
    let fRemoved = false;
    for(let iRow = 1; iRow < tbl.length; iRow++) {
      if (iRow == 0) continue; // skip headings
      if (isEqualTo(tbl[iRow], aRowToDelete)) {
        tbl.splice(iRow, 1);
        fRemoved = true;
      }
    }

    return fRemoved;
  }

} // Table class

