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

var ObjectLink = domplate(DomTree.Rep,
{
    className: "ccLink",

    tag:
        SPAN({"class": "ccObjectLink"},
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
            label: "Show Roots",
            command: Lib.bindFixed(this.onDisplayDetails, this, target, "roots")
        });
        items.push({
            label: "Show Graph",
            command: Lib.bindFixed(this.onDisplayDetails, this, target, "graph")
        });
        items.push({
            label: "Show Owners",
            command: Lib.bindFixed(this.onDisplayDetails, this, target, "owners")
        });
        return items;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Commands

    onDisplayDetails: function(target, graphType)
    {
        var tabView = Lib.getAncestorByClass(target, "tabView").repObject;

        // Switch tabs
        var tab = tabView.getTab("Roots");
        tab.invalidate();

        tab.currObject = target.repObject;
        tab.currGraphType = graphType;
        tab.select();
    },
});

// ********************************************************************************************* //

return ObjectLink;

// ********************************************************************************************* //
}});
