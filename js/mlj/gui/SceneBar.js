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
        var _openImageFileButton;
        
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
            
            _openImageFileButton = new component.FileButton({
                tooltip: "Open image file",
                icon: "img/icons/IcoMoon-Free-master/PNG/48px/0015-images.png",
                multiple: true
            });
            MLJ.gui.disabledOnSceneEmpty(_openImageFileButton);
            
            var addStickyNoteButton = new component.Button({
                tooltip: "Add sticky note",
                icon: "img/icons/IcoMoon-Free-master/PNG/48px/0035-file-text.png"
            });
            MLJ.gui.disabledOnSceneEmpty(addStickyNoteButton);
            
            var resetTrackball3D = new component.Button({
                tooltip: "Reset trackball 3D",
                icon: "img/icons/home.png"
            });
            MLJ.gui.disabledOnSceneEmpty(resetTrackball3D);

            var nextImage = new component.Button({
                tooltip: "Next image",
                icon: "img/icons/IcoMoon-Free-master/PNG/48px/0309-arrow-right.png"
            });
            MLJ.gui.disabledOnSceneEmpty(nextImage);

            
            // var layersComboWidget = new component.LayerSelection({
            var layersComboWidget = new component.ComboBox({
                tooltip: "Sets the selected floor",
                options: [
                    {content: "layer0", value: "0", selected: true},
                    {content: "layer1", value: "1"},
                    {content: "layer2", value: "2"},
                    {content: "layer3", value: "3"},
                ],
                icon: "img/icons/IcoMoon-Free-master/PNG/48px/0047-stack.png"
            });
            MLJ.gui.disabledOnSceneEmpty(layersComboWidget);

            // _toolBar.add(openMeshFileButton,
            //              saveMeshFileButton,
            //              edit3dModelOverlay,
            //              _openImageFileButton,
            //              addStickyNoteButton,
            //              resetTrackball3D,
            //              nextImage);

            _toolBar.add(openMeshFileButton,
                         saveMeshFileButton,
                         edit3dModelOverlay,
                         _openImageFileButton,
                         addStickyNoteButton,
                         resetTrackball3D,
                         nextImage,
                         layersComboWidget);
            
            // SCENE BAR EVENT HANDLERS
            openMeshFileButton.onChange(function (input) {
                MLJ.core.MeshFile.openMeshFile(input.files);
            });

            saveMeshFileButton.onClick(function () {
                var layer = MLJ.core.Scene3D.getSelectedLayer();
                MLJ.core.MeshFile.saveMeshFile(layer, "meshModel.zip");
            });

            edit3dModelOverlay.onClick(function () {
                if(edit3dModelOverlay.isOn())
                {
                    _openImageFileButton.disabled(false);
                }
                else
                {
                    // disable _openImageFileButton
                    _openImageFileButton.disabled(true);
                }
                MLJ.core.Scene3D.setEdit3dModelOverlayFlag(edit3dModelOverlay.isOn());
            });
           
            _openImageFileButton.onChange(function (input) {
                console.log('BEG _openImageFileButton.onChange'); 
                MLJ.core.ImageFile.openImageFile(input.files);
            });

            addStickyNoteButton.onClick(function () {
                var layer = MLJ.core.Scene3D.getSelectedLayer();
                layer.addStickyNote();
            });
           
            resetTrackball3D.onClick(function() {
                MLJ.core.Scene3D.resetTrackball3D();
            })

            nextImage.onClick(function() {
                MLJ.core.Scene3D.loadNextImage();
            })
                        
            layersComboWidget.onChange(function(foo) {
                // console.log('BEG layersComboWidget.onChange');

                let val = layersComboWidget.getSelectedValue();
                // console.log('val', val); 

                let content = layersComboWidget.getSelectedContent();
                // console.log('content', content); 

                if(val == 0 || val == 1 || val == 2 || val == 3)
                {
                    MLJ.core.Scene3DtopDown.setSelectedFloorInfo(content);
                }

                // var layer = MLJ.core.Scene3D.getSelectedLayer();
                // console.log('layer', layer);

                let layers = MLJ.core.Scene3D.getLayers();
                // console.log('layers', layers);
            })
            
        }

        /**
         * @author Stefano Gabriele         
         */
        this._make = function () {
            _toolBar.$.attr("id", "mlj-scenebar-widget");
            return _toolBar.$;
        };

        this.getOpenImageFileButton = function () {
//             console.log('BEG getOpenImageFileButton'); 
//             console.log('_openImageFileButton', _openImageFileButton); 
            return _openImageFileButton;
        };
        
        init();

        MLJ.gui.Widget.call(this);
    };

    MLJ.extend(MLJ.gui.Widget, _SceneBar);

    //Install widget
    MLJ.gui.installWidget("SceneBar", new _SceneBar());

})(MLJ.gui.component);
