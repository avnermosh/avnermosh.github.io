////////////////////////////////////////////////////////////////
//
// The scene file is the main container for the application
// In the threejs examples there are e.g. scene, camera, light, renderer in the main html file
// The MLJ.core.Scene class stores such telements
//
////////////////////////////////////////////////////////////////

MLJ.core.Scene = {};
MLJ.core.Scene.timeStamp = 0;


var firstTimeCameraPositioning = true;
var radius = 100;

var positionX0 = 521;
var positionY0 = 549;
var positionZ0 = 4282;

(function () {
    var _layers = new MLJ.util.AssociativeArray();
    var _decorators = new MLJ.util.AssociativeArray();

    // _scene - threejs container for objects, lights and cameras. contains things that will be rendered
    var _scene;

    // _group is THREE.Object3D (similar to THREE.Group) which is base class for most threejs objects
    // used for grouping elements, e.g. scale, position
    var _group;
    var _camera;
    var _scene2D;
    var _camera2D;

    var _controls;
    
    var _raycaster;
    var _mouse = new THREE.Vector2();
    var _renderer;
    var _this = this;

    // 3d model for the images boundaries (type: LineSegments, represented with yellow lines)
    var _imagesBoundariesLineSegments;
    
    var _edit3dModelOverlayFlag;
    var _selectedLayer;

    var _structureObjFileName;
    var _overlayObjFileName;
    
    var _selectedImageFilename;
    var _selectedThumbnailImageFilename;
    
    var _selectedImageFilenames;
    var _selectedImageFilenameIndex = 0;

    var _imageInfoVec = new MLJ.util.AssociativeArray();

    ////////////////////////////////////////////////////
    // OverlayRect
    ////////////////////////////////////////////////////
    
    var _edit3dModelOverlayTrackballControls;

    var _selectedOverlayVertexHelperGroup = new THREE.Object3D();

    var _intersectionInfo = {intersectionLayer: undefined,
                             intersectedStructure: undefined,
                             intersectedStructurePrev: undefined,
                             intersectedOverlayRect: undefined,
                             intersectedOverlayRectPrev: undefined,
                             intersectedOverlayVertex: undefined,
                             intersectedOverlayVertexPrev: undefined};

    ////////////////////////////////////////////////////
    // Other stuff
    ////////////////////////////////////////////////////

    var _releaseVersion = 1.0;
    var _modelVersion = undefined;
    var _blobs = {};
    var _zipFileArrayBuffer;
    var _zipLoaderInstance = -1;
    var _materialBlue = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth: 5});

    function onDocumentMouseMove0( event ) {
        event.preventDefault();

        _mouse.x = ( ( event.clientX - get3DOffset().left - _renderer.domElement.offsetLeft ) /
                     _renderer.domElement.clientWidth ) * 2 - 1;
        
        _mouse.y = - ( ( event.clientY - get3DOffset().top - _renderer.domElement.offsetTop ) /
                       _renderer.domElement.clientHeight ) * 2 + 1;

        MLJ.core.Scene.render();
    }

    function get3DSize() {
        var _3D = $('#_3D');

        return {
            width: _3D.innerWidth(),
            height: _3D.innerHeight()
        };
    }

    function get3DOffset() {
        var _3D = $('#_3D');

        return {
            left: _3D.offset().left,
            top: _3D.offset().top
        };
    }

    //SCENE INITIALIZATION  ________________________________________________________

    
    function animate() {
        requestAnimationFrame( animate );
        _controls.update();
        MLJ.core.Scene.render();
    }
    
    ////////////////////////////////////////////////////
    // BEG drag drop file
    // https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
    // https://jsfiddle.net/0GiS0/4ZYq3/
    ////////////////////////////////////////////////////

    function createVertexFromPoint(point) {
        var vector1 = new THREE.Vector3(point.worldcoords.x, point.worldcoords.y, point.worldcoords.z);
        return vector1;
    };



    function dragHandler(event) {

        if( !MLJ.core.Scene.getEdit3dModelOverlayFlag() )
        {
            // Do nothing. Not in editing mode.
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        _mouse.x = ( ( event.clientX - get3DOffset().left - _renderer.domElement.offsetLeft ) /
                     _renderer.domElement.clientWidth ) * 2 - 1;
        
        _mouse.y = - ( ( event.clientY - get3DOffset().top - _renderer.domElement.offsetTop ) /
                       _renderer.domElement.clientHeight ) * 2 + 1;
        
    }


    var droppedFileData;
    
    function updateMaterial(selectedOverlayRectObj, droppedFileUrl, droppedFilename, imageOrientation) {

        // instantiate a loader
        var loader = new THREE.TextureLoader();

        // load a resource
        loader.load(
            // resource URL
            droppedFileUrl,
            
            // onLoad callback
            function ( texture ) {
                selectedOverlayRectObj.material.map = texture;

                let urlArray = MLJ.util.getNestedObject(selectedOverlayRectObj, ['material', 'userData', 'urlArray']);
                if(!urlArray)
                {
                    selectedOverlayRectObj.material.userData.urlArray = new MLJ.util.AssociativeArray();
                }

                let imageInfo = {imageFilename: droppedFilename,
                                 imageOrientation: imageOrientation};
                
                urlArray.set(droppedFilename, imageInfo);

                let imageInfoVec = MLJ.core.Scene.getImageInfoVec();
                imageInfoVec.set(droppedFilename, imageInfo);
                MLJ.core.Scene.setImageInfoVec(imageInfoVec);
                
                if(urlArray.size() > 1)
                {
                    // remove default image if it exists
                    let keyToRemove = 'default_image.jpg';
                    let removedEl = urlArray.remove(keyToRemove);
                }
                    
                _selectedImageFilenames = urlArray.getKeys();

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


    
    function filesDroped(event) {

        if( !MLJ.core.Scene.getEdit3dModelOverlayFlag() )
        {
            // Do nothing. Not in editing mode.
            return;
        }
        
        var intersectedOverlayRectObjectId = MLJ.util.getNestedObject(_intersectionInfo, ['intersectedOverlayRect', 'object', 'id']);
        if( !intersectedOverlayRectObjectId )
        {
            console.log('intersectedOverlayRectObjectId is undefined');
            return;
        }
        event.stopPropagation();
        event.preventDefault();

        // var drop_area = document.getElementById("drop_area");
        // drop_area.className = "area";
        let $canvas2 = $('canvas')[0];
        $canvas2.className = "area";
        
        var droppedFiles = event.dataTransfer.files; //It returns a FileList object
        var filesInfo = "";

        for (var i = 0; i < droppedFiles.length; i++) {
            var droppedFile = droppedFiles[i];

            // Load the dragged file
            
            // https://stackoverflow.com/questions/31433413/return-the-array-of-bytes-from-filereader
            droppedFileData = new Blob([droppedFile]);
            var promise1 = new Promise(getBuffer);
            
            promise1.then(function(data) {
                var droppedFileUrl = URL.createObjectURL(droppedFileData);

                var droppedFilename = droppedFile.name;
                console.log('droppedFilename', droppedFilename);

                // Update _blobs with the new image
                _blobs[droppedFilename] = droppedFileUrl;

                let promise2 = _zipLoaderInstance.getOrientation(droppedFileData);
                
                promise2.then(function(result2) {
                    let imageOrientation = result2.orientation;
                    let imageInfo = {imageFilename: droppedFilename,
                                     imageOrientation: imageOrientation};
                    
                    let imageInfoVec = MLJ.core.Scene.getImageInfoVec();
                    imageInfoVec.set(droppedFilename, imageInfo);
                    MLJ.core.Scene.setImageInfoVec(imageInfoVec);
                    
                    //////////////////////////////////////////////
                    // BEG create a thumbnail for the image
                    //////////////////////////////////////////////

                    // TBD generalize the thumbligy code block into a function in e.g. imageUtils.js ?
                    
                    let droppedThumbnailFilename = droppedFilename.substr(0, droppedFilename.lastIndexOf(".")) + ".thumbnail.jpg";
                    if(!_blobs[droppedThumbnailFilename])
                    {
                        thumbnailify(_blobs[droppedFilename], 100, function(base64Thumbnail) {
                            console.log('done thumbnailify'); 
	                    // thumbnail.src = base64Thumbnail;
                            var droppedThumbnailFileUrl = URL.createObjectURL(base64Thumbnail)

                            _blobs[droppedThumbnailFilename] = droppedThumbnailFileUrl;

                            ////////////////////////////////////////////////////
                            // refresh the texture of the intersectedOverlayRect in the 3d model
                            ////////////////////////////////////////////////////

                            let selectedOverlayRectObj = _intersectionInfo.intersectedOverlayRect.object;
                            
                            updateMaterial(selectedOverlayRectObj, droppedThumbnailFileUrl, droppedThumbnailFilename, imageOrientation);
                            
                            
                            ////////////////////////////////////////////////////
                            // refresh the texture in the 2d pane
                            ////////////////////////////////////////////////////
                            
                            _selectedImageFilename = droppedFilename;
                            
                            // The file already exists in memory. Load it from the memory and render in the 2d pane
                            MLJ.core.MeshFile.loadTexture2FromFile(_blobs[droppedFilename]);
                            
                        });

                    }
                    else
                    {
                        ////////////////////////////////////////////////////
                        // refresh the texture of the intersectedOverlayRect in the 3d model
                        ////////////////////////////////////////////////////

                        let selectedOverlayRectObj = _intersectionInfo.intersectedOverlayRect.object;
                        let droppedThumbnailFileUrl = _blobs[droppedThumbnailFilename];
                        updateMaterial(selectedOverlayRectObj, droppedThumbnailFileUrl, droppedThumbnailFilename, imageOrientation);
                        
                        
                        ////////////////////////////////////////////////////
                        // refresh the texture in the 2d pane
                        ////////////////////////////////////////////////////
                        
                        _selectedImageFilename = droppedFilename;
                        
                        // The file already exists in memory. Load it from the memory and render in the 2d pane
                        MLJ.core.MeshFile.loadTexture2FromFile(_blobs[droppedFilename]);

                    }
                    
                }).catch(function(err) {

                    console.error('err1', err); 
                });                         
                
            }).catch(function(err) {

                console.error('err', err); 
            });
        }
    }

    // read the dropped file data from blob into Uint8Array buffer in memory
    function getBuffer(resolve) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(droppedFileData);
        reader.onload = function() {
            var arrayBuffer = reader.result
            var bytes = new Uint8Array(arrayBuffer);
            resolve(bytes);
        }
    }
    
    ////////////////////////////////////////////////////
    // END drag drop file
    ////////////////////////////////////////////////////
    
    function initScene() {
        
        var _3DSize = get3DSize();
        _scene = new THREE.Scene();

        _scene._structureObjFileName = "structure.obj";
        _scene._overlayObjFileName = "overlay.obj";

        var fov = 70;
        var cameraFrustumAspectRatio = _3DSize.width / _3DSize.height;
        var cameraFrustumNearPlane = 0.1;
        var cameraFrustumFarPlane = 100000;
        _camera = new THREE.PerspectiveCamera(fov, cameraFrustumAspectRatio, cameraFrustumNearPlane, cameraFrustumFarPlane);

        _camera.position.x = positionX0;
        _camera.position.y = positionY0;
        _camera.position.z = positionZ0;
        
        // BEG from example2_objLoader_raycasting.js
        _camera.lookAt( _scene.position );
        _camera.updateMatrixWorld();
        // END from example2_objLoader_raycasting.js

        _group = new THREE.Object3D();
        _scene.add(_group);
        
        _scene2D = new THREE.Scene();
        _camera2D = new THREE.OrthographicCamera(0, _3DSize.width / _3DSize.height, 1, 0, -1, 1);
        _camera2D.position.z = -1;
        
        _raycaster = new THREE.Raycaster();
        
        _renderer = new THREE.WebGLRenderer();

        _renderer.setPixelRatio(window.devicePixelRatio);
        _renderer.setSize(_3DSize.width, _3DSize.height);

        $('#_3D').append(_renderer.domElement);
        _scene.add(_camera);

        ////////////////////////////////////////////////////
        // OverlayRect
        ////////////////////////////////////////////////////
        
        MLJ.core.Scene.initOverlayRectVertexHelpers();
        
        ////////////////////////////////////////////////////
        // INIT CONTROLS
        ////////////////////////////////////////////////////

        let container1 = document.getElementById('_3D');
        _controls = new THREE.OrbitControls3Dpane(_camera, container1);
        // _controls = new THREE.TrackballControls(_camera, container1);

        _controls.rotateSpeed = 2.0;
        _controls.zoomSpeed = 1.2;
        _controls.panSpeed = 2.0;
        _controls.noZoom = false;
        _controls.noPan = false;
        _controls.staticMoving = true;
        _controls.dynamicDampingFactor = 0.3;
        
        // https://theasciicode.com.ar/
        // [ 65 /*A*/, 83 /*S*/, 68 /*D*/, 70 /*F*/, 71 /*G*/, 72 /*H*/ ];
        _controls.keys = [65, 83, 68, 70, 71, 72];


        // https://css-tricks.com/snippets/javascript/javascript-keycodes/
        // shift        16
        // ctrl         17
        // alt  18

        $(document).keydown(function (event) {
            // ASCII 72 is 'h', so clicking Ctrl+h (or Meta+Shift+h) is intercepted here.
            // Inside the code calls the TexturePanelPlugin.reset, i.e. 
            // Ctrl+h is mapped to reseting the view of the scene

            if ((event.ctrlKey || (event.metaKey && event.shiftKey)) && event.which === 72) {
                event.preventDefault();
                _controls.reset();
            }
        });

        ////////////////////////////////////////////////////
        // INIT LIGHTS 
        ////////////////////////////////////////////////////

        var light = new THREE.AmbientLight("#808080");
        _scene.add(light);

        _this.lights.AmbientLight = new MLJ.core.AmbientLight(_scene, _camera, _renderer);
        _this.lights.Headlight = new MLJ.core.Headlight(_scene, _camera, _renderer);

        ////////////////////////////////////////////////////
        // EVENT HANDLERS
        ////////////////////////////////////////////////////

        let $canvas2 = $('canvas')[0];
        $canvas2.addEventListener('touchmove', _controls.update.bind(_controls), false);
        $canvas2.addEventListener('mousemove', _controls.update.bind(_controls), false);
        $canvas2.addEventListener('mousewheel', _controls.update.bind(_controls), false);
        $canvas2.addEventListener('DOMMouseScroll', _controls.update.bind(_controls), false); // firefox
        document.addEventListener( 'mousemove', onDocumentMouseMove0, false );

        ////////////////////////////////////////////////////
        // BEG drag drop file via canvas2
        ////////////////////////////////////////////////////
        
        $canvas2.addEventListener("dragover", dragHandler);
        $canvas2.addEventListener("drop", filesDroped);

        _controls.addEventListener('change', function () {
            MLJ.core.Scene.render();
            $($canvas2).trigger('onControlsChange');
        });

        $(window).resize(function () {
            var size = get3DSize();

            _camera.aspect = size.width / size.height;
            _camera.updateProjectionMatrix();
            _renderer.setSize(size.width, size.height);

            _camera2D.left = size.width / size.height;
            _camera2D.updateProjectionMatrix;

            MLJ.core.Scene.render();
        });

        $(document).on("MeshFileOpened", function (event, layer) {
            MLJ.core.Scene.addLayer(layer);
        });

        $(document).on("MeshFileReloaded",
                       function (event, layer) {
                           // Restore three geometry to reflect the new state of the vcg mesh
                           layer.updateThreeMesh();
                           $(document).trigger("SceneLayerReloaded", [layer]);
                       });

    }

    function sleep(miliseconds) {
        var currentTime = new Date().getTime();

        while (currentTime + miliseconds >= new Date().getTime()) {
        }
    }

    this.lights = {
        AmbientLight: null,
        Headlight: null
    };

    this.getCamera = function () {
        return _camera;
    };

    this.getThreeJsGroup = function () {
        return _group;
    }

    this.addToScene = function (obj) {
        _scene.add( obj );
    };
    
    this.removeFromScene = function (obj) {
        _scene.remove( obj );
    };

    this.setDraggableControl = function (structureMeshGroup, overlayMeshGroup) {
        _edit3dModelOverlayTrackballControls = new THREE.Edit3dModelOverlayTrackballControls( structureMeshGroup,
                                                                                              overlayMeshGroup,
                                                                                              _intersectionInfo,
                                                                                              _selectedOverlayVertexHelperGroup,
                                                                                              _camera,
                                                                                              _renderer.domElement );
        
        _edit3dModelOverlayTrackballControls.addEventListener( 'dragstart', function ( event ) { _controls.enabled = false; } );
        _edit3dModelOverlayTrackballControls.addEventListener( 'dragend', function ( event ) { _controls.enabled = true; } );
    };
    
    this.selectLayerByName = function (layerName) {
        _selectedLayer = _layers.getByKey(layerName);
        $(document).trigger("SceneLayerSelected", [_selectedLayer]);
    };

    this.addLayer = function (layer) {
        if (!(layer instanceof MLJ.core.Layer)) {
            console.error("The parameter must be an instance of MLJ.core.Layer");
            return;
        }

        // Initialize the THREE geometry used by overlays and rendering params
        layer.initializeRenderingAttributes();
        // _group.add(layer.getThreeMesh());

        //Add new mesh to associative array _layers            
        _layers.set(layer.name, layer);
        
        _selectedLayer = layer;

        $(document).trigger("SceneLayerAdded", [layer, _layers.size()]);
        _this.render();

    };

    
    this.deleteRectangularMesh = function () {

        var intersectedOverlayRectObjectId = MLJ.util.getNestedObject(_intersectionInfo, ['intersectedOverlayRect', 'object', 'id']);
        if( intersectedOverlayRectObjectId == undefined)
        {
            console.log('No intersection overlay found');
            return;
        }
        // var selectedOverlayRectObj = _intersectionInfo.intersectedOverlayRect.object;

        var overlayMeshGroup = _intersectionInfo.intersectionLayer.getOverlayMeshGroup();
        var intersectedOverlayRectObject = overlayMeshGroup.getObjectById(intersectedOverlayRectObjectId);
        if(intersectedOverlayRectObject)
        {
            let material_userData_urlArray = MLJ.util.getNestedObject(intersectedOverlayRectObject, ['material', 'userData', 'urlArray']);
            if(!material_userData_urlArray)
            {
                console.log("intersectionObj.material.userData.urlArray is undefined")
                return false;
            }

            if(material_userData_urlArray.size() === 0)
            {
                _scene.remove( intersectedOverlayRectObject );
                overlayMeshGroup.remove( intersectedOverlayRectObject );
            }
            else
            {
                // console.log('material_userData_urlArray.size() before pop', material_userData_urlArray.size()); 
                let keyToRemove = material_userData_urlArray.getLastKey();
                material_userData_urlArray.remove(keyToRemove);
            }
            _selectedImageFilenames = material_userData_urlArray.getKeys();
        }
        else
        {
            console.error("Failed to get the overlay object for deletion");
        }
        
    };

    this.getIntersectionInfo = function () {
        return _intersectionInfo;    
    }
    
    this.insertRectangularMesh = function () {

        var intersectedStructureObjectId = MLJ.util.getNestedObject(_intersectionInfo, ['intersectedStructure', 'object', 'id']);
        if( intersectedStructureObjectId == undefined)
        {
            console.log('No intersection found');
            return;
        }

        _selectedLayer.createRectangleMesh(_intersectionInfo.intersectedStructure);
        
        return false;
    };

    this.initOverlayRectVertexHelpers = function () {

        // create vertexHelpers - create spheres around the corners
        var sphere=new THREE.Mesh(
            new THREE.SphereGeometry(20),
            new THREE.MeshBasicMaterial({color:MLJ.util.blueColor})
        );

        // Create array of spheres, one for each corner
        var overlayRectDummy = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 2, 1, 1),
            new THREE.MeshLambertMaterial({color:MLJ.util.islamicGreenColor,transparent:true})
        );

        
        for(var i=0;i<overlayRectDummy.geometry.vertices.length;i++){
            var vertexHelper=sphere.clone();
            var vertexPosition=overlayRectDummy.geometry.vertices[i];
            vertexHelper.position.copy(vertexPosition);
            vertexHelper.visible=false;
            vertexHelper.data={index:i};
            _selectedOverlayVertexHelperGroup.add(vertexHelper);
        }
        
        // Make the vertice spheres always visible
        // overlayRect.material.opacity=.5;
        for(var i=0;i<_selectedOverlayVertexHelperGroup.children.length;i++){
            _selectedOverlayVertexHelperGroup.children[i].visible=true;
        }
        
        _scene.add( _selectedOverlayVertexHelperGroup );
     };
    
    function disposeObject(obj) {
        if (obj.geometry)
        {
            obj.geometry.dispose();
            obj.geometry = null;
        }
        if (obj.material)
        {
            obj.material.dispose();
            obj.material = null;
        }
        if (obj.texture)
        {
            obj.texture.dispose();
            obj.texture = null;
        }
    }

    this.updateLayer = function (layer) {
        if (layer instanceof MLJ.core.Layer) {
            if (_layers.getByKey(layer.name) === undefined) {
                console.warn("Trying to update a layer not in the scene.");
                return;
            }
            layer.updateThreeMesh();
            //render the scene
            this.render();
            /**
             *  Triggered when a layer is updated
             *  @event MLJ.core.Scene#SceneLayerUpdated
             *  @type {Object}
             *  @property {MLJ.core.Layer} layer The updated mesh file
             *  @example
             *  <caption>Event Interception:</caption>
             *  $(document).on("SceneLayerUpdated",
             *      function (event, layer) {
             *          //do something
             *      }
             *  );
             */
            $(document).trigger("SceneLayerUpdated", [layer]);

        } else {
            console.error("The parameter must be an instance of MLJ.core.Layer");
        }
    };

    var lastID = 0;
    this.createLayer = function (layerName) {
        // layerName = "MyLayer";

        // remove layer from list if layer by such name exist before creating a new layer
        _this.removeLayerByName(layerName);
        
        var layer = new MLJ.core.Layer(lastID++, layerName);

        return layer;
    };

    this.getLayerByName = function (name) {
        return _layers.getByKey(name);
    };

    this.removeLayerByName = function (name) {
        var layer = this.getLayerByName(name);

        if (layer !== undefined) {

            layer = _layers.remove(layer.name);
            
            $(document).trigger("SceneLayerRemoved", [layer, _layers.size()]);
            if (layer) {
                layer.dispose();
                layer = null;
                // delete layer;
            }

            if (_layers.size() > 0) {
                _this.selectLayerByName(_layers.getFirst().name);
            } else {
                _this._selectedLayer = undefined;
            }
            MLJ.core.Scene.render();
        }
    };

    this.addSceneDecorator = function (name, decorator) {
        if (!(decorator instanceof THREE.Object3D)) {
            console.warn("MLJ.core.Scene.addSceneDecorator(): decorator parameter not an instance of THREE.Object3D");
            return;
        }

        _decorators.set(name, decorator)
        _group.add(decorator);

        _this.render();
    };

    
    this.getReleaseVersion = function () {
        return _releaseVersion;
    };

    this.setReleaseVersion = function (releaseVersion) {
        _releaseVersion = releaseVersion;
    };

    this.getMouse = function () {
        return _mouse;
    };

    this.getCamera = function () {
        return _camera;
    };

    this.getEdit3dModelOverlayFlag = function () {
        return _edit3dModelOverlayFlag;
    };

    this.setEdit3dModelOverlayFlag = function (edit3dModelOverlayFlag) {
        _edit3dModelOverlayFlag = edit3dModelOverlayFlag;
    };

    this.getModelVersion = function () {
        return _modelVersion;
    };

    this.setModelVersion = function (modelVersion) {
        _modelVersion = modelVersion;
    };

    this.getZipLoaderInstance = function () {
        return _zipLoaderInstance;
    };

    this.setZipLoaderInstance = function (zipLoaderInstance) {
        _zipLoaderInstance = zipLoaderInstance;
    };

    this.isStickyNotesEnabled = function () {
        // return false;
        return true;
    };

    this.getBlobs = function () {
        return _blobs;
    };

    this.setBlobs = function (blobs) {
        _blobs = blobs;
    };
    
    this.getSelectedLayer = function () {
        return _selectedLayer;
    };

    this.getLayers = function () {
        return _layers;
    };

    this.get3DSize = function () {
        return get3DSize();
    };

    this.get3DOffset = function () {
        return get3DOffset();
    };
    
    this.getRenderer = function () {
        return _renderer;
    };

    this.getScene = function () {
        return _scene;
    };

    this.getSelectedImageFilename = function () {
        return _selectedImageFilename;
    };

    this.getSelectedImageFilenames = function () {
        return _selectedImageFilenames;
    };

    this.getSelectedThumbnailImageFilename = function () {
        return _selectedThumbnailImageFilename;
    };
    
    this.getSelectedImageFilnameIndex = function () {
        return _selectedImageFilenameIndex;
    };

    this.setSelectedImageFilnameIndex = function (selectedImageFilnameIndex) {
        _selectedImageFilenameIndex = selectedImageFilnameIndex;
    };

    this.getImageInfoVec = function () {
        return _imageInfoVec;
    };

    this.setImageInfoVec = function (imageInfoVec) {
        _imageInfoVec = imageInfoVec;
    };
    
    this.getTrackballControls = function () {
        return _controls;
    };

    this.setTrackballControls = function (controls) {
        _controls = controls;
    };
    
    
    var plane = new THREE.PlaneBufferGeometry(2, 2);
    var quadMesh = new THREE.Mesh(
        plane
    );

    var quadScene = new THREE.Scene();
    quadScene.add(quadMesh);

    quadMesh.material = new THREE.ShaderMaterial({
        vertexShader:
        "varying vec2 vUv; \
             void main(void) \
             { \
                 vUv = uv; \
                 gl_Position = vec4(position.xyz, 1.0); \
             }",
        fragmentShader:
        "uniform sampler2D offscreen; \
             varying vec2 vUv; \
             void main(void) { gl_FragColor = texture2D(offscreen, vUv.xy); }"
    });
    quadMesh.material.uniforms = {
        offscreen: {type: "t", value: null}
    };

    this.getRectangleVerticesAsArray = function (intersection) {
        let rectangleVertices = this.getRectangleVertices(intersection);

        var tlPoint1 = new THREE.Vector3();
        tlPoint1.copy(rectangleVertices["tlPoint"]);
        var brPoint1 = new THREE.Vector3();
        brPoint1.copy(rectangleVertices["brPoint"]);
        var blPoint1 = new THREE.Vector3();
        blPoint1.copy(rectangleVertices["blPoint"]);
        var trPoint1 = new THREE.Vector3();
        trPoint1.copy(rectangleVertices["trPoint"]);

        var rectangleVerticesArray = [];
        rectangleVerticesArray.push(tlPoint1);
        rectangleVerticesArray.push(trPoint1);
        rectangleVerticesArray.push(brPoint1);
        rectangleVerticesArray.push(blPoint1);

        return rectangleVerticesArray;
    };
    
    this.getRectangleVertices = function (intersection) {

        var faceIndex0 = intersection.faceIndex - (intersection.faceIndex % 2);
        var faceIndex1 = faceIndex0 + 1;

        if(!intersection)
        {
            console.log("intersection is undefined");
            return;
        }

        if ( intersection.object.geometry instanceof THREE.BufferGeometry ) {
            var posArray = intersection.object.geometry.attributes.position.array;

            var numCoordsPerVerex = 3;
            var numVerticesPerFace = 3;
            var pos0 = faceIndex0 * (numCoordsPerVerex * numVerticesPerFace);
            var v0 = new THREE.Vector3(posArray[pos0], posArray[pos0+1], posArray[pos0+2]);

            pos0 += 3;
            var v1 = new THREE.Vector3(posArray[pos0], posArray[pos0+1], posArray[pos0+2]);

            pos0 += 3;
            var v2 = new THREE.Vector3(posArray[pos0], posArray[pos0+1], posArray[pos0+2]);

            pos0 = faceIndex1 * (numCoordsPerVerex * numVerticesPerFace);
            var v3 = new THREE.Vector3(posArray[pos0], posArray[pos0+1], posArray[pos0+2]);

            pos0 += 3;
            var v4 = new THREE.Vector3(posArray[pos0], posArray[pos0+1], posArray[pos0+2]);

            pos0 += 3;
            var v5 = new THREE.Vector3(posArray[pos0], posArray[pos0+1], posArray[pos0+2]);


            // TBD change the order here ???
            var rectangleVertices = {};
            rectangleVertices["tlPoint"] = v0;
            rectangleVertices["trPoint"] = v1;
            rectangleVertices["brPoint"] = v2;
            rectangleVertices["blPoint"] = v5;

            // rectangleVertices["tlPoint"] = v0;
            // rectangleVertices["blPoint"] = v1;
            // rectangleVertices["brPoint"] = v2;
            // rectangleVertices["trPoint"] = v5;
            
            return rectangleVertices;
        }
        else if ( intersection.object.geometry instanceof THREE.Geometry )
        {
            var numVerticesPerFace = 3;
            var pos0 = faceIndex0 * numVerticesPerFace;

            var rectangleVertices = {};
            rectangleVertices["tlPoint"] = intersection.object.geometry.vertices[pos0];
            rectangleVertices["trPoint"] = intersection.object.geometry.vertices[pos0+1];
            rectangleVertices["brPoint"] = intersection.object.geometry.vertices[pos0+2];
            rectangleVertices["blPoint"] = intersection.object.geometry.vertices[pos0+3];

            return rectangleVertices;
        }
        else
        {
            console.log("geometry is not supported");
            return;
        }

    };


    this.loadTheSelectedImageAndRender = function () {

        let imageInfo = _imageInfoVec.getByKey(_selectedImageFilename);

        // TBD - leave here until showImageInfo is implemented
        console.log('_selectedImageFilename', _selectedImageFilename);
        console.log('imageInfo', imageInfo); 
        
        _selectedThumbnailImageFilename = imageInfo.imageFilename;
        _selectedImageFilename = _selectedThumbnailImageFilename.replace(/\.thumbnail/i, '');
        var blobs = _this.getBlobs();
        
        if(blobs[_selectedImageFilename])
        {
            // The file already exists in memory. Load it from the memory and render
            MLJ.core.MeshFile.loadTexture2FromFile(blobs[_selectedImageFilename]);
        }
        else
        {
            // The file is not yet in memory.
            var zipLoaderInstance = _this.getZipLoaderInstance();
            var offsetInReader = zipLoaderInstance.files[_selectedImageFilename].offset;
            if(offsetInReader > 0)
            {
                // The file is not yet in memory, but its offset is stored in memory.
                // Load the file from the zip file into memory and render
                // unzip the image files (that were skipped in the initial load)
                var doSkipJPG = false;
                ZipLoader.unzip( _this._zipFileArrayBuffer, doSkipJPG, offsetInReader ).then( function ( zipLoaderInstance ) {
                    let promise3 = MLJ.core.MeshFile.addImageToBlobs(zipLoaderInstance);
                    promise3.then(function(value) {
                        // At this point all the images finished being added to the blob
                        if(blobs[_selectedImageFilename] === null)
                        {
                            console.error('blobs', blobs); 
                            console.error('_selectedImageFilename', _selectedImageFilename); 
                            throw 'blobs[_selectedImageFilename] is undefined';
                        }
                        MLJ.core.MeshFile.loadTexture2FromFile(blobs[_selectedImageFilename]);
                    }).catch(function(err) {
                        console.error('err from promise3', err); 
                    });
                });
            }
        }
        return true;
    }

    this.getLayerIntersectionsInfo = function (intersects)
    {
        let intersectedStructureFound = false;
        let intersectedOverlayRectFound = false;
        let intersectedOverlayVertexFound = false;

        for (var i = 0; i < intersects.length; i++) {
            var intersectionCurr = intersects[i];
            if(intersectionCurr.object.type == "Mesh")
            {
                // Iterating over all the layers
                var iter = _layers.iterator();
                while (iter.hasNext()) {
                    var layer = iter.next();
                    var structureMeshGroup = layer.getStructureMeshGroup();

                    // TBD verify that intersectedStructureObject, intersectedOverlayRectObject
                    // refer to the same layer
                    var intersectionCurr_object_id = MLJ.util.getNestedObject(intersectionCurr, ['object', 'id']);

                    if(!intersectedStructureFound)
                    {
                        let intersectedStructureObject = structureMeshGroup.getObjectById(intersectionCurr_object_id);
                        if(intersectedStructureObject)
                        {
                            intersectedStructureFound = true;
                            _intersectionInfo.intersectionLayer = layer;
                            _intersectionInfo.intersectedStructure = intersectionCurr;
                            break;
                        }
                    }

                    if(!intersectedOverlayVertexFound)
                    {
                        var overlayMeshGroup = layer.getOverlayMeshGroup();
                        var intersectedOverlayVertexObject = _selectedOverlayVertexHelperGroup.getObjectById(intersectionCurr_object_id);
                        if(intersectedOverlayVertexObject)
                        {
                            intersectedOverlayVertexFound = true;
                            _intersectionInfo.intersectedOverlayVertex = intersectionCurr;

                            var userData_intersectedOverlayRectObjectId = MLJ.util.getNestedObject(_selectedOverlayVertexHelperGroup, ['userData', 'intersectedOverlayRectObjectId']);
                            if(userData_intersectedOverlayRectObjectId)
                            {
                                let intersectedOverlayRectObject = overlayMeshGroup.getObjectById(userData_intersectedOverlayRectObjectId);
                                if(intersectedOverlayRectObject)
                                {
                                    intersectedOverlayRectFound = true;
                                    _intersectionInfo.intersectionLayer = layer;

                                    _intersectionInfo.intersectedOverlayRect = {object: null};
                                    _intersectionInfo.intersectedOverlayRect.object = intersectedOverlayRectObject;
                                    // console.log('intersectedOverlayRectObject1', intersectedOverlayRectObject);
                                    
                                }
                            }
                            else
                            {
                                console.error('Found intersection vertex without a rect'); 
                            }
                            
                            
                            break;
                        }
                    }

                    if(!intersectedOverlayRectFound)
                    {
                        var overlayMeshGroup = layer.getOverlayMeshGroup();
                        var intersectedOverlayRectObject = overlayMeshGroup.getObjectById(intersectionCurr_object_id);
                        if(intersectedOverlayRectObject)
                        {
                            intersectedOverlayRectFound = true;
                            _intersectionInfo.intersectionLayer = layer;
                            _intersectionInfo.intersectedOverlayRect = intersectionCurr;

                            ///////////////////////////////////////
                            // update _selectedOverlayVertexHelperGroup to refer
                            // to _intersectionInfo.intersectedOverlayRect
                            ///////////////////////////////////////

                            if ( _intersectionInfo.intersectedOverlayRect.object.geometry instanceof THREE.BufferGeometry ) {
                                
                                var rectangleVerticesArray = _this.getRectangleVerticesAsArray(_intersectionInfo.intersectedOverlayRect);
                                
                                for(var i=0;i<rectangleVerticesArray.length;i++)
                                {
                                    var vertexPosition = rectangleVerticesArray[i];
                                    _selectedOverlayVertexHelperGroup.children[i].position.copy(vertexPosition);
                                }
                            }
                            else if ( _intersectionInfo.intersectedOverlayRect.object.geometry instanceof THREE.Geometry ) {
                                for(var i=0;i<_intersectionInfo.intersectedOverlayRect.object.geometry.vertices.length;i++)
                                {
                                    let vertex = _intersectionInfo.intersectedOverlayRect.object.geometry.vertices[i];
                                    _selectedOverlayVertexHelperGroup.children[i].position.copy(vertex);
                                }
                            }
                            else
                            {
                                console.error('Invalid _intersectionInfo.intersectedOverlayRect.object.geometry'); 
                            }

                            
                            // _selectedOverlayVertexHelperGroup.position.copy(_intersectionInfo.intersectedOverlayRect.object.position);

                            _selectedOverlayVertexHelperGroup.userData["intersectedOverlayRectObjectId"] = _intersectionInfo.intersectedOverlayRect.object.id;
                            break;
                        }
                    }

                    
                }

            }
            else
            {
                // Can get here e.g. if intersecting with LineSegments
                // console.log('invalid mesh'); 
            }
        }
        return;
    };

    
    this.highlightIntersection = function (intersectionCurr, intersectionPrev, color0) {

        if ( intersectionCurr ) {

            var intersectionPrevObj = MLJ.util.getNestedObject(intersectionPrev, ['object']);

            if ( !intersectionPrev || (intersectionPrevObj != intersectionCurr.object) )
            {
                if ( intersectionPrev )
                {
                    // recover the color of the old intersection, before setting intersectionPrev
                    intersectionPrev.object.material.color.setHex( intersectionPrev.currentHex );
                }

                // keep the intersection so that we can recover in the future
                intersectionPrev = intersectionCurr;

                // save the color for future recovery
                var object_material_color = MLJ.util.getNestedObject(intersectionPrev, ['object', 'material', 'color']);
                if( object_material_color == undefined)
                {
                    console.error('Failed to get intersectionPrev.object.material.color'); 
                }
                intersectionPrev.currentHex = object_material_color.getHex();
                
                // set the highlight color 
                intersectionPrev.object.material.color.setHex( color0 );
                
            }
        }
        else {
            
            if ( intersectionPrev )
            {
                // recover the color of the old intersection
                intersectionPrev.object.material.color.setHex( intersectionPrev.currentHex );
            }
            intersectionPrev = null;
        }            
        
        var result = {intersectionCurr: intersectionCurr,
                      intersectionPrev: intersectionPrev};
        
        return result;
    };


    this.findIntersections = function () {

        // BEG from example2_objLoader_raycasting.js
        if(firstTimeCameraPositioning)
        {
            _camera.position.x = positionX0;
            _camera.position.y = positionY0;
            _camera.position.z = positionZ0;
           
            _camera.updateMatrixWorld();

            firstTimeCameraPositioning = false;
        }

        _raycaster.setFromCamera( _mouse, _camera );

        var intersects = _raycaster.intersectObjects( _scene.children, true );

        // console.log('intersects', intersects); 
        _intersectionInfo.intersectionLayer = undefined;
        _intersectionInfo.intersectedStructure = undefined;
        _intersectionInfo.intersectedOverlayRect = undefined;
        _intersectionInfo.intersectedOverlayVertex = undefined;
        
        this.getLayerIntersectionsInfo(intersects);
        

        ///////////////////////////////////////////////
        // Manage intersectedStructure
        ///////////////////////////////////////////////

        var result = this.highlightIntersection(_intersectionInfo.intersectedStructure,
                                                _intersectionInfo.intersectedStructurePrev,
                                                MLJ.util.redColor);
        _intersectionInfo.intersectedStructure = result.intersectionCurr;
        _intersectionInfo.intersectedStructurePrev = result.intersectionPrev;

        if(_intersectionInfo.intersectedOverlayVertex ||
           _intersectionInfo.intersectedOverlayVertexPrev)
        {
            ///////////////////////////////////////////////
            // Manage intersectedOverlayVertex
            ///////////////////////////////////////////////
            
            result = this.highlightIntersection(_intersectionInfo.intersectedOverlayVertex,
                                                _intersectionInfo.intersectedOverlayVertexPrev,
                                                MLJ.util.greenColor);
            _intersectionInfo.intersectedOverlayVertex = result.intersectionCurr;
            _intersectionInfo.intersectedOverlayVertexPrev = result.intersectionPrev;
        }

        {
            ///////////////////////////////////////////////
            // Manage intersectedOverlayRect
            ///////////////////////////////////////////////

            result = this.highlightIntersection(_intersectionInfo.intersectedOverlayRect,
                                                _intersectionInfo.intersectedOverlayRectPrev,
                                                MLJ.util.yellowColor);

            // Load the file, and render the image
            var intersectedOverlayRectObject = MLJ.util.getNestedObject(_intersectionInfo, ['intersectedOverlayRect', 'object']);
            if(intersectedOverlayRectObject)
            {
                var intersectedOverlayRectObjectPrev = MLJ.util.getNestedObject(_intersectionInfo, ['intersectedOverlayRectPrev', 'object']);
                if ( !intersectedOverlayRectObjectPrev || (intersectedOverlayRectObjectPrev != intersectedOverlayRectObject) )
                {
                    let urlArray = MLJ.util.getNestedObject(_intersectionInfo, ['intersectedOverlayRect', 'object', 'material', 'userData', 'urlArray']);
                    if(!urlArray || (urlArray.size() === 0))
                    {
                        console.log("intersectionObj.material.userData.urlArray is undefined")
                        return false;
                    }
                    _selectedImageFilenames = urlArray.getKeys();
                    _selectedImageFilenameIndex = 0;
                    _selectedImageFilename = _selectedImageFilenames[_selectedImageFilenameIndex];
            
                    if(_this.loadTheSelectedImageAndRender() == false)
                    {
                        console.error('Failed to load and render the selected image.'); 
                    }
                }
                
            }
            
            _intersectionInfo.intersectedOverlayRect = result.intersectionCurr;
            _intersectionInfo.intersectedOverlayRectPrev = result.intersectionPrev;
        }

    }


    this.render = function (fromReqAnimFrame) {

        // if(_controls.isKeyDown)
        // if(_controls.isMouseDown)
        {
            _this.findIntersections();
        }

        // END from example2_objLoader_raycasting.js
        
        _renderer.render(_scene, _camera);

        // render the 2D overlays
        _renderer.autoClear = false;
        _renderer.render(_scene2D, _camera2D);
        _renderer.autoClear = true;
        
    };

    this.loadNextImage = function () {
        if(_selectedImageFilenames.length > 0)
        {
            _selectedImageFilenameIndex = (_selectedImageFilenameIndex + 1) % _selectedImageFilenames.length
            _selectedImageFilename = _selectedImageFilenames[_selectedImageFilenameIndex];
            
            if(MLJ.core.Scene.loadTheSelectedImageAndRender() == false)
            {
                console.error('Failed to load and render the selected image.'); 
            }
        }
    };

    this.resetTrackball = function () {
        _controls.reset();
    };

    //INIT
    $(window).ready(function () {
        initScene();
        animate();
    });
    
}).call(MLJ.core.Scene);
