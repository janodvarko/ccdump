/* See license.txt for terms of usage */

// ********************************************************************************************* //

define([
    "lib/lib",
    "lib/trace",
    "analyzer",
    "objectGraphGenerator"
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
            var eventObj = event.object;
            FBTrace.sysout("navigator.onNavigate; " + eventObj.type, eventObj);

            this.onSelectTab(eventObj.type, eventObj.selection);
        }
        catch (err)
        {
            FBTrace.sysout("tabNavigator.onNavigate; EXCEPTION " + e, e);
        }
    },

    onSelectTab: function(type, selection)
    {
        if (typeof selection == "string")
            selection = this.tabView.analyzer.getObject(selection);

        if (!selection)
            return;

        if (!(selection instanceof Analyzer.CCObject))
            selection = selection.value;

        if (selection instanceof ObjectGraphGenerator.Object)
            selection = selection._o;

        FBTrace.sysout("navigator.onSelectTab; " + type + ", " + selection, selection);

        // Switch to target tab
        var tab = this.tabView.getTab("Roots");
        tab.invalidate();

        tab.currObject = selection;
        tab.currGraphType = type;

        tab.select();
    }
};

// ********************************************************************************************* //

return TabNavigator;

// ********************************************************************************************* //
});
