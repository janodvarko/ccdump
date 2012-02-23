/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "lib/tabView",
    "objectTree",
    "analyzer",
    "objectGraphGenerator"
],

function(Domplate, Lib, FBTrace, TabView, ObjectTree, Analyzer, ObjectGraphGenerator) {
with (Domplate) {

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

        var results = this.analyzeGraph(this.currGraphType, this.currObject);
        if (Lib.hasProperties(results))
        {
            var tree = new ObjectTree(results);
            tree.append(body, true);
        }
        else
        {
            this.noObject.replace({}, body);
        }
    },

    analyzeGraph: function(type, obj)
    {
        //FBTrace.sysout("type: " + type + ", ob: " + obj, obj);

        if (!obj)
            return;

        switch (type)
        {
        case "roots":
            return this.tabView.analyzer.findRoots(obj.address, true);

        case "graph":
            return this.getAllOwners(obj);

        case "details":
            return obj;
        }
    },

    getAllOwners: function(obj)
    {
        var searchId = this.tabView.analyzer.getSearchId();
        var generator = new ObjectGraphGenerator(searchId);
        return generator.findGraph(obj);
    }
});

// ********************************************************************************************* //

return RootsTab;

// ********************************************************************************************* //
}});
