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
 * @file Defines the Layer class
 * @author Stefano Gabriele
 */

/**         
 * @class Creates a new Layer 
 * @param {String} name The name of the mesh file
 * @memberOf MLJ.core
 */
MLJ.core.Layer = function (id, name)
{
    console.log('BEG MLJ.core.Layer');

    this.mtlInfo = undefined;
    this.wallsInfo = [];
    this.objInstanceUuid = undefined;
    
    this.name = name;
    this.id = id;
    this.groupObject = undefined;
    this.materialForSelectedLine = undefined;
    this.materialForSelectedLine = new THREE.LineBasicMaterial({color: 0xffff00});
    
    /**
     * @type {String} - Set if a mesh is read from a file
     * (see {@link MLJ.core.MeshFile.openMeshFile}), defaults to the empty string
     */
    this.fileName = "";
    this.selectedTexture = 0;

    this.VN = this.FN = this.threeMesh = null;
    // Array of booleans that reflect what are the overlays on or off for this layer.
    this.properties = new MLJ.util.AssociativeArray();
    //is updated by MLJ.core.Scene and contains overlay ThreeJS objects
    this.overlays = new MLJ.util.AssociativeArray();
    //contains overlaying mesh parameters
    this.overlaysParams = new MLJ.util.AssociativeArray();

    var _this = this;

    this.initializeRenderingAttributes = function () {
        
        for (var pname in MLJ.core.defaults) {
            _this.overlaysParams.set(pname,
                    jQuery.extend(true, {}, MLJ.core.defaults[pname]));
        }

        // Select the appropriate color mode
        // var cw = _this.overlaysParams.getByKey("ColorWheel");
        var useIndex = true;

        console.time("Time to create mesh: ");
        // This Threejs object is used as a 'group' 
        // This node will have as children all the overlays of this layer.
        // It is also used to store in a single place the geometry that the overlay node will refer. 
        // So for example point overlay will use/refer the geometry buffers here defined
        // The node itself will never been rendered (material has the visibile flag == false).
        //  
        _this.threeMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({visible: false}));
        _this.updateMeshBufferData();

        console.timeEnd("Time to create mesh: ");

        // If the mesh is a point cloud, enable the "Points" rendering mode
        if (_this.VN > 0 && _this.FN === 0) {
            _this.properties.set("Filled", false);
            _this.properties.set("Points", true);
        }

        console.log('END initializeRenderingAttributes');
    };

    this.getMaterialForSelectedLine = function () {
        return _this.materialForSelectedLine;
    };

    this.getGroup = function () {
        return _this.groupObject;
    };

    this.setGroup = function (groupObject) {
        _this.groupObject = groupObject;
    };

    this.getObjInstanceUuid = function () {
        return _this.objInstanceUuid;
    };

    this.setObjInstanceUuid = function (objInstanceUuid) {
        _this.objInstanceUuid = objInstanceUuid;
    };

    this.getMtlInfo = function () {
        return _this.mtlInfo;
    };

    this.setMtlInfo = function (mtlInfo) {
        _this.mtlInfo = mtlInfo;
    };

    this.getWallsInfo = function () {
        return _this.wallsInfo;
    };

    this.setWallsInfo = function (wallsInfo) {
        _this.wallsInfo = wallsInfo;
    };

    // This functions prepares the buffers that can be used by all the rendering overlay
    // for mesh geometry we replicate per triangle all the vertex information (e.g. fn*3 vertexes) 
    // to allow simple per face data managment. 
    // Normal is duplicated and the buffers store the per vertex smooth normal. 
    // Per face normal is not kept but the fill rendering overlay compute it by using on screen derivatives.
    // For point clouds we obviously keep everything per vertex.

    this.updateMeshBufferData = function () {
    };  

    this.usingIndexedGeometry = function () {
        return (_this.threeMesh.geometry.getAttribute('index') !== undefined);
    };

    this.updateThreeMesh = function () {
        this.updateMeshBufferData();
    };

    /**
     * Returns this THREE.Mesh object
     * @returns {THREE.Mesh} this THREE.Mesh object
     * @author Stefano Gabriele     
     */
    this.getThreeMesh = function () {
        return this.threeMesh;
    };

    /**
     * Removes the object from memory
     * @author Stefano Gabriele     
     */
    this.dispose = function () {

        var iter = _this.overlays.iterator();
        var mesh;
        while (iter.hasNext()) {
            mesh = iter.next();
            mesh.geometry.dispose();
            mesh.geometry = null;
            mesh.material.dispose();
            mesh.material = null;

            if (mesh.texture) {
                mesh.texture.dispose();
                mesh.texture = null;
            }
        }

        if(_this.groupObject)
        {
            MLJ.core.Scene.removeFromScene( _this.groupObject );
            delete _this.groupObject;
            _this.groupObject = null;
        }

        if(_this.materialForSelectedLine)
        {
            MLJ.core.Scene.removeFromScene( _this.materialForSelectedLine );
            delete _this.materialForSelectedLine;
            _this.materialForSelectedLine = null;
        }
        
        _this.threeMesh.geometry.dispose();
        _this.threeMesh.geometry = null;
        _this.threeMesh.material.dispose();
        _this.threeMesh.material = null;

        if (_this.threeMesh.texture) {
            _this.threeMesh.texture.dispose();
            _this.threeMesh.texture = null;
        }

        _this.name = _this.VN = _this.FN =
                _this.threeMesh = _this.properties = _this.overlays =
                _this.overlaysParams = _this = null;
    };
}
