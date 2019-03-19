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
 * MLJ.core.ImageFile namespace
 * @namespace MLJ.core.ImageFile
 * @memberOf MLJ.core
 * @author Stefano Gabriele
 */
MLJ.core.ImageFile = {
    ErrorCodes: {
        EXTENSION: 1
    },
    SupportedExtensions: {
        JPG: ".jpg",
        // jpg: ".jpg",
        // JPG: ".JPG",
        PNG: ".png"
    }
};

(function () {
    var _this = this;
    var _openedList = new MLJ.util.AssociativeArray();

    function isExtensionValid(extension) {

        switch (extension.toLowerCase()) {
            case ".jpg":
            case ".png":
                return true;
        }
        throw new Error("extension is not supported " + extension);
        return false;
    }


    ////////////////////////////////////////////////////
    // BEG openImageFile
    // https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
    // https://jsfiddle.net/0GiS0/4ZYq3/
    ////////////////////////////////////////////////////


    var fileToOpenData;
    
    this.updateMaterial = function (selectedOverlayRectObj, fileToOpenUrl, fileToOpenFilename, imageOrientation) {

        // instantiate a loader
        var loader = new THREE.TextureLoader();

        // load a resource
        loader.load(
            // resource URL
            fileToOpenUrl,
            
            // onLoad callback
            function ( texture ) {
                selectedOverlayRectObj.material.map = texture;

                let rotationVal = 0;
                switch (Number(imageOrientation)) {
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
                
                selectedOverlayRectObj.material.map.center = new THREE.Vector2(0.5, 0.5);
                selectedOverlayRectObj.material.map.rotation = rotationVal;
                
                let urlArray = MLJ.util.getNestedObject(selectedOverlayRectObj, ['material', 'userData', 'urlArray']);
                if(!urlArray)
                {
                    selectedOverlayRectObj.material.userData.urlArray = new MLJ.util.AssociativeArray();
                }

                let imageInfo = new ImageInfo({filename: fileToOpenFilename,
                                               orientation: imageOrientation});
                
                urlArray.set(fileToOpenFilename, imageInfo);

                let selectedlayer = MLJ.core.Model.getSelectedLayer();
                let imageInfoVec = selectedlayer.getImageInfoVec();
                imageInfoVec.set(fileToOpenFilename, imageInfo);
                selectedlayer.setImageInfoVec(imageInfoVec);
                
                if(urlArray.size() > 1)
                {
                    // remove default image if it exists
                    let keyToRemove = 'default_image.thumbnail.jpg';
                    let removedEl = urlArray.remove(keyToRemove);
                } 
                
                // _selectedImageFilenames = urlArray.getKeys();
                selectedlayer.setSelectedImageFilenames(urlArray.getKeys());
                selectedOverlayRectObj.material.needsUpdate = true;
            },

            // onProgress callback currently not supported
            undefined,

            // onError callback
            function ( err ) {
                console.error( 'An error happened2.' );
            }
        );
    }

    function thumbnailify(base64Image, targetSize, callback) {
        var img = new Image();

        img.onload = function() {
            let width = img.width;
            let height = img.height;
            let canvas1 = document.createElement('canvas');
            let ctx = canvas1.getContext("2d");

            canvas1.width = canvas1.height = targetSize;

            ctx.drawImage(
                img,
                width > height ? (width - height) / 2 : 0,
                height > width ? (height - width) / 2 : 0,
                width > height ? height : width,
                width > height ? height : width,
                0, 0,
                targetSize, targetSize
            );

            canvas1.toBlob(callback);
        };

        img.src = base64Image;
    };


    this.openImageFile = function (filesToOpen) {
        
        console.log('BEG openImageFile');

        let selectedlayer = MLJ.core.Model.getSelectedLayer();
        if( !selectedlayer.getEditOverlayRectFlag() )
        {
            // Do nothing. Not in editing mode.
            return;
        }

        let selectedOverlayRectObj = selectedlayer.getSelectedOverlayRectObj();
        if( !selectedOverlayRectObj )
        {
            console.log('selectedOverlayRectObj is undefined');
            return;
        }

        if(MLJ.core.Model.isScene3DpaneEnabled())
        {
            let canvas3D = document.getElementById('canvas3D');
            canvas3D.className = "area";
        }

        var filesInfo = "";

        let fileToOpenUrls = [];
        let fileToOpenFilenames = []
        
        // promiseFoo1
        return new Promise(function(resolve) {

            var promiseArrArr = [[],[]];

            console.log('filesToOpen.length0', filesToOpen.length);
            console.log('filesToOpen0', filesToOpen); 
            
            let zipLoaderInstance = MLJ.core.Model.getZipLoaderInstance();
            
            for (var i = 0; i < filesToOpen.length; i++) {
                let fileToOpen = filesToOpen[i];
                
                // Load the dragged file
                
                // https://stackoverflow.com/questions/31433413/return-the-array-of-bytes-from-filereader
                fileToOpenData = new Blob([fileToOpen]);

                let fileToOpenUrl = URL.createObjectURL(fileToOpenData);
                fileToOpenUrls.push(fileToOpenUrl);

                let fileToOpenName = fileToOpen.name;
                // replace space with underscore
                fileToOpenName = fileToOpenName.replace(/ /g, "_");
                
                fileToOpenFilenames.push(fileToOpenName);
                
                // getBuffer reads from fileToOpenData stream and returns (resolves) Uint8Array (bytes) to the result of the promise.
                // the result of the promise (the byte array) is pushed into promises1
                let promise1_Uint8Array = new Promise(getBuffer);

                let promise2_InstanceAndImageTags = zipLoaderInstance.getInstanceAndImageTags(fileToOpenName, fileToOpenData);

                promiseArrArr[0].push(promise1_Uint8Array);
                promiseArrArr[1].push(promise2_InstanceAndImageTags);
            }

            // see 2nd answer in:
            // https://stackoverflow.com/questions/36094865/how-to-do-promise-all-for-array-of-array-of-promises
            Promise.all(promiseArrArr.map(Promise.all, Promise))
                .then(function(promiseArrArrResults) {
                    // promiseArrArrResults contains an array of multiple Uint8Array's (one for each image)
                    let typeofPromiseArrArrResults = typeof promiseArrArrResults;
                    console.log('typeofPromiseArrArrResults', typeofPromiseArrArrResults); 
                    
                    // let promiseArrArrResults0ArrayLength = promiseArrArr[0].length;
                    let promiseArrArrResults0ArrayLength = promiseArrArrResults[0].length;
                    
                    console.log('promiseArrArrResults0ArrayLength', promiseArrArrResults0ArrayLength); 

                    // let promiseArrArrResults1ArrayLength = promiseArrArr[1].length;
                    let promiseArrArrResults1ArrayLength = promiseArrArrResults[1].length;
                    
                    console.log('promiseArrArrResults1ArrayLength', promiseArrArrResults1ArrayLength);

                    let selectedlayer = MLJ.core.Model.getSelectedLayer();
                    let blobs = selectedlayer.getBlobs();
                    for (let j = 0; j < promiseArrArrResults1ArrayLength; j++) {

                        let zipLoaderInstanceAndImageTags = promiseArrArrResults[1][j];
                        console.log('zipLoaderInstanceAndImageTags', zipLoaderInstanceAndImageTags);

                        let fileToOpenFilename1 = fileToOpenFilenames[j];
                        console.log('fileToOpenFilename1', fileToOpenFilename1);

                        let fileToOpenUrl = fileToOpenUrls[j];

                        // Update _blobs with the new image
                        // _blobs[fileToOpenFilename1] = fileToOpenUrl;
                        blobs.set(fileToOpenFilename1, fileToOpenUrl);
                        
                        let imageOrientation = zipLoaderInstanceAndImageTags.imageOrientation;
                        console.log('imageOrientation', imageOrientation);

                        if(imageOrientation == -1)
                        {
                            // TBD
                            // arbitrarily set to 1 so we can go on for now...
                            imageOrientation = 1;
                            // throw 'imageOrientation is -1"';
                        }
                        let imageInfo = new ImageInfo({filename: fileToOpenFilename1,
                                                       orientation: imageOrientation});
                        
                        let imageInfoVec = selectedlayer.getImageInfoVec();
                        imageInfoVec.set(fileToOpenFilename1, imageInfo);
                        selectedlayer.setImageInfoVec(imageInfoVec);
                        
                        //////////////////////////////////////////////
                        // Do load: 
                        // the texture of the intersectedOverlayRect in the 3d model
                        // the texture in the 2d pane
                        //////////////////////////////////////////////

                        // TBD generalize the thumblify code block into a function in e.g. imageUtils.js ?

                        let fileExtention = MLJ.util.getFileExtention(fileToOpenFilename1);
                        
                        let thumbnailFilename = fileToOpenFilename1.substr(0, fileToOpenFilename1.lastIndexOf(".")) + ".thumbnail." + fileExtention;

                        if(!blobs.getByKey(thumbnailFilename))
                        {
                            //////////////////////////////////////////////
                            // The thumbnail does not exist in memory
                            // BEG create a thumbnail for the image
                            //////////////////////////////////////////////
                            
                            thumbnailify(blobs.getByKey(fileToOpenFilename1), 100, function(base64Thumbnail) {
                                console.log('done thumbnailify'); 
	                        // thumbnail.src = base64Thumbnail;
                                var thumbnailFileUrl = URL.createObjectURL(base64Thumbnail)

                                blobs.set(thumbnailFilename, thumbnailFileUrl);

                                ////////////////////////////////////////////////////
                                // refresh the texture of the intersectedOverlayRect in the 3d model
                                ////////////////////////////////////////////////////

                                MLJ.core.ImageFile.updateMaterial(selectedOverlayRectObj, thumbnailFileUrl, thumbnailFilename, imageOrientation);
                                
                                ////////////////////////////////////////////////////
                                // refresh the texture in the 2d pane
                                ////////////////////////////////////////////////////
                                
                                selectedlayer.setSelectedImageFilename(fileToOpenFilename1);

                                selectedlayer.setSelectedThumbnailImageFilenamePrev(thumbnailFilename);
                                
                                // The file already exists in memory. Load it from the memory and render in the 2d pane
                                MLJ.core.MeshFile.loadTexture2FromFile(blobs.getByKey(fileToOpenFilename1));
                                
                            });

                        }
                        else
                        {
                            //////////////////////////////////////////////
                            // The thumbnail exists in memory
                            //////////////////////////////////////////////

                            // refresh the texture of the intersectedOverlayRect in the 3d model
                            let thumbnailFileUrl = blobs.getByKey(thumbnailFilename);
                            MLJ.core.ImageFile.updateMaterial(selectedOverlayRectObj, thumbnailFileUrl, thumbnailFilename, imageOrientation);

                            // refresh the texture in the 2d pane
                            selectedlayer.setSelectedImageFilename(fileToOpenFilename1);
                            selectedlayer.setSelectedThumbnailImageFilenamePrev(thumbnailFilename);

                            // The file already exists in memory. Load it from the memory and render in the 2d pane
                            MLJ.core.MeshFile.loadTexture2FromFile(blobs.getByKey(fileToOpenFilename1));

                        }

                    }
                    
                    // promiseFoo1 waits until getting here before exiting openImageFile2
                    return resolve(true);
                })
                .catch((err) => {
                    // handle errors here
                    console.error('err from promiseArrArr', err); 
                });

        });
    };

    // read the file data from blob into Uint8Array buffer in memory
    function getBuffer(resolve) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(fileToOpenData);
        reader.onload = function() {
            var arrayBuffer = reader.result
            var bytes = new Uint8Array(arrayBuffer);
            resolve(bytes);
        }
    }
    
    ////////////////////////////////////////////////////
    // END openImageFile
    ////////////////////////////////////////////////////
    
    
}).call(MLJ.core.ImageFile);
