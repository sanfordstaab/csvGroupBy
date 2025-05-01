// csv.js

// #include objectExt.js

/* conventions
 * aRow = entire table of data including headings (aRow[0])
 * aHeadings = the first row of a table aRow[0]
 */

var csv = {
    getDefaultOptions : function() {
        return {
            chQuote:'"',         // char used to enquote quoted values
            chSeparator:',',     // char used to separate values, kept within quoted values
            sEscQuote:'""""',    // string that identifies a quote within a quoted value
            sNewline:'\n'        // string used to separate lines of text, kept as is if in quoted value
        };
    },
    enquote : function(s, options) {
        // returns s in a properly escaped and enquoted form using the given options if needed.
        if (typeof(options) == 'undefined' || options.keys == (new Object().keys)) {
              options = csv.getDefaultOptions();
        }
        options = csv.getDefaultOptions().mergeIn(options);        
        if (s.indexOf(options.chQuote) != -1 || s.indexOf(options.chSeparator) != -1) {
            return options.chQuote + s.replace(new RegExp(options.chQuote, 'g'), options.sEscQuote) + options.chQuote;
        } else {
            return s;
        }
    },    
    fixedColumnTextToCsv : function(sData, delimeter, aColumnPositions) {
        /*
        Accepts data where each column is at a fixed number of characters long.
        The data needs to be analyzed to find these columns because several values
        could be blank in some rows.
        The delimeter is what to use in the csv output.
        if aColumnPositions is not given it is calculated based on the data.
        aColumnPositions should contain all the offsets to the start of each column
        including 0 and the total length of the lines + 1.  The offsets should be
        in ascending order.
        */
        if (!delimeter) {
            delimeter = ',';
        }
        var aLines = sData.split('\n');
        var lineLength = aLines[0].length;
        if (!aColumnPositions) {
            let aCheckCharOffsets = [];
            for (let i = 0; i < lineLength; i++) {
                aCheckCharOffsets.push(i);
            }
            // use data to derive column boundaries
            aColumnPositions = [0];
            var iLineMostColumns = -1;
            var sUnifiedLine = (' ').repeat(lineLength);
            for (let i = 0; i < aLines.length; i++) {
                let line = aLines[i];
                if (line.length == 0) {
                    continue; // skip blank lines
                }
                if (line.length != lineLength) {
                    throw new Error('Line ' + (i + 1) + " of the data set is not the same length as the first. [" + line + ']');
                }
                for (let c = 0; c < aCheckCharOffsets.length; c++) {
                    let offset = aCheckCharOffsets[c];
                    if (line.charAt(offset) != ' ') {
                        sUnifiedLine = sUnifiedLine.substr(0, offset) + '-' + sUnifiedLine.substr(offset + 1);
                        aCheckCharOffsets.splice(c, 1);
                        c--;
                    }
                }
            }
            for (let c = 0; c < sUnifiedLine.length - 1; c++) {
                if (sUnifiedLine.charAt(c) == ' ' && sUnifiedLine.charAt(c + 1) == '-') {
                    aColumnPositions.push(c + 1);
                }
            }
            aColumnPositions.push(lineLength + 1);
        } else {
            if (aColumnPositions.length == 0)  {
                aColumnPositions = [0];
            }
            if (aColumnPositions[0] != 0) {
                aColumnPositions.unshift(0);  // prepend a 0 if not there
            }
            if (aColumnPositions[aColumnPositions.length - 1] < lineLength + 1) {
                aColumnPositions.push(lineLength + 1);
            }
        }
        // we now have all the column positions and can convert the data to csv
        var sCsv = '';
        for (let i = 0; i < aLines.length; i++) {
            let line = aLines[i];
            if (line.length == 0) {
                continue;   // skip empty lines
            }
            if (line.length != lineLength) {
                throw new Error('Fixed column line ' + (i + 1) + ' is not the same length as the first one. (' + line.length + ')');
            }
            for (let j = 0; j < aColumnPositions.length - 1; j++) {
                let offset = aColumnPositions[j];
                let offsetNext = aColumnPositions[j + 1];
                let value = line.substring(offset, offsetNext).trim();
                if (value.indexOf(delimeter) != -1) {
                    // BUG: lets hope the data doesn't contain quotes or escape characters!
                    value = csv.enquote(value, { chSeparator : delimeter } );
                }
                sCsv += value;
                if (j < aColumnPositions.length - 2) {
                    sCsv += delimeter; // last column doesn't need a delimeter
                }
            } 
            if (i < aLines.length - 1) {
                sCsv += '\n';
            }
        }   
        return sCsv;
    },   
    nameValueSetsToArray : function(sData, fCamelCase) {
        /*
         A nameValueSet file contains lines like:
            name = value
         each on a separate line.
         names are case-insensitive and made camel-case by this parser if fCamelCase is true else uppercase.
         blank lines seperate records.
         Each record may contain only a subset of the possible names to specify.

         This implementation assumes '=' is the delimeter for names/values
        */
        var aHeadings = [];
        var aLines = sData.split('\n');
        var fInSet = false;
        for (let i = 0; i < aLines.length; i++) {
            var line = aLines[i];
            if (!line.length) {
                fInSet = false;
                continue; // skip blank lines
            } else {
                let iEq = line.indexOf('=');
                if (iEq != -1) {
                    fInSet = true;
                    let name = line.substr(0, iEq - 1).trim();
                    if (fCamelCase) {
                        name = name.toLowerCase();
                        name = name.charAt(0).toUpperCase() + name.substr(1);   // camel case                       
                    } else {
                        name = name.toUpperCase();
                    }
                    let iHeading = aHeadings.indexOf(name);
                    if (iHeading == -1) {
                        aHeadings.push(name);
                    }
                }
            }
        }
        // now that we know all the headings, parse the values
        var aRows = [ aHeadings ];
        fInSet = false;
        var aNewRow = [];
        for (let i = 0; i < aLines.length; i++) {
            var line = aLines[i];
            if (!line.length) {
                if (fInSet) {
                    aRows.push(aNewRow);
                    fInSet = false; 

                }
                continue; // skip blank lines
            } else {
                let iEq = line.indexOf('=');
                if (iEq != -1) {
                    if (!fInSet) {
                        aNewRow = [];
                        for (let i = 0; i < aHeadings.length; i++) {
                            aNewRow.push('');   
                        }
                        fInSet = true;
                    }
                    let name = line.substr(0, iEq - 1).trim();
                    if (fCamelCase) {
                        name = name.toLowerCase();
                        name = name.charAt(0).toUpperCase() + name.substr(1);   // camel case                       
                    } else {
                        name = name.toUpperCase();
                    }                    
                    let value = line.substr(iEq + 1).trim();
                    let iHeading = aHeadings.indexOf(name);
                    if (iHeading == -1) {
                        throw new Error('Internal Error! nameValueSetsToCsv();');
                    }
                    aNewRow[iHeading] = value;
                }
            }          
        }
        if (fInSet) { // in case there is no last blank line, get that last row added.
            aRows.push(aNewRow);
        }          
        return aRows;
    },
    getUniqueColumnValues : function(aRows, sKey) {
        var iKey = csv.findKeyIndex(aRows[0], sKey);
        var aUniqueValues = [];
        for (let iRow = 1; iRow < aRows.length; iRow++) {
            let row = aRows[iRow];
            let value = row[iKey];
            if (-1 == aUniqueValues.indexOf(row[iKey])) {
                aUniqueValues.push(value);
            }
        }
        aUniqueValues.sort();
        return aUniqueValues;
    },   
    assembleColumns : function(aInfo) {
        // brings together rows from multiple tables into one new table.
        /* aInfo = [ [aRows, aHeadingsToUse], ... ] 
           aRows[0] is the headings row, following rows are data

           Example:
           [
            [ // set 0
                [ // aRows
                    [ 'h1', 'h2', 'h3' ], // headings
                    [ v1,   v2,   v3   ], // data...
                    [ v4,   v5,   v6   ]
                ], // aRows,
                [ 'h3', h1 ] // aHeadingsTouse
            ],
            [ // set 1
                [ // aRows
                    [ 'h4', 'h5', 'h6' ], // headings
                    [ vb1, vb2, vb3 ] // data...
                    [ vb4, vb5, vb6 ]
                ], // aRows
                [ 'h6' ] // aHeadingsToUse
            ]
           ]
        */
        var aOut = [];
        var headingIndexes = [];
        var aHeadingsToUse = [];
        var cColsOut = 0;
        for (let iSet = 0; iSet < aInfo.length; iSet++) {
            var cBase = aHeadingsToUse.length;
            for (let iSetHeadingsToUse = 0; iSetHeadingsToUse < aInfo[iSet][1].length; iSetHeadingsToUse++) {
                aHeadingsToUse.push(aInfo[iSet][1][iSetHeadingsToUse]);
                var iAllSetHeadings = 0;
                var aAllSetHeadings = aInfo[iSet][0][0];
                // find the index for this sets headings to use in order
                while (iAllSetHeadings < aAllSetHeadings.length) {
                    if (aAllSetHeadings[iAllSetHeadings] == aHeadingsToUse[iSetHeadingsToUse + cBase]) {
                        headingIndexes.push([ iSet, iAllSetHeadings ]);
                        cColsOut++;
                        break;
                    }
                    iAllSetHeadings++
                }
            }
        }
        /*
        Example aHeadingsToUse:
        [ 'h3', h1, 'h6' ]
        Example headingIndexes:
        [
            0, 2, // 'h3'
            0, 0, // 'h1'
            1, 2, // 'h6'
        ]
        */
        aOut.push(aHeadingsToUse);
        for (let iRow = 1; iRow < aInfo[0][0].length; iRow++) {  // we assume all sets have the same number of data rows
            var aNewRow = [];
            for (let iCol = 0; iCol < cColsOut; iCol++) {
                var iSet = headingIndexes[iCol][0];
                aNewRow.push(aInfo[iSet][0][iRow][headingIndexes[iCol][1]]);
            }
            aOut.push(aNewRow);
        }
        /*
        Example output:
        [
            [ 'h3', 'h1', 'h6' ],
            [  v3,   v1,   vb3 ],
            [  v6,   v4,   vb6 ]
        ]
        */
        return aOut;
    },
    findKeyIndex : function(aHeadings, sKey) {
        // given a heading key it finds the index into aHeadings for that key
        // throws an exception if not found.
        var iKey = aHeadings.indexOf(sKey);
        if (iKey == -1) {
            throw new Error('Key [' + sKey + '] not found.');            
        }
        return iKey;
    },      
    renameColumn : function(aRows, sOldColumnName, sNewColumnName) {
        var iCol = csv.findKeyIndex(aRows[0], sOldColumnName);
        aRows[0][iCol] = sNewColumnName;
        return aRows;
    },
    areColumnsEqual : function(aRows1, sKey1, aRows2, sKey2) {
        // compares all values of the two columns, potentially in two different datasets
        // returns '' if equal, else an explanatory string.
        if (aRows1.length != aRows2.length) {
            throw new Error('areColumnsEqual:The two given tables are not of the same length.');
        }
        var iKey1 = csv.findKeyIndex(aRows1[0], sKey1);
        var iKey2 = csv.findKeyIndex(aRows2[0], sKey2);
        for (let iRow = 1; iRow < aRows1.length; iRow++) {
            if (aRows1[iRow][iKey1] != aRows2[iRow][iKey2]) {
                return 'Row ' + iRow + ' columns ' + sKey1 + ':' + sKey2 + 
                        ' have different key column values: ' + aRows1[iRow][iKey1] + ' and ' +  aRows2[iRow][iKey2];
            }
        }
        return '';
    },
    sort : function(aRows, aKeyInfo) {
        // sort on multiple columns of a dataset
        // oKeyInfo - column name order is the order of importance
        // subsequent columns are only consulted if the previous ones are equal
        // [
        //      [ sColHeaderName, fDescending, fNumeric ], 
        // ...
        // ]
        aRows = ([aRows[0]]).concat(aRows.slice(1).sort(function(a, b) {
            for (let iInfo = 0; iInfo < aKeyInfo.length; iInfo++) {
                let aThisInfo = aKeyInfo[iInfo];
                let iKey = csv.findKeyIndex(aRows[0], aThisInfo[0]);
                let fDescending = aThisInfo[1];
                let fNumeric = aThisInfo[2];
                let aKey = a[iKey];
                if (fNumeric) {
                    aKey = Number(aKey);
                }
                let bKey = b[iKey];
                if (fNumeric) {
                    bKey = Number(bKey);
                }
                if (aKey < bKey) {
                    return (fDescending ? 1 : -1);
                } else if (aKey == bKey) {
                    continue;
                } else {
                    return (fDescending ? -1 : 1);
                }                
            }
            return 0;   
        }));
        return aRows;
    },
    filter : function(aRows, fnFilter) {
        // returns a dataset that is a subset of aRows.
        // fnFilter takes each row of the dataset and returns true if that row is to be returned.
        let aNewRows = [ aRows[0] ];
        for (let iRow = 1; iRow < aRows.length; iRow++) {
            if (fnFilter(aRows[iRow])) {
                aNewRows.push(aRows[iRow]);
            }
        }
        return aNewRows;
    },
    dualFilter : function(aRows1, sKey1, aRows2, sKey2, fnFilter) {
        const iKey1 = csv.findKeyIndex(aRows1[0], sKey1);
        const iKey2 = csv.findKeyIndex(aRows2[0], sKey2);        
        const aRowsSet = fnFilter(aRows1, iKey1, aRows2, iKey2);
        aRows1 = aRowsSet[0];
        aRows2 = aRowsSet[1];
        return aRowsSet;
    },
    modifyColumn : function(aRows, sKey, fnModifyValue) {
        // fnModifyValue is given each value in the sKey column of the aRows dataset
        // and returns the modified value.
        let iKey = csv.findKeyIndex(aRows[0], sKey);
        for (let iRow = 1; iRow < aRows.length; iRow++) {
            const row = aRows[iRow];
            row[iKey] = fnModifyValue(row[iKey]);
        }
        return aRows;
    }, 
    modifyDataRows : function(aRows, fnModifyRow) {
        // fnModifyRow is given each row of the aRows dataset and
        // returns the modified row.
        for (let iRow = 1; iRow < aRows.length; iRow++) {
            aRows[iRow] = fnModifyRow(aRows[iRow]);
        }
    },
    addColumn : function(aRows, sNewKey, fnAddValue) {
        // adds a column to the end of each row of the dataset
        // fnAddValue receives each data row and returns the 
        // value to insert for that row.
        // sNewKey is the name to give to the new column at the end of the 
        // aHeadings (aRows[0]) array.
        aRows[0].push(sNewKey);
        for (let iRow = 1; iRow < aRows.length; iRow++) {
            let aRow = aRows[iRow];
            aRow.push(fnAddValue(aRow));
        }
        return aRows;
    },
    lookupValue : function(aRows, sRowKeyHeading, sRowKeyValue, sColHeading) {
        // returns the value associated with the row whos sRowKeyHeading column
        // has the sRowKeyValue value and returns the value in that row's
        // sRowKeyValue column.
        const iRowKey = csv.findKeyIndex(aRows[0], sRowKeyHeading);
        const iCol = csv.findKeyIndex(aRows[0], sColHeading);
        for (let iRow = 1; iRow < aRows.length; iRow++) {
            let aRow = aRows[iRow];
            if (aRow[iRowKey] == sRowKeyValue) {
                return aRow[iCol];
            }
        }
        return '';
    },
    toCsv : function(aRows, options) {
        if (typeof(options) != 'object' || Object.keys(options).length == 0) {
            options = csv.getDefaultOptions();
        }
        options = csv.getDefaultOptions().mergeIn(options); 
        var s = '';  
        for (let iRow = 0; iRow < aRows.length; iRow++) {
            for (let iCol = 0; iCol < aRows[0].length; iCol++) {
                if (iCol > 0 && iCol < aRows[0].length) {
                    s += options.chSeparator;
                }
                s += csv.enquote((aRows[iRow][iCol]).toString(), options);
            }
            if (iRow < aRows.length - 1) {
                s += options.sNewline;
            }
        }        
        return s;
    },
    toNameValueSets : function(aRows) {
        let sSet = '';        
        for (let iRow = 1; iRow < aRows.length; iRow++) {
            for (let iCol = 0; iCol < aRows[iRow].length; iCol++) {
                if (aRows[iRow][iCol]) {
                    sSet += aRows[0][iCol] + ' = ' + aRows[iRow][iCol] + '\n';
                }
            }
            sSet += '\n';
        }
        return sSet;
    },
    toArray : function(sCSVData, options, cSkipRows, fTrimValues) {
        // Takes CSV text and returns a parsed dataset (aRows)
        // All row arrays will be of the same length as the first one which is presumed to be the headings
        // Any truncated values will be appended to the last column value separated by commas.
        if (typeof(options) != 'object' || Object.keys(options).length == 0) {
            options = csv.getDefaultOptions();
        }
        options = csv.getDefaultOptions().mergeIn(options);        
        if (!cSkipRows) {
            cSkipRows = 0;
        }
        let aRows = [];
        let fFirstRow = true;
        const aLines = sCSVData.split(options.sNewline);
        let cCols = 0; // we will set this after processing the first line
        let state = "startOfValue";
        let  = '';
        const aValues = [];
        for (let i = cSkipRows; i < aLines.length; i++) {   // skip headding row
            let thisLine = aLines[i];
            if (thisLine.length == 0) {
                if (state != "inQuotedValue") {
                    continue; // skip unquoted blank lines
                }
            }
            for (let iCh = 0; iCh < thisLine.length; iCh++) {
                const thisCh = thisLine[iCh];
                switch (state) {
                case "startOfValue":
                    if (thisCh == options.chQuote) {
                        state = "inQuotedValue";
                        val = '';
                    } else if (thisCh == options.chSeparator) {
                        aValues.push('');
                    } else {
                        state = "inUnquotedValue";
                        val = thisCh;
                    }
                    break;
                case "inQuotedValue":
                    if (thisLine.length >= (iCh + options.sEscQuote.length) && thisLine.substr(iCh, options.sEscQuote.length) == options.sEscQuote) {
                        val += '"';
                        iCh += options.sEscQuote.length - 1;
                    } else if (thisCh == options.chQuote) {
                        if (fTrimValues) {
                            val = val.trim();
                        }
                        aValues.push(val);
                        state = "endedValue";
                    } else {
                        val += thisCh;
                    }
                    break;
                case "inUnquotedValue":
                    if (thisCh == options.chSeparator) {
                        if (fTrimValues) {
                            val = val.trim();
                        }
                        aValues.push(val);
                        state = "startOfValue";
                        if (iCh == thisLine.length - 1) {   // EOL after a separator?
                            aValues.push('');   // add empty entry after last separator
                        }
                    } else {
                        val += thisCh;
                    }
                    break;
                case "endedValue":
                    if (thisCh == options.chSeparator) {
                        val = '';
                        state = "startOfValue";
                    }
                    break;
                default:
                    return null;  // internal error
                    break;
                }
            } // end of line

            if (state == 'inUnquotedValue' && val) {
                aValues.push(val);
            }
            if (state == "inQuotedValue") {
                val += options.sNewline; // newline in quoted value
                continue;   // to next line
            }
            if (fFirstRow ) {    // set cCols after processing of first line
                cCols = aValues.length;
                fFirstRow = false;
            }
            if (cCols != 0 && aValues.length != cCols) {
                while (aValues.length < cCols) {
                    // pad to match headings
                    aValues.push(''); 
                }
                if (aValues.length > cCols) {
                    // truncate to match headings
                    const aExtraValues = aValues.splice(0, aValues.length);
                    // tack on chopped values so no data is lost
                    aValues[aValues.length - 1] += ',' + aExtraValues.join(',');    
                }
            }
            aRows.push(aValues);
            state = 'startOfValue'; // prep state for next line
            aValues = [];
        } // next CSV text line
        if (state != "startOfValue") {
            throw new Error("Unexpected EOF. State=" + state);
        } 
        return aRows;
    },    
    checkHeadings : function(aRows, aExpectedHeadings) {
        // throws an exception if the first row of aRows does not
        // match aExpectedHeadings.  Also does several sanity
        // checks on aRows to ensure parsing went ok.
        // '*' in aExpectedHeadings passes any heading value for that column
        // '**' in aExpectedHeadings (last value) passes all following column heading values.
        if (!Array.isArray(aRows)) {
            throw new Error('aRows is not an array.');
        }
        if (aRows.length < 1) {
            throw new Error('There are no rows in aRows.');
        }
        const aHeadings = aRows[0];
        if (!Array.isArray(aHeadings)) {
            throw new Error('The first row is not an array.');
        }
        if (!Array.isArray(aExpectedHeadings)) {
            throw new Error('The expected headings is not an array.');
        }
        if (aHeadings.length < 1) {
            throw new Error('The headings row is an empty array.');
        }
        for (let i = 0; i < aHeadings.length; i++) {
            const heading = aHeadings[i];
            let expectedHeading = aExpectedHeadings[i];
            if (heading != expectedHeading) {
                if (expectedHeading == '*') {
                    continue;
                }
                if (expectedHeading == '**') {
                    break;
                }
                throw new Error('Heading [' + heading + '] does not match the expected heading [' + expectedHeading + ']');
            }
        }
        for (let iRow = 1; iRow < aRows.length; iRow++) {
            if (aHeadings.length != aRows[iRow].length) {
                throw new Error('Row ' + iRow + ' has ' + aRows[iRow].length + ' values instead of the expected ' + aHeadings.length + ' values.');
            }
        }
        return '';  // success
    }    
}