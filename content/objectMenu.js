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
            SPAN({"class": "arrow", onclick: "$onOpenOptions"},
                "&nbsp;"
            )
        ),

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
            command: Lib.bindFixed(this.onNavigate, this, target, "Details")
        });
        items.push("-");
        items.push({
            label: "Show Roots",
            command: Lib.bindFixed(this.onNavigate, this, target, "Roots")
        });
        items.push({
            label: "Show Graph",
            command: Lib.bindFixed(this.onNavigate, this, target, "Graph")
        });
        return items;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Commands

    onNavigate: function(target, type)
    {
        // Fire navigate event. It's processed by the main application object (tabView).
        Lib.fireEvent(target, "navigate", {
            type: type,
            selection: this.getRepObject(target)
        });
    },
});

// ********************************************************************************************* //

return ObjectMenu;

// ********************************************************************************************* //
}});
