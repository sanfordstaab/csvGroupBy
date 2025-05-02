// errorNotice.js

// error support

/**
 * Sets the HTML into the erorrUI and shows it
 * @param {string} html 
 */
function setError(html) {
  const eDiv = ge('divError');
  eDiv.innerHTML = html;
  show(eDiv.id);
}

/**
 * Clears the error UI content and hides it.
 */
function clearErrorUI() {
  const eDiv = ge('divError');
  eDiv.innerHTML = ' ';
  hide(eDiv.id);
}

/**
 * Adds the formCtrlError class to the element to make it RED
 * @param {number | element | number[]} idOrElementOrArray 
 * @param {boolean=} fError - passes on to markErrorOnly()
 */
function markErrorUI(idOrElementOrArray, fError = true) {
  applyIdOrElOrArrayToFunction(idOrElementOrArray, markErrorOnly, fError);
}

/**
 * Adds the class formCtrlError to the control to make it RED
 * @param {element} el 
 * @param {boolean} fError 
 */
function markErrorOnly(el, fError) {
  addClassToElementOnly(el, 'formCtrlError', fError);
}

/**
 * Removes formCtrlError and formCtrlNotice classes from all 
 * elements within idParent that have that class set.
 * This effectively clears the errors and notices UIs.
 * @param {number=} idParent - defaults to 0
 */
function clearAllErrorsAndNotices(idParent = 0) {
  clearErrorUI();
  clearNoticeUI();
  getElementsWithClassNameWithinElement(
    idParent,
    'formCtrlError',
  ).forEach(
    (el) => {
      markErrorUI(el, false);
    },
  );
  getElementsWithClassNameWithinElement(
    idParent,
    'formCtrlNotice',
  ).forEach(
    (el) => {
      markNoticeUI(el.id, false);
    },
  );
}

/**
 * An embellishment on document.getElementsByClassName() that only
 * returns children of the parent element
 * @param {number} idParent - id of the parent element, 
 * if 0 or '', we apply to all elements of the given class
 * @param {string} className - class string to search on
 * @returns element[]
 */
function getElementsWithClassNameWithinElement(idParent, className) {
  const aEl = Array.from(document.getElementsByClassName(className));
  if (idParent == '') {
    return aEl;
  }
  const aElWithinParent = [];
  const elParent = ge(idParent);
  aEl.forEach(
    (el) => {
      if (elParent.contains(el)) {
        aElWithinParent.push(el);
      }
    },
  );
  return aElWithinParent;
}

// notice support

/**
 * Sets the HTML into the notice UI control and shows it.
 * @param {string} html 
 */
function setNotice(html) {
  const eDiv = ge('divNotice');
  eDiv.innerHTML = html;
  show(eDiv.id);
}

/**
 * Adds the formCtrlNotice class to the control to turn it GREEN
 * @param {number} idOrEl 
 */
function markNoticeUI(idOrEl) {
  if (typeof (idOrEl) === 'string') {
    idOrEl = ge(idOrEl);
  }
  addClassToElement(idOrEl, 'formCtrlNotice', true);
}

/**
 * Clears and hides the notice UI
 */
function clearNoticeUI() {
  const eDiv = ge('divNotice');
  eDiv.innerHTML = ' ';
  hide(eDiv.id);
}

/**
 * Pushes a notice onto sNotice and adjusts its look if it is an error.
 * @param {string[]} aNotices - array to push modified notice onto.
 * @param {string} sNotice
 * @param {boolean=} fError - if true sNotice is made red.
 * we will set it to <span class="red">notice</span>
 * fError defaults to false.
 */
function addANotice(aNotices, sNotice, fError=false) {
  if (fError) {
    sNotice = `<span class="red">${sNotice}</span>`;
    console.warn(sNotice);
  }
  aNotices.push(sNotice);
}