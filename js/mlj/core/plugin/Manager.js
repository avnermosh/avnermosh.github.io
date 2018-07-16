/**
 * MLJLib
 * MeshLabJS Library
 * 
 * Copyright(C) 2015
 * Paolo Cignoni 
 * Visual Computing Lab
 * ISTI - CNR
 * 
 * All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify it under 
 * the terms of the GNU General Public License as published by the Free Software 
 * Foundation; either version 2 of the License, or (at your option) any later 
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT 
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS 
 * FOR A PARTICULAR PURPOSE. See theGNU General Public License 
 * (http://www.gnu.org/licenses/gpl.txt) for more details.
 * 
 */

/**
 * @file Defines the functions to manage and install plugins
 * @author Stefano Gabriele
 */

/**
 * MLJ.core.plugin.Manager
 * @author Stefano Gabriele
 */
MLJ.core.plugin.Manager = {
};

(function (widget, gui) {

    var _texture = new MLJ.util.AssociativeArray();

    /**
     * Installs a new plugin in MeshLabJS
     * @memberOf MLJ.core.plugin
     * @author Stefano Gabriele
     * It performs two tasks:
     *  * add the filter/rendering plugin in the corresponding
     *    list of plugins. 
     *  * add the name and the tooltip string to the set of string to be searched
     */
    this.install = function () {
        var plugin;
        for (var i = 0; i < arguments.length; i++) {
            plugin = arguments[i];
            if (plugin instanceof MLJ.core.plugin.Plugin) {
                if (plugin instanceof MLJ.core.plugin.Texturing){
                    _texture.set(plugin.getName(), plugin);                    
                }
            } else {
                console.error("The parameter must be an instance of MLJ.core.Plugin");
            }
        }
    };

    /**
     * Executes the main entry point function for all installed plugins
     * It is called only in the index.html after loading all the js plugins
     * to perform all the proper initialization and GUI setup 
     * (e.g. it will call for each plugin the _init())
     * @memberOf MLJ.core.plugin
     * @author Stefano Gabriele
     */
    this.run = function () {
        
        ptr = _texture.iterator();
        while (ptr.hasNext()) {
            ptr.next()._main();
        }

    };

}).call(MLJ.core.plugin.Manager, MLJ.widget, MLJ.gui);//MLJ.widget contains GUI running widgets
