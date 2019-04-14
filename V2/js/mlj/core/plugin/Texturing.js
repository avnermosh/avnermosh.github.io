////////////////////////////////////////////////////////////////
//
// This file (js/mlj/core/plugin/Texturing.js) is responsible to do ???
//
// for comparison the file MLJ.core.plugin.TexturePanelPlugin.js (in mlj/plugins/rendering/) does xxx
////////////////////////////////////////////////////////////////

    
var globalIndex = 0;
MLJ.core.plugin.Texturing = function (parameters, defaults) {
    // console.log('BEG MLJ.core.plugin.Texturing');
    
    MLJ.core.plugin.Plugin.call(this, parameters.name, parameters);

    var _this = this;
    MLJ.core.setDefaults(_this.getName(), defaults)
    var texCanvasComponent = new MLJ.gui.component.Component();
    var guiBuilder = new MLJ.core.plugin.GUIBuilder(texCanvasComponent);
    var UID = MLJ.gui.generateUID();

    this._main = function () {    
        _this._init(guiBuilder);
        texCanvasComponent.$.hide();
    };

    this._setOnParamChange = guiBuilder.setOnParamChange;

    this._setOnParamChange(function (paramProp, value) {
        
        globalIndex++;

        // update parameter
        var layer = MLJ.core.Model.getSelectedLayer();
        if (layer === undefined)
        {
            return;
        }

        //the selectedTexture param is layer-dependent and not texture-dependent
        if (paramProp === "selectedTexture") {
            if (value <= layer.texturesNum) //Fix in case the other texture had more texture than the new one
            {
                layer.selectedTexture = value;
            }
            else
            {
                layer.selectedTexture = 0;
            }
        }

        if (jQuery.isFunction(paramProp)) { //is 'bindTo' property a function?
            paramProp(value);
        }
    });

    $(document).on("SceneLayerAdded", function (event, layer) {
        //The texCanvasComponent will be shown only when the first mesh is loaded
        //it is the only way to hide
        if (MLJ.core.Model.getLayers().size() === 1)
        {
            texCanvasComponent.$.show();
        }

        _this._applyTo(layer, 1, $);
    });

    $(document).on("SceneLayerSelected", function (event, layer) {
        _this._applyTo(layer, 1, $);
    });

    $(document).on("SceneLayerRemoved", function (event, layer, layersNum) {
        _this._applyTo(layer, layersNum, $);
    });

    $(document).on("Texture2FileOpened", function (event, texture3) {

        var layer = MLJ.core.Model.getSelectedLayer();
        if (layer === undefined)
        {
            return;
        }
        
        layer.texture[0] = texture3;
        
        if (MLJ.core.Model.getLayers().size() === 1)
        {
            texCanvasComponent.$.show();
        }

        _this._applyTo(layer, 1, $);
    });

};
MLJ.extend(MLJ.core.plugin.Plugin, MLJ.core.plugin.Texturing);
