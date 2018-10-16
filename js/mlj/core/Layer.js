////////////////////////////////////////////////////////////////
//
// The layer file is 
//
////////////////////////////////////////////////////////////////

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
    this.objInfo = undefined;
    
    this.name = name;
    this.id = id;

    // structureMeshGroup stores the immutable sturcture related meshes
    this.structureMeshGroup = new THREE.Object3D();
    this.structureMeshGroup.name = "structure";
    
    // overlayMeshGroup stores the mutable overlay related meshes
    this.overlayMeshGroup = new THREE.Object3D();
    this.overlayMeshGroup.name = "overlay";

    // stickyNoteGroup stores the mutable overlay related meshes
    this.stickyNoteGroup = new THREE.Object3D();
    this.stickyNoteGroup.name = "stickyNotes";

    this.noteArray = new MLJ.util.AssociativeArray();

    MLJ.core.Scene.setDraggableControl( this.structureMeshGroup, this.overlayMeshGroup );

    /**
     * @type {String} - Set if a mesh is read from a file
     * (see {@link MLJ.core.MeshFile.openMeshFile}), defaults to the empty string
     */
    this.fileName = "";
    this.selectedTexture = 0;

    var _this = this;

    this.initializeRenderingAttributes = function () {
        
        var useIndex = true;

        console.time("Time to create mesh: ");

        console.timeEnd("Time to create mesh: ");

        console.log('END initializeRenderingAttributes');
    };

    this.addStickyNote = function () {
        console.log('BEG addStickyNote');

        let selectedImageFilename = MLJ.core.Scene.getSelectedImageFilename();

        if(selectedImageFilename)
        {
            let index = _this.noteArray.size();
            let noteNumber = Number(index);
            let noteId = "note" + noteNumber;
            let dataStr = "{\"ops\":[{\"insert\":\"My Note\"},{\"attributes\":{\"header\":1},\"insert\":\"\\n\"}]}";

            let noteData = dataStr;
            let noteStyle = {
                top: 0,
                left: 0
            };
            let imageFilename = selectedImageFilename;
            
            let texturePlugin = MLJ.core.plugin.Manager.getTexturePlugins().getFirst();
            var texScene = texturePlugin.getTexScene();
            var texCamera = texturePlugin.getTexCamera();
            var texLabelRenderer = texturePlugin.getTexLabelRenderer();

            let newNote = new Note(noteId,
                                   noteData,
                                   noteStyle,
                                   imageFilename,
                                   index,
                                   _this,
                                   texLabelRenderer,
                                   texScene,
                                   texCamera);


            _this.noteArray.set(noteId, newNote);

        }
        
    };
    
    this.getStructureMeshGroup = function () {
        return _this.structureMeshGroup;
    };

    this.addToStructureMeshGroup = function (mesh) {
        _this.structureMeshGroup.add( mesh );
//         console.log('_this.structureMeshGroup', _this.structureMeshGroup);
//         let bBox = mesh.bBox;
//         console.log('bBox', bBox); 

//         var box = new THREE.Box3().setFromObject( mesh );
//         console.log('box', box);

//         var position1 = new THREE.Vector3();
//         console.log('position1 before bBox.center', position1);
//         box.center( position1 ); // this re-sets position1
//         console.log('position1 after bBox.center', position1);

//         box.center( _this.structureMeshGroup.position ); // this re-sets _this.structureMeshGroup
//         console.log('_this.structureMeshGroup after bBox.center', _this.structureMeshGroup);
        
//         var container = document.getElementsByTagName('canvas')[0];
//         let trackballControls = new THREE.TrackballControls(_this.structureMeshGroup, container);
//         MLJ.core.Scene.setTrackballControls(trackballControls);
        
    };

    this.getOverlayMeshGroup = function () {
        return _this.overlayMeshGroup;
    };

    this.addToOverlayMeshGroup = function (mesh) {
        _this.overlayMeshGroup.add(mesh);
    };

    this.getNoteArray = function () {
        return _this.noteArray;
    };
    
    this.setNoteArray = function (noteArray) {
        _this.noteArray = noteArray;
    };

    this.getStickyNoteGroup = function () {
        return _this.stickyNoteGroup;
    };

    this.addToStickyNoteGroup = function (css2DObject) {
        _this.stickyNoteGroup.add( css2DObject );
    };

    this.getMtlInfo = function () {
        return _this.mtlInfo;
    };

    this.setMtlInfo = function (mtlInfo) {
        _this.mtlInfo = mtlInfo;
    };

    this.getObjInfo = function () {
        return _this.objInfo;
    };

    this.setObjInfo = function (objInfo) {
        _this.objInfo = objInfo;
    };

    this.createRectangleMesh = function (intersectedStructure) {

        var structureRectangleVertices = MLJ.core.Scene.getRectangleVertices(intersectedStructure);

        if(Object.keys(structureRectangleVertices).length !== 4)
        {
            console.log("Failed to get structureRectangleVertices")
            return false;
        }

        var tlPoint1 = new THREE.Vector3();
        tlPoint1.copy(structureRectangleVertices["tlPoint"]);
        var brPoint1 = new THREE.Vector3();                 ;
        brPoint1.copy(structureRectangleVertices["brPoint"]);
        var blPoint1 = new THREE.Vector3();                 ;
        blPoint1.copy(structureRectangleVertices["blPoint"]);
        var trPoint1 = new THREE.Vector3();                 ;
        trPoint1.copy(structureRectangleVertices["trPoint"]);

        // console.log('structureRectangleVertices', structureRectangleVertices);
        
        var overlayRectangleVerticesArray = [];
        overlayRectangleVerticesArray.push(tlPoint1);
        overlayRectangleVerticesArray.push(trPoint1);
        overlayRectangleVerticesArray.push(brPoint1);
        overlayRectangleVerticesArray.push(blPoint1);

        console.log('overlayRectangleVerticesArray', overlayRectangleVerticesArray);

        var geometry = new THREE.Geometry();
        // default placeholder file until a real image file is dropped
        let imageFilename = "default_image.jpg";

        var userData = {urlArray: new MLJ.util.AssociativeArray(),
                        origPosition: null,
                        scale: null}

        let imageOrientation = -2;
        let imageInfo = {imageFilename: imageFilename,
                         imageOrientation: imageOrientation};
        
        userData.urlArray.set(imageFilename, imageInfo);

        let imageInfoVec = MLJ.core.Scene.getImageInfoVec();
        imageInfoVec.set(imageFilename, imageInfo);
        MLJ.core.Scene.setImageInfoVec(imageInfoVec);
        
        var rectangleMeshMaterial = new THREE.MeshPhongMaterial( {
	    opacity: 0.5,
            transparent: false,
            side: THREE.DoubleSide,
	    // default color is white ??
            color: MLJ.util.redColor, 
            // leave name commented out so that it will be set automatically to unique indexed name, e.g. material_44
            // name: "imageFilename",
            userData: userData
	} );
        
        geometry.vertices = overlayRectangleVerticesArray;

        var face1 = new THREE.Face3(0, 1, 2);
        var face2 = new THREE.Face3(0, 2, 3);

        geometry.faces.push( face1 );
        geometry.faces.push( face2 );
        
        // must have faceVertexUvs so that the texture will show
        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(0,0),
            new THREE.Vector2(1,0),
            new THREE.Vector2(1,1)
        ]);

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(0,0),
            new THREE.Vector2(1,1),
            new THREE.Vector2(0,1)
        ]);
        
        //updating the uvs
        geometry.uvsNeedUpdate = true;

        var rectangleMesh = new THREE.Mesh( geometry, rectangleMeshMaterial );
        
        var box = new THREE.Box3().setFromObject( rectangleMesh );
        box.getCenter( rectangleMesh.position ); // this re-sets the position

        var scaleFactor = 0.8;
        rectangleMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

        var diff_overlayRect_vertex_position = new THREE.Vector3();
        diff_overlayRect_vertex_position.copy(rectangleMesh.position).sub( rectangleMesh.geometry.vertices[0] );

        var positionRangeTmp = new THREE.Vector3();
        positionRangeTmp.copy(diff_overlayRect_vertex_position).multiplyScalar(1 - scaleFactor);

        let positionRange = new THREE.Vector3(Math.abs(positionRangeTmp.x), Math.abs(positionRangeTmp.y), Math.abs(positionRangeTmp.z));

        let origPosition = new THREE.Vector3(0, 0, 0);
        origPosition.copy(rectangleMesh.position);
        rectangleMesh.material.userData.origPosition = origPosition;

        let scale1 = new THREE.Vector3(0, 0, 0);
        scale1.copy(rectangleMesh.scale);
        rectangleMesh.material.userData.scale = scale1;
        
        rectangleMesh.geometry.computeBoundingBox();
        rectangleMesh.geometry.center();

        _this.addToOverlayMeshGroup(rectangleMesh);
        
    };
    
    /**
     * Removes the object from memory
     * @author Stefano Gabriele     
     */
    this.dispose = function () {

        if(_this.structureMeshGroup)
        {
            MLJ.core.Scene.removeFromScene( _this.structureMeshGroup );
            delete _this.structureMeshGroup;
            _this.structureMeshGroup = null;
        }
        
        if(_this.overlayMeshGroup)
        {
            MLJ.core.Scene.removeFromScene( _this.overlayMeshGroup );
            delete _this.overlayMeshGroup;
            _this.overlayMeshGroup = null;
        }

        if(_this.stickyNoteGroup)
        {
            MLJ.core.Scene.removeFromScene( _this.stickyNoteGroup );
            delete _this.stickyNoteGroup;
            _this.stickyNoteGroup = null;
        }
        
        _this.name = null;
        _this = null;
    };
}
