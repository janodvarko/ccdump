/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "tabs/dynamicTab",
    "app/objectTree",
    "app/objectGraphGenerator"
],

function(Domplate, Lib, FBTrace, DynamicTab, ObjectTree, ObjectGraphGenerator) {
with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function DetailsTab() {}
DetailsTab.prototype = Lib.extend(DynamicTab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "Details",
    label: "Details",

    bodyTag:
        DIV({"class": "DetailsBody"}),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    onUpdateBody: function(tabView, body)
    {
        var selection = tabView.selection;
        if (!selection)
        {
            this.noSelection.replace({}, body);
            return;
        }

        var tree = new ObjectTree({"Object": selection});
        tree.append(body, true);
    },
});

// ********************************************************************************************* //

return DetailsTab;

// ********************************************************************************************* //
}});
