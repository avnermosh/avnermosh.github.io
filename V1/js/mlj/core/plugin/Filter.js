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
 * @file Defines the basic class to create a filter plugin
 * @author Stefano Gabriele
 */


MLJ.core.plugin.Filter = function (parameters) {

    MLJ.core.plugin.Plugin.call(this, parameters.name, parameters);
    var _this = this;

    var entry = new MLJ.gui.component.AccordionEntry(
            {label: parameters.name, tooltip: parameters.tooltip});

    //Test if arity is number and is integer
    if (!(Math.floor(parameters.arity) === parameters.arity &&
            jQuery.isNumeric(parameters.arity))) {
        parameters.arity = 1;
    }

    var filterBuilder = new MLJ.core.plugin.GUIBuilder(entry);

    $(document).on("mljSearchSelect", function (ev, select) {
        var found = false;
        var tooltipMatch, nameMatch;
        for (var i = 0, m = select.length; i < m; i++) {

            tooltipMatch = parameters.tooltip
                    ? parameters.tooltip.indexOf(select[i]) != -1 : false;

            nameMatch = parameters.name.indexOf(select[i]) != -1;

            if (nameMatch || tooltipMatch) {
                entry.show();
                found = true;
                //exit from for cycle
                i = select.length;
            }
        }

        if (!found) {
            entry.hide();
        }

        //MLJ.widget.TabbedPane.getFiltersAccord().refresh();
    });

    this._main = function () {
        MLJ.widget.TabbedPane.getFiltersAccord().addEntry(entry);

        var apply = new MLJ.gui.component.Button({
            tooltip: "Apply to selected layer",
            icon: "img/icons/apply.png",
        });

        entry.addHeaderButton(apply);
        apply.onClick(function () {
            //reset of all the boolean CalledPtrMesh and clear of the mesh history after the current time
            var layersIt = MLJ.core.Model.getLayers().iterator();
            while (layersIt.hasNext())
            {
                var layerTmp = layersIt.next();
                layerTmp.resetCalledPtrMesh();
                layerTmp.cppMesh.Clear(MLJ.core.Scene.timeStamp);
            }
            //clear of the history of changes after current time
            for (var i = MLJ.core.Scene.timeStamp+1; i < MLJ.core.Scene.layerSetHistory.length; i++)
                MLJ.core.Scene.layerSetHistory.pop();
            var t0 = performance.now();
            switch (_this.parameters.arity)
            {
                case 0:  // Creation Filters (they do not rely on a "current layer"
                case 3:  // Filter that apply to ALL layer (flatten) 
                    _this._applyTo();
                    break;
                case -1:  // DeleteFilter
                case 1:  // Standard filters that apply to a single mesh
                case 2:  // 
                    _this._applyTo(MLJ.core.Scene.getSelectedLayer());
                    break;
                default:
                    alert("Error filter");
            }
            var t1 = performance.now();
            MLJ.core.Scene.updateLayer(MLJ.core.Scene.getSelectedLayer());
            MLJ.core.Scene.addStateToHistory()
            //trigger button events
            $(document).trigger("Redo", MLJ.core.Scene.timeStamp);
            $(document).trigger("Undo", MLJ.core.Scene.timeStamp-1);
            MLJ.widget.Log.append(_this.name + " execution time " + Math.round(t1 - t0) + " ms");
        });

        if (parameters.arity !== 0) {
            MLJ.gui.disabledOnSceneEmpty(apply);
        }


        _this._init(filterBuilder);

    };
};

MLJ.extend(MLJ.core.plugin.Plugin, MLJ.core.plugin.Filter);
