/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/domTree",
    "lib/trace",
],
function(Domplate, Lib, DomTree, FBTrace) { with (Domplate) {

// ********************************************************************************************* //

var ObjectLink = domplate(DomTree.Rep,
{
    className: "ccLink",

    tag:
        OBJECTLINK({href: "$object|getTargetUrl", onclick: "$onClick"}, "$object|getTitle"),

    onClick: function(event)
    {
        var target = event.target;

        FBTrace.sysout("onclick");
        // xxxHonza: any way how to execute a custom callback from here?
        //Lib.fireEvent(event.target, "navigate");

        var tabView = Lib.getAncestorByClass(target, "tabView").repObject;
        var obj = Lib.getAncestorByClass(target, "dataTableRow").repObject;

        // Switch tabs
        var tab = tabView.getTab("Roots");
        tab.invalidate();

        tab.currObject = obj;
        tab.currGraphType = "details";
        tab.select();
    },

    getTargetUrl: function(object)
    {
        return object + "";
    },
});

// ********************************************************************************************* //

return ObjectLink;

// ********************************************************************************************* //
}});
