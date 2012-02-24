/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/domTree",
    "lib/TableView",
    "objectMenu",
    "objectLink",
],
function(Domplate, FBTrace, TableView, ObjectMenu, ObjectLink) {

// ********************************************************************************************* //

var ObjectTableView = Domplate.domplate(TableView,
{
    render: function(parentNode, data, cols)
    {
        cols = cols || [
            {property: "name", rep: ObjectMenu},
            {property: "address", rep: ObjectLink},
            {property: "refcount", alphaValue: false},
            "gcmarked",
            "edges",
            "owners"
        ];

        TableView.render.call(this, parentNode, data, cols);
    }
});

// ********************************************************************************************* //

return ObjectTableView;

// ********************************************************************************************* //
});
