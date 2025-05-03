// csvGroupBy.js

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
  const tbl = [ g.tblIn[0].deepCopy() ];

  // append headings
  tbl[0].push('groupValue'); 
  tbl[0].push('combinedValue');

  // calculate groupValues and add empty comvineValues
  for (let iRow = 1; iRow < g.tblIn.length; iRow++) {
    const aRowIn = g.tblIn[iRow];
    const aRowOut = aRowIn.deepCopy();
    // append groupValue
    aRowOut.push(getRowMulitValue(aRowIn, g.tblIn[0], g.iosGroupBy.aSelectedHeadings));
    aRowOut.push(''); // append combinedValue string (to append to later)
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
  const idxCombinedValue = aRow[tbl[0].indexOf('combinedValue')];
  for (let iRow = 1; iRow < g.tblIn.length; iRow++) {
    const aRow = g.tblIn[iRow];
    const thisGroupValue = aRow[idxGroupValue];
    const fLastRow = iRow == g.tblIn.length - 1;
    if (thisGroupValue != prevGroupValue || fLastRow) {
      
      // new group or the last row
      if (prevGroupValue) {
        const aNewRow = createNewRowFromGroup(aRow, 
          prevGroupValue, 
          aCombinedValuesSoFar, 
          idxCombinedValue);
        tblOut.push(aNewRow);
        aCombinedValuesSoFar = [];
      } else {

        // first row
        aCombinedValuesSoFar = [ aRow[idxCombinedValue] ];
      }
    } else {
      // continuing group row
      aCombinedValuesSoFar.push(aRow[idxCombinedValue]);
      if (fLastRow) {
       aNewRow =  createNewRowFromGroup(aRow, 
          prevGroupValue, 
          aCombinedValuesSoFar, 
          idxCombinedValue);
        tblOut.push(aNewRow);
      }

    } // if

    aCombinedValuesSoFar.push(
      getRowMulitValue(aRow, g.tblIn[0], g.Combined.headings));
  } // for each tblIn row

  // include our calculated headings
  const aHeadingsToKeep = g.iosOutput.aSelectedHeadings;
  aHeadingsToKeep.push('groupValue');
  aHeadingsToKeep.push('combinedValue');

  // eliminate other columns
  tblOut = Table.filterTableColumns(tblOut, aHeadingsToKeep);

  // put the new table out.
  ge('txtaOutput').value = csv.toCsv(tblOut);
}

function createNewRowFromGroup(
  aRow, 
  prevGroupValue, 
  aCombinedValuesSoFar, 
  idxCombinedValue) 
{
  //  put out the prevous one if we have one
  const aNewRow = aRow.deepCopy();
  aNewRow[idxGroupValue] = prevGroupValue; // groupValue
  if (aCombinedValuesSoFar.length == 1) {
    // combinedValue - one unique row in the group
    aNewRow[idxCombinedValue] = aCombinedValuesSoFar[0]; 
  } else {
    // more than 1 combined value

    // add delimeters:
    // default delimeter is ", "
    let sCombinedValues = aCombinedValuesSoFar.join(', ');

    // first delimeter is " and "
    sCombinedValues = sCombinedValues.replace(/, /, ' and ');

    // last delimeter is " ", remove the ,
    const iLastDelimeter = sCombinedValues.lastIndexOf(', ');
    sCombinedValues = 
      sCombinedValues.substring(0, iLastDelimeter - 1) +
      sCombinedValues.substring(iLastDelimeter + 1);

    aNewRow[idxCombinedValue] = sCombinedValues;

    return aNewRow;
  }
}

function getRowMulitValue(aRow, aRowHeadings, aCombinedHeadings) {
  let aCombinedValues = [];
  for (const combinedHeading of aCombinedHeadings) {
    aCombinedValues.push(aRow[aRowHeadings.indexOf(combinedHeading)]); 
  }
  return aCombinedValues.join(', ');
}