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

    var getFileExtention = function (filename2)
    {
        // http://www.jstips.co/en/javascript/get-file-extension/
        var fileExt = filename2.slice((filename2.lastIndexOf(".") - 1 >>> 0) + 2);
        return fileExt;
    };

    this.loadTextureImage2 = function (textureFileName, onTextureLoaded) {

        //let's create the layer-dependent texture array
        var texture2 = new THREE.TextureLoader().load( textureFileName, function ( texture2 ) {
            // This anonymous function will be called when the texture2 has finished loading
            
            var texWidth = texture2.image.width;
            var texHeight = texture2.image.height;
            var format = THREE.RGBFormat;
            var texComponentsTitle = "RGB";
            
            
            texture2.wrapS = THREE.ClampToEdgeWrapping;
            texture2.wrapT = THREE.ClampToEdgeWrapping;
            
            texture2.needsUpdate = true; //We need to update the texture2
            texture2.minFilter = THREE.LinearFilter;   //Needed when texture2 is not a power of 2

            
            // https://stackoverflow.com/questions/36668836/threejs-displaying-a-2d-image
            var material2 = new THREE.SpriteMaterial( { map: texture2, color: 0xffffff, fog: true } );
            var sprite2 = new THREE.Sprite( material2 );

            // background-size: contain,
            // object-fit: contain,
            var objectFitVal = "contain";
            // object-fit: objectFitVal,
            
            texture2 = {
                fileName: textureFileName,
                height: texHeight,
                width: texWidth,
                components: texComponentsTitle,
                format: format,
                data: sprite2
            };
            
            onTextureLoaded(true, texture2);
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

    // extract images as blob url and add to the blobs list
    this.addImageToBlobs = function (zipLoaderInstance) {
        filenames = Object.keys(zipLoaderInstance.files);

        // loop over keys
        var blobs = MLJ.core.Scene.getBlobs();
        for (var key in filenames)
        {
            var filename = filenames[key];
            var fileExtention = getFileExtention(filename);
            switch(fileExtention) {
                case "jpg":
                case "JPG":
                    blobs[filename] = zipLoaderInstance.extractAsBlobUrl( filename, 'image/jpeg' );
                    break;
                default:
                    break;
            }
        }
    };

    this.loadObjectAndMaterialFiles = function (objFileName, mtlFileName, layer) {
        if(objFileName === undefined)
        {
            console.error('objFileName is undefined');
            return false;
        }
        
        var blobs = MLJ.core.Scene.getBlobs();
        console.log( 'mtlFileName: ' + mtlFileName );
        console.log( 'objFileName: ' + objFileName );

        var loadingManager = new THREE.LoadingManager();

        // Initialize loading manager with URL callback.
        var objectURLs = [];
        loadingManager.setURLModifier( ( url ) => {
            if(!blobs[ url ])
            {
                url = url.replace(/\.\//i, '');
            }

            url = blobs[ url ];
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

                let structure_obj_re = /.*structure.obj/;
                let matchResults = objFileName.match(structure_obj_re);
                if(matchResults)
                {
                    layer.addToStructureMeshGroup(objInstance);
                }
                else
                {
                    objInstance.traverse(function ( child ) {
                        if ( child instanceof THREE.Mesh ) {
                            let overlayRect = child.clone();

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
                                overlayRect.geometry.center();

                                for(var i=0;i<overlayRect.geometry.vertices.length;i++)
                                {
                                    var scale0 = new THREE.Vector3(1, 1, 1);
                                    scale0.divide(material_userData_scale);
                                    overlayRect.geometry.vertices[i].multiply(scale0);
                                }
                                
                                overlayRect.scale.set(material_userData_scale.x, material_userData_scale.y, material_userData_scale.z)
                            }
                            layer.addToOverlayMeshGroup(overlayRect);
                        }
                    });
                }

                layer.texture = [];
                _this.onLoadendMesh(true, layer);
            } );
        });

        return true;
    };

    
    this.validateVersion = function (generalMetadataFilename) {

        var blobs = MLJ.core.Scene.getBlobs();
        if(!blobs[generalMetadataFilename])
        {
            // should not reach here
            console.error('Missing file: ' + generalMetadataFilename );
            return false;
        }
        
        var generalInfo = _this.loadFile(blobs[generalMetadataFilename], "json");
        
        var generalInfo_modelVersion = MLJ.util.getNestedObject(generalInfo, ['generalInfo', 'modelVersion']);

        if(!generalInfo_modelVersion || (MLJ.core.Scene.getReleaseVersion() !== generalInfo_modelVersion))
        {
            // should not reach here
            console.error('Version are not matching. Release version: ' + MLJ.core.Scene.getReleaseVersion() +
                          " , Model version: " + generalInfo_modelVersion);
            return false;
        }

        MLJ.core.Scene.setModelVersion( generalInfo_modelVersion );

        return true;
    };
    
    this.extractFilesFromZipLoaderInstance = function (zipLoaderInstance, layer, doSkipJPG) {
        filenames = Object.keys(zipLoaderInstance.files);
        
        // loop over keys
        var blobs = MLJ.core.Scene.getBlobs();
        var mtlFileNames = [];
        var objFileNames = [];
        var wallsInfo = [];
        
        for (var key in filenames)
        {
            var filename = filenames[key];

            var fileExtention = getFileExtention(filename);

            switch(fileExtention) {
                case "":
                    // e.g. skip directory names
                    break;
                    // case "zip":
                    //     console.log( 'create layer with name: ' + filename );
                    //     var layer1 = MLJ.core.Scene.createLayer(filename);
                    //     layer1.fileName = filename;
                    
                    //     var zipLoader1 = new ZipLoader( filename );
                    //     console.log('zipLoader1', zipLoader1);
                    
                    //     _this.loadFromZipFile3(zipLoader1, filename, layer1);
                    //     break;
                case "jpg":
                case "jpeg":
                case "JPG":
                    if(doSkipJPG)
                    {
                        // take1 - skip non "flatten_canvas" images
                        // var re1 = /flatten_canvas/;
                        // var regex1_matched = filename.match(re1);
                        // if(regex1_matched)
                        // {
                        //     console.log('regex1_matched');
                        //     blobs[filename] = zipLoaderInstance.extractAsBlobUrl( filename, 'image/jpeg' );
                        // }

                        // take2 - Skip individual images with "IMG" (and not e.g. "flatten_canvas" images)
                        var re1 = /IMG/;
                        var regex1_matched = filename.match(re1);
                        if(regex1_matched)
                        {
                        }
                        else
                        {
                            console.log('regex1_matched');
                            blobs[filename] = zipLoaderInstance.extractAsBlobUrl( filename, 'image/jpeg' );
                        }
                    }
                    else
                    {
                        blobs[filename] = zipLoaderInstance.extractAsBlobUrl( filename, 'image/jpeg' );
                    }

                    break;
                case "mtl":
                    blobs[filename] = zipLoaderInstance.extractAsBlobUrl( filename, 'text/plain' );
                    mtlFileNames.push(filename);
                    
                    break;
                case "obj":
                    blobs[filename] = zipLoaderInstance.extractAsBlobUrl( filename, 'text/plain' );
                    objFileNames.push(filename);
                    
                    break;
                case "json":
                    blobs[filename] = zipLoaderInstance.extractAsBlobUrl( filename, 'text/plain' );

                    // e.g. floor0/wall_24/wall_image_attributes2.json
                    var metadata = _this.loadFile(blobs[filename], "json");
                    
                    var wall_metadata_re = /wall_image_attributes2/;
                    var wall_metadata_re_matched = filename.match(wall_metadata_re);

                    var general_metadata_re = /general_metadata/;
                    var general_metadata_re_matched = filename.match(general_metadata_re);
                    
                    if(wall_metadata_re_matched)
                    {
                        // found specific wall image attributes json file
                        metadata.metadataFilename = filename;
                        wallsInfo.push(metadata);
                    }
                    else if(general_metadata_re_matched)
                    {
                        // found general metadata json file, e.g. modelVersion
                    }
                    else
                    {
                        // should not reach here
                        console.error('Found json file that is not wall info');
                    }
                    
                    break;
                default:
                    var msgStr = 'fileExtension: ' + fileExtention + ' in .zip file is not supported';
                    console.error( msgStr );
                    return false;
            }
        }

        // Validate version
        let generalMetadataFilename = "general_metadata.json";
        if( !_this.validateVersion(generalMetadataFilename) )
        {
            // should not reach here
            console.error('Version validation failed');
            return false;
        }
        
        layer.setWallsInfo(wallsInfo);

        MLJ.core.Scene.setBlobs(blobs);
        var scene = MLJ.core.Scene.getScene();

        objFileNames.forEach(function(objFileName) {

            console.log(objFileName);
            var mtlFileName = objFileName + ".mtl";
            console.log(mtlFileName);
            
            var structure_obj_re = /.*structure.obj/;
            var matchResults = objFileName.match(structure_obj_re);
            if(matchResults)
            {
                // this is a structure mesh file
                scene._structureObjFileName = objFileName;
            }
            else
            {
                // this is an overlay mesh file
                scene._overlayObjFileName = objFileName;
            }
            
            
            var objInfo = _this.loadFile(blobs[objFileName], "text");
            layer.setObjInfo(objInfo);


            var mtlInfo = _this.loadFile(blobs[mtlFileName], "text");
            layer.setMtlInfo(mtlInfo);

            if(! _this.loadObjectAndMaterialFiles(objFileName, mtlFileName, layer))
            {
                return false;
            }
        });

        MLJ.core.Scene.addToScene( layer.getStructureMeshGroup() );
        MLJ.core.Scene.addToScene( layer.getOverlayMeshGroup() );

        MLJ.core.Scene.render();

        MLJ.core.Scene.setZipLoaderInstance(zipLoaderInstance);
        
        return true;
    };

    this.loadFromZipFile = function (arrayBuffer, layer, doSkipJPG) {
        console.log('BEG loadFromZipFile');

        // try
        // {
        ZipLoader.unzip( arrayBuffer, doSkipJPG ).then( function ( zipLoaderInstance ) {
            if(!_this.extractFilesFromZipLoaderInstance(zipLoaderInstance, layer, doSkipJPG))
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
        var exporter = new THREE.OBJExporter();
        var exportedResult = exporter.parse( meshGroup );
        var objExported = exportedResult.obj;
        //         console.log('objExported', objExported);
        var objExportedBlob = new Blob([objExported]);
        var objExportedBlobUrl = URL.createObjectURL(objExportedBlob);
        blobs[objFileName] = objExportedBlobUrl;

        var mtlFileName = objFileName + ".mtl";
        var mtlExported = exportedResult.mtl;
        //         console.log('mtlExported', mtlExported);
        var mtlExportedBlob = new Blob([mtlExported]);
        var mtlExportedBlobUrl = URL.createObjectURL(mtlExportedBlob);
        blobs[mtlFileName] = mtlExportedBlobUrl;
    };

    
    // Parse the image (get the buffer and offset) into a new zipLoaderInstance
    function parseImageFromZip(doSkipJPG, offsetInReader) {
        return new Promise(function(resolve){
            var zipLoaderInstance2 = ZipLoader.unzip( MLJ.core.Scene._zipFileArrayBuffer, doSkipJPG, offsetInReader );
            resolve(zipLoaderInstance2);
        });
    };

    this.saveToZipFile = function (layer, zipFileName) {
        console.log('BEG saveToZipFile');

        var zip = new JSZip();

        var promise = new Promise(function(resolve){

            // load skipped files
            var blobs = MLJ.core.Scene.getBlobs();
            // Add the files that were not loaded to memory yet
            // unzip the image files of specific wall (that were skipped in the initial load)
            var wallsInfo = layer.getWallsInfo();
            var promises = [];
            for (var wallIndex = 0; wallIndex < wallsInfo.length; ++wallIndex)
            {
                // console.log('wallIndex', wallIndex);
                // console.log('wallsInfo[wallIndex]', wallsInfo[wallIndex]); 
                if(!wallsInfo[wallIndex])
                {
                    console.error('wallsInfo[wallIndex] is undefined'); 
                    return false;
                }

                for (var imageIndex = 0; imageIndex < wallsInfo[wallIndex].imagesInfo.length; ++imageIndex) {
                    var imageInfo = wallsInfo[wallIndex].imagesInfo[imageIndex];
                    var imageFilename = imageInfo.imageFilename;
                    if(!blobs[imageFilename])
                    {
                        // The file is not yet in memory. Load it to the memory
                        var zipLoaderInstance = MLJ.core.Scene.getZipLoaderInstance();
                        var offsetInReader = zipLoaderInstance.files[imageFilename].offset;
                        if(offsetInReader > 0)
                        {
                            // The file is not yet in memory, but its offset is stored in memory.
                            // Unzip the image file (that were skipped in the initial load)
                            // Load the file from the zip file into memory
                            // Parse the image (get the buffer and offset) into a new zipLoaderInstance
                            var doSkipJPG = false;
                            promises.push(parseImageFromZip(doSkipJPG, offsetInReader));
                        }
                    }
                }
            }
            
            Promise.all(promises)
            // .then(() => {
                .then(function(values) {
                    
                    for(i=0;i<values.length;i++){
                        var zipLoaderInstance2 = values[i];
                        
                        // extract images as blob url and add to the blobs list
                        var zipLoaderInstance3 = MLJ.core.MeshFile.addImageToBlobs(zipLoaderInstance2);
                    }
                    var scene = MLJ.core.Scene.getScene();
                    var blobs = MLJ.core.Scene.getBlobs();

                    var doExportObjToFile = true;
                    if(doExportObjToFile)
                    {
                        // Export the object file
                        // meshGroup, objInstance exports ok - meshGroup of type "Group" and has "Mesh" child
                        // meshlab can open the mesh file but without material ???
                        // scene1 exports NOT ok - scene1 does not have direct "Mesh" child

                        var structureMeshGroup = layer.getStructureMeshGroup();
                        exportObjAndMtlFiles(blobs, structureMeshGroup, scene._structureObjFileName);

                        var overlayMeshGroup = layer.getOverlayMeshGroup();
                        exportObjAndMtlFiles(blobs, overlayMeshGroup, scene._overlayObjFileName);
                    }


                    
                    // At this point all the files should be in memory
                    // Add the files to the saved zip
                    for (let [fileName, blobUrl] of Object.entries(blobs))
                    {
                        // add file to zip
                        var fileExtention = getFileExtention(fileName);
                        switch(fileExtention) {
                            case "mtl":
                            case "obj":
                            case "jpg":
                            case "JPG":
                            case "json":
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
                                saveAs(content, zipFileName);
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
                });
            // .catch((e) => {
            //     // handle errors here
            //     console.log('a2'); 
            // });

        });
        
    };
    
    /**
     * Loads 'file' and reads it into the layer 'layer'
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
                var doSkipJPG = true;
                // doSkipJPG = false;

                MLJ.core.Scene._zipFileArrayBuffer = fileLoadedEvent.target.result;
                resOpen = _this.loadFromZipFile(MLJ.core.Scene._zipFileArrayBuffer, layer, doSkipJPG);
            }
        };
    }

    this.onLoadendMesh = function (loaded, layer) {
        if (loaded) {
            console.log('Trigger "MeshFileOpened"');

            // Trigger event to indicate that the mesh file finished openning
            // (this will cause to add a new layer via addLayer)
            $(document).trigger("MeshFileOpened", [layer]);
            
            // console.timeEnd("Parsing Mesh Time");
            // console.timeEnd("Read mesh file");
        }
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

        $(toOpen).each(function (key, file) {

            if (!(file instanceof File)) {
                console.error("MLJ.MeshFile.openMeshFile(file): the parameter 'file' must be a File instace.");
                return;
            }

            //Add file to opened list
            _openedList.set(file.name, file);
            //Extract file extension
            var pointPos = file.name.lastIndexOf('.');
            var extension = file.name.substr(pointPos);

            //Validate file extension
            if (!isExtensionValid(extension)) {
                console.error("MeshLabJs allows file format '.off', '.ply', '.obj', 'zip' and '.stl'. \nTry again.");
                return;
            }

            var layer = MLJ.core.Scene.createLayer(file.name);
            layer.fileName = file.name;
            
            _this.loadMeshDataFromFile(file, layer);
            
        });
    };

    this.saveMeshFile = function (layer, fileName) {
        resOpen = _this.saveToZipFile(layer, fileName);
    };


    this.loadTexture2FromFile = function (fileName) {

        this.loadTextureImage2(fileName, function (loaded, texture2) {
            if (loaded) {
                // console.log('Trigger "MeshFileOpened"');
                
                // Trigger event to indicate that the texture2 finished openning
                $(document).trigger("Texture2FileOpened", texture2);
                
            }
        });
    };

}).call(MLJ.core.MeshFile);
