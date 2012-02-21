/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "lib/tabView",
    "objectTree",
],

function(Domplate, Lib, FBTrace, TabView, ObjectTree) { with (Domplate) {

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

    noRoots:
        SPAN("No roots?"),

    noAnalyses:
        SPAN("Run CC Collector to start analysis"),

    noObject:
        SPAN("No object specified"),

    onUpdateBody: function(tabView, body)
    {
        if (tabView.analyzer.isEmpty())
        {
            this.noAnalyses.replace({}, body);
            return;
        }

        if (!tabView.currentObject)
        {
            this.noObject.replace({}, body);
            return;
        }

        var roots = tabView.analyzer.findRoots(tabView.currentObject);
        if (Lib.hasProperties(roots))
        {
            var tree = new ObjectTree(roots);
            tree.append(body);
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
