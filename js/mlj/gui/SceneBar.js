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
 * @file Defines and installs the SceneBar widget 
 * @author Stefano Gabriele
 */
(function (component) {
    /**         
     * @class Create a new SceneBar widget
     * @augments  MLJ.gui.Widget
     * @private
     * @memberOf MLJ.gui.widget
     * @author Stefano Gabriele 
     */
    var _SceneBar = function () {

        var _toolBar = new component.ToolBar();

        function init() {

            var openMeshFileButton = new component.FileButton({
                tooltip: "Open mesh file",
                icon: "img/icons/IcoMoon-Free-master/PNG/48px/0049-folder-open.png",
                multiple: true
            });

            var saveMeshFileButton = new component.Button({
                tooltip: "Save mesh file",
                icon: "img/icons/IcoMoon-Free-master/PNG/48px/0099-floppy-disk.png"
            });
            MLJ.gui.disabledOnSceneEmpty(saveMeshFileButton);

            var edit3dModelOverlay = new component.ToggleButton({
                tooltip: "Edit model overlay",
                icon: "img/icons/IcoMoon-Free-master/PNG/48px/0146-wrench.png"
            });
            MLJ.gui.disabledOnSceneEmpty(edit3dModelOverlay);
            
            var openImageFileButton = new component.FileButton({
                tooltip: "Open image file",
                icon: "img/icons/IcoMoon-Free-master/PNG/48px/0015-images.png",
                multiple: true
            });
            
            var resetTrackball = new component.Button({
                tooltip: "Reset trackball",
                icon: "img/icons/home.png"
            });

            MLJ.gui.disabledOnSceneEmpty(resetTrackball);
            _toolBar.add(openMeshFileButton,
                         saveMeshFileButton,
                         edit3dModelOverlay,
                         openImageFileButton,
                         resetTrackball);
            
            // SCENE BAR EVENT HANDLERS
            openMeshFileButton.onChange(function (input) {
                MLJ.core.MeshFile.openMeshFile(input.files);
            });

            saveMeshFileButton.onClick(function () {
                var layer = MLJ.core.Scene.getSelectedLayer();
                MLJ.core.MeshFile.saveMeshFile(layer, "meshModel.zip");
            });

            edit3dModelOverlay.onClick(function () {
                MLJ.core.Scene.setEdit3dModelOverlayFlag(edit3dModelOverlay.isOn());
            });
           
            openImageFileButton.onChange(function (input) {
                MLJ.core.ImageFile.openImageFile(input.files);
            });

            resetTrackball.onClick(function() {
                MLJ.core.Scene.resetTrackball();
            })
        }

        /**
         * @author Stefano Gabriele         
         */
        this._make = function () {
            _toolBar.$.attr("id", "mlj-scenebar-widget");
            return _toolBar.$;
        };

        init();

        MLJ.gui.Widget.call(this);
    };

    MLJ.extend(MLJ.gui.Widget, _SceneBar);

    //Install widget
    MLJ.gui.installWidget("SceneBar", new _SceneBar());

})(MLJ.gui.component);
