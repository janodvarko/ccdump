/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/domTree",
    "lib/tabView",
    "lib/tableView",
    "lib/trace",
    "objectTree",
    "tabs/search",
],
function(Domplate, Lib, DomTree, TabView, TableView, Trace, ObjectTree, Search) { with (Domplate) {

// ********************************************************************************************* //
// Options

// Options should be persistent
var options =
{
    "roots": false
}

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
        // Handlers must be passed dynamically, since HomeTab object is isntanciated.
        this.element = this.content.replace({
            onRun: this.onRun.bind(this),
        }, body);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    content:
        TABLE({"class": "homeTable", cellpadding: 3, cellspacing: 0},
            TBODY(
                TR({"class": "toolbar"},
                    TD(
                        BUTTON({"class": "", onclick: "$onRun"}, "Run CC Collector"),
                        SPAN({"class": "progressLabel"})
                    ),
                    TD(
                        TAG(Search.Box.tag)
                    )
                ),
                TR(
                    TD({"class": "log", colspan: 2},
                        DIV({"class": "description"},
                            "Run CC Collector to start analysis"
                        )
                    )
                )
            )
        ),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Event Handlers

    onRun: function(event)
    {
        var parentNode = this.element.querySelector(".log");
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
        // Update progress label.
        this.onProgress(analyzer);

        // Create output tree
        this.renderGraph();
    },

    renderGraph: function()
    {
        var parentNode = this.element.querySelector(".log");
        var tree = new ObjectTree({"Graph": this.tabView.analyzer.graph});
        tree.append(parentNode, false);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Search

    onSearch: function(text, keyCode)
    {
        var parentNode = this.element.querySelector(".log");
        Lib.eraseNode(parentNode);

        var result = this.tabView.analyzer.findObjects(text);
        if (!result)
        {
            this.renderGraph();
            return false;
        }

        var cols = ["name", "address", "refcount", "gcmarked", "edges", "owners"];

        // Render objects as a table.
        TableView.render(parentNode, result, cols);

        return true;
    },

    getSearchOptions: function()
    {
        var items = [];

        items.push({
            label: "Roots Only",
            checked: options["roots"],
            command: Lib.bindFixed(this.onOption, this, "roots")
        });

        return items;
    },

    onOption: function(name)
    {
        options[name] = !options[name];
    }
});

// ********************************************************************************************* //

return HomeTab;

// ********************************************************************************************* //
}});
