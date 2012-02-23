/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "lib/tabView",
    "objectTree",
    "objectGraphGenerator"
],

function(Domplate, Lib, FBTrace, TabView, ObjectTree, ObjectGraphGenerator) {
with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function GraphTab() {}
GraphTab.prototype = Lib.extend(TabView.Tab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "Graph",
    label: "Graph",

    bodyTag:
        DIV({"class": "GraphBody"}),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    noSelection:
        SPAN("No object selected"),

    noGraph:
        SPAN("No graph found"),

    onUpdateBody: function(tabView, body)
    {
        var selection = tabView.selection;
        if (!selection)
        {
            this.noSelection.replace({}, body);
            return;
        }

        var searchId = this.tabView.analyzer.getSearchId();
        var generator = new ObjectGraphGenerator(searchId);
        var graph = generator.findGraph(selection);

        if (Lib.hasProperties(graph))
        {
            var tree = new ObjectTree(graph);
            tree.append(body, true);
        }
        else
        {
            this.noGraph.replace({}, body);
        }
    },
});

// ********************************************************************************************* //

return GraphTab;

// ********************************************************************************************* //
}});
