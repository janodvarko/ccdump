/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "tabs/baseTab",
    "lib/trace",
    "app/objectTree",
    "tabs/search",
    "app/graphSerializer",
    "lib/options",
    "app/objectTableView",
    "app/objectFinder"
],
function(Domplate, Lib, BaseTab, FBTrace, ObjectTree, Search, GraphSerializer, Options,
    ObjectTableView, ObjectFinder) {

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
            "Run CC Analysis to start hunting memory leaks"
        ),

    progressToolbarItem:
        SPAN({"class": "progressLabel toolbarButton", title: "Cycle Collector Graph Info"}),

    noResults:
        SPAN("No Results"),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Toolbar

    getToolbarButtons: function()
    {
        this.toolbar.noSeparators = true;

        var buttons = [];

        buttons.push({
            id: "cleanUp",
            label: "Clean Up",
            tooltiptext: "Trash all collected data",
            className: "cleanUp",
            command: this.onCleanUp.bind(this)
        });

        buttons.push({
            id: "run",
            label: "Run CC Analysis",
            tooltiptext: "Run Cycle Collector Analysis",
            className: "run",
            command: this.onRun.bind(this),
            getItems: this.getRunOptions.bind(this)
        });

        buttons.push({
            id: "progress",
            tag: this.progressToolbarItem
        });

        buttons.push({
            id: "save",
            tooltiptext: "Save the log into a file",
            className: "save",
            command: this.onSave.bind(this)
        });

        buttons.push({
            id: "showRoots",
            label: "Show Roots",
            tooltiptext: "Show all root objects",
            className: "showRoots",
            command: this.onShowRoots.bind(this)
        });

        return buttons.concat(BaseTab.prototype.getToolbarButtons.apply(this, arguments));
    },

    getRunOptions: function()
    {
        var items = [];
        items.push({
            label: "Trace All",
            checked: Options.getPref("traceAll"),
            command: this.onOption.bind(this, "traceAll")
        });

        items.push("-");
        items.push({
            label: "Load From File",
            command: this.onLoad.bind(this)
        });

        return items;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    onUpdateBody: function(tabView, body)
    {
        BaseTab.prototype.onUpdateBody.apply(this, arguments);

        // Set UI into the default state.
        this.resetUI();

        // Display the default content
        var content = this.getTabContent();
        this.defaultContentTag.replace({}, content);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Event Handlers

    onRun: function(event)
    {
        this.resetUI();

        // Run CC collector. Disable the run button to avoid clicks during processing.
        this.toolbar.disableButton("run");
        this.tabView.analyzer.run(this);

        // Reset the progress info.
        this.onProgress(this.tabView.analyzer);
    },

    onSave: function()
    {
        var self = this;
        GraphSerializer.saveToFile(function()
        {
            return GraphSerializer.toJSON(self.tabView.analyzer);
        });
        
    },

    onLoad: function()
    {
        this.resetUI();

        GraphSerializer.loadFromFile(this.tabView.analyzer);
        this.onFinished(this.tabView.analyzer);
    },

    onCleanUp: function()
    {
        document.location.reload();
    },

    onShowRoots: function()
    {
        Lib.fireEvent(this.getTabContent(), "navigate", {
            type: "Roots",
            selection: {value: this.tabView.analyzer.roots}
        });
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // UI Update

    /**
     * This method should reset the UI and get rid of all references that could keep
     * the result graph in the memory.
     */
    resetUI: function()
    {
        this.tabView.analyzer.clear();

        // Update progress label.
        this.onProgress(this.tabView.analyzer);

        var parentNode = this.getTabContent();
        Lib.eraseNode(parentNode);

        // Make sure the other tabs doesn't contain any references to the current graph.
        // It would dramatically increase number of objects in the next CC graph.
        for each (var tab in this.tabView.tabs)
        {
            if (tab != this)
                tab.invalidate();
        }

        //xxxHonza: close dynamically appended tabs?

        this.tabView.selection = null;

        this.toolbar.enableButton("run");
        this.toolbar.hideButton("save");
        this.toolbar.disableButton("cleanUp");
        this.toolbar.disableButton("search");
        this.toolbar.hideButton("showRoots");
    },

    enableUI: function()
    {
        this.toolbar.enableButton("run");
        this.toolbar.showButton("save");
        this.toolbar.enableButton("cleanUp");
        this.toolbar.enableButton("search");
        this.toolbar.showButton("showRoots");
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Progress

    onProgress: function(analyzer)
    {
        var label = this.toolbar.element.querySelector(".progressLabel");
        var text = "Collected: " + Object.keys(analyzer.graph).length + " objects, " +
            analyzer.roots.length + " roots, " +
            analyzer.garbage.length + " garbage, " +
            analyzer.edges.length + " edges";

        label.innerHTML = analyzer.isEmpty() ? "" : text;
    },

    onFinished: function(analyzer)
    {
        // Update UI and render the restult graph
        this.onProgress(analyzer);
        this.enableUI();
        this.renderGraph();

        // Do automatic search if there is something in the search box.
        var text = Search.Box.getValue(this.getSearchBox());
        if (text)
            this.doSearch(text);
    },

    renderGraph: function()
    {
        var parentNode = this.getTabContent();
        var table = new ObjectTableView();
        table.render(parentNode, this.tabView.analyzer.graph);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Search

    onSearch: function(text, keyCode)
    {
        if (this.tabView.analyzer.isEmpty())
        {
            return;
        }

        var parentNode = this.getTabContent();
        Lib.eraseNode(parentNode);

        var caseSensitive = Options.getPref("search.caseSensitive");
        var useRegExp = Options.getPref("search.useRegExp");

        var finder = new ObjectFinder(this.tabView.analyzer.graph);
        var result = finder.findObjects(text, caseSensitive, useRegExp);
        if (!result && !text)
        {
            this.renderGraph();
            return false;
        }

        if (!result)
        {
            this.noResults.append({}, parentNode);
            return false;
        }

        var tableLayout = Options.getPref("search.tableLayout");
        if (tableLayout)
        {
            // Render objects as a table.
            var table = new ObjectTableView();
            table.render(parentNode, result);
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
