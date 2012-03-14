/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "tabs/baseTab",
    "lib/options",
    "app/objectTree",
    "app/objectGraphGenerator",
    "app/objectTableView",
],

function(Domplate, Lib, FBTrace, BaseTab, Options, ObjectTree, ObjectGraphGenerator,
    ObjectTableView) {
with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function GraphTab()
{
}

GraphTab.prototype = Lib.extend(BaseTab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "Graph",
    label: "Graph",

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    noGraph:
        SPAN("No graph found"),

    onUpdateBody: function(tabView, body)
    {
        BaseTab.prototype.onUpdateBody.apply(this, arguments);

        // Render tab content.
        var content = body.querySelector(".tabContent");
        var selection = tabView.selection;
        if (!selection)
        {
            this.noSelection.replace({}, content);
            return;
        }

        var searchId = this.tabView.analyzer.getSearchId();
        var generator = new ObjectGraphGenerator(searchId);
        this.graph = generator.findGraph(selection);

        this.renderGraph(content);
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

        var content = this._body.querySelector(".tabContent");

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
        var items = BaseTab.prototype.getSearchOptions.apply(this, arguments);
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
        if (obj.searchMark == this.searchId)
            return;

        obj.searchMark = this.searchId;

        this.callback(obj._o);

        for each (var child in obj)
        {
            if (child instanceof ObjectGraphGenerator.Object)
                this._iterate(child);
        }
    }
}

// ********************************************************************************************* //

return GraphTab;

// ********************************************************************************************* //
}});
