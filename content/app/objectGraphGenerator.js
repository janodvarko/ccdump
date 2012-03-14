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
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Graph

    findGraph: function(o)
    {
        if (!o)
            return null;

        var res = {};
        this.getObjectGraph(o, o.address, res);
        return res;
    },

    getObjectGraph: function(o, name, res)
    {
        if (o.searchMark == this.searchId)
            return;

        o.searchMark = this.searchId;

        var obj = new ObjectGraphGenerator.Object(o);
        obj.name = o.name;
        res[this.ensureUniqueName(res, name)] = obj;

        for each (var owner in o.owners)
            this.getObjectGraph(owner.from, owner.name ? owner.name : "<unknown-owner>", obj);

        for each (var edge in o.edges)
            this.getObjectGraph(edge.to, edge.name ? edge.name : "<unknown-edge>", obj);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Path

    findPath: function(root, obj)
    {
        if (!obj)
            return null;

        this.root = root;

        var res = [];
        this.getObjectPath(obj, res);
        return res;
    },

    getObjectPath: function(o, res)
    {
        if (o.searchMark == this.searchId)
            return;

        o.searchMark = this.searchId;

        if (o == this.root)
        {
            res.push(o);
            return true;
        }

        for each (var owner in o.owners)
        {
            if (this.getObjectPath(owner.from, res))
            {
                res.push(o);
                return true;
            }
        }

        for each (var edge in o.edges)
        {
            if (this.getObjectPath(edge.to, res))
            {
                res.push(o);
                return true;
            }
        }

        return false;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Helpers

    ensureUniqueName: function(obj, name)
    {
        var newName = name;
        var counter = 0;
        while (obj[newName])
            newName = name + " {" + (++counter) + "}";
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
