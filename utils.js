// utils.js

// General Utilities
function ge(id, fNoCheck = false) {
  const el = document.getElementById(id);
  if (!fNoCheck && !el) {
    console.error(`id "${id}" was not found by ge().`);
  }
  return el;
}

/**
 * Sets the attribute of an element with the given ID to the specified value.
 * If the element is not found, it does nothing.
 * @param {string} id 
 * @param {string} attribute 
 * @param {string} value 
 */
function setElementAttributeMaybe(id, attribute, value) {
  const el = ge(id, true);
  if (el) {
    el[attribute] = value;
  }
}

function genSort(a, b) {
  if (a < b) {
    return -1;
  } if (a > b) {
    return 1;
  }
  return 0;
}


function caseInsensitiveSort(a, b) {
  return genSort(a.toLocaleUpperCase(), b.toLocaleUpperCase());
}

// object with keys that are element objects that contain the shown display type
const oDisplayShowStateById = {};

/**
 * Hides an element with the given ID.
 *
 * @param {string | Element} elOrId - The ID of the element to hide, or the element itself.
 * @return {void} 
 */
function hide(elOrId) {
  show(elOrId, false);
}

/**
 * Shows or hides an element based on the provided ID.
 *
 * @param {string | HTMLElement | Array<string | HTMLElement>} elOrId - The ID or element(s) to show or hide.
 * @param {boolean} [fShow=true] - Optional flag to indicate whether to show or hide the element(s). Default is true (show).
 * @return {void}
 */
function show(elOrId, fShow = true) {
  // we accept an array of ids or els or even a mixture.
  if (Array.isArray(elOrId)) {
    for (const item of elOrId) {
      show(item, fShow);
    }
    return;
  }

  // convert an id to an el
  let el = elOrId;
  if (typeof(elOrId) == 'string') {
    el = ge(elOrId, true);
  }
  if (!el) {
    return;
  }

  if (fShow) {
    const showState = oDisplayShowStateById[elOrId];
    if (showState) {
      el.style.display = showState;
    } else {
      // console.warn(`Showing element id=${el.id} that had no shown state.`);
      el.style.display = ''; // back to default/original setting
    }
  } else {
    if (el.style.display != 'none') {
      oDisplayShowStateById[elOrId] = el.style.display;
    } else {
      // console.warn(`Hideing element id=${el.id} that was aready hidden.`)
    }
    el.style.display = 'none';
  }
} // show


function isShown(elOrId) {
  if (typeof (elOrId) == 'string') {
    elOrId = ge(elOrId);
  }
  return elOrId.style.display != 'none';
}


