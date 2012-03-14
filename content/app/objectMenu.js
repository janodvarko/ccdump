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

        var target = event.target;
        var items = this.getMenuItems(target);

        // Fire event so, other application components (e.g. the current tab)
        // can append its own items.
        Lib.fireEvent(target, "getObjectMenuItems", {
            items: items,
            object: this.getRepObject(target)
        });

        // Show the menu.
        var menu = new Menu({id: "searchOptions", items: items});
        menu.showPopup(event.target);
    },

    getMenuItems: function(target)
    {
        // Tab objects can't be specified as deps since it would introduce
        // cyclical dependencies.
        var items = [];
        items.push({
            label: "Show Details",
            command: Lib.bindFixed(this.onNavigate, this, target, "tabs/detailsTab")
        });
        items.push("-");
        items.push({
            label: "Show Roots",
            command: Lib.bindFixed(this.onNavigate, this, target, "tabs/rootsTab")
        });
        items.push({
            label: "Show Graph",
            command: Lib.bindFixed(this.onNavigate, this, target, "tabs/graphTab")
        });
        return items;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Commands

    onNavigate: function(target, type)
    {
        // Fire navigate event. It's processed by {@link TabNavigator}.
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
