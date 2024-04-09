// -----------------------------------
// Utility Functions
// -----------------------------------
/**
 * Capitalizes the first letter of a string returning a new modified string.
 * @param {*} str - The original string to modify
 * @returns {string}
 */
export function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Checks if `query` matches any element's attribute in a _nodelist_ of `elements` and returns true if a match is found. This function requires that a NodeList of elements be passed, such as those returned by the `querySelectorAll` method.
 * 
 * The optional parameter `attrName` is a _string_ that allows you to limit which attributes are checked to only those that match `attrName`.
 * 
 * If the query does not match any of the elements' attribute in the nodelist, then returns false.
 * @param {string} query - The attribute string to check against `elements`.
 * @param {NodeList} elements - A NodeList of HTML Elements to check.
 * @param {string} attrName (optional) - A string used to limit the attributes that are checked
 * @returns {boolean}
 */
export function hasMatchingAttribute(query, elements, attrName) {
    if (!elements || elements.length === 0) {
        return false;
    }

    const attrNameExists = (attrName !== undefined && attrName !== null);

    let hasMatch = false;
    for (const element of elements) {
        for (const attr of element.attributes) {
            if (attrNameExists) {
                if (attr.name === attrName && attr.value === query) {
                    return hasMatch = true
                }
            } else if (attr.value === query) {
                return hasMatch = true;
            }
        }
        if (hasMatch) {
            return true;
        }
    }
    return hasMatch;
}