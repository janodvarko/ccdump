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
    label: "Details",

    bodyTag:
        DIV({"class": "RootsBody"}),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    noAnalyses:
        SPAN("Run CC Collector to start analysis"),

    noObject:
        SPAN("No object specified"),

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

        if (!this.currObject)
        {
            this.noObject.replace({}, body);
            return;
        }

        var results = this.analyzeGraph(this.currGraphType);
        if (Lib.hasProperties(results))
        {
            var tree = new ObjectTree(results);
            tree.append(body);
        }
        else
        {
            this.noObject.replace({}, body);
        }
    },

    analyzeGraph: function(type)
    {
        switch (type)
        {
        case "roots":
            return this.tabView.analyzer.findRoots(this.currObject, true);

        case "graph":
            return this.tabView.analyzer.findGraph(this.currObject);

        case "owners":
            return this.tabView.analyzer.findRoots(this.currObject, false);
        }
    }
});

// ********************************************************************************************* //

return RootsTab;

// ********************************************************************************************* //
}});
