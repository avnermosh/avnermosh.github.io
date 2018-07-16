////////////////////////////////////////////////////////////////
//
// This file (js/mlj/plugins/rendering/TexturePanelPlugin.js) is responsible to handle the GUI for the Texturing tab
// e.g. resize the texture when zooming in/out with the middle mouse button
//
// for comparison the file MLJ.core.plugin.Texturing.js (in mlj/core/plugin/) does xxx
////////////////////////////////////////////////////////////////

var animationDuration = 200;

(function (plugin, core, scene) {

    var texCamera, texScene, texRenderer, texControls;

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

        scene2 = scene;
        meshObject2 = layer;
        
        $("#texCanvasWrapper").append(texRenderer.domElement);

        //Always remove everything from the scene when creating the meshes and adding them to the scene
        for (var i = texScene.children.length - 1; i >= 0; i--) {
            texScene.remove(texScene.children[i]);
        }

        // console.log('layer.texture.length', layer.texture.length);
        // console.log('layer.texturesNum', layer.texturesNum);
        // console.log('layersNum', layersNum);
        
        if (layer.texturesNum > 0 && layersNum > 0) {

            showWidgets();

            for (var i = 0; i < layer.texturesNum; i++) {
                //If a layer is added, we need to create the planar mesh with the texture for the first time, so, if it's undefined
                //We'll create it only now in order to avoid useless computation on each layer selections
                if (!layer.texture[i].planeMesh) {

                    var map2 = layer.texture[0].data.material.map;
                    
                    var material = new THREE.SpriteMaterial( { map: map2, color: 0xffffff, fog: true } );
                    var planeMesh = new THREE.Sprite( material );
                    planeMesh.position.x = planeMesh.position.y = planeMesh.position.z = 0;
                    // planeMesh.scale.x = planeMesh.scale.y = 70;
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
            
        } else {
            hideWidgets();
        }

        //This will resize the windows properly and trigger the resizeCanvas function
        $(window).trigger('resize');

        //Always render, if nothing is shown, then no layer is selected
        texRenderer.render(texScene, texCamera);

    };


    function canvasInit() {
        //The camera is ortographic and set at the center of the scene, better than prospectic in this case
        texCamera = new THREE.PerspectiveCamera(70, 512 / 512, 1, 5000);
        texCamera.position.z = 80; //80 seems like the perfect value, not sure why, I think it is because of the near/fara frustum
        texScene = new THREE.Scene();

        texRenderer = new THREE.WebGLRenderer({
            preserveDrawingBuffer: true,
            alpha: true});
        texRenderer.setPixelRatio(window.devicePixelRatio);
        texRenderer.setClearColor(0XDBDBDB, 1); //Webgl canvas background color

        texControls = new THREE.TrackballControls(texCamera, texRenderer.domElement); //with this, controls are limited to the canvas but right click does not work
        texControls.staticMoving = false;
        texControls.noRoll = true;
        texControls.noRotate = true;
        texControls.noPan = false;
        texControls.minDistance = texCamera.near;
        texControls.maxDistance = texCamera.far;
        texControls.zoomSpeed = 0.8;
        texControls.panSpeed = 0.6;
        texControls.addEventListener('change', render);

        animate();
    }


    function animate() {
        requestAnimationFrame(animate);
        texControls.update();
    }


    function render() {
        texRenderer.render(texScene, texCamera);
    }

    $(window).resize(function () {
        resizeCanvas();
        if (texRenderer && texCamera && texScene)
            texRenderer.render(texScene, texCamera);
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
            if (texRenderer && texCamera && texScene)
                texRenderer.render(texScene, texCamera);
        } else
            $(window).trigger('resize'); //This one is needed to reset the size (since it is impossible to resize the canvas back
    });

    function resizeCanvas() {
        if (texRenderer && texCamera && texScene) {
            var panelWidth = $("#tab-Texture").width();
            var panelHeight = $("#tab-Texture").height()
            
            texControls.handleResize();
            texCamera.aspect = panelWidth / panelHeight;
            texCamera.updateProjectionMatrix();
            texRenderer.setSize(panelWidth, panelHeight);
        }
    }

    function hideWidgets() {
        //call the parent to hide the div containing both label and button set
        for (var i = 0; i < widgets.length; i++) {
            if (widgets[i].rangedfloat)
                widgets[i].rangedfloat.$.parent().parent().hide(animationDuration);
            if (widgets[i].color)
                widgets[i].color.$.parent().parent().hide(animationDuration);
            if (widgets[i].choice)
                widgets[i].choice.$.parent().parent().hide(animationDuration);
        }

        $("#texCanvasWrapper").hide(animationDuration);
        $("#texInfoContainer").hide(animationDuration);
    }

    function showWidgets() {
        //call the parent to show the div containing both label and button set
        for (var i = 0; i < widgets.length; i++) {
            if (widgets[i].rangedfloat)
                widgets[i].rangedfloat.$.parent().parent().show(animationDuration);
            if (widgets[i].color)
                widgets[i].color.$.parent().parent().show(animationDuration);
            if (widgets[i].choice)
                widgets[i].choice.$.parent().parent().show(animationDuration);
        }

        $("#texCanvasWrapper").show(animationDuration);
        $("#texInfoContainer").show(animationDuration);
    }

    plugin.Manager.install(plug);

    var doLoadHardcodedZipFile = true;
    doLoadHardcodedZipFile = false;
    if(doLoadHardcodedZipFile)
    {
        // $(window).load happens after $(window).ready
        // 
        // a. loadMeshDataFromFile triggers "MeshFileOpened" event
        // b. Scene::$(document).on("MeshFileOpened responds on it and calls addLayer
        // the window needs to be fully loaded so that the trigger is intercepted in b. and addLayer is called
        // 
        // https://stackoverflow.com/questions/20418169/difference-between-window-load-and-window-ready?lq=1
        // https://stackoverflow.com/questions/3698200/window-onload-vs-document-ready
        //
        // $(window).ready(function () {
        $(window).load(function () {
            // txtFile needs to in the same dir as index.html
            // https://stackoverflow.com/questions/8390855/how-to-instantiate-a-file-object-in-javascript
            // var txtFile = "foo1.zip"
            // var txtFile = "3543_W18_shimi.SM.zip"
            // var txtFile = "2910_w47_shertzer_section0.6a_reduceTextureIndices.zip"
            // var txtFile = "2910_w47_shertzer_section0.6a_reduceTextureIndices.floor0.zip"
            // var txtFile = "2910_w47_shertzer_section0.6a_reduceTextureIndices.floor0_sm.zip"
            var txtFile = "2910_w47_shertzer_section1.6a_reduceTextureIndices.floor1_sm.zip";
            
            var file1 = new File([""], txtFile, {type: "application/zip"})
            MLJ.core.MeshFile.openMeshFile(file1);
        });
    }
    
})(MLJ.core.plugin, MLJ.core, MLJ.core.Scene);
