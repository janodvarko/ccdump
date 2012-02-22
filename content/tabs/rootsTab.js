/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "lib/tabView",
    "objectTree",
],

function(Domplate, Lib, FBTrace, TabView, ObjectTree) { with (Domplate) {

// ********************************************************************************************* //
// Home Tab

function RootsTab() {}
RootsTab.prototype = Lib.extend(TabView.Tab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "Roots",
    label: "Details",

    bodyTag:
        DIV({"class": "RootsBody"}),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    noAnalyses:
        SPAN("Run CC Collector to start analysis"),

    noObject:
        SPAN("No object specified"),

    invalidate: function()
    {
        TabView.Tab.prototype.invalidate.apply(this, arguments);

        this.currObject = null;
    },

    onUpdateBody: function(tabView, body)
    {
        if (tabView.analyzer.isEmpty())
        {
            this.noAnalyses.replace({}, body);
            return;
        }

        if (!this.currObject)
        {
            this.noObject.replace({}, body);
            return;
        }

        var results = this.analyzeGraph(this.currGraphType, this.currObject);
        if (Lib.hasProperties(results))
        {
            var tree = new ObjectTree(results);
            tree.append(body, true);
        }
        else
        {
            this.noObject.replace({}, body);
        }
    },

    analyzeGraph: function(type, obj)
    {
        //FBTrace.sysout("type: " + type + ", ob: " + obj, obj);

        if (!obj)
            return;

        switch (type)
        {
        case "roots":
            return this.tabView.analyzer.findRoots(obj.address, true);

        case "graph":
            return this.getAllOwners(obj);

        case "details":
            return obj;
        }
    },

    getAllOwners: function(obj)
    {
        var searchId = this.tabView.analyzer.getSearchId();
        var generator = new ObjectGraphGenerator(searchId);
        return generator.findGraph(obj);
    }
});

// ********************************************************************************************* //
// Graph Generator

/**
 * Returns graph as a tree of owners and edges for specified object.
 */
function ObjectGraphGenerator(searchId)
{
    this.searchId = searchId;
}

ObjectGraphGenerator.prototype =
{
    findGraph: function(o)
    {
        if (!o)
            return null;

        this.counter = 0;

        var res = {};
        this.getObjectGraph(o, o.address, res);
        return res;
    },

    getObjectGraph: function(o, name, res)
    {
        if (o.searchMark == this.searchId)
            return;

        o.searchMark = this.searchId;

        this.counter++;

        var obj = {name: o.name}
        res[this.ensureUniqueName(res, name)] = obj;

        for each (var owner in o.owners)
        {
            this.getObjectGraph(owner.from,
                owner.name ? owner.name : "<unknown-owner>",
                obj);
        }

        for each (var edge in o.edges)
        {
            this.getObjectGraph(edge.to,
                edge.name ? edge.name : "<unknown-edge>",
                obj);
        }
    },

    ensureUniqueName: function(obj, name)
    {
        var newName = name;
        var counter = 0;
        while (obj[newName])
            newName = name + (++counter);
        return newName;
    }
}

// ********************************************************************************************* //

return RootsTab;

// ********************************************************************************************* //
}});
