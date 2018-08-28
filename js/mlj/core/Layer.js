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
    this.wallsInfo = [];
    
    this.name = name;
    this.id = id;

    // structureMeshGroup stores the immutable sturcture related meshes
    this.structureMeshGroup = new THREE.Object3D();
    this.structureMeshGroup.name = "structure";
    
    // overlayMeshGroup stores the mutable overlay related meshes
    this.overlayMeshGroup = new THREE.Object3D();
    this.overlayMeshGroup.name = "overlay";

    MLJ.core.Scene.setDraggableControl( this.structureMeshGroup, this.overlayMeshGroup );

    // yellow lines
    this.imagesLineBoundariesMaterial = new THREE.LineBasicMaterial({color: MLJ.util.yellowColor});
    
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

    
    this.getImagesLineBoundariesMaterial = function () {
        return _this.imagesLineBoundariesMaterial;
    };

    this.getStructureMeshGroup = function () {
        return _this.structureMeshGroup;
    };

    this.addToStructureMeshGroup = function (mesh) {
        _this.structureMeshGroup.add( mesh );
    };

    this.getOverlayMeshGroup = function () {
        return _this.overlayMeshGroup;
    };

    this.addToOverlayMeshGroup = function (mesh) {
        _this.overlayMeshGroup.add(mesh);
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

    this.getWallsInfo = function () {
        return _this.wallsInfo;
    };

    this.setWallsInfo = function (wallsInfo) {
        _this.wallsInfo = wallsInfo;
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

        var userData = {url: imageFilename,
                        origPosition: null,
                        scale: null}

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
        // var face2 = new THREE.Face3(2, 3, 0);
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
            new THREE.Vector2(1,1),
            new THREE.Vector2(0,1),
            new THREE.Vector2(0,0)
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
        
        if(_this.imagesLineBoundariesMaterial)
        {
            MLJ.core.Scene.removeFromScene( _this.imagesLineBoundariesMaterial );
            delete _this.imagesLineBoundariesMaterial;
            _this.imagesLineBoundariesMaterial = null;
        }
        
        _this.name = null;
        _this = null;
    };
}
