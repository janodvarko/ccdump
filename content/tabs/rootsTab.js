/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "lib/tabView",
    "app/objectTableView",
],

function(Domplate, Lib, FBTrace, TabView, ObjectTableView) {
with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function RootsTab() {}
RootsTab.prototype = Lib.extend(TabView.Tab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "Roots",
    label: "Roots",

    bodyTag:
        DIV({"class": "RootsBody"}),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    noAnalyses:
        SPAN("Run CC Collector to start analysis"),

    noSelection:
        SPAN("No object selected"),

    noRoots:
        SPAN("No roots found"),

    invalidate: function()
    {
        TabView.Tab.prototype.invalidate.apply(this, arguments);

        this.currObject = null;
    },

    onUpdateBody: function(tabView, body)
    {
        if (tabView.analyzer.isEmpty())
        {
            this.noAnalyses.replace({}, body);
            return;
        }

        var selection = tabView.selection;
        if (!selection)
        {
            this.noSelection.replace({}, body);
            return;
        }

        var analyzer = this.tabView.analyzer;
        var results = selection.address ? analyzer.findRoots(selection.address) : selection;
        if (results.length)
        {
            var table = new ObjectTableView();
            table.render(body, results);
        }
        else
        {
            this.noRoots.replace({}, body);
        }
    },
});

// ********************************************************************************************* //

return RootsTab;

// ********************************************************************************************* //
}});
