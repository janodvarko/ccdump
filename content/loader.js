/* See license.txt for terms of usage */

// ********************************************************************************************* //
// Module Loader Implementation

var require = (function() {

// ********************************************************************************************* //
// Constants

var Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

// ********************************************************************************************* //
// Module Loader implementation

var Loader =
{
    modules: {},
    currentModule: [],

    require: function(config, modules, callback)
    {
        this.config = config ? config : this.config;
        this.currentModule = [];

        var main = this.modules["main"] = {
            scope: {}
        };

        this.currentModule.push(main);
        this.define(modules, callback);
    },

    define: function(moduleName, deps, callback)
    {
        // Module name doesn't have to be specified.
        if (arguments.length == 2)
        {
            callback = deps;
            deps = moduleName;
            moduleName = undefined;
        }

        var args = [];
        for (var i=0; i<deps.length; i++)
        {
            var id = deps[i];
            args.push(this.loadModule(id));
        }

        try
        {
            var module = this.currentModule[this.currentModule.length-1];
            module.exports = callback.apply(module.scope, args);
        }
        catch (err)
        {
            Cu.reportError(err);
        }
    },

    loadModule: function(moduleId)
    {
        var module = this.modules[moduleId];
        if (module)
            return module.exports;

        module = this.modules[moduleId] = {};
        module.scope = {
            define: this.define.bind(this)
        }

        var moduleUrl = this.getModuleUrl(moduleId) + ".js";

        try
        {
            this.currentModule.push(module);
            Services.scriptloader.loadSubScript(moduleUrl, module.scope);
        }
        catch (err)
        {
            Cu.reportError(moduleUrl);
            Cu.reportError(err);
        }
        finally
        {
            this.currentModule.pop();
        }

        // Exports (the module return value in case of AMD) is set in define function.
        return module.exports;
    },

    load: function(context, fullPath, url)
    {
        //xxxHonza: Remaping moved modules
    },

    getModuleUrl: function(moduleId)
    {
        var baseUrl = this.config.baseUrl;
        if (baseUrl.substr(-1) != "/")
            baseUrl += "/";

        // If there are no aliases just use baseUrl.
        if (!this.config.paths)
            return baseUrl + moduleId;

        // Get module id path parts (excluding the module name).
        var parts = moduleId.split("/");
        var moduleName = parts.pop();

        var self = this;
        var resolved = parts.map(function(part)
        {
            var alias = self.config.paths[part];
            return alias ? alias : part;
        });

        var moduleUrl = resolved.join("/");
        if (moduleUrl.substr(-1) != "/")
            moduleUrl += "/";

        moduleUrl += moduleName;

        var reProtocol = /^[^:]+(?=:\/\/)/;
        if (moduleUrl.match(reProtocol))
            return moduleUrl;

        // If there is no protocol, use baseUrl.
        return baseUrl + moduleUrl;
    }
}

// ********************************************************************************************* //

return Loader.require.bind(Loader);

// ********************************************************************************************* //
})();
