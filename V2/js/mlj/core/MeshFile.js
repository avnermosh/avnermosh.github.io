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
 * @file Defines the functions to manage files
 * @author Stefano Gabriele
 */

/**
 * MLJ.core.MeshFile namespace
 * @namespace MLJ.core.MeshFile
 * @memberOf MLJ.core
 * @author Stefano Gabriele
 */
MLJ.core.MeshFile = {
    ErrorCodes: {
        EXTENSION: 1
    },
    SupportedExtensions: {
        OFF: ".off",
        OBJ: ".obj",
        PLY: ".ply",
        STL: ".stl",
        ZIP: ".zip"
    }
};

(function () {
    var _this = this;
    var _openedList = new MLJ.util.AssociativeArray();
    var imageInfoVecGlobal = new MLJ.util.AssociativeArray();

    function isExtensionValid(extension) {

        switch (extension.toLowerCase()) {
            case ".off":
            case ".obj":
            case ".ply":
            case ".stl":
            case ".zip":
                return true;
        }

        return false;
    }

    this.getImageInfoVecGlobal = function () {
        return imageInfoVecGlobal;
    }

    this.loadTextureImage2 = function (textureFileUrl, onTextureLoaded) {

        //let's create the layer-dependent texture array
        var texture2 = new THREE.TextureLoader().load( textureFileUrl, function ( texture2 ) {
            // This anonymous function will be called when the texture2 has finished loading
            var format = THREE.RGBFormat;
            var texComponentsTitle = "RGB";
            
            texture2.wrapS = THREE.ClampToEdgeWrapping;
            texture2.wrapT = THREE.ClampToEdgeWrapping;
            
            texture2.needsUpdate = true; //We need to update the texture2
            // Prevent warning when texture is not a power of 2
            // https://discourse.threejs.org/t/warning-from-threejs-image-is-not-power-of-two/7085
            texture2.minFilter = THREE.LinearFilter;
            
            let selectedLayer = MLJ.core.Model.getSelectedLayer();
            let blobs = selectedLayer.getBlobs();
            let imageInfoVec = selectedLayer.getImageInfoVec();
            let selectedImageFilename = selectedLayer.getSelectedImageFilename();
            let imageInfo = imageInfoVec.getByKey(selectedImageFilename);

            let rotationVal = 0;
            switch (Number(imageInfo.orientation)) {
                case 1:
                    // landscape
                    rotationVal = 0;
                    break;
                case 6:
                    // portrait
                    rotationVal = (-Math.PI / 2);
                    break;
                default:
                    break;
            }
            
            // https://stackoverflow.com/questions/36668836/threejs-displaying-a-2d-image
            var material2 = new THREE.SpriteMaterial( { map: texture2,
                                                        color: 0xffffff,
                                                        rotation: rotationVal,
                                                        fog: true } );
            
            var sprite2 = new THREE.Sprite( material2 );

            // background-size: contain,
            // object-fit: contain,
            var objectFitVal = "contain";
            // object-fit: objectFitVal,
            
            var texture3 = {
                fileName: textureFileUrl,
                components: texComponentsTitle,
                format: format,
                data: sprite2
            };
            
            onTextureLoaded(true, texture3);
        });
        
    };

    this.loadFile = function (filename, fileType) {
        var data;
        // https://blog-en.openalfa.com/how-to-read-synchronously-json-files-with-jquery
        // generalized for fileType: json and text
        $.ajax({ 
            url: filename, 
            dataType: fileType, 
            data: data, 
            async: false, 
            success: function(data0){
                data = data0;
                return;
            }
        });

        return data;
    };

    function populateBlobs(blobs, promises1, resolve) {
        for(var i=0; i<promises1.length; i++)
        {
            let filename = promises1[i].filename;
            // blobs[filename] = promises1[i].url;
            blobs.set(filename, promises1[i].url);
        }
        
        resolve(true);
    }
    
    // extract images as blob url and add to the blobs list
    this.addImageToBlobs = function (zipLoaderInstance) {
        filenames = Object.keys(zipLoaderInstance.files);

        return new Promise(function(resolve, reject) {
            
            // loop over keys
            var promises_extractImageAsBlobUrl = [];
            
            let selectedLayer = MLJ.core.Model.getSelectedLayer();
            var blobs = selectedLayer.getBlobs();
            for (var key in filenames)
            {
                var filename = filenames[key];
                var fileExtention = MLJ.util.getFileExtention(filename);
                switch(fileExtention) {
                    case "jpg":
                    case "JPG":
                    case "png":
                        //                         console.log('zipLoaderInstance.files[filename].url', zipLoaderInstance.files[filename].url); 
                        if (zipLoaderInstance.files[filename].url) {
                            // the url already exists
                            blobs.set(filename, zipLoaderInstance.files[filename].url);
                        }
                        else
                        {
                            // the url does not exist
                            if(fileExtention === "png")
                            {
                                promises_extractImageAsBlobUrl.push(zipLoaderInstance.extractImageAsBlobUrl( filename, 'image/png' ));
                            }
                            else
                            {
                                promises_extractImageAsBlobUrl.push(zipLoaderInstance.extractImageAsBlobUrl( filename, 'image/jpeg' ));
                            }
                        }
                        break;
                    default:
                        break;
                }
            }

            Promise.all(promises_extractImageAsBlobUrl)
                .then(function(values) {
                    // populateBlobs returns a promise
                    return populateBlobs(blobs, values, resolve);
                })
                .catch((err) => {
                    // handle errors here
                    console.error('err from promises_extractImageAsBlobUrl', err);
                    reject(false);
                });
        });
        
    };

    this.loadObjectAndMaterialFiles = function (objFileName, mtlFileName, layer) {
        if(objFileName === undefined)
        {
            console.error('objFileName is undefined');
            return false;
        }
        
        var blobs = layer.getBlobs();
        console.log( 'mtlFileName: ' + mtlFileName );
        console.log( 'objFileName: ' + objFileName );

        var loadingManager = new THREE.LoadingManager();

        // Initialize loading manager with URL callback.
        var objectURLs = [];
        loadingManager.setURLModifier( ( url ) => {
            if(!blobs.getByKey(url))
            {
                url = url.replace(/\.\//i, '');
            }

            url = blobs.getByKey(url);

            objectURLs.push( url );
            return url;
        } );
        
        let mtlLoader = new THREE.MTLLoader(loadingManager);
        mtlLoader.setMaterialOptions( {side: THREE.DoubleSide} );

        mtlLoader.load( mtlFileName, function( materials ) {
            materials.preload();

            var objLoader = new THREE.OBJLoader(loadingManager);
            objLoader.setMaterials( materials );

            objLoader.load( objFileName, function ( objInstance ) {
                objInstance.traverse(function ( child ) {
                    if( child.material ) {
                        child.material.side = THREE.DoubleSide;
                    }
                    if ( child instanceof THREE.Mesh ) {
                        child.geometry.computeBoundingBox();
                        objInstance.bBox = child.geometry.boundingBox;
                    }
                });
                //                 objInstance.name = objFileName;

                let structure_obj_re = /.*structure\.obj/;
                let structure_obj_re_matched = objFileName.match(structure_obj_re);

                let top_down_structure_obj_re = /.*structure.(layer\d{1})\.obj/;
                let top_down_structure_obj_re_matched = objFileName.match(top_down_structure_obj_re);
                
                let overlay_rect_re = /.*overlay\.obj/;
                let overlay_rect_re_matched = objFileName.match(overlay_rect_re);

                if(structure_obj_re_matched)
                {
                    objInstance.traverse(function ( child ) {
                        if( child.material ) {
                            child.material.side = THREE.DoubleSide;
                            child.material.polygonOffset = true;
                            child.material.polygonOffsetUnits = 1;
                            // structure.obj less in front (higher polygonOffsetFactor), compared to overlay.obj
                            child.material.polygonOffsetFactor = 0;
                        }
                    });
                    
                    // struct - add to struct mesh group
                    layer.addToStructureMeshGroup(objInstance);
                }
                else if(top_down_structure_obj_re_matched)
                {

                    // console.log('top_down_structure_obj_re_matched', top_down_structure_obj_re_matched);
                    let layerSubstr = top_down_structure_obj_re_matched[1]
                    // console.log('layerSubstr', layerSubstr); 

                    // topDown struct - add to topDown struct array

                    // Set the bounding box of floorInfo.mesh and set its z order
                    objInstance.traverse(function ( child ) {
                        if ( child instanceof THREE.Mesh ) {

                            // Set the z order of floorInfo.mesh such that other objects that are on the same plane
                            // (_axesHelperIntersection, _cube_camera3D, _cube_scene3DcameraMouseIntersectionPoint, _cube_scene3DcameraLookAtIntersectionPoint)
                            // will be rendered on top of it
                            child.material.polygonOffset = true;
                            child.material.polygonOffsetUnits = 4;
                            child.material.polygonOffsetFactor = 1;
                            
                            if ( child.name === "ground_1" ) {
                                // Set the bounding box of floorInfo.mesh from the dround background image
                                let mesh1 = child.clone();
                                objInstance.bBox.setFromObject( mesh1 );
                            }
                        }
                    });
                    
                    // TBD - generalize to get the floorInfo["height"] number from a meta file in the .zip file that gets filled when exporting the 3d model from sh3d
                    let floorThickness = 12;
                    let floorHeight = 250;
                    let heightAboveFloor = floorHeight / 2;
                    let floorLevel = 0;
                    
                    if(layerSubstr == "layer0")
                    {
                        floorLevel = 0;
                    }
                    else if(layerSubstr == "layer1")
                    {
                        floorLevel = 1;
                    }
                    else if(layerSubstr == "layer2")
                    {
                        floorLevel = 2;
                    }
                    else if(layerSubstr == "layer3")
                    {
                        floorLevel = 3;
                    }

                    let floorInfo = new FloorInfo({name: objFileName,
                                                   floorLevel: floorLevel,
                                                   floorHeight: floorHeight,
                                                   floorThickness: floorThickness,
                                                   heightAboveFloor: heightAboveFloor,
                                                   mesh: objInstance});
                    
                    layer.addFloorInfo(objFileName, floorInfo);

                }
                else if(overlay_rect_re_matched)
                {
                    // overlayRect - add to overlayRect group
                    objInstance.traverse(function ( child ) {
                        if ( child instanceof THREE.Mesh ) {
                            let overlayRect = child.clone();
                            if( child.material ) {
                                child.material.side = THREE.DoubleSide;
                                child.material.polygonOffset = true;
                                child.material.polygonOffsetUnits = 1;
	                        // overlay.obj more in front (lower polygonOffsetFactor), compared to structure.obj
                                child.material.polygonOffsetFactor = -1;
                            }

                            
                            let material_userData_scale = MLJ.util.getNestedObject(overlayRect, ['material', 'userData', 'scale']);
                            if(material_userData_scale)
                            {
                                if ( overlayRect.geometry instanceof THREE.BufferGeometry ) {
                                    overlayRect.geometry = new THREE.Geometry().fromBufferGeometry( overlayRect.geometry );
                                    overlayRect.geometry.mergeVertices();
                                }

                                var box = new THREE.Box3().setFromObject( overlayRect );
                                box.getCenter( overlayRect.position ); // this re-sets the position
                                
                                overlayRect.geometry.computeBoundingBox();
                                // Mesh::geometry.center() repositions the mesh such that its center is at 0
                                overlayRect.geometry.center();

                                for(var i=0;i<overlayRect.geometry.vertices.length;i++)
                                {
                                    var scale0 = new THREE.Vector3(1, 1, 1);
                                    scale0.divide(material_userData_scale);
                                    overlayRect.geometry.vertices[i].multiply(scale0);
                                }
                                
                                overlayRect.scale.set(material_userData_scale.x, material_userData_scale.y, material_userData_scale.z);
                                overlayRect.updateMatrixWorld();
                            }
                            layer.addToOverlayMeshGroup(overlayRect);
                        }
                    });
                }
                else
                {
                    // should not reach here
                    console.error('obj file is not supported. Obj filename: ' + objFileName);
                    return false;
                }

                layer.texture = [];
                _this.onLoadendMesh(true, layer);
            } );
        });

        return true;
    };

    
    this.validateVersion = function (layer, generalMetadataFilename) {

        var blobs = layer.getBlobs();
        if(!blobs.getByKey(generalMetadataFilename))
        {
            // should not reach here
            console.error('Missing file: ' + generalMetadataFilename );
            return false;
        }
        
        var generalInfo = _this.loadFile(blobs.getByKey(generalMetadataFilename), "json");
        
        var generalInfo_modelVersion = MLJ.util.getNestedObject(generalInfo, ['generalInfo', 'modelVersion']);

        if(!generalInfo_modelVersion || (MLJ.core.Model.getReleaseVersion() !== generalInfo_modelVersion))
        {
            // should not reach here
            console.error('Version are not matching. Release version: ' + MLJ.core.Model.getReleaseVersion() +
                          " , Model version: " + generalInfo_modelVersion);
            return false;
        }

        MLJ.core.Model.setModelVersion( generalInfo_modelVersion );

        return true;
    };

    this.loadNotesFromJsonFile = function (layer, notesFilename) {
        
        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        var blobs = selectedLayer.getBlobs();
        let notesArray1 = _this.loadFile(blobs.getByKey(notesFilename), "json");

        let stickyNoteGroup = layer.getStickyNoteGroup();
        let texturePlugin = MLJ.core.plugin.Manager.getTexturePlugins().getFirst();
        var texScene = texturePlugin.getTexScene();
        var texCamera = texturePlugin.getTexCamera();
        var texLabelRenderer = texturePlugin.getTexLabelRenderer();

        var noteArray = layer.getNoteArray();
        
        for (var index = 0; index < notesArray1.length; index++) {

            let note = notesArray1[index];
            let noteData = notesArray1[index].data;
            let noteStyle = notesArray1[index].style;
            let imageFilename = notesArray1[index].imageFilename;
            
            let noteId = "note" + Number(index);

            let newNote = new Note(noteId,
                                   noteData,
                                   noteStyle,
                                   imageFilename,
                                   index,
                                   layer,
                                   texLabelRenderer,
                                   texScene,
                                   texCamera);

            noteArray.set(noteId, newNote);
        }

        texScene.add( stickyNoteGroup );
        
        layer.setNoteArray(noteArray);
        
    };

    this.extractFilesFromZipLoaderInstance = function (zipLoaderInstance, layer, doSkipJpg) {

        // creating a promise (promise4) so that we return only when the promise is fully done
        return new Promise(function(resolve){
            
            // loop over keys
            var promises3 = [];
            
            filenames = Object.keys(zipLoaderInstance.files);
            
            // loop over keys
            var blobs = layer.getBlobs();
            var mtlFileNames = [];
            var objFileNames = [];
            
            for (var key in filenames)
            {
                var filename = filenames[key];

                var fileExtention = MLJ.util.getFileExtention(filename);

                switch(fileExtention) {
                    case "":
                        // e.g. skip directory names
                        break;
                    case "jpg":
                    case "jpeg":
                    case "JPG":
                    case "png":
                        if(doSkipJpg)
                        {
                            // separate to 2 groups:
                            // a.
                            // diagonalStripesPattern.jpg
                            //
                            // b.
                            // IMG_6399.jpg

                            // regex to all image files except the texture (overlayRect) images
                            var re2 = /^.*\.jpeg$/;
                            var nonOverlayRectImageRegexMatched = filename.match(re2);

                            // match - diagonalStripesPattern.jpg
                            // match - 638_w17_yossi_havusha.structure.layer0_ground_1.jpg
                            // match - 638_w17_yossi_havusha.structure.layer0_ground_1.png
                            // Do NOT match - IMG_6399.jpg
                            if(nonOverlayRectImageRegexMatched)
                            {
                                if (zipLoaderInstance.files[filename].url) {
                                    blobs.set(filename, zipLoaderInstance.files[filename].url);
                                }
                                else
                                {
                                    if(fileExtention === "png")
                                    {
                                        promises3.push(zipLoaderInstance.extractImageAsBlobUrl( filename, 'image/png' ));
                                    }
                                    else
                                    {
                                        promises3.push(zipLoaderInstance.extractImageAsBlobUrl( filename, 'image/jpeg' ));
                                    }
                                }
                            }
                            else
                            {
                                blobs.set(filename, null);
                            }
                        }
                        else
                        {
                            if (zipLoaderInstance.files[filename].url) {
                                blobs.set(filename, zipLoaderInstance.files[filename].url);
                            }
                            else
                            {
                                promises3.push(zipLoaderInstance.extractImageAsBlobUrl( filename, 'image/jpeg' ));
                            }
                        }

                        break;
                    case "mtl":
                        blobs.set(filename, zipLoaderInstance.extractAsBlobUrl( filename, 'text/plain' ));
                        mtlFileNames.push(filename);
                        
                        break;
                    case "obj":
                        blobs.set(filename, zipLoaderInstance.extractAsBlobUrl( filename, 'text/plain' ));
                        objFileNames.push(filename);
                        
                        break;
                    case "json":
                        blobs.set(filename, zipLoaderInstance.extractAsBlobUrl( filename, 'text/plain' ));

                        var metadata = _this.loadFile(blobs.getByKey(filename), "json");
                        
                        var general_metadata_re = /general_metadata/;
                        var general_metadata_re_matched = filename.match(general_metadata_re);

                        let notes_metadata_re = /notes/;
                        let notes_metadata_re_matched = filename.match(notes_metadata_re);
                        
                        if(general_metadata_re_matched)
                        {
                            // found general metadata json file, e.g. modelVersion
                        }
                        else if(notes_metadata_re_matched)
                        {
                            if(MLJ.core.Model.isStickyNotesEnabled())
                            {
                                // found notes metadata json file, i.e. sticky notes
                                _this.loadNotesFromJsonFile(layer, filename);
                            }
                        }
                        else
                        {
                            // should not reach here
                            console.error('Found json file that is not supported');
                        }
                        
                        break;
                    default:
                        var msgStr = 'fileExtension: ' + fileExtention + ' in .zip file is not supported';
                        console.error( msgStr );
                        return reject(false);
                        
                }
            }

            Promise.all(promises3)
                .then(function(promises3) {

                    console.log('promises3.length', promises3.length); 
                    // loop over promises3 - fill in blobs
                    for(var i=0; i<promises3.length; i++)
                    {
                        let filename = promises3[i].filename;
                        blobs.set(filename, promises3[i].url)
                        
                        let fileExtention = MLJ.util.getFileExtention(filename);
                        switch(fileExtention) {
                            case "jpg":
                            case "JPG":
                            case "jpeg":
                            case "png":
                                let imageInfo = new ImageInfo({filename: filename,
                                                               orientation: promises3[i].imageOrientation});

                                // console.log('imageInfo', imageInfo); 
                                imageInfoVecGlobal.set(filename, imageInfo);
                                break;
                            default:
                                break;
                        }

                    }

                    // Validate version
                    let generalMetadataFilename = "general_metadata.json";
                    if( !_this.validateVersion(layer, generalMetadataFilename) )
                    {
                        // should not reach here
                        console.error('Version validation failed');
                        // return reject(false);
                        reject(false);
                    }
                    
                    layer.setBlobs(blobs);

                    objFileNames.forEach(function(objFileName) {

                        // console.log('objFileName', objFileName); 
                        // var mtlFileName = objFileName + ".mtl";
                        let mtlFileName = objFileName.substr(0, objFileName.lastIndexOf(".")) + ".mtl";

                        // console.log('mtlFileName', mtlFileName); 
                        
                        let structure_obj_re = /.*structure\.obj/;
                        let structure_obj_re_matched = objFileName.match(structure_obj_re);

                        let top_down_structure_obj_re = /.*structure.layer\d{1}\.obj/;
                        let top_down_structure_obj_re_matched = objFileName.match(top_down_structure_obj_re);
                        
                        let overlay_rect_re = /.*overlay\.obj/;
                        let overlay_rect_re_matched = objFileName.match(overlay_rect_re);

                        if(structure_obj_re_matched)
                        {
                            // this is a structure mesh file
                            MLJ.core.Model.setStructureObjFileName(objFileName);
                        }
                        else if(top_down_structure_obj_re_matched)
                        {
                            // console.log('objFileName1', objFileName);
                        }
                        else if(overlay_rect_re_matched)
                        {
                            // this is an overlay mesh file
                            MLJ.core.Model.setOverlayObjFileName(objFileName);
                        }
                        else
                        {
                            // should not reach here
                            console.error('obj file is not supported. Obj filename: ' + objFileName);
                            reject(false);
                            // return reject(false);
                        }

                        // TBD CheckME: Are objInfo, mtlInfo needed ???
                        var objInfo = _this.loadFile(blobs.getByKey(objFileName), "text");
                        layer.setObjInfo(objInfo);


                        var mtlInfo = _this.loadFile(blobs.getByKey(mtlFileName), "text");
                        layer.setMtlInfo(mtlInfo);

                        if(! _this.loadObjectAndMaterialFiles(objFileName, mtlFileName, layer))
                        {
                            reject(false);
                            // return reject(false);
                        }
                    });

                    if(MLJ.core.Model.isScene3DpaneEnabled())
                    {
                        let pivotGroup = layer.getPivotGroup();
                        pivotGroup.add(layer.getStructureMeshGroup());
                        pivotGroup.add(layer.getOverlayMeshGroup());
                        let selectedOverlayVertexHelperGroup = MLJ.core.Scene3D.getSelectedOverlayVertexHelperGroup();
                        pivotGroup.add(selectedOverlayVertexHelperGroup);
                        
                        MLJ.core.Scene3D.getScene3D().add(pivotGroup);
                    }
                    
                    // MLJ.core.Scene3D.render();
                    MLJ.core.Scene3DtopDown.render();

                    MLJ.core.Model.setZipLoaderInstance(zipLoaderInstance);

                    // for promise4
                    resolve(true);
                })
                .catch((err) => {
                    // handle errors here
                    console.error('err2', err); 
                });
        });

    };

    this.loadFromZipFile = function (arrayBuffer, layer, doSkipJpg) {
        console.log('BEG loadFromZipFile');

        // try
        // {
        ZipLoader.unzip( arrayBuffer, doSkipJpg ).then( function ( zipLoaderInstance ) {
            if(!_this.extractFilesFromZipLoaderInstance(zipLoaderInstance, layer, doSkipJpg))
            {
                let msgStr = "Failed to extract files from the zip file.";
                console.error(msgStr);
                //         throw(msgStr);
                return false;
            }
        });
        // }
        // catch(err)
        // {
        // TBD
        // adjust the catch for async, is the version don't match, don't continue with program
        // }

    };

    // extract binary content from a given blobUrl
    function urlToPromise(url) {
        return new Promise(function(resolve, reject) {
            JSZipUtils.getBinaryContent(url, function (err, data) {
                if(err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    function exportObjAndMtlFiles(blobs, meshGroup, objFileName) {
        // console.log('BEG exportObjAndMtlFiles');

        var exporter = new THREE.OBJExporter();
        if(objFileName == "overlay.obj")
        {
            let a = 3;
        }
        var exportedResult = exporter.parse( meshGroup );
        var objExported = exportedResult.obj;
        // if(objFileName == "overlay.obj")
        // {
        //     console.log('objExported', objExported);
        // }
        var objExportedBlob = new Blob([objExported]);
        var objExportedBlobUrl = URL.createObjectURL(objExportedBlob);
        blobs.set(objFileName, objExportedBlobUrl);

        // var mtlFileName = objFileName + ".mtl";
        let mtlFileName = objFileName.substr(0, objFileName.lastIndexOf(".")) + ".mtl";
        var mtlExported = exportedResult.mtl;
        // if(objFileName == "overlay.obj")
        // {
        //     console.log('mtlExported', mtlExported);
        // }

        var mtlExportedBlob = new Blob([mtlExported]);
        var mtlExportedBlobUrl = URL.createObjectURL(mtlExportedBlob);
        blobs.set(mtlFileName, mtlExportedBlobUrl);
    };


    function exportNotesToBlob(layer, blobs, notesFileName) {

        var noteArray = layer.getNoteArray();

        let notesExported = [];

        let iter = noteArray.iterator();
        while (iter.hasNext()) {
            let note = iter.next();
            
            let myDelta = note.getQuill().getContents();
            let notesDataExported = JSON.stringify(myDelta);
            
            let notes_style = {top: note.getStyle().top,
                               left: note.getStyle().left};

            let noteExported = {data: notesDataExported,
                                style: notes_style,
                                imageFilename: note.getImageFilename()};

            notesExported.push(noteExported);
        }
        
        let notesExported2 = JSON.stringify(notesExported);
        var notesExportedBlob = new Blob([notesExported2], {type: 'application/json'});

        var notesExportedBlobUrl = URL.createObjectURL(notesExportedBlob);
        blobs.set(notesFileName, notesExportedBlobUrl);
    };


    // Parse the image (get the buffer and offset) into a new zipLoaderInstance
    function parseImageFromZip(doSkipJpg, offsetInReader) {
        return new Promise(function(resolve){
            
            let zipLoaderInstance2 = ZipLoader.unzip( MLJ.core.Model.getZipFileArrayBuffer(), doSkipJpg, offsetInReader );
            resolve(zipLoaderInstance2);
        });
    };

    // function parseImageFromZip(doSkipJpg, offsetInReader) {
    //     return new Promise(function(resolve, reject){
    
    //         let promise_unzip = ZipLoader.unzip( MLJ.core.Model.getZipFileArrayBuffer(), doSkipJpg, offsetInReader );
    
    //         promise_unzip.then(function(zipLoaderInstance2) {
    //             resolve(zipLoaderInstance2);
    //         }).catch(function(error){
    //             let msgStr = "Failure from promise_unzip";
    //             console.error(msgStr);
    //             reject(msgStr);
    //         });
    
    //     });
    // };


    
    this.saveToZipFile = function (layer, zipFileName) {
        console.log('BEG saveToZipFile');

        var zip = new JSZip();

        // RemoveME: Can we remove promise ??
        // no one is waiting on it...
        var promise = new Promise(function(resolve, reject){

            // load skipped files
            var blobs = layer.getBlobs();
            // console.log('blobs', blobs);
            
            // Add the files that were not loaded to memory yet
            // unzip the image files that were skipped in the initial load
            var promises_parseImageFromZip = [];
            
            filenames = blobs.getKeys();
            for (var key in filenames)
            {
                let filename = filenames[key];
                let blobUrl = blobs.getByKey(filename);

                if(!blobUrl)
                {
                    // The file is not yet in memory. Load it to the memory
                    let zipLoaderInstance = MLJ.core.Model.getZipLoaderInstance();
                    var offsetInReader = zipLoaderInstance.files[filename].offset;
                    if(offsetInReader > 0)
                    {
                        // The file is not yet in memory, but its offset is stored in memory.
                        // Unzip the image file (that were skipped in the initial load)
                        // Load the file from the zip file into memory
                        // Parse the image (get the buffer and offset) into a new zipLoaderInstance
                        var doSkipJpg = false;
                        promises_parseImageFromZip.push(parseImageFromZip(doSkipJpg, offsetInReader));
                    }
                }
            }
            
            Promise.all(promises_parseImageFromZip)
                .then(function(values) {
                    
                    for(i=0;i<values.length;i++){
                        // extract images as blob url and add to the blobs list
                        MLJ.core.MeshFile.addImageToBlobs(values[i]);
                    }

                    var blobs = layer.getBlobs();
                    
                    {
                        // sanity test
                        let iter = blobs.iterator();
                        while (iter.hasNext())
                        {
                            let keyVal = iter.nextKeyVal();
                            var fileName = keyVal[0];
                            var blobUrl = keyVal[1];
                            if(blobUrl == null)
                            {
                                // At this point all the files should be in memory
                                console.log('blobUrl', blobUrl);

                                let msgStr = "blobUrl is null. Failure from promises_parseImageFromZip";
                                console.error(msgStr);
                                throw(msgStr);
                                
                            }
                        };
                    }


                    // Export the structure obj and mtl to files
                    // meshGroup, objInstance exports ok - meshGroup of type "Group" and has "Mesh" child
                    
                    var structureMeshGroup = layer.getStructureMeshGroup();
                    let structureObjFileName = MLJ.core.Model.getStructureObjFileName();
                    exportObjAndMtlFiles(blobs, structureMeshGroup, structureObjFileName);

                    // Export the selectedFloorInfo.mesh obj and mtl to files
                    // TBD - store the height in userData
                    let selectedLayer = MLJ.core.Model.getSelectedLayer();
                    let selectedFloorInfo = selectedLayer.getSelectedFloorInfo();
                    
                    exportObjAndMtlFiles(blobs,
                                         selectedFloorInfo.mesh,
                                         selectedFloorInfo.name);

                    // Export the overlayMesh obj and mtl to files
                    let overlayMeshGroup = layer.getOverlayMeshGroup();
                    let overlayObjFileName = MLJ.core.Model.getOverlayObjFileName();
                    exportObjAndMtlFiles(blobs, overlayMeshGroup, overlayObjFileName);

                    // Export the notes to blob
                    exportNotesToBlob(layer, blobs, "notes.json");
                    
                    // At this point all the files should be in memory
                    // Add the files to the saved zip
                    let iter = blobs.iterator();
                    while (iter.hasNext())
                    {
                        let keyVal = iter.nextKeyVal();
                        var fileName = keyVal[0];
                        var blobUrl = keyVal[1];
                        if(blobUrl == null)
                        {
                            // At this point all the files should be in memory
                            console.log('blobUrl', blobUrl);

                            let msgStr = "blobUrl is null";
                            console.error(msgStr);
                            throw(msgStr);
                            
                        }
                        
                        // add file to zip
                        var fileExtention = MLJ.util.getFileExtention(fileName);
                        switch(fileExtention) {
                            case "mtl":
                            case "obj":
                            case "jpg":
                            case "JPG":
                            case "jpeg":
                            case "png":
                            case "json":
                                // console.log('fileName', fileName); 
                                zip.file(fileName, urlToPromise(blobUrl), {binary:true});
                                break;
                            default:
                                console.error("File extention is not supported", fileExtention);
                                break;
                        }
                    }
                    if(JSZip.support.blob){
                        // Generate the zip file asynchronously
                        zip.generateAsync({type:"blob"})
                            .then(function(content) {

                                let doSaveToLocalFileSystem = true;
                                if(doSaveToLocalFileSystem)
                                {
                                    saveAs(content, zipFileName);
                                }
                                
                                let doSaveUsingDropbox = true;
                                doSaveUsingDropbox = false;
                                if(doSaveUsingDropbox)
                                {
                                    // uploadToDropbox_viaHardcodedAccessToken(content, zipFileName);
                                    uploadToDropbox_viaImplicitGrant(content, zipFileName);
                                    
                                }

                                let doSaveUsingGoogleDrive = true;
                                doSaveUsingGoogleDrive = false;
                                if(doSaveUsingGoogleDrive)
                                {
                                    content.name = zipFileName;
                                    console.log('content', content);

                                    // ok saves content as Untitled. After downloading it from "Google Drive", I can open the application with it. Yey!!!
                                    let options2 = {
                                        file: content,
                                        token: undefined,
                                        onComplete: function(data) { console.log('Completed with success'); },
                                        onError: function(data) { console.log('Completed with error'); }
                                    };
                                    window.pUploaderForGoogleDrive(options2);
                                }
                                
                                
                            }, function(err){
                                console.log(err)
                            });
                        
                        console.log('Finished saving to zip file');
                    }
                    else
                    {
                        console.error("JSZip does not support blob");
                    }
                    
                    resolve(true);
                })
                .catch((err) => {
                    // handle errors here
                    console.error('err3', err);
                    reject(false);
                });

        });
        
    };
    
    /**
     * Loads 'file' and reads it into the layer
     */
    this.loadMeshDataFromFile = function (file, layer) {

        var fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);

        fileReader.onloadend = function (fileLoadedEvent) {
            console.log("Read file " + file.name + " size " + fileLoadedEvent.target.result.byteLength + " bytes");
            // console.timeEnd("Read mesh file");
            var resOpen = -1;
            if (file.name.split('.').pop() === "zip")
            {
                var doSkipJpg = true;
                // TBD - doSkipJpg -> doSkipOverlayImages
                // doSkipJpg = false;

                MLJ.core.Model.setZipFileArrayBuffer(fileLoadedEvent.target.result);
                let zipFileArrayBuffer = MLJ.core.Model.getZipFileArrayBuffer();
                resOpen = _this.loadFromZipFile(zipFileArrayBuffer, layer, doSkipJpg);
                console.log('After loadFromZipFile'); 
                
            }
        };
    }

    this.onLoadendMesh = function (loaded, layer) {
        if (loaded) {
            console.log('Trigger "MeshFileOpened"');

            layer.setImageInfoVec(imageInfoVecGlobal);

            // Trigger event to indicate that the mesh file finished openning
            // (this will cause to add a new layer via addLayer)
            $(document).trigger("MeshFileOpened", [layer]);
            
            // console.timeEnd("Parsing Mesh Time");
            // console.timeEnd("Read mesh file");
        }
    };    
    
    
    this.openSingleMeshFile = function (fileObj) {
        
        if (!(fileObj instanceof File)) {
            console.error("MLJ.MeshFile.openSingleMeshFile(fileObj): the parameter 'fileObj' must be a File instace.");
            return;
        }

        // Add fileObj to opened list
        _openedList.set(fileObj.name, fileObj);
        // Extract file extension
        var pointPos = fileObj.name.lastIndexOf('.');
        var extension = fileObj.name.substr(pointPos);

        //Validate file extension
        if (!isExtensionValid(extension)) {
            console.error("MeshLabJs allows file format '.off', '.ply', '.obj', 'zip' and '.stl'. \nTry again.");
            return;
        }

        var layer = MLJ.core.Model.createLayer(fileObj.name);
        layer.fileName = fileObj.name;

        _this.loadMeshDataFromFile(fileObj, layer);
    };

    /**
     * Opens a mesh file or a list of mesh files     
     * @param {(File | FileList)} toOpen A single mesh file or a list of mesh files
     * @memberOf MLJ.core.MeshFile
     * @fires MLJ.core.MeshFile#MeshFileOpened
     * @author Stefano Gabriele
     */
    this.openMeshFile = function (toOpen) {

        // console.time("Read mesh file");
        console.log('toOpen', toOpen);

        // toOpen is a FileList
        // typeOfToOpen is object
        // let typeOfToOpen = typeof toOpen;

        $(toOpen).each(function (key, file) {
            _this.openSingleMeshFile(file);
        });
    };

    this.saveMeshFile = function (layer, fileName) {
        resOpen = _this.saveToZipFile(layer, fileName);
    };


    this.loadTexture2FromFile = function (fileUrl) {
        this.loadTextureImage2(fileUrl, function (loaded, texture3) {
            if (loaded) {
                // console.log('Trigger "MeshFileOpened"');
                
                // Trigger event to indicate that the texture3 finished openning
                $(document).trigger("Texture2FileOpened", texture3);
                
            }
        });
    };

}).call(MLJ.core.MeshFile);
