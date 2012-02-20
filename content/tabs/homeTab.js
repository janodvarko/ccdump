/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/domTree",
    "lib/tabView",
    "lib/trace",
    "objectTree",
],
function(Domplate, Lib, DomTree, TabView, Trace, ObjectTree) { with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function HomeTab() {}
HomeTab.prototype = Lib.extend(TabView.Tab,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "Home",
    label: "Home",

    bodyTag:
        DIV({"class": "homeBody"}),

    onUpdateBody: function(tabView, body)
    {
        this.element = this.content.replace({onRun: this.onRun.bind(this)}, body);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    content:
        TABLE({"class": "ccView"},
            TBODY(
                TR(
                    TD({"class":  "toolbar"},
                        BUTTON({"class": "", onclick: "$onRun"}, "Run CC Collector"),
                        SPAN({"class": "progressLabel"})
                    )
                ),
                TR(
                    TD({"class": "graphTree"})
                )
            )
        ),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Event Handlers

    onRun: function(event)
    {
        var parentNode = this.element.querySelector(".graphTree");
        Lib.eraseNode(parentNode);

        // Make sure the other tabs get refreshed.
        this.tabView.getTab("Roots").invalidate();
        this.tabView.getTab("Documents").invalidate();

        // Run CC collctor.
        this.tabView.analyzer.run(this);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Progress

    onProgress: function(analyzer)
    {
        var label = this.element.querySelector(".progressLabel");
        label.innerHTML = Object.keys(analyzer.graph).length + " objects, " +
            analyzer.roots.length + " roots, " +
            analyzer.garbage.length + " garbage";
    },

    onFinished: function(analyzer)
    {
        var parentNode = this.element.querySelector(".graphTree");
        var tree = new ObjectTree({"Graph": analyzer.graph});
        tree.append(parentNode, false);
    },
});

// ********************************************************************************************* //

return HomeTab;

// ********************************************************************************************* //
}});
