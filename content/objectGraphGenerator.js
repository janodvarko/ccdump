/* See license.txt for terms of usage */

define([
],
function() { with (Domplate) {

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

        var obj = new ObjectGraphGenerator.Object(o);
        obj.name = o.name;
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

ObjectGraphGenerator.Object = function(obj)
{
    // A private member, ObjectTree template doesn't display those.
    this._o = obj;
}

// ********************************************************************************************* //

return ObjectGraphGenerator;

// ********************************************************************************************* //
}});
