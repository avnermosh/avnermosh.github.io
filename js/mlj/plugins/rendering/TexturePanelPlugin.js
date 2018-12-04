////////////////////////////////////////////////////////////////
//
// This file (js/mlj/plugins/rendering/TexturePanelPlugin.js) is responsible to handle the GUI for the Texturing tab
// e.g. resize the texture when zooming in/out with the middle mouse button
//
// for comparison the file MLJ.core.plugin.Texturing.js (in mlj/core/plugin/) does xxx
////////////////////////////////////////////////////////////////

var animationDuration = 200;

(function (plugin, core, scene) {
    
    var texCamera;
    var texScene;
    var texRenderer1;
    var texLabelRenderer;
    var texControls;
    let rotationVal = 0;

    var DEFAULTS = {
        uvParam: false,
        selectedTexture: 0
    };
    
    var plug = new plugin.Texturing({
        name: "TexturePanel",
        tooltip: "Show the texture image and parametrization attached to the mesh",
        toggle: true,
        on: true
    }, DEFAULTS);

    var widgets;

    plug._init = function (guiBuilder) {
        widgets = [];
        hideWidgets();
        canvasInit();
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

        $("#texCanvasWrapper1").append(texRenderer1.domElement);
        if(MLJ.core.Scene3D.isStickyNotesEnabled())
        {
            $("#texCanvasWrapper1").append(texLabelRenderer.domElement);
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

                    let blobs = MLJ.core.Scene3D.getBlobs();
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
                    var planeMesh = new THREE.Sprite( material );
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
            texScene.add(layer.texture[layer.selectedTexture].planeMesh);

            this.showStickyNotes(layer);

        }
        else {
            hideWidgets();
        }

        //This will resize the windows properly and trigger the resizeCanvas function
        $(window).trigger('resize');

        //Always render, if nothing is shown, then no layer is selected
        texRenderer1.render(texScene, texCamera);
        if(MLJ.core.Scene3D.isStickyNotesEnabled())
        {
            texLabelRenderer.render(texScene, texCamera);
        }

    };

    function onDocumentTouchMove2D( event ) {
        console.log('BEG onDocumentTouchMove2D'); 
        // if(_controls2D.isTouchDown)
        {
            event.preventDefault();

            if( event.touches.length > 0 )
            {
                render();
            }
        }
    }

    function onDocumentMouseMove2D( event ) {
        console.log('BEG onDocumentMouseMove2D'); 
        event.preventDefault();

        render();
        // texRenderer1.render(texScene, texCamera);
    }

    function setTexControls(container2) {
        console.log('BEG setTexControls');
        
        // // NOT OK - orbit control responds but on all the scene
        // texControls = new THREE.OrbitControls(texCamera);

        // NOT OK - orbit control responds but on all canvases
        // var container2 = document.getElementsByTagName('canvas')[0];

        // texControls = new THREE.OrbitControls(texCamera, texRenderer1.domElement);

        // let container2 = document.getElementById('tab-Texture');
        // let container2 = document.getElementById('texCanvasWrapper1');

        // let container2 = document.getElementById('mlj-tools-pane');
        
        texControls = new THREE.OrbitControls(texCamera, container2);
        // texControls = new THREE.TrackballControls(texCamera, container2);

        
        //////////////////////////////////////
        // Set rotate related parameters
        //////////////////////////////////////

        // No rotation.
        texControls.enableRotate = false;
        texControls.minPolarAngle = 0; // radians
        texControls.maxPolarAngle = 0; // radians
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

        
        //////////////////////////////////////
        // Set pan related parameters
        //////////////////////////////////////

        texControls.enablePan = true;
        texControls.panSpeed = 0.6;

        texControls.staticMoving = false;
        
        texControls.addEventListener( 'mousemove', onDocumentMouseMove2D, false );
        texControls.addEventListener( 'touchmove', onDocumentTouchMove2D, false );

        texControls.addEventListener('change', render);
    };
    
    function canvasInit() {

        // Looks like left,right,top,bottom is in %
        // (when set to -100,100, the image covers 1/2 of the window)
        // (when set to -200,200, the image covers 1/4 of the window)
        // frustum can be updated in resizeCanvas
        let left = -50;
        let right = 50;
        let top = 50;
        let bottom = -50;
        let near = -500;
        let far = 1000;
        
        texCamera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);

        texCamera.position.set( 0, 0, 80 );
        
        texScene = new THREE.Scene();

        texRenderer1 = new THREE.WebGLRenderer({
            preserveDrawingBuffer: true,
            alpha: true});
        
        texRenderer1.setPixelRatio(window.devicePixelRatio);
        texRenderer1.setClearColor(0XDBDBDB, 1); //Webgl canvas background color

        let container2 = document.getElementsByTagName('canvas')[0];
        setTexControls(container2);
        
        if(MLJ.core.Scene3D.isStickyNotesEnabled())
        {
            texLabelRenderer = new THREE.CSS2DRenderer();
            texLabelRenderer.setSize( texRenderer1.getSize().width, texRenderer1.getSize().height );
            texLabelRenderer.domElement.style.position = 'absolute';
            texLabelRenderer.domElement.style.top = 0;
        }
        
        animate();
    }


    function animate() {
        requestAnimationFrame(animate);
        texControls.update();
    }


    function render() {
        texRenderer1.render(texScene, texCamera);
        if(MLJ.core.Scene3D.isStickyNotesEnabled())
        {
            texLabelRenderer.render(texScene, texCamera);
        }
    }

    $(window).resize(function () {
        resizeCanvas();
        texRenderer1.render(texScene, texCamera);
        if(MLJ.core.Scene3D.isStickyNotesEnabled())
        {
            texLabelRenderer.render(texScene, texCamera);
        }
    });


    //NEEDED TO MAKE the CONTROLS WORKING AS SOON AS THE TEXTURE TAB IS OPENED!!
    //Apparently when the canvas goes from hidden to shown, it's necessary to "update" controls in order
    //to make them work correctly
    //The mouse click won't work otherwise, unless texControls.handleResized() is called
    //Since it may be possible that the panel has been resized, better call resizeCanvas and be sure that
    //camera, controls and aspect are correct. If the tab opened is not the texture tab better resizing it
    $(window).on('tabsactivate', function (event, ui) {
        if (ui.newPanel.attr('id') === MLJ.widget.TabbedPane.getTexturePane().parent().attr('id')) {
            resizeCanvas();
            texRenderer1.render(texScene, texCamera);
            if(MLJ.core.Scene3D.isStickyNotesEnabled())
            {
                texLabelRenderer.render(texScene, texCamera);
            }
        } else
            $(window).trigger('resize'); //This one is needed to reset the size (since it is impossible to resize the canvas back
    });

    function resizeCanvas() {

        let portraitWidth = 1512;
        let portraitHeight = 2016;
        let imageAspectPortrait = portraitWidth / portraitHeight;

        var paneWidth = $("#tab-Texture").width();
        var paneHeight = $("#tab-Texture").height();
        if(rotationVal !== 0)
        {
            // portrait
            paneWidth = paneHeight * imageAspectPortrait;
        }
        else
        {
            // landscape
            paneWidth = paneHeight / imageAspectPortrait;
        }

        // aspect has no effect ?? (changing the aspect value to e.g. 1.0 doesn't make a visual difference?? ...)
        texCamera.aspect = paneWidth / paneHeight;

        // console.log('rotationVal', rotationVal);
        // console.log('paneWidth', paneWidth); 
        // console.log('paneHeight', paneHeight);

        texCamera.updateProjectionMatrix();

        texRenderer1.setSize(paneWidth, paneHeight);

        if(MLJ.core.Scene3D.isStickyNotesEnabled())
        {
            texLabelRenderer.setSize(paneWidth, paneHeight);
        }
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

        $("#texCanvasWrapper1").hide(animationDuration);
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

        $("#texCanvasWrapper1").show(animationDuration);
        $("#texInfoContainer").show(animationDuration);
    }

    plugin.Manager.install(plug);

    $(document).ready(function () {
        // TBD
        // at this point
        // not defined - tab-Texture, texCanvasWrapper1
        // defined - mlj-tools-pane
        //
        // let container2 = document.getElementById('mlj-tools-pane');
        // console.log('container2', container2); 
        
    });
    
    // $(window).load happens after $(window).ready   
    // $(window).ready(function () {
    $(window).load(function () {

        // at this point
        // defined - tab-Texture, texCanvasWrapper1, mlj-tools-pane

        let container2 = document.getElementById('mlj-tools-pane');
        setTexControls(container2);
        
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
