/* See license.txt for terms of usage */

define([
    "lib/trace",
],
function(FBTrace) { with (Domplate) {

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

    findGraph: function(o, callback)
    {
        if (!o)
            return null;

        this.callback = callback;
        this.counter = 0;

        this.res = {};

        this.queue = [{
            o: o,
            name: o.address,
            res: this.res
        }];

        // Start asynchronous processing of the graph.
        this.process();
    },

    process: function()
    {
        for (var i=0; i<1000; i++)
        {
            if (!this.queue.length)
            {
                FBTrace.sysout("objectGraphGenerator.findGraph; DONE", this.res);
                this.callback(this.res);
                return;
            }

            var o = this.queue.shift();
            this.getObjectGraph(o.o, o.name, o.res);
        }

        FBTrace.sysout("objectGraphGenerator.findGraph; PROGRESS " + this.queue.length);

        // Next chunk on timeout.
        setTimeout(this.process.bind(this), 125);
    },

    getObjectGraph: function(o, name, res)
    {
        if (o._searchMark == this.searchId)
            return;

        o._searchMark = this.searchId;

        var obj = new ObjectGraphGenerator.Object(o);
        obj.name = o.name;
        res[this.ensureUniqueName(res, name)] = obj;

        // Just counting number of objects in the sub-graph
        this.counter++;

        /*for (var i=0; i<o.owners.length; i++)
        {
            var owner = o.owners[i];
            this.queue.push({
                o: owner.from,
                name: owner.name ? owner.name : "<unknown-owner>",
                res: obj
            });
            //this.getObjectGraph(owner.from, owner.name ? owner.name : "<unknown-owner>", obj);
        }*/

        for (var i=0; i<o.edges.length; i++)
        {
            var edge = o.edges[i];
            this.queue.push({
                o: edge.to,
                name: edge.name ? edge.name : "<unknown-edge>",
                res: obj
            });
            //this.getObjectGraph(edge.to, edge.name ? edge.name : "<unknown-edge>", obj);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Helpers

    ensureUniqueName: function(obj, name)
    {
        var newName = name;
        //var counter = 0;
        while (obj[newName])
            newName = name + " {" + (Math.random()) + "}";
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
