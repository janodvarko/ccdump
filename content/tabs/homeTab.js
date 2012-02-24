/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "tabs/baseTab",
    "lib/trace",
    "objectTree",
    "tabs/search",
    "serializer",
    "lib/options",
    "objectTableView"
],
function(Domplate, Lib, BaseTab, FBTrace, ObjectTree, Search, Serializer, Options,
    ObjectTableView) {

with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function HomeTab() {}
HomeTab.prototype = Lib.extend(BaseTab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "Home",
    label: "Home",

    defaultContentTag:
        DIV({"class": "description"},
            "Run CC Collector to start analysis"
        ),

    progressToolbarItem:
        SPAN({"class": "progressLabel toolbarButton", title: "Cycle Collector Graph Info"}),

    onUpdateBody: function(tabView, body)
    {
        BaseTab.prototype.onUpdateBody.apply(this, arguments);

        // hide save log button.
        var save = this.toolbar.element.querySelector(".saveButton");
        Lib.collapse(save, true);

        var content = this.getTabContent();
        this.defaultContentTag.replace({}, content);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Toolbar

    getToolbarButtons: function()
    {
        this.toolbar.noSeparators = true;

        var buttons = [];

        buttons.push({
            id: "run",
            label: "Run CC Analysys",
            tooltiptext: "Run Cycle Collector Analysys",
            className: "runCC",
            command: this.onRun.bind(this)
        });

        buttons.push({
            id: "progress",
            tag: this.progressToolbarItem
        });

        buttons.push({
            id: "save",
            tooltiptext: "Save the log into a file",
            className: "saveButton",
            command: this.onSave.bind(this)
        });

        return buttons.concat(BaseTab.prototype.getToolbarButtons.apply(this, arguments));
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Event Handlers

    onRun: function(event)
    {
        var parentNode = this.getTabContent();
        Lib.eraseNode(parentNode);

        // Make sure the other tabs doesn't contain any references to the current graph.
        // It would dramatically increase number of objects in the next CC graph.
        for each (var tab in this.tabView.tabs)
        {
            if (tab != this)
                tab.invalidate();
        }

        this.tabView.selection = null;

        // hide save log button.
        var save = this.toolbar.element.querySelector(".saveButton");
        Lib.collapse(save, true);

        // Disable the Run button
        var runCC = this.toolbar.element.querySelector(".runCC");
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
        var label = this.toolbar.element.querySelector(".progressLabel");
        label.innerHTML = "Collected: " + Object.keys(analyzer.graph).length + " objects, " +
            analyzer.roots.length + " roots, " +
            analyzer.garbage.length + " garbage, " +
            analyzer.edges.length + " edges";
    },

    onFinished: function(analyzer)
    {
        // Update progress label.
        this.onProgress(analyzer);

        // Create output tree
        this.renderGraph();

        // Enable the run button.
        var runCC = this.toolbar.element.querySelector(".runCC");
        runCC.removeAttribute("disabled");

        // Show save log button.
        var save = this.toolbar.element.querySelector(".saveButton");
        Lib.collapse(save, false);

        // Search for zombie documents by default
        this.doSearch("nsDocument");
    },

    renderGraph: function()
    {
        var parentNode = this.getTabContent();
        var tree = new ObjectTree({"Graph": this.tabView.analyzer.graph});
        tree.append(parentNode, false);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Search

    onSearch: function(text, keyCode)
    {
        var parentNode = this.getTabContent();
        Lib.eraseNode(parentNode);

        var caseSensitive = Options.getPref("search.caseSensitive");
        var result = this.tabView.analyzer.findObjects(text, caseSensitive);
        if (!result)
        {
            this.renderGraph();
            return false;
        }

        var tableLayout = Options.getPref("search.tableLayout");
        if (tableLayout)
        {
            // Render objects as a table.
            ObjectTableView.render(parentNode, result);
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

        items.push({
            label: "Find Zombie Documents",
            command: Lib.bindFixed(this.doSearch, this, "nsDocument")
        });
        items.push({
            label: "Find Zombie HTTP Elements",
            command: Lib.bindFixed(this.doSearch, this, "http")
        });

        // Also append derived search options.
        return items.concat(BaseTab.prototype.getSearchOptions.apply(this, arguments));
    },

    doSearch: function(text)
    {
        var tab = Lib.getAncestorByClass(this.getTabContent(), "tabBody");
        Search.Box.doSearch(text, tab);
    },
});

// ********************************************************************************************* //

return HomeTab;

// ********************************************************************************************* //
}});
