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

    /**
     * Opens a image file or a list of image files     
     * @param {(File | FileList)} toOpen A single image file or a list of image files
     * @memberOf MLJ.core.ImageFile
     * @fires MLJ.core.ImageFile#ImageFileOpened
     * @author Stefano Gabriele
     */
    this.openImageFile = function (toOpen) {
        console.log('BEG openImageFile'); 

        console.log('toOpen', toOpen); 

        // toOpen is a FileList
        // typeOfToOpen is object
        // let typeOfToOpen = typeof toOpen;
        
        // console.time("Read image file");

        MLJ.core.Scene3D.openImageFile(toOpen);
        
    };

    
}).call(MLJ.core.ImageFile);
