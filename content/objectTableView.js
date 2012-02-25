/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/trace",
    "lib/TableView",
    "objectMenu",
    "objectLink",
    "lib/domTree",
    "lib/options",
],
function(Domplate, FBTrace, TableView, ObjectMenu, ObjectLink, DomTree, Options) {
with (Domplate) {

// ********************************************************************************************* //

var Index = domplate(DomTree.Reps.Number,
{
    className: "indexNumber",
});

// ********************************************************************************************* //

function ObjectTableView()
{
}

ObjectTableView.prototype = domplate(TableView.prototype,
{
    getValueTag: function(colAndValue)
    {
        if (colAndValue.col.property == "index")
            return Index.tag;

        return TableView.prototype.getValueTag.apply(this, arguments);
    },

    getProps: function(obj)
    {
        var index = 1;
        var arr = [];
        for (var p in obj)
        {
            var value = obj[p];
            value.index = index++;
            arr.push(value);
        }
        return arr;
    },

    render: function(parentNode, data, cols, limit)
    {
        cols = cols || [
            {property: "index", label: " "},
            {property: "name", rep: ObjectMenu},
            {property: "address", rep: ObjectLink},
            {property: "refcount", alphaValue: false},
            "gcmarked",
            "edges",
            "owners"
        ];

        limit = limit || Options.getPref("tableViewLimit");
        TableView.prototype.render.call(this, parentNode, data, cols, limit);
    }
});

// ********************************************************************************************* //

return ObjectTableView;

// ********************************************************************************************* //
}});
