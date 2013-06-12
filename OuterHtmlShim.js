/**
 * Creates a custom exception object that matches as close as possible
 * to the global DOMException object.
 *
 * W3C Spec for DOMException: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-17189187
 * Code adapted from: http://stackoverflow.com/a/9856490/1265126
 *
 * @param {number} code Exception code matching the specifications of DOMException.
 * @param {string} [message] Custom error message.
 * @returns {CustomDOMException} Returns a custom exception object.
 * @constructor
 */
function CustomDOMException (code, message) {
    //throw on missing code
    if (typeof code !== "number") {
        throw new TypeError("Wrong argument");
    }

    //we need the codes, to get the "name" property.
    var consts = {
        1: "INDEX_SIZE_ERR",
        3: "HIERARCHY_REQUEST_ERR",
        4: "WRONG_DOCUMENT_ERR",
        5: "INVALID_CHARACTER_ERR",
        7: "NO_MODIFICATION_ALLOWED_ERR",
        8: "NOT_FOUND_ERR",
        9: "NOT_SUPPORTED_ERR",
        11: "INVALID_STATE_ERR",
        12: "SYNTAX_ERR",
        13: "INVALID_MODIFICATION_ERR",
        14: "NAMESPACE_ERR",
        15: "INVALID_ACCESS_ERR",
        17: "TYPE_MISMATCH_ERR",
        18: "SECURITY_ERR",
        19: "NETWORK_ERR",
        20: "ABORT_ERR",
        21: "URL_MISMATCH_ERR",
        22: "QUOTA_EXCEEDED_ERR",
        23: "TIMEOUT_ERR",
        24: "INVALID_NODE_TYPE_ERR",
        25: "DATA_CLONE_ERR"
    };

    if ((code in consts) === false) {
        throw new TypeError("Unknown exception code: " + code);
    }

    //props for adding properties
    var props = {value: null, writable: true, enumerable: false, Configurable: true};
    //generate an exception object
    var newException;

    try {
        //force an exception to be generated;
        document.querySelectorAll('div:foo');
    } catch (e) {
        //use it as the prototype
        newException = Object.create(Object.getPrototypeOf(e));
    }

    //get the name of the exception type
    var name = consts[code];

    //name
    props.value = name;
    Object.defineProperty(newException, 'name', props);
    props.value = code;
    Object.defineProperty(newException, 'code', props);
    props.value = message;
    Object.defineProperty(newException, 'message', props);

    //Make sure it "stringifies" properly
    var finalMessage;

    if (typeof message === "function") {
        finalMessage = function () {
            return message.call(newException);
        };
    } else {
        finalMessage = function () {
            return name + ": DOM Exception " + code + (message.length ? ': ' + message : '');
        };
    }

    props.value = function () {
        return finalMessage.call(newException);
    };

    Object.defineProperty(newException, 'toString', props);

    return newException;
}

// Shim for HTMLElement.prototype.outerHTML
// outerHTML is missing from FF10 and previous versions: https://developer.mozilla.org/en-US/docs/DOM/element.outerHTML
// Getter code adapted from: http://stackoverflow.com/a/3819589/1265126
// Setter code adapted from: http://stackoverflow.com/a/2536298/1265126
// Possible candidate for setter code found in comments of: http://snipplr.com/view/5460
if (Object.defineProperty) {
    if (typeof HTMLElement !== 'undefined' && !window.opera) {
        var element = HTMLElement.prototype;

        if (typeof Object.getOwnPropertyDescriptor(element, 'outerHTML') === 'undefined') {
            Object.defineProperty(element, 'outerHTML', {
                get: function () {
                    var div = document.createElement('div'),
                        h;
                    div.appendChild(this.cloneNode(true));
                    h = div.innerHTML;
                    div = null;
                    return h;
                },
                set: function (s) {
                    //TODO: Test the outerHTML setter shim! Make sure this outerHTML setter matches expected behavior.
                    console.warn('outerHTML setter shim - still needs testing! Make sure this outerHTML setter matches expected behavior.');

                    // If the element is the root node of the document, setting its outerHTML property will throw a DOMException with the error code NO_MODIFICATION_ALLOWED_ERR.
                    // Source: https://developer.mozilla.org/en-US/docs/DOM/element.outerHTML#Notes
                    // W3C Spec for DOMException NO_MODIFICATION_ALLOWED_ERR: http://www.w3.org/TR/DOM-Level-3-Core/core.html#DOMException-NO_MODIFICATION_ALLOWED_ERR
                    if (this.parentNode.nodeType === 9) {
                        // Reproduce as close as possible a DOM exception.
                        if (typeof DOMException !== 'function') {
                            throw new CustomDOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR, 'Modifications are not allowed for this document');
                        } else {
                            // FIXME: Not quite sure this works that well...
                            throw DOMException.constructor.call(DOMException, DOMException.NO_MODIFICATION_ALLOWED_ERR, 'Modifications are not allowed for this document');
                        }
                    } else {
                        var r = this.ownerDocument.createRange();
                        r.setStartBefore(this);
                        var df = r.createContextualFragment(s);
                        this.parentNode.replaceChild(df, this);
                    }
                },
                enumerable: true,
                configurable: true
            });
        }
    }
}
