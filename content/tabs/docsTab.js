/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "lib/tabView",
    "app/objectTree",
],

function(Domplate, Lib, FBTrace, TabView, ObjectTree) { with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function DocsTab() {}
DocsTab.prototype = Lib.extend(TabView.Tab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "Documents",
    label: "Documents",

    bodyTag:
        DIV({"class": "docsBody"}),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    noDocs:
        SPAN("No possibly-leaked nsDocument objects in the log"),

    noAnalyses:
        SPAN("Run CC Collector first"),

    onUpdateBody: function(tabView, body)
    {
        FBTrace.sysout("DocsTab.onUpdateBody;");

        if (tabView.analyzer.isEmpty())
        {
            this.noAnalyses.replace({}, body);
            return;
        }

        var docs = tabView.analyzer.getDocuments();
        if (docs.length)
        {
            var tree = new ObjectTree(docs);
            tree.append(body);
        }
        else
        {
            this.noDocs.replace({}, body);
        }
    },
});

// ********************************************************************************************* //

return DocsTab;

// ********************************************************************************************* //
}});
