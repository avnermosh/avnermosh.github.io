////////////////////////////////////////////////////////////////
//
// This file (js/mlj/plugins/rendering/TexturePanelPlugin.js) is responsible to handle the GUI for the Texturing tab
// e.g. resize the texture when zooming in/out with the middle mouse button
//
// for comparison the file MLJ.core.plugin.Texturing.js (in mlj/core/plugin/) does xxx
////////////////////////////////////////////////////////////////

var animationDuration = 200;
var globalIndex1 = 0;

(function (plugin, core, scene) {
    
    var texCamera;
    var texScene;
    var texRenderer1;
    var texLabelRenderer;
    var texControls;
    let rotationVal = 0;
    var planeMesh1;
    var bbox;
    
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

    ///////////////////////////////////////////////////////////////////////////
    // limitPanning() insures that the image always covers the view window:
    // - The minimal zoom is set to 1, to prevent a case where the image is smaller than the view window 
    // - If the zoom is 1, the image covers the view window, and panning is disabled.
    // - If the zoom is bigger than 1, panning is enabled as long as the image covers the view window.
    ///////////////////////////////////////////////////////////////////////////

    plug.limitPanning = function () {
        console.log('BEG plug.limitPanning'); 
        
        // console.log('texCamera.zoom', texCamera.zoom);
        // console.log('texCamera.left', texCamera.left);
        // console.log('texCamera.position.x', texCamera.position.x);
        
        let x1 = texCamera.position.x + (texCamera.left / texCamera.zoom);
        // console.log('x1', x1); 
        let x1a = Math.max(x1, bbox.min.x);
        // console.log('bbox.min.x', bbox.min.x); 
        // console.log('x1a', x1a); 
        let pos_x = x1a - (texCamera.left / texCamera.zoom);
        // console.log('pos_x1', pos_x);
        
        let x2 = pos_x + (texCamera.right / texCamera.zoom);
        let x2a = Math.min(x2, bbox.max.x);
        pos_x = x2a - (texCamera.right / texCamera.zoom);
        // console.log('pos_x', pos_x);
        
        let y1 = texCamera.position.y + (texCamera.bottom / texCamera.zoom);
        let y1a = Math.max(y1, bbox.min.y);
        let pos_y = y1a - (texCamera.bottom / texCamera.zoom);
        
        let y2 = pos_y + (texCamera.top / texCamera.zoom);
        let y2a = Math.min(y2, bbox.max.y);
        pos_y = y2a - (texCamera.top / texCamera.zoom);
        // console.log('pos_y', pos_y);
        
        let doLimitPan = true;
        if(doLimitPan)
        {
            texCamera.position.set(pos_x, pos_y, texCamera.position.z);
            texCamera.lookAt(pos_x, pos_y, texControls.target.z);
            texControls.target.set(pos_x, pos_y, 0);
            texControls.update();            
        }
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
            
            let selectedImageFilename = MLJ.core.Scene3D.getSelectedImageFilename();
            
            if(note.getImageFilename() === selectedImageFilename)
            {
                // Show the note
                noteElement.classList.remove("inactive-note");
                noteElement.classList.add("active-note");

                note.activate();
                // texEditNotesControls[j].addEventListener( 'dragstart', function ( event ) { texControls.enabled = false; } );
                // texEditNotesControls[j].addEventListener( 'dragend', function ( event ) { texControls.enabled = true; } );
                
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
        // // RemoveME:
        // console.clear();

        //if the array has been defined then there was at least a texture, for now, we are gonna show ONLY the first one
        layer.texturesNum = 0;
        if (layer.texture.length > 0) {
            layer.texturesNum = 1;
        }
        
        // remove?
        scene.render();

        $("#texCanvasWrapper").append(texRenderer1.domElement);
        if(MLJ.core.Scene3D.isStickyNotesEnabled())
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

                    // let blobs = MLJ.core.Scene3D.getBlobs();
                    let imageInfoVec = MLJ.core.Scene3D.getImageInfoVec();
                    let selectedThumbnailImageFilename = MLJ.core.Scene3D.getSelectedThumbnailImageFilename();
                    let imageInfo = imageInfoVec.getByKey(selectedThumbnailImageFilename);

                    switch (Number(imageInfo.imageOrientation)) {
                        case 1:
                            rotationVal = 0;
                            break;
                        case 6:
                            rotationVal = (-Math.PI / 2);
                            break;
                        default:
                            break;
                    }
                    
                    var material = new THREE.SpriteMaterial( { map: map2,
                                                               color: 0xffffff,
                                                               rotation: rotationVal,
                                                               fog: true } );
                    let planeMesh = new THREE.Sprite( material );
                    planeMesh.position.x = planeMesh.position.y = planeMesh.position.z = 0;
                    planeMesh.scale.x = 100
                    planeMesh.scale.y = 100;
                    planeMesh.name = "planeMesh";

                    layer.texture[i].planeMesh = planeMesh;
                }
            }

            //Add the mesh to the scene
            texControls.reset();

            // The plane mesh is always visible

            // texScene.add(layer.texture[layer.selectedTexture].planeMesh);

            planeMesh1 = layer.texture[layer.selectedTexture].planeMesh;
            console.log('planeMesh1', planeMesh1); 
            bbox = new THREE.Box3().setFromObject(planeMesh1);
            texScene.add(planeMesh1);
            texCamera.position.set( 0, 0, 80 );
            

            this.showStickyNotes(layer);

        }
        else {
            hideWidgets();
        }

        //This will resize the windows properly and trigger the resizeCanvas function
        $(window).trigger('resize');

        //Always render, if nothing is shown, then no layer is selected
        render();
    };

    function onDocumentTouchMove2D( event ) {
        // console.log('BEG onDocumentTouchMove2D');
        // console.log('texControls.isTouchDown', texControls.isTouchDown); 

        if(texControls.isTouchDown)
        {
            event.preventDefault();

            console.log('event.touches.length', event.touches.length); 
            render();
        }
    }

    function onDocumentMouseMove2D( event ) {
        // console.log('BEG onDocumentMouseMove2D'); 
        event.preventDefault();

        render();
    }

    function onDocumentTouchDoubleTap( event ) {

        console.log('BEG onDocumentTouchDoubleTap'); 

        let element1Id = 'texture-pane-wrapper';
        let element1JqueryObject = $('#' + element1Id);
        var element1 = document.getElementById(element1Id);
        
        var element2 = document.getElementById('_3DWrapper');
        var element3 = document.getElementById('mlj-scenebar-widget');
        
        if(globalIndex1%2==0)
        {
            console.log('globalIndex1 is Even');

            element1JqueryObject.addClass("showFullSize");
            element1JqueryObject.removeClass("texturePaneWrapper");
            
            element2.style.display = "none";
            element3.style.display = "none";
        }
        else
        {
            console.log('globalIndex1 is Odd'); 

            element1JqueryObject.removeClass("showFullSize");
            element1JqueryObject.addClass("texturePaneWrapper");
            
            element2.style.display = "block";
            element3.style.display = "block";
        }

        // Adjust the size and position of the texRenderer1 (canvasTex), texLabelRenderer (canvasTexLabel) elements
        resizeCanvas();
        
        globalIndex1 += 1;
    };

    function setTexControls() {
        console.log('BEG setTexControls');

        // Need to be similar to what is in OrbitControls3Dpane.js constructor
        let texCanvasWrapperElement = document.getElementById('texCanvasWrapper');
        // console.log('texCanvasWrapperElement', texCanvasWrapperElement); 

        texControls = new THREE.OrbitControls3Dpane(texCamera, texCanvasWrapperElement);
        
        console.log('texControls.enableZoom5', texControls.enableZoom); 
        
        //////////////////////////////////////
        // Set rotate related parameters
        //////////////////////////////////////

        // No rotation.
        texControls.enableRotate = false;
        // Setting to Math.PI/2 is needed to satisfy OrbitControls3Dpane, which forces "y-axis-is-up"
        // (otherwise the camera position is forced moved to  satisfy the "y-axis-is-up" condition)
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
        texControls.enableDamping = true;
        
        
        texCanvasWrapperElement.addEventListener( 'touchmove', onDocumentTouchMove2D, false );
        texCanvasWrapperElement.addEventListener( 'mousemove', onDocumentMouseMove2D, false );
        
        texControls.addEventListener('change', render);
    };
    
    function canvasInit() {

        // console.log('BEG canvasInit');

        // Looks like left,right,top,bottom is in %
        // (when set to -100,100, the image covers 1/2 of the window)
        // (when set to -200,200, the image covers 1/4 of the window)
        // frustum can be updated in resizeCanvas

        let left = -50;
        let right = 50;
        let top = 50;
        let bottom = -50;
        // let left = -200;
        // let right = 200;
        // let top = 200;
        // let bottom = -200;

        let near = -500;
        let far = 1000;

        texCamera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
        texCamera.position.set( 0, 0, 80 );
        
        texScene = new THREE.Scene();

        texRenderer1 = new THREE.WebGLRenderer({
            preserveDrawingBuffer: true,
            alpha: true});
        
        texRenderer1.domElement.id = 'canvasTex';
        texRenderer1.setPixelRatio(window.devicePixelRatio);
        texRenderer1.setClearColor(0XDBDBDB, 1); //Webgl canvas background color

        setTexControls();

        if(MLJ.core.Scene3D.isStickyNotesEnabled())
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

        let element1Id = 'texture-pane-wrapper';
        let element1JqueryObject = $('#' + element1Id);
        console.log('element1JqueryObject', element1JqueryObject); 

        element1JqueryObject.on('doubletap', function(event) {
            // Takes care both of "double touch" (with the finger) and double click (with the mouse)
            console.log('User doubletapped #myElement');
            onDocumentTouchDoubleTap(event);
        });
        
    }


    function animate() {
        requestAnimationFrame(animate);
        texControls.update();
    }

    function render() {
        // console.log('BEG TexturePanelPlugin render');

        texRenderer1.render(texScene, texCamera);
        if(MLJ.core.Scene3D.isStickyNotesEnabled())
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


    function getTexturePaneWrapperSize() {
        console.log('BEG TexturePanelPlugin getTexturePaneWrapperSize');

        let texturePaneWrapper = $('#texture-pane-wrapper');
        console.log('texturePaneWrapper.outerWidth()', texturePaneWrapper.outerWidth());
        console.log('texturePaneWrapper.innerWidth()', texturePaneWrapper.innerWidth());

        // TBD
        // innerHeight, outerHeight kepps increasing ???
        console.log('texturePaneWrapper.innerHeight()', texturePaneWrapper.innerHeight());
        // console.log('texturePaneWrapper', texturePaneWrapper);
        // console.log('texturePaneWrapper.clientWidth', texturePaneWrapper.clientWidth);
        
        return {
            width: texturePaneWrapper.innerWidth(),
            height: texturePaneWrapper.innerHeight()
            // width: texturePaneWrapper.outerWidth(),
            // height: texturePaneWrapper.outerHeight()
        };
    }

    function resizeCanvas() {
        // console.log('BEG TexturePanelPlugin resizeCanvas');
        
        var texturePaneWrapperSize = getTexturePaneWrapperSize();
        // console.log('texturePaneWrapperSize', texturePaneWrapperSize);

        let portraitWidth = 1512;
        let portraitHeight = 2016;
        let imageAspectPortrait = portraitWidth / portraitHeight;

        // w0, h0 - the size of the gui window
        let w0 = $("#texCanvasWrapper").width();
        let h0 = $("#texCanvasWrapper").height();
        // console.log('w0', w0); 
        // console.log('h0', h0);

        //////////////////////////////////////////////////////////
        // Set the aspect ratio of texCamera - always set to imageAspectPortrait for portrait or
        // 1/imageAspectPortrait for landscape
        //////////////////////////////////////////////////////////

        if(rotationVal !== 0)
        {
            // portrait
            image_w_h_ratio = imageAspectPortrait;
        }
        else
        {
            // landscape
            image_w_h_ratio = 1 / imageAspectPortrait;
        }
        texCamera.aspect = image_w_h_ratio;
        texCamera.updateProjectionMatrix();

        //////////////////////////////////////////////////////////
        // Set canvas width / height
        // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
        // Set the width and height to be such that the entire pane is used for drawing
        // and set the zoom factor such that the entire image is seen 
        //////////////////////////////////////////////////////////

        // w1, h1 - the size of the canvas that preserves the aspectRatio of the image. It exceeds the gui window, i.e. w1>=w0, h1>=h0
        //          also, the size of the viewport.
        let texturePaneWrapperRatio = w0 / h0;
        let w1 = 1;
        let h1 = 1;

        // x2, y2 - offset from the orgin of the gui window for the origin of the canvas and the viewport
        let x2 = 0;
        let y2 = 0;

        if(texturePaneWrapperRatio > image_w_h_ratio)
        {
            w1 = w0;
            h1 = w1 / image_w_h_ratio;

            // h1 is bigger than h0
            let zoomFactor = h0 / h1;
            texControls.setZoom(zoomFactor);

            x2 = 0;
            y2 = (h1 - h0) / 2;
        }
        else
        {
            h1 = h0;
            w1 = h1 * image_w_h_ratio;

            // w1 is bigger than w0
            let zoomFactor = w0 / w1;
            texControls.setZoom(zoomFactor);

            y2 = 0;
            x2 = (w1 - w0) / 2;
        }

       
        console.log('texCamera.zoom after', texCamera.zoom);
        console.log('texturePaneWrapperRatio', texturePaneWrapperRatio); 
        console.log('texturePaneWrapperSize', texturePaneWrapperSize);
        console.log('image_w_h_ratio', image_w_h_ratio); 
        console.log('texturePaneWrapperRatio > image_w_h_ratio', (texturePaneWrapperRatio > image_w_h_ratio)); 
        console.log('w0', w0);
        console.log('h0', h0);
        console.log('w1', w1);
        console.log('h1', h1);
        // console.log('w1/h1', w1/h1);
        
        texRenderer1.setSize(w1, h1);


        if(MLJ.core.Scene3D.isStickyNotesEnabled())
        {
            texLabelRenderer.setSize(w1, h1);
        }

        //////////////////////////////////////////////////////////
        // Set viewport
        // https://threejs.org/docs/#api/en/renderers/WebGLRenderer.setViewport
        //////////////////////////////////////////////////////////

        // console.log('x2', x2);
        // console.log('y2', y2);
        
        let currentViewport1 = texRenderer1.getCurrentViewport();

        // proportions ok, fills window ok, offset - ok
        texRenderer1.setViewport ( -x2, -y2, w1, h1 );
    }


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
    
})(MLJ.core.plugin, MLJ.core, MLJ.core.Scene3D);
