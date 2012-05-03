/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "tabs/baseTab",
],

function(Domplate, Lib, FBTrace, BaseTab) { with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function DynamicTab()
{
}

DynamicTab.prototype = Lib.extend(BaseTab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    tabHeaderTag:
        A({"class": "$tab.id\\Tab tab",
            view: "$tab.id", _repObject: "$tab"},
            SPAN("$tab.label"),
            SPAN("&nbsp;"),
            SPAN({"class": "image", onclick: "$tab.onCloseTab", title: "Close"})
        ),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Handlers

    onCloseTab: function(event)
    {
        Lib.cancelEvent(event);

        // Remove itself from the list of tabs.
        this.tabView.removeTab(this);
    }
});

// ********************************************************************************************* //

return DynamicTab;

// ********************************************************************************************* //
}});
