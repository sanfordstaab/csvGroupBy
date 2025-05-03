// csvGroupBy.js

// uses tables.js, InOrderSelect.js

const g = {};

function eh_onPageLoad(event) {
}

function eh_onInputFileDropped(event) { 
  FileIO.as_eh_dropFile(event, onDropOnInput); 
}

function onDropOnInput(fileName, sData) {
  g.tblIn = csv.toArray(sData);
  if (g.tblIn) {
    ge('txtaInput').value = sData;
    g.iosGroupBy = new InOrderSelect('GroupBy', g.tblIn);
    g.iosCombined = new InOrderSelect('Combined', g.tblIn);
    g.iosOutput = new InOrderSelect('Output', g.tblIn);
  } else {
    setError(`Failed to parse input from ${fileName}`);
  }
}

// ----------------------------

// instance specific event handlers

// GroupBy
function eh_saveGroupByKeyState(event) {
  g.iosGroupBy.eh_saveKeyState(event);
}

function eh_onGroupByColsSelectChanged(event) {
  g.iosGroupBy.eh_onColsSelectChanged(event);
}

// Combined
function eh_saveCombinedKeyState(event) {
  g.iosCombined.eh_saveKeyState(event);
}

function eh_onCombinedColsSelectChanged(event) {
  g.iosCombined.eh_onColsSelectChanged(event);
}

// Output
function eh_saveOutputKeyState(event) {
  g.iosOutput.eh_saveKeyState(event);
}

function eh_onOutputColsSelectChanged(event) {
  g.iosOutput.eh_onColsSelectChanged(event);
}

// -------------------------

function eh_process(event) {
  if (!g.iosCombined.aSelectedHeadings.length || 
      !g.iosGroupBy.aSelectedHeadings.length) {
    ge('txtaOutput').value = 'You must specify both the groupby and combine groups to process the input.';
    return;
  }

  // create a temporary table and calculate the group value for each row of tblIn
  let tbl = [ g.tblIn[0].deepCopy() ];

  // append headings
  tbl[0].push('groupValue'); 
  tbl[0].push('combinedValue');

  // calculate group and combined values for each row
  for (let iRow = 1; iRow < g.tblIn.length; iRow++) {
    const aRowIn = g.tblIn[iRow];
    const aRowOut = aRowIn.deepCopy();
    // append groupValue
    aRowOut.push(getRowMulitValue(aRowIn, g.tblIn[0], g.iosGroupBy.aSelectedHeadings));
    const combinedValue = getRowMulitValue(aRowOut, tbl[0], g.iosCombined.aSelectedHeadings);
    aRowOut.push(combinedValue); // append combinedValue string (to append to later)
    tbl.push(aRowOut);
  }

  // sort the tbl rows by the groupValues
  const idxGroupValue = tbl[0].indexOf('groupValue');
  tbl = Table.sortTableRows(tbl, 
    function(aRow1, aRow2) {
      return genSort(aRow1[idxGroupValue], aRow2[idxGroupValue]);
    }
  );

  // now go through tbl and combine rows based on the GroupBy values.

  let tblOut = [];
  tblOut.push(tbl[0]); // headings
  
  // Go through each row and build up the combinedValues where
  // the groupValues are equal.
  let prevGroupValue = null;
  let aCombinedValuesSoFar = [];
  const idxCombinedValue = tbl[0].indexOf('combinedValue');
  for (let iRow = 1; iRow < tbl.length; iRow++) {
    const aRow = tbl[iRow];
    const thisGroupValue = aRow[idxGroupValue];
    const fLastRow = iRow == tbl.length - 1;
    if (thisGroupValue != prevGroupValue || fLastRow) {
      // new group or the last row
      if (prevGroupValue) {
        tbl[iRow - 1][idxCombinedValue] = 
        formatCombinedValues(aCombinedValuesSoFar);
        tblOut.push(tbl[iRow - 1]);
      }
      aCombinedValuesSoFar = [ aRow[idxCombinedValue] ];
    } else { // thisGroup == prevGroup
      aCombinedValuesSoFar.push(aRow[idxCombinedValue]);
      if (fLastRow) {
        aRow[idxCombinedValue] = 
          formatCombinedValues(aCombinedValuesSoFar);
          tblOut.push(aNewRow);
      }
    } // if
    prevGroupValue = thisGroupValue;
  } // for each tblIn row

  // include our calculated headings
  const aHeadingsToKeep = g.iosOutput.aSelectedHeadings;
  aHeadingsToKeep.push('combinedValue');

  // eliminate other columns
  tblOut = Table.filterTableColumns(tblOut, aHeadingsToKeep);

  // put the new table out.
  ge('txtaOutput').value = csv.toCsv(tblOut);
}

function formatCombinedValues(aCombinedValuesSoFar) {
  // remove blank values
  for (let i = 0; i < aCombinedValuesSoFar.length; i++) {
    let tv = aCombinedValuesSoFar[i].trim();
    // remove ,s
    tv = tv.split(', ').join(' ').trim();

    // if there is nothing there, delete it
    if (tv == '') {
      aCombinedValuesSoFar.splice(i, 1);
      i--;
    }
    aCombinedValuesSoFar[i] = tv;
  }

  // add delimeters:
  // default delimeter is ", "
  let sCombinedValues = aCombinedValuesSoFar.join(', ').replace(/  /g, ' ');

  // first delimeter is " and "
  sCombinedValues = sCombinedValues.replace(/, /, ' and ');

  // last delimeter is " ", remove the ,
  const iLastDelimeter = sCombinedValues.lastIndexOf(', ');
  if (iLastDelimeter != -1) {
    sCombinedValues = 
      sCombinedValues.substring(0, iLastDelimeter - 1) +
      sCombinedValues.substring(iLastDelimeter + 1);
  }

  return sCombinedValues;
}

function getRowMulitValue(aRow, aRowHeadings, aCombinedHeadings) {
  let aCombinedValues = [];
  for (const combinedHeading of aCombinedHeadings) {
    aCombinedValues.push(aRow[aRowHeadings.indexOf(combinedHeading)]); 
  }
  return aCombinedValues.join(', ');
}