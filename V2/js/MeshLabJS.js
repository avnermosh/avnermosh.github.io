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
 * @file Creates and manages MeshLabJS GUI.
 * @author Stefano Gabriele / stefano_gabriele@yahoo.it  
 */


(function (widget) {

    if (typeof widget === 'undefined') {
        console.error("MLJ.gui.widget module needed.");
    }

    var _$texturePaneWrapper = $('<div id="texture-pane-wrapper"></div>');
    _$texturePaneWrapper.addClass("texturePaneWrapper");

    var texCanvasWrapper = $('<div id="texCanvasWrapper"></div>');
    texCanvasWrapper.addClass("texCanvasWrapper");
    
    var _$border = $('<div id="mlj-tools-pane-border"></div>');

    _$border.css({
        width: "100%",
        background: "none",
        verticalAlign: "middle"
    });

    var _3DWrapper = $('<div id="_3DWrapper"></div>');

    var _3D;
    if(MLJ.core.Model.isScene3DpaneEnabled())
    {
        _3D = $('<div id="_3D"></div>');
    }

    var _3DtopDown = $('<div id="_3DtopDown"></div>');

    this.addGoogleDriveButtons = function () {

        let html1 = '<button id="google-drive-sign-in-or-out-button" style="margin-left: 25px">Sign In/Authorize</button>';
        _$texturePaneWrapper.append(html1);

        let html2 = '<button id="google-drive-revoke-access-button" style="display: none; margin-left: 25px">Revoke access</button>';
        _$texturePaneWrapper.append(html2);
        
        let html3 = '<div id="google-drive-auth-status" style="display: inline; padding-left: 25px"></div><hr>';
        _$texturePaneWrapper.append(html3);

        let html4 = '<div id="dropboxAuthlink"></div>';
        _$texturePaneWrapper.append(html4);

    };
    
    this.makeGUI = function (title) {

        if(MLJ.core.Model.isScene3DpaneEnabled())
        {
            _3DWrapper.append(_3D);
        }
        _3DWrapper.append(_3DtopDown);
        
        $('body').append(_$texturePaneWrapper, _3DWrapper);

        let doSaveUsingGoogleDrive = true;
        doSaveUsingGoogleDrive = false;
        if(doSaveUsingGoogleDrive)
        {
            this.addGoogleDriveButtons();
        }
            
        _$texturePaneWrapper.append(MLJ.gui.getWidget("SceneBar")._make());

        _$texturePaneWrapper.append(texCanvasWrapper);
        
        _3DWrapper.addClass("_3DWrapper");
        
        if(MLJ.core.Model.isScene3DpaneEnabled())
        {
            _3D.css({
                position: "relative",
                width: "100%",
                height: "50%"
            });

            _3DtopDown.css({
                position: "relative",
                width: "100%",
                height: "50%"
            });
        }
        else
        {
            _3DtopDown.addClass("_3DtopDown");
        }

    };
    
    $(window).resize(function (event) {
        // console.log('BEG MeshlabJS resize'); 
    });


}).call(MLJ.gui, MLJ.gui.widget);
