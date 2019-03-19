////////////////////////////////////////////////////////////////
//
// The Model file is 
//
////////////////////////////////////////////////////////////////

/**
 * @file Defines the Model class
 */

/**         
 * @class Creates a new Model 
 * @param {String} name The name of the mesh file
 * @memberOf MLJ.core
 */


MLJ.core.Model = {};
(function (id, name)
{
    console.log('BEG MLJ.core.Model');

    this.releaseVersion = 1.0;
    this.modelVersion = null;
    this._layers = new MLJ.util.AssociativeArray();
    this._selectedLayer = null;
    this._structureObjFileName = "structure.obj";
    this._overlayObjFileName = "overlay.obj";
    this._zipFileArrayBuffer;
    this._zipLoaderInstance = -1;
    
    var _this = this;

    this.getZipFileArrayBuffer = function () {
        return this._zipFileArrayBuffer;
    };

    this.setZipFileArrayBuffer = function (zipFileArrayBuffer) {
        this._zipFileArrayBuffer = zipFileArrayBuffer;
    };

    this.getZipLoaderInstance = function () {
        return this._zipLoaderInstance;
    };

    this.setZipLoaderInstance = function (zipLoaderInstance) {
        this._zipLoaderInstance = zipLoaderInstance;
    };

    this.getStructureObjFileName = function () {
        return this._structureObjFileName;
    };

    this.setStructureObjFileName = function (structureObjFileName) {
        this._structureObjFileName = structureObjFileName;
    };

    this.getOverlayObjFileName = function () {
        return this._overlayObjFileName;
    };

    this.setOverlayObjFileName = function (overlayObjFileName) {
        this._overlayObjFileName = overlayObjFileName;
    };
    
    this.getReleaseVersion = function () {
        return this.releaseVersion;
    };

    this.setReleaseVersion = function (releaseVersion) {
        this.releaseVersion = releaseVersion;
    };

    this.getModelVersion = function () {
        return this.modelVersion;
    };

    this.setModelVersion = function (modelVersion) {
        this.modelVersion = modelVersion;
    };

    var lastID = 0;
    this.createLayer = function (layerName) {
        // layerName = "MyLayer";

        // remove layer from list if layer by such name exist before creating a new layer
        _this.removeLayerByName(layerName);
        
        var layer = new MLJ.core.Layer(lastID++, layerName);

        return layer;
    };

    this.getLayerByName = function (name) {
        return this._layers.getByKey(name);
    };

    this.addLayer = function (layer) {
        // TBD - why addLayer is called multiple times
        
        if (!(layer instanceof MLJ.core.Layer)) {
            console.error("The parameter must be an instance of MLJ.core.Layer");
            return;
        }

        // Initialize the THREE geometry used by overlays and rendering params
        layer.initializeRenderingAttributes();
        // _group3D.add(layer.getThreeMesh());

        //Add new mesh to associative array _layers            
        this._layers.set(layer.name, layer);
        
        this._selectedLayer = layer;

        // let floorInfo = this._selectedLayer.floorInfoArray.getFirst();
        let floorInfoArray = this._selectedLayer.getFloorInfoArray();
        let floorInfo = floorInfoArray.getFirst();
        this._selectedLayer.setSelectedFloorInfo(floorInfo.name);

        $(document).trigger("SceneLayerAdded", [layer, this._layers.size()]);
        MLJ.core.Scene3DtopDown.render();
    };

    this.selectLayerByName = function (layerName) {
        this._selectedLayer = this._layers.getByKey(layerName);
        $(document).trigger("SceneLayerSelected", [this._selectedLayer]);
    };

    this.removeLayerByName = function (name) {
        var layer = this.getLayerByName(name);

        if (layer !== undefined) {

            layer = this._layers.remove(layer.name);
            
            $(document).trigger("SceneLayerRemoved", [layer, this._layers.size()]);
            if (layer) {
                layer.dispose();
                layer = null;
                // delete layer;
            }

            if (this._layers.size() > 0) {
                _this.selectLayerByName(this._layers.getFirst().name);
            } else {
                _this._selectedLayer = undefined;
            }
            MLJ.core.Scene3DtopDown.render();
        }
    };

    this.updateLayer = function (layer) {
        if (layer instanceof MLJ.core.Layer) {
            if (this._layers.getByKey(layer.name) === undefined) {
                console.warn("Trying to update a layer not in the scene.");
                return;
            }
            layer.updateThreeMesh();
            //render the scene
            MLJ.core.Scene3DtopDown.render();
            /**
             *  Triggered when a layer is updated
             *  @event MLJ.core.Scene3D#SceneLayerUpdated
             *  @type {Object}
             *  @property {MLJ.core.Layer} layer The updated mesh file
             *  @example
             *  <caption>Event Interception:</caption>
             *  $(document).on("SceneLayerUpdated",
             *      function (event, layer) {
             *          //do something
             *      }
             *  );
             */
            $(document).trigger("SceneLayerUpdated", [layer]);

        } else {
            console.error("The parameter must be an instance of MLJ.core.Layer");
        }
    };
    
    this.getSelectedLayer = function () {
        return this._selectedLayer;
    };

    this.getLayers = function () {
        return this._layers;
    };


    /**
     * Removes the object from memory
     */
    this.dispose = function () {

        this.name = null;
        _this = null;
    };

    this.isStickyNotesEnabled = function () {
        return false;
        // return true;
    }

    this.isScene3DpaneEnabled = function () {
        return false;
        // return true;
    }

    // this.initModel = function () {
    $(document).on("MeshFileOpened", function (event, layer) {
        MLJ.core.Model.addLayer(layer);
    });

    $(document).on("MeshFileReloaded",
                   function (event, layer) {
                       // Restore three geometry to reflect the new state of the vcg mesh
                       layer.updateThreeMesh();
                       $(document).trigger("SceneLayerReloaded", [layer]);
                   });

}).call(MLJ.core.Model);


