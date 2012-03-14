/* See license.txt for terms of usage */

// ********************************************************************************************* //

define([
    "lib/lib",
    "lib/trace",
    "app/analyzer",
    "app/objectGraphGenerator",
    "tabs/graphTab",
    "tabs/rootsTab",
    "tabs/pathTab",
    "tabs/detailsTab",
],
function(Lib, FBTrace, Analyzer, ObjectGraphGenerator) {

// ********************************************************************************************* //
// Navigation among application tabs

var TabNavigator =
{
    initialize: function(tabView)
    {
        this.tabView = tabView;

        this.onNavigateListener = this.onNavigate.bind(this);
        this.tabView.content.addEventListener("navigate", this.onNavigateListener, false);
    },

    shutdown: function()
    {
        this.tabView.content.removeEventListener("navigate", this.onNavigateListener, false);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Navigation

    onNavigate: function(event)
    {
        Lib.cancelEvent(event);

        try
        {
            var self = this;
            var object = event.object;

            // Load required tab-type. Do not provide any configuration, it has been
            // set up in main.js already. Loading the tab modules this way solves
            // some cyclic dependencies.
            require(null, [object.type], function(tabType) {
                self.onSelectTab(tabType, object);
            });
        }
        catch (err)
        {
            FBTrace.sysout("tabNavigator.onNavigate; EXCEPTION " + err, err);
        }
    },

    onSelectTab: function(tabType, input)
    {
        var selection = input.selection;
        if (typeof selection == "string")
            selection = this.tabView.analyzer.getObject(selection);

        if (!selection)
            return;

        // xxxHonza: type hacks
        if (!(selection instanceof Analyzer.CCObject))
            selection = selection.value;

        if (selection instanceof ObjectGraphGenerator.Object)
            selection = selection._o;

        // Switch to target tab
        var tab = this.appendTab(tabType);
        tab.invalidate();

        this.tabView.selection = selection;
        this.tabView.input = input;
        tab.select();
    },

    appendTab: function(tabType)
    {
        var tab = this.tabView.getTab(tabType.prototype.id);
        if (tab)
            return tab;

        var tab = this.tabView.appendTabBefore(new tabType(), "About");
        this.tabView.renderTab(tab, null, "About");

        return tab;
    }
};

// ********************************************************************************************* //

return TabNavigator;

// ********************************************************************************************* //
});
