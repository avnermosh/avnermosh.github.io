////////////////////////////////////////////////////////////////
//
// This file (js/mlj/plugins/rendering/TexturePanelPlugin.js) is responsible to handle the GUI for the Texturing tab
// e.g. resize the texture when zooming in/out with the middle mouse button
//
// for comparison the file MLJ.core.plugin.Texturing.js (in mlj/core/plugin/) does xxx
////////////////////////////////////////////////////////////////

var animationDuration = 200;
var globalIndex1 = 0;

(function (plugin, core)
 {
    
    var texCamera;
    var texScene;
    var texRenderer1;
    var texLabelRenderer;
    var texControls;
    let rotationVal = 0;
    var planeMesh1;
    var bbox;
    var viewportExtendsOnX = false;
    var currentViewportNormalized;
    
    var DEFAULTS = {
        uvParam: false,
        selectedTexture: 0
    };
    
    var plug = new plugin.Texturing({
        name: "TexturePanel",
        tooltip: "Show the texture image",
        toggle: true,
        on: true
    }, DEFAULTS);

    var widgets;

    plug._init = function (guiBuilder) {
        widgets = [];
        hideWidgets();
    };

    plug.getTexScene = function () {
        return texScene;
    };

    plug.getTexLabelRenderer = function () {
        return texLabelRenderer;
    };
    
    plug.getTexCamera = function () {
        return texCamera;
    };

    plug.getBoundingBox = function () {
        return bbox;
    };

    plug.doesViewportExtendOnX = function () {
        return viewportExtendsOnX;
    };
    
    plug.showStickyNotes = function (layer) {
        
        let noteArray = layer.getNoteArray();

        let iter = noteArray.iterator();
        while (iter.hasNext()) {
            let note = iter.next();
            
            let noteElementId = note.getNoteId();
            let noteElement = document.getElementById(noteElementId);
            if(!noteElement)
            {
                console.error( 'noteElement is not defined for noteElementId:', noteElementId );
                continue;
            }

            let selectedLayer = MLJ.core.Model.getSelectedLayer();
            let selectedImageFilename = selectedLayer.getSelectedImageFilename();
            
            if(note.getImageFilename() === selectedImageFilename)
            {
                // Show the note
                noteElement.classList.remove("inactive-note");
                noteElement.classList.add("active-note");
                note.activate();
            }
            else
            {
                // hide the note
                noteElement.classList.remove("active-note");
                noteElement.classList.add("inactive-note");
                note.deactivate();
            }
        }

    };

    plug._applyTo = function (layer, layersNum, $) {
//         console.log('BEG plug._applyTo');
        
        // // RemoveME:
        // console.clear();
        
        //if the array has been defined then there was at least a texture, for now, we are gonna show ONLY the first one
        layer.texturesNum = 0;
        if (layer.texture.length > 0) {
            layer.texturesNum = 1;
        }
        
        $("#texCanvasWrapper").append(texRenderer1.domElement);
        if(MLJ.core.Model.isStickyNotesEnabled())
        {
            $("#texCanvasWrapper").append(texLabelRenderer.domElement);
        }

        //Always remove everything from the scene when creating the meshes and adding them to the scene
        for (var i = texScene.children.length - 1; i >= 0; i--) {
            if(texScene.children[i].type == "Sprite")
            {
                texScene.remove(texScene.children[i]);
            }
        }

        if (layer.texturesNum > 0 && layersNum > 0) {

            showWidgets();

            for (var i = 0; i < layer.texturesNum; i++) {
                //If a layer is added, we need to create the planar mesh with the texture for the first time, so, if it's undefined
                //We'll create it only now in order to avoid useless computation on each layer selections
                if (!layer.texture[i].planeMesh) {

                    var map2 = layer.texture[0].data.material.map;
            // console.log('map2a', map2);
            // map2.needsUpdate = true;
            // console.log('map2a', map2);

                    let imageInfoVec = layer.getImageInfoVec();
                    let selectedThumbnailImageFilename = layer.getSelectedThumbnailImageFilename();

                    let selectedImageFilename = layer.getSelectedImageFilename();
                    let imageInfo = imageInfoVec.getByKey(selectedImageFilename);
                    if(!imageInfo.width) {
                        imageInfo.width = map2.image.width;
                        imageInfo.height = map2.image.height;
                    }
                    imageInfoVec.set(selectedImageFilename, imageInfo);
                    layer.setImageInfoVec(imageInfoVec);

                    let image_w_h_ratio = 0;

                    switch (Number(imageInfo.orientation)) {
                        case -1:
                        case 1:
                            // landscape
                            rotationVal = 0;
                            image_w_h_ratio = map2.image.width / map2.image.height;

                            // Update the camera frustum to cover the entire image
                            texCamera.left = -map2.image.width/2;
                            texCamera.right = map2.image.width/2;
                            texCamera.top = map2.image.height/2;
                            texCamera.bottom = -map2.image.height/2;
                            
                            break;
                        case 6:
                            // portrait
                            rotationVal = (-Math.PI / 2);
                            image_w_h_ratio = map2.image.height / map2.image.width;

                            // Update the camera frustum to cover the entire image
                            texCamera.left = -map2.image.height/2;
                            texCamera.right = map2.image.height/2;
                            texCamera.top = map2.image.width/2;
                            texCamera.bottom = -map2.image.width/2;
                            
                            break;
                        default:
                            break;
                    }
                    
                    texCamera.aspect = image_w_h_ratio;
                    texCamera.updateProjectionMatrix();
 
                    var material = new THREE.SpriteMaterial( { map: map2,
                                                               color: 0xffffff,
                                                               rotation: rotationVal,
                                                               fog: true } );
                    let planeMesh = new THREE.Sprite( material );
                    planeMesh.position.set( 0, 0, 0 );
                    let scaleX = (texCamera.right - texCamera.left);
                    let scaleY = (texCamera.top - texCamera.bottom);

                    switch (Number(imageInfo.orientation)) {
                        case -1:
                        case 1:
                            // landscape
                            planeMesh.scale.set( scaleX, scaleY, 1 );
                            break;

                        case 6:
                            // portrait
                            planeMesh.scale.set( scaleY, scaleX, 1 );
                            break;

                        default:
                            break;
                    }

                    planeMesh.name = "planeMesh";

                    layer.texture[i].planeMesh = planeMesh;
                }
            }

            // Reset the camera control attributes (e.g. position, view angle, zoom of the camera)
            texControls.reset();

            // The plane mesh is always visible
//             console.log('layer.selectedTexture', layer.selectedTexture); 
            planeMesh1 = layer.texture[layer.selectedTexture].planeMesh;
//             console.log('planeMesh1', planeMesh1);
            
            bbox = new THREE.Box3().setFromObject(planeMesh1);
            if(planeMesh1.material.rotation === 0)
            {
                // landscape
            }
            else
            {
                // portrait
                let minX = bbox.min.x;
                bbox.min.x = bbox.min.y;
                bbox.min.y = minX;

                let maxX = bbox.max.x;
                bbox.max.x = bbox.max.y;
                bbox.max.y = maxX;
            }
            // planeMesh1.material.needsUpdate1 = true;
            // planeMesh1.material.map.needsUpdate = true;
            // planeMesh1.material.map.foo = true;

            // console.log('planeMesh1.material.map.needsUpdate', planeMesh1.material.map.needsUpdate);
            // console.log('planeMesh1.material.map', planeMesh1.material.map);

            ////////////////////////////////////////////////////////////////////
            // Update imageTextInfo with the information of the selected image
            ////////////////////////////////////////////////////////////////////
            
            let imageTextInfoId = "imageTextInfo";
            let html = '<div id="editor1a">';
            MLJ.util.addElement('texCanvasWrapper', 'div', imageTextInfoId, html, 'imageTextInfo');
            let box1div = document.getElementById('imageTextInfo');
            // box1div.className = 'imageTextInfo';
            let imageTextInfo = new THREE.CSS2DObject( box1div );
            imageTextInfo.position.set( 0, 0, 0 );
            imageTextInfo.name = 'imageTextInfo';
            planeMesh1.add( imageTextInfo );

            let imageInfoVec = layer.getImageInfoVec();
            let selectedImageFilename = layer.getSelectedImageFilename();
            let imageInfo = imageInfoVec.getByKey(selectedImageFilename);
            imageTextInfo.element.innerText = imageInfo.toString(imageInfo);
            
            //Add the mesh to the scene
            texScene.add(planeMesh1);

            texCamera.position.set( 0, 0, 80 );

            this.showStickyNotes(layer);

        }
        else {
            hideWidgets();
        }

        resizeCanvas();

        //Always render, if nothing is shown, then no layer is selected
        render();
    };

    function onDocumentTouchMove2D( event ) {
        // console.log('BEG onDocumentTouchMove2D');

        if(texControls.isTouchDown)
        {
            event.preventDefault();

//             console.log('event.touches.length', event.touches.length); 
            render();
        }
    }

    function onDocumentMouseMove2D( event ) {
        // console.log('BEG onDocumentMouseMove2D'); 
        event.preventDefault();

        render();
    }

    function onDocumentTouchDoubleTap( event ) {

        // implementation of onDocumentTouchDoubleTap requires jquery.mobile-events/2.0.0/jquery.mobile-events.min.js
        
        // console.log('BEG onDocumentTouchDoubleTap'); 

        let element1Id = 'texture-pane-wrapper';
        let element1JqueryObject = $('#' + element1Id);
        var element1 = document.getElementById(element1Id);
        
        var element2 = document.getElementById('_3DWrapper');
        var element3 = document.getElementById('mlj-scenebar-widget');
        
        if(globalIndex1%2==0)
        {
            // console.log('globalIndex1 is Even');

            element1JqueryObject.addClass("showFullSize");
            element1JqueryObject.removeClass("texturePaneWrapper");
            
            element2.style.display = "none";
            element3.style.display = "none";
        }
        else
        {
            // console.log('globalIndex1 is Odd'); 

            element1JqueryObject.removeClass("showFullSize");
            element1JqueryObject.addClass("texturePaneWrapper");
            
            element2.style.display = "block";
            element3.style.display = "block";
        }

        // Center the texture image image after toggling between single pane and multiple panes
        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        if(selectedLayer.loadTheSelectedImageAndRender() == false)
        {
            throw('Failed to load and render the selected image.');
        }

        globalIndex1 += 1;
    };

    function setTexControls() {
        console.log('BEG setTexControls');

        // Need to be similar to what is in OrbitControls3Dpane.js constructor
        let texCanvasWrapperElement = document.getElementById('texCanvasWrapper');
        // console.log('texCanvasWrapperElement', texCanvasWrapperElement); 

        texControls = new THREE.OrbitControls3Dpane(texCamera, texCanvasWrapperElement);
        
        //////////////////////////////////////
        // Set rotate related parameters
        //////////////////////////////////////

        // No rotation.
        texControls.enableRotate = false;
        // Set the rotation angle (with 0 angle change range) to Math.PI/2 to satisfy OrbitControls3Dpane with "y-axis-is-up"
        // coordinate axis system is:
        // x-red - directed right (on the screen), y-green directed up (on the screen), z-blue directed towards the camera
        texControls.minPolarAngle = Math.PI/2;
        texControls.maxPolarAngle = Math.PI/2;
        // No orbit horizontally.
        texControls.minAzimuthAngle = 0; // radians
        texControls.maxAzimuthAngle = 0; // radians

        //////////////////////////////////////
        // Set zoom related parameters
        //////////////////////////////////////

        texControls.enableZoom = true;
        texControls.zoomSpeed = 0.8;
        texControls.minDistance = texCamera.near;
        texControls.maxDistance = texCamera.far;
        // The minimal zoom is set to 1, to prevent a case where the image is smaller than the view window
        texControls.minZoom = 1;
        texControls.maxZoom = Infinity;

        //////////////////////////////////////
        // Set pan related parameters
        //////////////////////////////////////

        texControls.enablePan = true;
        texControls.panSpeed = 0.6;
        texControls.screenSpacePanning = true;
        texControls.enableDamping = false;
        
        texCanvasWrapperElement.addEventListener( 'touchmove', onDocumentTouchMove2D, false );
        texCanvasWrapperElement.addEventListener( 'mousemove', onDocumentMouseMove2D, false );
        
        texControls.addEventListener('change', render);
    };
    
    function canvasInit() {

        // console.log('BEG canvasInit');

        //////////////////////////////////////
        // Set camera related parameters
        //////////////////////////////////////

        // https://discourse.threejs.org/t/does-change-in-camera-position-impact-the-left-top-right-and-bottom-parameters-of-orthographic-camera/5501
        // left,right,top,bottom are in world units, i.e. for OrthographicCamera: leftBorderX = camera.position.x + (camera.left / camera.zoom);
        //
        // left,right,top,bottom (-50, 50, 50, -50) goes together with planeMesh.scale (100, 100, 1)
        // because the vertices of planeMesh.geometry.attributes.position.data.array which is of type THREE.Sprite are normalized (-0.5 - 0.5)
        // then the combination of left,right,top,bottom (-50, 50, 50, -50), and planeMesh.scale (100, 100, 1) fills in the entire window
        // for combination of left,right,top,bottom (-50, 50, 50, -50), and planeMesh.scale (50, 100, 1) the image covers 1/2 of the window on the x axis
        // for combination of left,right,top,bottom (-200, 200, 200, -200), and planeMesh.scale (100, 100, 1) the image covers 1/4 of the window on the x axis, and on the y axis

        let left = -100;
        let right = 100;
        let top = 50;
        let bottom = -50;
        let near = -500;
        let far = 1000;

        texCamera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
        texCamera.position.set( 0, 0, 80 );
        
        texScene = new THREE.Scene();

        //////////////////////////////////////
        // Set texRenderer1 related parameters
        //////////////////////////////////////

        texRenderer1 = new THREE.WebGLRenderer({
            preserveDrawingBuffer: true,
            alpha: true});
        
        texRenderer1.domElement.id = 'canvasTex';
        texRenderer1.setPixelRatio(window.devicePixelRatio);
        texRenderer1.setClearColor(0XDBDBDB, 1); //Webgl canvas background color

        let texRenderer1JqueryObject = $('#' + texRenderer1.domElement.id);
        texRenderer1JqueryObject.addClass("showFullSize");

        setTexControls();

        if(MLJ.core.Model.isStickyNotesEnabled())
        {
            texLabelRenderer = new THREE.CSS2DRenderer();
            texLabelRenderer.domElement.id = 'canvasTexLabel';
            texLabelRenderer.setSize( texRenderer1.getSize().width, texRenderer1.getSize().height );
            texLabelRenderer.domElement.style.position = 'absolute';
            texLabelRenderer.domElement.style.top = 0;
        }

        ////////////////////////////////////////////////////
        // Handle doubletap 
        ////////////////////////////////////////////////////

        let texturePaneWrapperJqueryObject = $('#texture-pane-wrapper');
        // console.log('texturePaneWrapperJqueryObject', texturePaneWrapperJqueryObject); 

        texturePaneWrapperJqueryObject.on('doubletap', function(event) {
            console.log('BEG onDocumentTouchDoubleTap'); 
            // Takes care both of "double touch" (with the finger) and double click (with the mouse)
            // maximization of texture pane is now handled via a button instead of double tap
            // console.log('User doubletapped #myElement');
            // onDocumentTouchDoubleTap(event);
        });
        
    }

    function animate() {
        requestAnimationFrame(animate);
        texControls.update();
    }

    function render() {
        // console.log('BEG TexturePanelPlugin render');
        // console.log('texScene.children.length', texScene.children.length); 
        if(texScene.children.length > 0)
        {
            // console.log('texScene.children[0]', texScene.children[0]);
            // console.log('texScene.children[0].material', texScene.children[0].material);
//             console.log('texScene.children[0].material.needsUpdate', texScene.children[0].material.needsUpdate); 
//             texScene.children[0].material.needsUpdate = true;
//             console.log('texScene.children[0].material.needsUpdate1', texScene.children[0].material.needsUpdate); 
        }
        else
        {
        }
        // console.log('texScene.children[0].material.map', texScene.children[0].material.map);
        // console.log('texCamera', texCamera);
        
        texRenderer1.render(texScene, texCamera);
        if(MLJ.core.Model.isStickyNotesEnabled())
        {
            texLabelRenderer.render(texScene, texCamera);
        }
    }

    $(window).resize(function () {
        // console.log('BEG TexturePanelPlugin resize');

        // ok - scales the image to the maximum within the window while preserving the aspect ratio,
        // ok - when zooming the image fills in the entire window
        resizeCanvas();

        render();
    });

    function getTexCanvasWrapperSize() {
        // console.log('BEG TexturePanelPlugin getTexCanvasWrapperSize');
        let texCanvasWrapper = $('#texCanvasWrapper');
        
        return {
            width: texCanvasWrapper.innerWidth(),
            height: texCanvasWrapper.innerHeight()
        };
    }

     function scaleAndCenterTheSelectedImage(orientation) {
//          console.log('BEG scaleAndCenterTheSelectedImage'); 

         // texCanvasWrapperSize - the size of the gui window
         let texCanvasWrapperSize = getTexCanvasWrapperSize();

         let imageWidth = planeMesh1.material.map.image.width;
         let imageHeight = planeMesh1.material.map.image.height;

         let retVal = texControls.setCameraAndCanvas(texCanvasWrapperSize.width,
                                                     texCanvasWrapperSize.height,
                                                     imageWidth,
                                                     imageHeight,                             
                                                     orientation);

         planeMesh1.scale.set( retVal.scaleX, retVal.scaleY, 1 );
         viewportExtendsOnX = retVal.viewportExtendsOnX;

         texRenderer1.setSize(texCanvasWrapperSize.width, texCanvasWrapperSize.height);

         if(MLJ.core.Model.isStickyNotesEnabled())
         {
             texLabelRenderer.setSize(retVal.canvasWidth, retVal.canvasHeight);
         }

         // Set viewport
         texRenderer1.setViewport ( -retVal.canvasOffsetLeft, -retVal.canvasOffsetTop, retVal.canvasWidth, retVal.canvasHeight );
         let currentViewport = texRenderer1.getCurrentViewport();
         let pixelRatio = texRenderer1.getPixelRatio();
         _currentViewportNormalized = new THREE.Vector4();
         _currentViewportNormalized.copy(currentViewport)
         _currentViewportNormalized.divideScalar(pixelRatio);
     };
    
    function resizeCanvas() {
//         console.log('BEG TexturePanelPlugin resizeCanvas');
        
        //////////////////////////////////////////////////////////
        // Set the height of texCanvasWrapper programatically.
        //////////////////////////////////////////////////////////

        let texturePaneWrapper = document.getElementById('texture-pane-wrapper');
        let texCanvasWrapper = $('#texCanvasWrapper');
        if(texturePaneWrapper.classList.contains("texturePaneWrapper"))
        {
            // texturePaneWrapper has css class texturePaneWrapper, i.e. displaying multiple panes
            // including the sceneBar, which needs to be accounted for.
            // Set the height of texCanvasWrapper to occupy the parent (texturePaneWrapper) remaining height, after scenebar
            
            let scenbarJqueryObject = $('#mlj-scenebar-widget');
            let sceneBarHeight = scenbarJqueryObject.css("height");
            // console.log('sceneBarHeight', sceneBarHeight); 

            // e.g. texCanvasWrapper.css({height: "calc( 100% - 33.78px )"})
            let calcCmd = "calc( 100% - " + sceneBarHeight + ")";
            // console.log('calcCmd', calcCmd); 
            texCanvasWrapper.css({height: calcCmd});
        }
        else
        {
            // texturePaneWrapper has css class showFullSize, i.e. displaying a single pane,
            // and hiding the sceneBar, which does not need to be accounted for.
            texCanvasWrapper.css({height: "100%"});
        }

        //////////////////////////////////////////////////////////
        // Scale and senter the selected image
        //////////////////////////////////////////////////////////

        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        let imageInfoVec = selectedLayer.getImageInfoVec();
        let selectedImageFilename = selectedLayer.getSelectedImageFilename();
        let imageInfo = imageInfoVec.getByKey(selectedImageFilename);
        
        if(imageInfo && planeMesh1)
        {
            scaleAndCenterTheSelectedImage(imageInfo.orientation);
        }
    };


    function hideWidgets() {
        // //call the parent to hide the div containing both label and button set
        // for (var i = 0; i < widgets.length; i++) {
        //     if (widgets[i].rangedfloat)
        //         widgets[i].rangedfloat.$.parent().parent().hide(animationDuration);
        //     if (widgets[i].color)
        //         widgets[i].color.$.parent().parent().hide(animationDuration);
        //     if (widgets[i].choice)
        //         widgets[i].choice.$.parent().parent().hide(animationDuration);
        // }

        $("#texCanvasWrapper").hide(animationDuration);
        $("#texInfoContainer").hide(animationDuration);
    }

    function showWidgets() {
        // //call the parent to show the div containing both label and button set
        // for (var i = 0; i < widgets.length; i++) {
        //     if (widgets[i].rangedfloat)
        //         widgets[i].rangedfloat.$.parent().parent().show(animationDuration);
        //     if (widgets[i].color)
        //         widgets[i].color.$.parent().parent().show(animationDuration);
        //     if (widgets[i].choice)
        //         widgets[i].choice.$.parent().parent().show(animationDuration);
        // }

        $("#texCanvasWrapper").show(animationDuration);
        $("#texInfoContainer").show(animationDuration);
    }

    plugin.Manager.install(plug);

    // $(document).ready(function () {
    // });
    
    //INIT
    $(window).ready(function () {
        // canvasInit();
        // animate();
    });

    // $(window).load happens after $(window).ready   
    // $(window).ready(function () {
    $(window).load(function () {

        // at this point the following elements are defined - texCanvasWrapper
        canvasInit();
        animate();

        var doLoadHardcodedZipFile = true;
        doLoadHardcodedZipFile = false;
        if(doLoadHardcodedZipFile)
        {
            // a. loadMeshDataFromFile triggers "MeshFileOpened" event
            // b. Scene::$(document).on("MeshFileOpened responds on it and calls addLayer
            // the window needs to be fully loaded so that the trigger is intercepted in b. and addLayer is called
            // 
            // https://stackoverflow.com/questions/20418169/difference-between-window-load-and-window-ready?lq=1
            // https://stackoverflow.com/questions/3698200/window-onload-vs-document-ready
            //
            // txtFile needs to in the same dir as index.html
            // https://stackoverflow.com/questions/8390855/how-to-instantiate-a-file-object-in-javascript
            var txtFile = "meshModel.zip";

            var file1 = new File([""], txtFile, {type: "application/zip"})

            // The size is incorrectly set to 0, which causes the read to fail
            console.log('file1', file1); 

            MLJ.core.MeshFile.openSingleMeshFile(file1);
            
        }
    });

})(MLJ.core.plugin, MLJ.core);
