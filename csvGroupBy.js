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
    ge('groupColsUI').innerHTML = getGroupUIHTML();
    ge('groupCombineUI').innerHTML = getCombineUIHTML();
  } else {
    setError(`Failed to parse input from ${fileName}`);
  }
}

function getGroupUIHTML() {
  const sSelHtmlOptions = getOptionsHTML(g.tblIn[0].deepCopy().sort(), '');
  let html = '';

  html += `<select id="selGroupCols" multiple size="15">
  ${
    sSelHtmlOptions
  }
  </select>`;

  return html;
}

function getCombineUIHTML() {
  g.aCombineHeadings = [];
  const sSelHtmlOptions = getOptionsHTML(g.tblIn[0].deepCopy().sort(), '');
  let html = '';

  html += `<select id="selCombineCols" size="15"
    title="Select the columns to add to the combined columns list.
    Hold the 'ctrl' key down to add the column to the list or 
    hold the 'shift' key down to remove the column from the list.  
    Select the columns in the order you want them combined."
    onchange="eh_onCombineColsSelectChanged(event)"
    onkeydown="eh_saveKeyState(event)"
    onmousedown="eh_saveKeyState(event)"
    onclick="eh_saveKeyState(event)"
    >
  ${
    sSelHtmlOptions
  }
  </select>
  <br>
  <div id="divCombineColsInOrder">
  </div>`;

  return html;
}

function eh_saveKeyState(event) {
  g.shiftKey = event.shiftKey;
  g.ctrlKey = event.ctrlKey;
}

function eh_onCombineColsSelectChanged(event) {
  const value = ge('selCombineCols').value;
  const idx = g.aCombineHeadings.indexOf(value);

  if (g.shiftKey === true && idx != -1) {
    // delete the selected value from the list
    g.aCombineHeadings.splice(idx, 1);
  } else if (g.ctrlKey === true && idx == -1) {
    // add the selected value to the list
    g.aCombineHeadings.push(value);
  }

  let html = 'No Combined data specified.';
  if (g.aCombineHeadings.length) {
    html = '<ol>';
    for (const heading of g.aCombineHeadings) {
      html += `<li>${heading}</li>`;
    }
    html += '</ol>';
  }

  ge('divCombineColsInOrder').innerHTML = html;
}

function eh_process(event) {
  const aGroupHeadings = getMultiSelectValues(ge('selGroupCols'));
  if (!g.aCombineHeadings.length || !aGroupHeadings.length) {
    ge('txtOutput').value = 'You must specify both the groupby and combine groups to process the input.';
    return;
  }

  // create a temporary table and calculate the group value for each row of tblIn
  const tbl = g.tblIn.deepCopy();

  // append headings
  tbl[0].push('groupValue'); 
  tbl[0].push('combinedValue');

  // calculate groupValues and add empty comvineValues
  for (let iRow = 1; iRow < g.tblIn.length; iRow++) {
    const aRowIn = g.tblIn[iRow];
    const aRowOut = aRowIn.deepCopy();
    // append groupValue
    aRowOut.push(getRowCombinedValue(aRowIn, g.tblIn[0], aGroupHeadings));
    aRowOut.push(''); // append combinedValue string (to append to later)
    tbl.push(aRowOut);
  }

  // sort the tbl rows by the groupValues
  tbl = Table.sortTableRows(tbl, 
    function(aRow1, aRow2) {
      const idxGroupValue = tbl[0].indexOf('groupValue');
      return genSort(aRow1[idxGroupValue], aRow2[idxGroupValue]);
    }
  );

  const tblOut = [];
  tblOut.push(tbl[0]); // headings
  
  // Go through each row and build up the combinedValues where
  // the groupValues are equal.
  let prevGroupValue = null;
  let aCombinedValuesSoFar = [];
  const idxGroupValue = aRow[tbl[0].indexOf('groupValue')];
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

    } // else
    aCombinedValuesSoFar.push(
      getRowCombinedValue(aRow, g.tblIn[0], g.aCombineHeadings));
  } // for
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

function getRowCombinedValue(aRow, aHeadings, aCombinedHeadings) {
  let aCombinedValues = [];
  for (const combinedHeading of aCombinedHeadings) {
    aCombinedValues.push(aRow[aHeadings.indexOf(combinedHeading)]); 
  }
  return aCombinedValues.join(', ');
}