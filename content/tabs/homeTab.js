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
    "serializer",
    "objectMenu",
    "objectLink"
],
function(Domplate, Lib, DomTree, TabView, TableView, Trace, ObjectTree, Search, Serializer,
    ObjectMenu, ObjectLink) { with (Domplate) {

// ********************************************************************************************* //
// Options

// xxxHonza: Options should be persistent in user preferences
var options =
{
    "roots": false,
    "searchTableView": true
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
            onSave: this.onSave.bind(this),
        }, body);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    content:
        TABLE({"class": "homeTable", cellpadding: 3, cellspacing: 0},
            TBODY(
                TR({"class": "toolbar"},
                    TD(
                        BUTTON({"class": "runCC", onclick: "$onRun"}, "Run CC Collector"),
                        SPAN({"class": "progressLabel"}),
                        SPAN({"class": "saveButton", onclick: "$onSave", collapsed: "true",
                            title: "Save the log into a file"})
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
        //this.tabView.getTab("Documents").invalidate();

        // hide save log button.
        var save = this.element.querySelector(".saveButton");
        Lib.collapse(save, true);

        // Disable the Run button
        var runCC = this.element.querySelector(".runCC");
        runCC.setAttribute("disabled", "true");

        // Run CC collctor.
        this.tabView.analyzer.run(this);

        // Reset the progress info.
        this.onProgress(this.tabView.analyzer);
    },

    onSave: function()
    {
        var text = Serializer.serializeGraph(this.tabView.analyzer.graph);
        Serializer.saveToFile(text);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Progress

    onProgress: function(analyzer)
    {
        var label = this.element.querySelector(".progressLabel");
        label.innerHTML = "Collecting: " + Object.keys(analyzer.graph).length + " objects, " +
            analyzer.roots.length + " roots, " +
            analyzer.garbage.length + " garbage";
    },

    onFinished: function(analyzer)
    {
        // Update progress label.
        this.onProgress(analyzer);

        // Create output tree
        this.renderGraph();

        // Enable the run button.
        var runCC = this.element.querySelector(".runCC");
        runCC.removeAttribute("disabled");

        // Show save log button.
        var save = this.element.querySelector(".saveButton");
        Lib.collapse(save, false);
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

        if (options.searchTableView)
        {
            var cols = [
                {property: "name", rep: ObjectMenu},
                {property: "address", rep: ObjectLink},
                {property: "refcount", alphaValue: false},
                "gcmarked",
                "edges",
                "owners"
            ];

            // Render objects as a table.
            TableView.render(parentNode, result, cols);
        }
        else
        {
            var tree = new ObjectTree(result);
            tree.append(parentNode);
        }

        return true;
    },

    getSearchOptions: function()
    {
        var items = [];

        /*items.push({
            label: "Roots Only",
            checked: options["roots"],
            command: Lib.bindFixed(this.onOption, this, "roots")
        });*/
        items.push({
            label: "Find Zombie Documents",
            command: Lib.bindFixed(this.onSearchForDocuments, this)
        });
        items.push({
            label: "Clear Results",
            command: Lib.bindFixed(this.onClearSearch, this)
        });
        items.push("-");
        items.push({
            label: "Table View",
            checked: options["searchTableView"],
            command: Lib.bindFixed(this.onOption, this, "searchTableView")
        });

        return items;
    },

    onOption: function(name)
    {
        options[name] = !options[name];
    },

    onSearchForDocuments: function()
    {
        var tab = Lib.getAncestorByClass(this.element, "tabBody");
        Search.Box.doSearch("nsDocument", tab);
    },

    onClearSearch: function()
    {
        var tab = Lib.getAncestorByClass(this.element, "tabBody");
        Search.Box.doSearch("", tab);
    }
});

// ********************************************************************************************* //

return HomeTab;

// ********************************************************************************************* //
}});
