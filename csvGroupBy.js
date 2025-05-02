// csvGroupBy.js

const g = {};
const aEventHandlers = [];

function eh_onPageLoad(event) {
  installEventListenerRows(aEventHandlers);
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

  html += `<select id="selGroupCols" multiple>
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

  html += `<select id="selCombineCols"
    title="Select the columns to add to the combined columns list.
    Hold the 'ctrl' key down to add the column to the list or 
    hold the 'shift' key down to remove the column from the list.  
    Select the columns in the order you want them combined."
    onkeyup="as_eh_onCombineColsSelectChanged(event)"
    onclick="as_eh_onCombineColsSelectChanged(event)"
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

 async function as_eh_onCombineColsSelectChanged(event) {
  console.log(`shift:${event.shiftKwy}, ctrl:${event.ctrlKey}`);
  await as_delay(1); // let UI catch up
  const value = ge('selCombineCols').value;
  // ! BUG: event.shiftKey is false when down and undefined when up
  // ! BUG: event.ctrlKey is false when down and undefined when up
  const idx = g.aCombineHeadings.indexOf(value);
  if (event.shiftKey === false && idx != -1) {
    // delete the selected value from the list
    g.aCombineHeadings.slice(idx, 1);
  } else if (event.ctrlKey === false && idx == -1) {
    // add the selected value to the list
    g.aCombineHeadings.push(value);
  }
  let html = 'No Combined data specified.';
  if (g.aCombineHeadings.length) {
    html = `
<ol>
  <li>${
    g.aCombineHeadings.join('<br>')
  }
  </li>
</ol>`;
  }

  ge('divCombineColsInOrder').innerHTML = html;
}