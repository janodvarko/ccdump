/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/domTree",
    "lib/popupMenu",
    "lib/trace",
],
function(Domplate, Lib, DomTree, Menu, FBTrace) { with (Domplate) {

// ********************************************************************************************* //

var ObjectMenu = domplate(DomTree.Rep,
{
    className: "objectMenu", //xxxHonza: not used?

    tag:
        SPAN({"class": "objectMenu"},
            SPAN(
                "$object|getTitle"
            ),
            SPAN({"class": "arrow", onclick: "$onOpenOptions", _repObject: "$object"},
                "&nbsp;"
            )
        ),

    onClick: function(event)
    {
        // xxxHonza: any way how to execute a custom callback from here?
        //Lib.fireEvent(event.target, "navigate");
    },

    getTargetUrl: function(object)
    {
        return object + "";
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Context Menu

    onOpenOptions: function(event)
    {
        Lib.cancelEvent(event);
        if (!Lib.isLeftClick(event))
            return;

        var items = this.getMenuItems(event.target);
        var menu = new Menu({id: "searchOptions", items: items});
        menu.showPopup(event.target);
    },

    getMenuItems: function(target)
    {
        var items = [];
        items.push({
            label: "Show Details",
            command: Lib.bindFixed(this.onDisplayDetails, this, target, "details")
        });
        items.push("-");
        items.push({
            label: "Show Roots",
            command: Lib.bindFixed(this.onDisplayDetails, this, target, "roots")
        });
        items.push({
            label: "Show Graph",
            command: Lib.bindFixed(this.onDisplayDetails, this, target, "graph")
        });
        return items;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Commands

    onDisplayDetails: function(target, graphType)
    {
        var tabView = Lib.getAncestorByClass(target, "tabView").repObject;
        var obj = Lib.getAncestorByClass(target, "dataTableRow").repObject;

        // Switch tabs
        var tab = tabView.getTab("Roots");
        tab.invalidate();

        tab.currObject = obj;
        tab.currGraphType = graphType;
        tab.select();
    },
});

// ********************************************************************************************* //

return ObjectMenu;

// ********************************************************************************************* //
}});
