/* See license.txt for terms of usage */

define([
    "lib/trace",
],
function(FBTrace) { with (Domplate) {

// ********************************************************************************************* //
// Graph Generator

/**
 * Returns graph as a tree of edges for specified object. This structure is simplier than
 * the original object-graph, which eliminates amount of clickint in the UI when exploring it.
 *
 * The graph is generated asynchronously to avoid UI freezing.
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

        this.graph = {};

        // The algorithm is using a stack queue instea of recursion and so,
        // it can be simply divided into more smaller tasks executed
        // asynchronously
        this.stack = [{
            o: o,
            name: o.address,
            res: this.graph
        }];

        // Start asynchronous processing.
        this.process();
    },

    process: function()
    {
        // Process the stack in 1K chunks
        for (var i=0; i<1000; i++)
        {
            // If there is nothing else to process it's done.
            if (!this.stack.length)
                return this.onFinish();

            // Process the first node from the stack.
            var o = this.stack.shift();
            this.getObjectGraph(o.o, o.name, o.res);
        }

        // Update UI
        this.onProgress();

        // Next chunk on timeout.
        this.timeout = setTimeout(this.process.bind(this), 125);
    },

    // If the user closes the tab before finish.
    cancel: function()
    {
        if (this.timeout)
            clearTimeout(this.timeout);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Callbacks

    onProgress: function()
    {
        this.callback.onProgress.call(this.callback, this);
    },

    onFinish: function()
    {
        this.timeout = null;
        this.callback.onFinish.call(this.callback, this);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

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

        // Get all edges of the objects and put them onto the stack for further processing.
        for (var i=0; i<o.edges.length; i++)
        {
            var edge = o.edges[i];
            this.stack.push({
                o: edge.to,
                name: edge.name ? edge.name : "<unknown-edge>",
                res: obj
            });
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Helpers

    ensureUniqueName: function(obj, name)
    {
        var newName = name;
        while (obj[newName])
            newName = name + " {" + (Math.random().toString().substr(2)) + "}";
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
