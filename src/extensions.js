// -----------------------------------
// Showdown Extensions
// -----------------------------------
// Define a custom extension function
var footnoteExt = function() {
    return [
        {
            type: 'lang',
            regex: /\[\^1\]/g,
            replace: '<span style="color:red;">1</span>'
        }
    ];
};

// Register the custom extension with Showdown
showdown.extension('footnotes', footnoteExt);

