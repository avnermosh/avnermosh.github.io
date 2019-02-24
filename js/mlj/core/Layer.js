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

    // pivotGroup stores structureMeshGroup, overlayMeshGroup
    // this.pivotGroup = new THREE.Object3D();
    this.pivotGroup = new THREE.Group();
    this.pivotGroup.name = "pivot";
    
    // structureMeshGroup stores the immutable structure related meshes
    this.structureMeshGroup = new THREE.Object3D();
    this.structureMeshGroup.name = "structure";
    
    // overlayMeshGroup stores the mutable overlay related meshes
    this.overlayMeshGroup = new THREE.Object3D();
    this.overlayMeshGroup.name = "overlay";

    this.floorInfoArray = new MLJ.util.AssociativeArray();

    
    // stickyNoteGroup stores the mutable overlay related meshes
    this.stickyNoteGroup = new THREE.Object3D();
    this.stickyNoteGroup.name = "stickyNotes";

    this.noteArray = new MLJ.util.AssociativeArray();

    MLJ.core.Scene3D.setEdit3dModelControl( this.pivotGroup,
                                            this.structureMeshGroup,
                                            this.overlayMeshGroup );

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

        let selectedImageFilename = MLJ.core.Scene3D.getSelectedImageFilename();

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

   
    this.getPivotGroup = function () {
        return _this.pivotGroup;
    };

    this.getStructureMeshGroup = function () {
        return _this.structureMeshGroup;
    };

    this.addToStructureMeshGroup = function (mesh) {
        _this.structureMeshGroup.add( mesh );
    };

    this.getFloorInfoArray = function () {
        return _this.floorInfoArray;
    };
    
    this.getFloorInfoByName = function (floorName) {
        return _this.floorInfoArray.getByKey(floorName);
    };

    this.addFloorInfo = function (floorInfoName, floorInfo) {
        _this.floorInfoArray.set(floorInfoName, floorInfo);
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

        // console.log('BEG createRectangleMesh');
        
        var structureRectangleVertices = MLJ.core.Scene3D.getRectangleVertices(intersectedStructure);

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

        var geometry = new THREE.Geometry();
        // default placeholder file until a real image file is dropped
        let imageThumbnailFilename = "default_image.thumbnail.jpg";

        // TBD - sanity check - check that default_image.thumbnail.jpg, default_image.jpg are in the zip file
        // Not done yet...
        
        var userData = {urlArray: new MLJ.util.AssociativeArray(),
                        origPosition: null,
                        scale: null}

        let imageOrientation = 1;
        let imageInfo = {imageFilename: imageThumbnailFilename,
                         imageOrientation: imageOrientation};
        
        userData.urlArray.set(imageThumbnailFilename, imageInfo);

        let imageInfoVec = MLJ.core.Scene3D.getImageInfoVec();
        imageInfoVec.set(imageThumbnailFilename, imageInfo);
        MLJ.core.Scene3D.setImageInfoVec(imageInfoVec);

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

        if(_this.pivotGroup)
        {
            MLJ.core.Scene3D.removeFromScene3D( _this.pivotGroup );
            delete _this.pivotGroup;
            _this.pivotGroup = null;
        }
        
        if(_this.structureMeshGroup)
        {
            MLJ.core.Scene3D.removeFromScene3D( _this.structureMeshGroup );
            delete _this.structureMeshGroup;
            _this.structureMeshGroup = null;
        }
        
        if(_this.floorInfoArray)
        {
            // clear the array
            while(1) {
                // clear the next array entry
                let floorInfoName = _this.floorInfoArray.getLastKey();
                let floorInfo = _this.floorInfoArray.remove(floorInfoName);
                if(floorInfo)
                {
                    // https://stackoverflow.com/questions/40694372/what-is-the-right-way-to-remove-a-mesh-completely-from-the-scene-in-three-js
                    floorInfo.geometry.dispose();
                    floorInfo.material.dispose();
                }
                else
                {
                    // no more elements in the array
                    break;
                }
            }
            // sanity check
            if(_this.floorInfoArray.size() > 0)
            {
                throw new Error("Reached error condition: '_this.floorInfoArray.size() > 0'");
            }

        }
        
        if(_this.overlayMeshGroup)
        {
            MLJ.core.Scene3D.removeFromScene3D( _this.overlayMeshGroup );
            delete _this.overlayMeshGroup;
            _this.overlayMeshGroup = null;
        }

        if(_this.stickyNoteGroup)
        {
            MLJ.core.Scene3D.removeFromScene3D( _this.stickyNoteGroup );
            delete _this.stickyNoteGroup;
            _this.stickyNoteGroup = null;
        }
        
        _this.name = null;
        _this = null;
    };
}
