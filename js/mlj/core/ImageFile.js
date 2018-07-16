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

        return false;
    }

    var getFileExtention = function (filename2)
    {
        // http://www.jstips.co/en/javascript/get-file-extension/
        var fileExt = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
        return fileExt;
    };

    
    /**
     * Opens a image file or a list of image files     
     * @param {(File | FileList)} toOpen A single image file or a list of image files
     * @memberOf MLJ.core.ImageFile
     * @fires MLJ.core.ImageFile#ImageFileOpened
     * @author Stefano Gabriele
     */
    this.openImageFile = function (toOpen) {
        console.log('BEG openImageFile'); 
        // console.log('toOpen', toOpen); 

        // console.time("Read image file");

        $(toOpen).each(function (key, file) {

            if (!(file instanceof File)) {
                console.error("MLJ.ImageFile.openImageFile(file): the parameter 'file' must be a File instace.");
                return;
            }

            //Add file to opened list
            _openedList.set(file.name, file);
            //Extract file extension
            var pointPos = file.name.lastIndexOf('.');
            var extension = file.name.substr(pointPos);

            //Validate file extension
            if (!isExtensionValid(extension)) {
                console.error("MeshLabJs allows file format '.jpg', '.png'. \nTry again.");
                return;
            }

            console.log('file.name', file.name);
            
        });
    };

    
}).call(MLJ.core.ImageFile);
