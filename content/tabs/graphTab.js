/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "tabs/BaseTab",
    "lib/options",
    "objectTree",
    "objectGraphGenerator",
    "objectTableView"
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

    bodyTag:
        DIV({"class": ""},
            DIV({"class": "tabToolbar"}),
            DIV({"class": "tabContent"})
        ),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    noSelection:
        SPAN("No object selected"),

    noGraph:
        SPAN("No graph found"),

    onUpdateBody: function(tabView, body)
    {
        BaseTab.prototype.onUpdateBody.apply(this, arguments);

        var content = body.querySelector(".tabContent");
        this.selection = tabView.selection;
        if (!this.selection)
        {
            this.noSelection.replace({}, content);
            return;
        }

        var searchId = this.tabView.analyzer.getSearchId();
        var generator = new ObjectGraphGenerator(searchId);
        this.graph = generator.findGraph(this.selection);

        if (Lib.hasProperties(this.graph))
        {
            var tree = new ObjectTree(this.graph);
            tree.append(content, true);
        }
        else
        {
            this.noGraph.replace({}, content);
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
        Lib.eraseNode(content);

        if (!results.length)
        {
            var tree = new ObjectTree(this.graph);
            tree.append(content, true);
            return false;
        }

        ObjectTableView.render(content, results);

        return true;
    },

    getSearchOptions: function()
    {
        var items = BaseTab.prototype.getSearchOptions.apply(this, arguments);

        return items;
    },
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
