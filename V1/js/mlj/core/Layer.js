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

    this._blobs = new MLJ.util.AssociativeArray();
    this._selectedImageFilename;
    this._selectedThumbnailImageFilename;
    this._selectedThumbnailImageFilenamePrev;
    this._selectedImageFilenames;
    this._selectedImageFilenameIndex = 0;
    this._selectedOverlayRectObj = null;

    this._selectedFloorInfo = null;
    
    this._floorOverlayRectGroup = new THREE.Object3D();
    this._floorOverlayRectGroup.name = "floorOverlayRectGroup";
    MLJ.core.Scene3DtopDown.getScene3DtopDown().add(this._floorOverlayRectGroup);
    
    this._editOverlayRectFlag = false;
    this._editMode = null;

    // accumulated list of all the overlay images, as they are added 
    this._imageInfoVec = new MLJ.util.AssociativeArray();

    if(MLJ.core.Model.isScene3DpaneEnabled())
    {
        MLJ.core.Scene3D.setEdit3dModelControl( this.pivotGroup,
                                                this.structureMeshGroup,
                                                this.overlayMeshGroup );
    }

    MLJ.core.Scene3DtopDown.setEditTopDownOverlayControl();
    
    /**
     * @type {String} - Set if a mesh is read from a file
     * (see {@link MLJ.core.MeshFile.openMeshFile}), defaults to the empty string
     */
    this.fileName = "";
    this.selectedTexture = 0;

    var _this = this;

    this.initializeRenderingAttributes = function () {
        
        console.time("Time to create mesh: ");

        console.timeEnd("Time to create mesh: ");

        console.log('END initializeRenderingAttributes');
    };

    this.addStickyNote = function () {
        console.log('BEG addStickyNote');

        let selectedImageFilename = this._selectedImageFilename;

        if(selectedImageFilename)
        {
            let index = this.noteArray.size();
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
                                   this,
                                   texLabelRenderer,
                                   texScene,
                                   texCamera);


            this.noteArray.set(noteId, newNote);

        }
        
    };

   
    this.getPivotGroup = function () {
        return this.pivotGroup;
    };

    this.getStructureMeshGroup = function () {
        return this.structureMeshGroup;
    };

    this.addToStructureMeshGroup = function (mesh) {
        this.structureMeshGroup.add( mesh );
    };

    this.getFloorInfoArray = function () {
        return this.floorInfoArray;
    };
    
    this.getFloorInfoByName = function (floorName) {
        return this.floorInfoArray.getByKey(floorName);
    };

    this.addFloorInfo = function (floorInfoName, floorInfo) {
        this.floorInfoArray.set(floorInfoName, floorInfo);
    };

    this.getOverlayMeshGroup = function () {
        return this.overlayMeshGroup;
    };

    this.addToOverlayMeshGroup = function (mesh) {
        mesh.name = mesh.id;
        this.overlayMeshGroup.add(mesh);
    };

    this.getNoteArray = function () {
        return this.noteArray;
    };
    
    this.setNoteArray = function (noteArray) {
        this.noteArray = noteArray;
    };

    this.getStickyNoteGroup = function () {
        return this.stickyNoteGroup;
    };

    this.addToStickyNoteGroup = function (css2DObject) {
        this.stickyNoteGroup.add( css2DObject );
    };

    this.getMtlInfo = function () {
        return this.mtlInfo;
    };

    this.setMtlInfo = function (mtlInfo) {
        this.mtlInfo = mtlInfo;
    };

    this.getObjInfo = function () {
        return this.objInfo;
    };

    this.setObjInfo = function (objInfo) {
        this.objInfo = objInfo;
    };

    this.getSelectedImageFilename = function () {
        return this._selectedImageFilename;
    };

    this.setSelectedImageFilename = function (selectedImageFilename) {
        this._selectedImageFilename = selectedImageFilename;
    };

    this.getSelectedImageFilenames = function () {
        return this._selectedImageFilenames;
    };

    this.setSelectedImageFilenames = function (selectedImageFilenames) {
        this._selectedImageFilenames = selectedImageFilenames;
    };

    this.getSelectedThumbnailImageFilename = function () {
        return this._selectedThumbnailImageFilename;
    };
    
    this.getSelectedThumbnailImageFilenamePrev = function () {
        return this._selectedThumbnailImageFilenamePrev;
    };

    this.setSelectedThumbnailImageFilenamePrev = function (selectedThumbnailImageFilenamePrev) {
        this._selectedThumbnailImageFilenamePrev = selectedThumbnailImageFilenamePrev;
    };
    
    this.getSelectedImageFilnameIndex = function () {
        return this._selectedImageFilenameIndex;
    };

    this.setSelectedImageFilnameIndex = function (selectedImageFilnameIndex) {
        this._selectedImageFilenameIndex = selectedImageFilnameIndex;
    };

    this.getSelectedOverlayRectObj = function () {
        return this._selectedOverlayRectObj;
    };
    
    this.getBlobs = function () {
        return this._blobs;
    };

    this.setBlobs = function (blobs) {
        this._blobs = blobs;
    };

    this.setBlob = function (filename, blob) {
        this._blobs.set(filename, blob);
    };

    this.getImageInfoVec = function () {
        return this._imageInfoVec;
    };

    this.setImageInfoVec = function (imageInfoVec) {
        this._imageInfoVec = imageInfoVec;
    };
    
    this.getEditOverlayRectFlag = function () {
        return this._editOverlayRectFlag;
    };

    this.setEditOverlayRectFlag = function (editOverlayRectFlag) {
        this._editOverlayRectFlag = editOverlayRectFlag;
        if(MLJ.core.Model.isScene3DpaneEnabled())
        {
            MLJ.core.Scene3D.enableControls3D(this._editOverlayRectFlag);
        }
        MLJ.core.Scene3DtopDown.enableControls3DtopDown(this._editOverlayRectFlag);
    };

    this.getEditMode = function () {
        return this._editMode;
    };
    
    this.setEditMode = function (editMode) {
        console.log('BEG setEditMode');
        this._editMode = editMode;
        console.log('this._editMode', this._editMode); 
    };

    this.getSelectedFloorInfo = function () {
        return this._selectedFloorInfo;
    };

    this.setSelectedFloorInfo = function (floorName2) {
//         console.log('BEG setSelectedFloorInfo'); 

        // Loop over this.floorInfoArray and match
        let floorName = "NA";
        let iter = this.floorInfoArray.iterator();
        while (iter.hasNext()) {
            let floorInfo = iter.next();

            let topDownStructureObjRegexMatched = "na";
            if( (topDownStructureObjRegexMatched = floorInfo.name.match(floorName2)) )
            {
                floorName = floorInfo.name;
                break;
            }
            
        }

        if(this._selectedFloorInfo)
        {
            // remove the previous this._selectedFloorInfo["mesh"]
            MLJ.core.Scene3DtopDown.getScene3DtopDown().remove(this._selectedFloorInfo["mesh"]);
        }
        
        this._selectedFloorInfo = this.getFloorInfoByName(floorName);
//         console.log('this._selectedFloorInfo', this._selectedFloorInfo);
        
        if(this._selectedFloorInfo)
        {
            // add the current this._selectedFloorInfo["mesh"]
            MLJ.core.Scene3DtopDown.getScene3DtopDown().add(this._selectedFloorInfo["mesh"]);
            MLJ.core.Scene3DtopDown.setCamera3DtopDown(this._selectedFloorInfo);
            
            // Add overlay rects to floor overlay rect group
            this.updateOverlayRectsInFloorOverlayRectGroup(this._selectedFloorInfo);

            MLJ.core.Scene3DtopDown.resizeCanvas();
        }
        else
        {
            throw new Error("Reached error condition: if(this._selectedFloorInfo)");
        }
    };

    this.getFloorOverlayRectGroup = function () {
        return this._floorOverlayRectGroup;
    };

    this.loadNextImage = function () {
        if(this._selectedOverlayRectObj && this._selectedImageFilenames.length > 0)
        {
            this._selectedImageFilenameIndex = (this._selectedImageFilenameIndex + 1) % this._selectedImageFilenames.length
            this._selectedThumbnailImageFilename = this._selectedImageFilenames[this._selectedImageFilenameIndex];
            
            if(this._blobs.getByKey(this._selectedThumbnailImageFilename))
            {
                let imageInfo = this._imageInfoVec.getByKey(this._selectedThumbnailImageFilename);
                MLJ.core.ImageFile.updateMaterial(this._selectedOverlayRectObj,
                                                  this._blobs.getByKey(this._selectedThumbnailImageFilename),
                                                  this._selectedThumbnailImageFilename,
                                                  imageInfo.orientation);
            }
            
            if(this.loadTheSelectedImageAndRender() == false)
            {
                console.error('Failed to load and render the selected image.'); 
            }
        }
    };

    this.loadTheSelectedImageAndRender = function () {
//         console.log('BEG loadTheSelectedImageAndRender'); 

        if(!this._selectedThumbnailImageFilename)
        {
            // sanity check. Shouldn't reach here
            throw 'this._selectedThumbnailImageFilename is undefined"';
        }

        let imageInfo = this._imageInfoVec.getByKey(this._selectedThumbnailImageFilename);

        if(!imageInfo)
        {
            // sanity check. Shouldn't reach here.

            console.log('this._imageInfoVec', this._imageInfoVec);
            let iter1 = this._imageInfoVec.iterator();
            while (iter1.hasNext()) {
                let imageInfo1 = iter1.next();
                console.log('imageInfo1', imageInfo1); 
            }
            
            throw 'imageInfo is undefined"';
        }

        // sanity check
        if( this._selectedThumbnailImageFilename !== imageInfo.filename)
        {
            console.error('this._selectedThumbnailImageFilename', this._selectedThumbnailImageFilename); 
            console.error('imageInfo.filename', imageInfo.filename);
            throw 'Reached failure condition: "this._selectedThumbnailImageFilename !== imageInfo.filename"';
        }

        this._selectedImageFilename = this._selectedThumbnailImageFilename.replace(/\.thumbnail/i, '');
        var blobs = this.getBlobs();
        
        if(blobs.getByKey(this._selectedImageFilename))
        {
            // The file already exists in memory. Load it from the memory and render
            this._selectedThumbnailImageFilenamePrev = this._selectedThumbnailImageFilename;
            MLJ.core.MeshFile.loadTexture2FromFile(blobs.getByKey(this._selectedImageFilename));
        }
        else
        {
            // The file is not yet in memory.
            let zipLoaderInstance = MLJ.core.Model.getZipLoaderInstance();
            console.log('this._selectedImageFilename', this._selectedImageFilename);
            if(!zipLoaderInstance.files[this._selectedImageFilename])
            {
                throw 'zipLoaderInstance.files[this._selectedImageFilename] is undefined';
            }
            
            var offsetInReader = zipLoaderInstance.files[this._selectedImageFilename].offset;
            if(offsetInReader > 0)
            {
                // The file is not yet in memory, but its offset is stored in memory.
                // Load the file from the zip file into memory and render
                // unzip the image files (that were skipped in the initial load)
                var doSkipJpg = false;
                ZipLoader.unzip( MLJ.core.Model.getZipFileArrayBuffer(), doSkipJpg, offsetInReader ).then( function ( zipLoaderInstance ) {
                    let promise3 = MLJ.core.MeshFile.addImageToBlobs(zipLoaderInstance);
                    promise3.then(function(value) {
                        // At this point all the images finished being added to the blob
                        if(blobs.getByKey(this._selectedImageFilename) === null)
                        {
                            console.error('blobs', blobs); 
                            console.error('this._selectedImageFilename', this._selectedImageFilename); 
                            throw 'blobs.getByKey(this._selectedImageFilename) is undefined';
                        }
                        this._selectedThumbnailImageFilenamePrev = this._selectedThumbnailImageFilename;
                        MLJ.core.MeshFile.loadTexture2FromFile(blobs.getByKey(this._selectedImageFilename));
                    }).catch(function(err) {
                        console.error('err from promise3', err); 
                    });
                });
            }
        }
        return true;
    };

    
    this.clearSelectedImageInfo = function () {
        // console.log('BEG clearSelectedImageInfo');

        this._selectedOverlayRectObj = null;
        
        // There is no overlayRect intersection. Setting the _selectedThumbnailImageFilename to be noSelectedImage.
        // causes the previous "real" _selectedThumbnailImageFilename if any, to be removed
        this._selectedThumbnailImageFilename = "noSelectedImage.thumbnail.jpg";
        
        this._selectedImageFilenameIndex = 0;
    };
    
    this.setSelectedImageInfo = function (intersectedOverlayRectInfo) {
        // console.log('BEG setSelectedImageInfo');
        
        let sceneBar = MLJ.gui.getWidget("SceneBar");
        let openImageFileButton = sceneBar.getOpenImageFileButton();
        // let isDisabled = openImageFileButton.isDisabled();
        // console.log('isDisabled', isDisabled); 

        // Load the file, and render the image

        var intersectedOverlayRectObject = MLJ.util.getNestedObject(intersectedOverlayRectInfo, ['currentIntersection', 'object']);
        if(intersectedOverlayRectObject)
        {
            if(this._editOverlayRectFlag)
            {
                // enable openFile button only if there is a selected OverlayRect (yellow for new OverlayRect, or where existing images are for used OverlayRect)

                // There is an intersection with overlayRect and in edit mode. Enable the openImageFileButton
                openImageFileButton.disabled(false);
            }
            
            let intersectedOverlayRectObjectPrev = MLJ.util.getNestedObject(intersectedOverlayRectInfo, ['previousIntersection', 'object']);
            if ( !intersectedOverlayRectObjectPrev || (intersectedOverlayRectObjectPrev != intersectedOverlayRectObject) )
            {
                // The currentIntersection differs from the previous intersection. Update this._selectedImageFilenames,
                // this._selectedImageFilenameIndex, _selectedThumbnailImageFilename
                let urlArray = MLJ.util.getNestedObject(intersectedOverlayRectInfo, ['currentIntersection', 'object', 'material', 'userData', 'urlArray']);
                if(!urlArray || (urlArray.size() === 0))
                {
                    console.log("intersectionObj.material.userData.urlArray is undefined")
                    return false;
                }
                
                this._selectedOverlayRectObj = intersectedOverlayRectObject;
                this._selectedImageFilenames = urlArray.getKeys();
                // Point to the first image in the image stack
                this._selectedImageFilenameIndex = 0;
                this._selectedThumbnailImageFilename = this._selectedImageFilenames[this._selectedImageFilenameIndex];
            }
            
        }
        else
        {
            if(this._editOverlayRectFlag)
            {
                // There is NO intersection with overlayRect and we are in edit mode. Disable the openImageFileButton
                openImageFileButton.disabled(true);
            }
            
            this.clearSelectedImageInfo();
        }
        
    };


    this.addOverlayRectToFloorOverlayRectGroup = function (overlayMeshObj1) {

        // console.log('BEG addOverlayRectToFloorOverlayRectGroup');
        
        let material = new THREE.MeshBasicMaterial();
        material.color.set(MLJ.util.acquaColor);
        material.userData = overlayMeshObj1.material.userData;
        // console.log('overlayMeshObj1.material.map', overlayMeshObj1.material.map); 
        
        let geometry = new THREE.SphereGeometry( 40, 32, 32 );
        let overlayMeshObj2 = new THREE.Mesh( geometry, material );
        overlayMeshObj2.name = overlayMeshObj1.name;
        overlayMeshObj2.position.copy(overlayMeshObj1.position);

        this._floorOverlayRectGroup.add( overlayMeshObj2 );
    };
    
    this.updateOverlayRectsInFloorOverlayRectGroup = function (selectedFloorInfo) {

        // Remove all previous children (in case that the selected floor has changed)
        for (let i = this._floorOverlayRectGroup.children.length - 1; i >= 0; i--) {
            this._floorOverlayRectGroup.remove(this._floorOverlayRectGroup.children[i]);
        }

        this.overlayMeshGroup.traverse(function(overlayMeshObj1) {
            if ( overlayMeshObj1.isMesh && (overlayMeshObj1.geometry !== undefined)) {
                if( (overlayMeshObj1.position.y > selectedFloorInfo.minHeight) && (overlayMeshObj1.position.y < selectedFloorInfo.maxHeight))
                {
                    // Add overlay rect to floor overlay rect group
                    // overlayRect belongs to this floor. Project its location on the topDownView
                    _this.addOverlayRectToFloorOverlayRectGroup(overlayMeshObj1);
                }
            }
        });
    };
    
    this.createRectangleMesh = function (structureRectangleVertices) {
        // console.log('BEG createRectangleMesh');

        /////////////////////////////////////////////////////////////
        // Create 4 vertices
        /////////////////////////////////////////////////////////////
        
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

        /////////////////////////////////////////////////////////////
        // Set up default image for the new rect
        // (needed also for Scene3DtopDown)
        /////////////////////////////////////////////////////////////
        
        // TBD - sanity check - check that default_image.thumbnail.jpg, default_image.jpg are in the zip file
        // Not done yet...
        
        var userData = {urlArray: new MLJ.util.AssociativeArray(),
                        origPosition: null,
                        scale: null}

        // default placeholder file until a real image file is dropped
        let imageThumbnailFilename = "default_image.thumbnail.jpg";
        let imageOrientation = 1;
        let imageInfo = new ImageInfo({filename: imageThumbnailFilename,
                                       orientation: imageOrientation});
        
        userData.urlArray.set(imageThumbnailFilename, imageInfo);

        this._imageInfoVec.set(imageThumbnailFilename, imageInfo);

        /////////////////////////////////////////////////////////////
        // Set up the material for the overlayRect object that is displayed in Scene3D
        // (NOT needed for Scene3DtopDown)
        /////////////////////////////////////////////////////////////

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
        
        /////////////////////////////////////////////////////////////
        // Set up the geometry for the overlayRect object that is displayed in Scene3D
        // (NOT needed for Scene3DtopDown)
        /////////////////////////////////////////////////////////////

        var geometry = new THREE.Geometry();
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

        /////////////////////////////////////////////////////////////
        // Set up the name
        // (needed also for Scene3DtopDown)
        /////////////////////////////////////////////////////////////

        var rectangleMesh = new THREE.Mesh( geometry, rectangleMeshMaterial );
        rectangleMesh.name = rectangleMesh.id;

        var box = new THREE.Box3().setFromObject( rectangleMesh );
        // The rectangle position is set to be the center of the bounding box
        box.getCenter( rectangleMesh.position ); // this re-sets the position

        /////////////////////////////////////////////////////////////
        // Set up the scale and origPosition
        // (NOT needed for Scene3DtopDown)
        /////////////////////////////////////////////////////////////

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
        rectangleMesh.updateMatrixWorld();

        /////////////////////////////////////////////////////////////
        // Add to overlayMeshGroup and FloorOverlayRectGroup
        // (needed also for Scene3DtopDown)
        /////////////////////////////////////////////////////////////

        this.addToOverlayMeshGroup(rectangleMesh);

        // Update the FloorOverlayRectGroup to have a new marker for the NewRect
        this.addOverlayRectToFloorOverlayRectGroup(rectangleMesh);
        
    };
    
    this.deleteOverlayRect = function (intersectedOverlayRectObject) {
        if(intersectedOverlayRectObject)
        {
            if(MLJ.core.Model.isScene3DpaneEnabled())
            {
                // remove overlayRect from scene3D
                let scene3D = MLJ.core.Scene3D.getScene3D();
                scene3D.remove( intersectedOverlayRectObject );
            }

            // remove _floorOverlayRectGroup
            let objectNameInFloorOverlayRectGroup = intersectedOverlayRectObject.id;
            var object = this._floorOverlayRectGroup.getObjectByName( objectNameInFloorOverlayRectGroup, true );
            this._floorOverlayRectGroup.remove( object );

            // remove intersectedOverlayRectObject from Layer.overlayMeshGroup
            this.overlayMeshGroup.remove( intersectedOverlayRectObject );
        }
    };
    

    this.deleteImageFromOverlayRect = function (intersectedOverlayRectObject) {
        // console.log('BEG deleteImageFromOverlayRect'); 

        if(intersectedOverlayRectObject)
        {
            let material_userData_urlArray = MLJ.util.getNestedObject(intersectedOverlayRectObject, ['material', 'userData', 'urlArray']);
            if(!material_userData_urlArray)
            {
                console.log("intersectionObj.material.userData.urlArray is undefined")
                return false;
            }

            if(material_userData_urlArray.size() === 0)
            {
                this.deleteOverlayRect(intersectedOverlayRectObject);
            }
            else
            {
                // Remove the selected image and update to display the next image in texture pane and scene3d pane
                let imageFilenameToRemove = this._selectedThumbnailImageFilename;
                material_userData_urlArray.remove(imageFilenameToRemove);
                if(material_userData_urlArray.size() === 0)
                {
                    this.deleteOverlayRect(intersectedOverlayRectObject);
                }
                else
                {
                    this._selectedImageFilenameIndex = (this._selectedImageFilenameIndex - 1) % this._selectedImageFilenames.length
                    this.loadNextImage();
                }
            }
            this._selectedImageFilenames = material_userData_urlArray.getKeys();
        }
        else
        {
            console.error("Failed to get the overlay object for deletion");
        }
        
    };

    /**
     * Removes the object from memory
     * @author Stefano Gabriele     
     */
    this.dispose = function () {

        if(this.pivotGroup)
        {
            if(MLJ.core.Model.isScene3DpaneEnabled())
            {
                MLJ.core.Scene3D.removeFromScene3D( this.pivotGroup );
                delete this.pivotGroup;
                this.pivotGroup = null;
            }
        }
        
        if(this.structureMeshGroup)
        {
            if(MLJ.core.Model.isScene3DpaneEnabled())
            {
                MLJ.core.Scene3D.removeFromScene3D( this.structureMeshGroup );
                delete this.structureMeshGroup;
                this.structureMeshGroup = null;
            }
        }
        
        if(this.floorInfoArray)
        {
            // clear the array
            while(1) {
                // clear the next array entry
                let floorInfoName = this.floorInfoArray.getLastKey();
                let floorInfo = this.floorInfoArray.remove(floorInfoName);
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
            if(this.floorInfoArray.size() > 0)
            {
                throw new Error("Reached error condition: 'this.floorInfoArray.size() > 0'");
            }

        }
        
        if(this.overlayMeshGroup)
        {
            if(MLJ.core.Model.isScene3DpaneEnabled())
            {
                MLJ.core.Scene3D.removeFromScene3D( this.overlayMeshGroup );
                delete this.overlayMeshGroup;
                this.overlayMeshGroup = null;
            }
        }

        if(this.stickyNoteGroup)
        {
            if(MLJ.core.Model.isScene3DpaneEnabled())
            {
                MLJ.core.Scene3D.removeFromScene3D( this.stickyNoteGroup );
                delete this.stickyNoteGroup;
                this.stickyNoteGroup = null;
            }
        }
        
        this.name = null;
        _this = null;
    };
}
