// InOrderSelect.js

/**
 * Class to handle processing of an in-order select control.
 * This control enhances a multiple select control by letting
 * the user specify the order as well as the set.
 * For this to work the caller must create two event
 * external handlers named:
 * eh_on<setName>ColsSelectChanged(event)
 * eh_save<setName>KeyState(event)
 * for each instance of this class.
 * These should each call the associated generic event
 * handler for the proper instance of this class.
 * The user must provide an HTML host with id InOrderSelectHost-<setName>
 */
class InOrderSelect {
  constructor(setName, tblIn) {
    this.tblIn = tblIn.deepCopy();
    this.tblHeadings = this.tblIn[0].sort();
    this.setName = setName;
    this.aSelectedHeadings = [];
    this.idHost = `InOrderSelectHost-${setName}`; // external host id
    this.idSelect = `sel${setName}Cols`; // internal id
    this.idOrderList = `orderList-${this.setName}` // internal id
    // render this instance
    ge(this.idHost).innerHTML = this.#getSelectWithOrderHTML();
  }

  #getSelectWithOrderHTML() {
    return `<select id="${this.idSelect}" size="15"
      title="Select the columns to add to the ${this.setName} columns list.
Hold the 'ctrl' key down to add that column to the end of the list 
or 
Hold the 'alt' key down to remove that column from the list.  
Select the columns in the order you want them."
onkeydown="eh_save${this.setName}KeyState(event); eh_on${this.setName}ColsSelectChanged(event);"
onmousedown="eh_save${this.setName}KeyState(event); eh_on${this.setName}ColsSelectChanged(event);"
onclick="eh_save${this.setName}KeyState(event); eh_on${this.setName}ColsSelectChanged(event);"
      >
    ${
      getOptionsHTML(this.tblHeadings, '')
    }
    </select>
    <br>
    <div id="${this.idOrderList}">
    </div>`;
  }

  /**
   * Generic Event Handler
   * @param {object} event 
   */
  eh_saveKeyState(event) {
    this.altKey = event.altKey;
    this.ctrlKey = event.ctrlKey;
  }

  /**
   * Generic Event Handler
   * @param {object} event 
   */
  eh_onColsSelectChanged(event) {
    if (event.key == 'Control' || event.key == 'Alt') {
      return; // don't react to just these keys moving.
    }
    const value = event.target.value;
    const idx = this.aSelectedHeadings.indexOf(value);
    console.log(`idx=${idx} altKey=${this.altKey} ctrlKey=${this.ctrlKey}`);

    if (this.altKey === true && idx != -1) {
      // delete the selected value from the list
      this.aSelectedHeadings.splice(idx, 1);
    } else if (this.ctrlKey === true && idx == -1) {
      // add the selected value to the list
      this.aSelectedHeadings.push(value);
    }

    let html = `No ${this.setName} data specified.`;
    if (this.aSelectedHeadings.length) {
      html = '<ol>';
      for (const heading of this.aSelectedHeadings) {
        html += `<li>${heading}</li>`;
      }
      html += '</ol>';
    }

    ge(this.idOrderList).innerHTML = html;
  }

} // InOrderSelect