function getAgeFromDateString(sDateBorn) {
  const age = ((new Date()).getTime() - (new Date(sDateBorn)).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(age);
}

/**
 * Enables or Disables an element
 * @param {*} idOrElementOrArray
 * @param {boolean=} fEnable
 */
function enableElement(
  idOrElementOrArray, 
  fEnable = true, 
  fNoCheck=false) 
{
  if (Array.isArray(idOrElementOrArray)) {
    idOrElementOrArray.forEach(
      (id) => {
        enableElement(id, fEnable, fNoCheck);
      }
    );
    return;
  }

  let el = idOrElementOrArray;
  if (typeof (el) == 'string') {
    el = ge(el, fNoCheck);
  }

  if (el) {
    if (fEnable) {
      el.removeAttribute('disabled');
    } else {
      el.setAttribute('disabled', '');
    }
  }
}


function getGradeFromDateString(sDate) {
  // generally, if a kid is 5 years old before September 1 in most states he is good.
  // The user can adjust this if necessary.
  const dateBorn = new Date(sDate);
  const dateCutoff = new Date(`9/1/${(new Date().toLocaleDateString()).split('/')[2]}`);
  const age = Math.floor((dateCutoff.getTime() - dateBorn.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  let grade = age - 5;
  if (grade > 12) {
    grade = 'A';
  }
  // TODO: Do we want to allow grade "K"?
  if (grade < 1) {
    grade = 1;
  }

  return grade;
}

String.prototype.quickHash = function() {
  var hash = 0,
    i, chr;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

String.prototype.toCamelCase = function toCamelCase() {
  return this
    .replace(
/(\w)(\w*)/g,
      (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase()
    );
};

// same as toCamelCase() but removes multiple spaces.
String.prototype.toCleanCamelCase = function toCleanCamelCase() {
  return this.toCamelCase().replace(/ {2}/g, ' ').trim();
};

const regExFuzzySchool = / ES| MS| HS| HA| Middle| Senior| Junior| Elementary| Middle| High| School/gi;
/**
 * This is used for fuzzy school name comparisons
 */
String.prototype.toCleanSchoolName = function toCleanSchoolName() {
  return this.replace(regExFuzzySchool, ' ').trim().toCleanCamelCase();
};

/**
 *
 * @param {string} msg
 * @param {string} json
 * @returns improved msg or original if no improvement could be made.
 */

function improveJSONErrorMsg(msg, json) {
  const aMatches = (/ at position (\d+)/gm).exec(msg);
  if (aMatches) {
    let charPos = Number(aMatches[1]);
    let len = 40;
    if (charPos < len / 2) {
      charPos = len / 2;
      if (len > json.length) {
        len = json.length;
      }
    }
    return `${aMatches.input} [ ${json.substr(charPos - len / 2, len)} ]`;
  }
  return msg;
}

/**
 *
 * @param {date} date A Date() object
 * @returns {string} the date as a mm/dd/yyyy string.
 */
function dateToMMDDYYYY(date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function dateToYYYYMMDDHHMMSS(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()
    }-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
}

function YYYYMMDDHHMMSStoDate(sDate) {
  const aParts = sDate.split('-');
  const date = new Date();
  date.setFullYear(aParts[0]);
  date.setMonth(aParts[1] - 1);
  date.setDate(aParts[2]);
  date.setHours(aParts[3]);
  date.setMinutes(aParts[4]);
  date.setSeconds(aParts[5]);
  return date; 
}

/**
 * This is used to extract the value of a date type input control,
 * the id of which is given.
 * @param {string} datePickerId 
 * @returns date value in mm/dd/yyy format no leading 0s
 */
function formatDatePickerDate(datePickerId) {
  const sDateIn = ge(datePickerId).value;
  const aParts = sDateIn.split('-'); // yyyy-mm-dd
  let sDateOut = sDateIn;
  if (aParts.length == 3) {
    sDateOut = `${
      Number(aParts[1])
    }/${
      Number(aParts[2])
    }/${
      Number(aParts[0])
    }`; // mm/dd/yyyy no leading 0s
  }
  return sDateOut;
}

/**
 * Used to set the date string of a date input control given
 * the mm/dd/yyyy format.
 * @param {string} sDateIn // mm/dd/yyyy
 * @returns date string in the form of yyyy-mm-dd with leading 0s
 */
function unformatDatePickerValue(sDateIn) { // mm/dd/yyyy
  const aParts = sDateIn.split('/');
  let sDateOut = sDateIn;
  if (aParts.length == 3) {
    sDateOut = `${aParts[2]}-${aParts[0].padStart(2, '0')}-${aParts[1].padStart(2, '0')}`; // yyyy-mm-dd
  }
  return sDateOut; // yyyy-mm-dd 
}

// function testDateFormating() {
//   const date = new Date();
//   const sDate = dateToYYYYMMDDHHMMSS(date);
//   console.log(sDate);
//   const sDateStart = date.toString();
//   const sDateEnd = YYYYMMDDHHMMSStoDate(sDate);
//   console.log(`sDateStart=${sDateStart}  sDateEnd=${sDateEnd}`);
//   console.assert(sDateStart == sDateEnd);
// }
// testDateFormating();

/**
 * Delays the execution of subsequent code for a specified amount of time.
 * @param {number} time The amount of time to delay in milliseconds.
 * @returns {Promise} A promise that resolves after the specified time has passed.
 */
async function as_delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

/**
 * A generic function used for waiting on external events.
 * Call within an async function as_that returns this function's
 * returned promise.
 * @param {string} sEvent // ie 'click', 'change' etc.
 * @param {string} id // id of element that fires the event 
 * @param {function=} fnCallbackOnEvent(id) // an optional callback to make
 * when the event fires.
 * @returns a promise that will resolve when the event is fired.
 */
async function as_EventOnElement(sEvent, id, fnCallbackOnEvent=null) {
  const el = ge(id);
  return new Promise(
    (resolve) => {
      const handler = () => {
        el.removeEventListener(sEvent, handler);
        resolve();
        if (fnCallbackOnEvent) {
          fnCallbackOnEvent(id);
        }
      }
      el.addEventListener(sEvent, handler);
    }
  );
}

/**
 * Generates <option> innerHTML for a select control
 * @param {'array'} aValues array of option values
 * @param {*} selectedValue, '' for no selection
 * @param {'array='} aText array of text option values
 * @returns {'HTML'} Options for select control
 */
function getOptionsHTML(
  aValues,
  selectedValue,
  aText = null // optional if text of option is different from the value.
  ) {
  let html = '';
  aValues.forEach(
    (value, index) => {
      let selected = '';
      if (value == selectedValue) {
        selected = ' selected';
      }
      if (aText) {
        html += `<option${selected} value="${value}">${aText[index]}</option>\n`;
      } else {
        html += `<option${selected}>${value}</option>\n`;
      }
    }
  );
  return html;
}

/**
 * 
 * @param {element} elSelect 
 * @returns {[]} aSelectedOptionValues
 */
function getMultiSelectValues(elSelect) {
  var aSelectedValues = [];
  var options = elSelect && elSelect.options;
  console.assert(options);
  for (const option of Array.from(options)) {
    if (option.selected) {
      aSelectedValues.push(
        option.value ? option.value : option.text
      );
    }
  }
  return aSelectedValues;
}

/**
 *
 * @param {Array} array the array of raw data to copy to an object form
 * @param {Object} oKeyedIndexes an object whos values are indexes into the given array
 * @returns {Object} an object that uses keys from oKeyedIndexs with values from array
 */

function arrayToObject(array, oKeyedIndexes) {
  console.assert(array.length == Object.keys(oKeyedIndexes).length,
    `arrayToObject: array \n${
      JSON.stringify(array)
    } differs in length from the oKeyedIndexes of \n${
      JSON.stringify(Object.keys(oKeyedIndexes))
    }.`);
  const oNew = {};
  Object.keys(oKeyedIndexes).forEach(
    (key) => {
      oNew[key] = array[oKeyedIndexes[key]];
    }
  );
  return oNew;
}

/**
 *
 * @param {Object} obj an object corresponding to the oKeyedIndexes
 * @param {Object} oKeyedIndexes an object whos values are indexes into the retirmed array
 * @returns an array whose values came from the obj given
 */

function objectToArray(obj, oKeyedIndexes) {
  console.assert(Object.keys(obj).length == Object.keys(oKeyedIndexes).length,
    `objectToArray: obj \n${
      JSON.stringify(Object.keys(obj))
    } differs in length from the oKeyedIndexes of \n${
      JSON.stringify(Object.keys(oKeyedIndexes))
    }.`);
  const aNew = [];
  Object.keys(oKeyedIndexes).forEach(
    (key) => {
      aNew[oKeyedIndexes[key]] = obj[key];
    }
  );
  return aNew;
}

// UI utilities

/**
 * @param {string} name the name property of the radio button group
 * @returns {string} the id of the radio element that is checked.
 */
function getCheckedRadioId(name) {
  const NLCollection = document.getElementsByName(name);
  for (const node of NLCollection) {
    if (node.checked) {
      return node.id;
    }
  }
  return '';
}
/**
 *
 * @param {*} idOrElOrArray // and array or nested array of elements or ids to elements
 * @param {function} fn // a fn which takes an element as it's first parameter. No return value is returned in the case of an array.
 * @param {*} params // parameter for the second parameter of fn, optional
 * // if params is an array, it will be applied to fn
 * @returns // the results of fn if not recursive else undefined
 */
function applyIdOrElOrArrayToFunction(idOrElOrArray, fn, params) {
  // recurse if array of ids/els
  if (Array.isArray(idOrElOrArray)) {
    idOrElOrArray.forEach(
      (idOrEl) => {
        applyIdOrElOrArrayToFunction(idOrEl, fn, params);
      }
    );
    return undefined;
  }

  // call self with el if id is a string
  if (typeof (idOrElOrArray) == 'string') {
    const el = ge(idOrElOrArray);
    return applyIdOrElOrArrayToFunction(el, fn, params);
  }

  // non-recursive call to array of params via apply
  if (Array.isArray(params)) {
    params.unshift(idOrElOrArray);
    return fn.apply(null, params);
  }

  // non-recursive call to single el and single param
  return fn(idOrElOrArray, params);
}

function addClassToElement(elOrIdOrArray, className, fAdd = true) {
  applyIdOrElOrArrayToFunction(elOrIdOrArray, addClassToElementOnly, [ className, fAdd ]);
}

function addClassToElementOnly(el, className, fAdd = true) {
  if (fAdd) {
    el.classList.add(className);
  } else {
    el.classList.remove(className);
  }
}


function checkSum(str) {
  let sum = 0;
  for (let iChar = 0; iChar < str.length; iChar++) {
    sum += str.charCodeAt(iChar);
  }
  sum = Math.floor(sum) % 0xFFFFFFFF;
  return sum;
}


function isBadJSON(sJSON) {
  if (sJSON.trim()) {
    try {
      JSON.parse(sJSON);
    } catch (e) {
      return e.message;
    }
  }
  return false; // blank is ok or good JSON
}

function deepCopy(o) {
  return JSON.parse(JSON.stringify(o));
}

/**
 * Compares two objects using JSON.stringify();
 * @param {any} a 
 * @param {any} b 
 * @returns {boolean} fIsEqual 
 */
function isEqualTo(a, b) {
  return JSON.stringify(a) == JSON.stringify(b);
}

/**
 * Pushes item onto the array object if it is not already there.
 * Note: this will not work with object or function items
 * @param {any} item 
 */
Array.prototype.addUnique = function(item) {
  console.assert(undefined != item);
  if (!this.includes(item)) {
    this.push(item);
  }
}

Array.prototype.concatUnique = function(aItems) {
  for (const item of aItems) {
    this.addUnique(item);
  }
}

Array.prototype.deepCopy = function() {
  return deepCopy(this);
}

/**
 * Compares each item of this array to each item in 
 * the a array and returns the first match found
 * or null if no matches found.
 * @param {[]} a
 */
Array.prototype.firstCommonItem = function(a) {
  for (const item1 of this) {
    for (const item2 of a) {
      if (item1 == item2) {
        return item1;
      }
    }
  }
  return null; // no common items
}

/**
 * 
 * @param {object} o - object to modify
 * @param {[][]} aaFieldValues - an array of [ key, value ] arrays
 * to apply to a copy of o.
 * @returns a deepCopy of o with the given key values set/modified.
 */
function getModifiedObject(o, aaFieldValues) {
  let oNew = o.deepCopy();
  for (const aFieldValue of aaFieldValues) {
    oNew[aFieldValue[0]] = aFieldValue[1];
  }

  return oNew;
}

// pulled from https://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
/**
 * Used to parse command line parameters
 * @param {string} parameterName 
 * @returns {string} parameterValue or '' if not found
 */
function getParamFromURL(parameterName) {
  let result = '';
  let tmp = [];
  const items = location.search.substring(1).split("&");
  for (let index = 0; index < items.length; index++) {
      tmp = items[index].split("=");
      if (tmp[0] === parameterName) {
        result = decodeURIComponent(tmp[1]);
      }
  }
  return result;
}

/**
 * Used to append class names to existing class neams
 * Each class name should have one or more spaces between them.
 * @param {string} cls 
 * @param {string} newCls 
 */
function addClass(cls, newCls) {
  if (!cls) {
    cls = '';
  }
  if (!newCls) {
    return cls;
  }
  cls = cls.trim();
  newCls = newCls.trim();
  if (!cls) {
    return newCls;
  }
  const aNewCls = newCls.split(/\s+/);
  aNewCls.addUnique(cls);
  return aNewCls.join(' ');
}

/**
 * Truncate or pad a given number to "ditits" decimal places
 * @param {number} num number to truncate/pad to digits
 * @param {number} digits - number of digits to return beyond the .
 * @returns {number} a number tructated/padded to digits
 */
function toFixedNum(num, digits) {
  return Number(num.toFixed(digits))
}