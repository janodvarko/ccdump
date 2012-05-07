/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "tabs/dynamicTab",
    "lib/options",
    "app/objectTree",
    "app/objectGraphGenerator",
    "app/objectTableView",
],

function(Domplate, Lib, FBTrace, DynamicTab, Options, ObjectTree, ObjectGraphGenerator,
    ObjectTableView) {
with (Domplate) {

// ********************************************************************************************* //
// Graph Tab

/**
 * This tab is responsible for displaying a sub-graph of objects that are related
 * (through and edge) directly or idirectly to the selected object.
 */
function GraphTab()
{
}

GraphTab.prototype = Lib.extend(DynamicTab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "Graph",
    label: "Graph",

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Templates

    noGraph:
        SPAN("No graph found"),

    infoBarItem:
        SPAN({"class": "infoBarItem toolbarButton", title: "Cycle Collector sub-graph info"}),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Toolbar

    getToolbarButtons: function()
    {
        this.toolbar.noSeparators = true;

        var buttons = [];
        buttons.push({
            id: "infoBar",
            tag: this.infoBarItem
        });

        return buttons.concat(DynamicTab.prototype.getToolbarButtons.apply(this, arguments));
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    onUpdateBody: function(tabView, body)
    {
        DynamicTab.prototype.onUpdateBody.apply(this, arguments);

        // Render an empty tab content if there is no selection.
        var content = body.querySelector(".tabContent");
        var selection = tabView.selection;
        if (!selection)
        {
            this.noSelection.replace({}, content);
            return;
        }

        // Search the whole CC graph for subgraph related to the selected object.
        // The processing is done asynchronously. This tab object is used for callbacks
        // (onProgress and onFinish)
        var searchId = this.tabView.analyzer.getSearchId();
        this.generator = new ObjectGraphGenerator(searchId);
        this.generator.findGraph(selection, this);
    },

    renderGraph: function(parentNode)
    {
        Lib.eraseNode(parentNode);

        if (Lib.hasProperties(this.graph))
        {
            var tree = new ObjectTree(this.graph);
            tree.append(parentNode, true);
        }
        else
        {
            this.noGraph.replace({}, parentNode);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Progress

    onProgress: function(generator)
    {
        var label = this.toolbar.element.querySelector(".infoBarItem");
        var text = "Objects to process: " + generator.stack.length;
        label.innerHTML = text;
    },

    onFinish: function(generator)
    {
        this.graph = generator.graph;

        // Update info bar item in the toolbar.
        var label = this.toolbar.element.querySelector(".infoBarItem");
        var text = "Collected: " + generator.counter + " objects";
        label.innerHTML = text;

        var content = this.getTabContent();
        this.renderGraph(content);

        this.generator = null;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Handlers

    /**
     * Executed when the tab is closed.
     */
    onClose: function()
    {
        // If graph generator is currently in progress cancel it.
        if (this.generator)
            this.generator.cancel();
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Search

    onSearch: function(text, keyCode)
    {
        if (!this.graph)
            return;

        var results = [];

        if (text)
        {
            var caseSensitive = Options.getPref("search.caseSensitive");
            if (!caseSensitive)
                text = text.toLowerCase();

            var iterator = new GraphIterator(this.graph);
            var searchId = this.tabView.analyzer.getSearchId();
            iterator.run(searchId, function(obj)
            {
                var name = obj ? obj.name : "";
                if (!caseSensitive)
                    name = name.toLowerCase();

                if (name.indexOf(text) >= 0)
                    results.push(obj);
            });
        }

        var content = this.getTabContent();

        // Show search results if any; otherwise display the original graph.
        if (results.length)
        {
            var table = new ObjectTableView();
            table.render(content, results);
        }
        else
        {
            this.renderGraph(content);
        }

        return true;
    },

    getSearchOptions: function()
    {
        var items = DynamicTab.prototype.getSearchOptions.apply(this, arguments);
        return items;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Object Menu

    /**
     * Extending the "object context menu" with a new item. This extension is only applied
     * to this tab.
     * 
     * @param {Object} target Clicked target element
     * @param {Object} object Object associated with the clicked target.
     * @param {Object} items List of items in the context menu.
     */
    getObjectMenuItems: function(target, object, items)
    {
        items.push("-");
        items.push({
            label: "Path to Graph Root",
            command: Lib.bindFixed(this.onShowPath, this, target, object)
        });
    },

    onShowPath: function(target, object)
    {
        // Fire navigate event. It's processed by {@link TabNavigator}.
        Lib.fireEvent(target, "navigate", {
            type: "tabs/pathTab",
            selection: this.tabView.selection,
            object: object.value ? object.value._o : object
        });
    }
});

// ********************************************************************************************* //

// This iterator is used for searching within the current sub-graph.
function GraphIterator(graph)
{
    this.graph = graph;
}

GraphIterator.prototype =
{
    run: function(searchId, callback)
    {
        this.searchId = searchId;
        this.callback = callback;

        this._iterate(this.graph);
    },

    _iterate: function(obj)
    {
        if (obj._searchMark == this.searchId)
            return;

        obj._searchMark = this.searchId;

        this.callback(obj._o);

        for (var prop in obj)
        {
            var child = obj[prop];
            if (child instanceof ObjectGraphGenerator.Object)
                this._iterate(child);
        }
    }
}

// ********************************************************************************************* //

return GraphTab;

// ********************************************************************************************* //
}});
