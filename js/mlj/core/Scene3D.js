////////////////////////////////////////////////////////////////
//
// The scene file is the main container for the application
// In the threejs examples there are e.g. scene, camera, light, renderer in the main html file
// The MLJ.core.Scene3D class stores such telements
//
////////////////////////////////////////////////////////////////

MLJ.core.Scene3D = {};
MLJ.core.Scene3D.timeStamp = 0;

var positionPrev = new THREE.Vector3(0,0,0);
var cameraLookAtIntersectionPoint = undefined;

var globalIndex = 0;

(function () {
    var _layers = new MLJ.util.AssociativeArray();
    var _decorators = new MLJ.util.AssociativeArray();

    // _scene - threejs container for objects, lights and cameras. contains things that will be rendered
    var _scene3D;
    var _camera3D;
    var _controls3D;
    var _renderer3D;
    // _group3D is THREE.Object3D (similar to THREE.Group) which is base class for most threejs objects
    // used for grouping elements, e.g. scale, position
    var _group3D;
    var _mouse3D = new THREE.Vector2();

    var _scene2D;
    var _camera2D;

    var _raycaster;
    
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
    // Helpers
    ////////////////////////////////////////////////////
    
    var _originAxisHelper;
    var _axisHelper1;
    
    var _camera3DOffsetFromOrigin = new THREE.Vector3();
    
    ////////////////////////////////////////////////////
    // Other stuff
    ////////////////////////////////////////////////////

    var _releaseVersion = 1.0;
    var _modelVersion = undefined;
    var _blobs = {};
    var _zipFileArrayBuffer;
    var _zipLoaderInstance = -1;
    var _materialBlue = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth: 5});
    
    function onDocumentTouchDoubleTap( event ) {

        console.log('BEG onDocumentTouchDoubleTap'); 

        let element1Id = '_3DWrapper';
        let element1JqueryObject = $('#' + element1Id);
        var element1 = document.getElementById(element1Id);
        
        var element2 = document.getElementById('texture-pane-wrapper');
        
        if(globalIndex%2==0)
        {
            console.log('globalIndex is Even');

            element1JqueryObject.addClass("showFullSize");
            element1JqueryObject.removeClass("_3DWrapper");
            
            element2.style.display = "none";
        }
        else
        {
            console.log('globalIndex is Odd'); 

            element1JqueryObject.removeClass("showFullSize");
            element1JqueryObject.addClass("_3DWrapper");
            
            element2.style.display = "block";
        }

        // Adjust the size and position of the _renderer3D (canvas3D) element
        MLJ.core.Scene3D.resizeCanvas();

        // let width3 = element1JqueryObject.css("width");
        // let height3 = element1JqueryObject.css("height");
        // let top3 = element1JqueryObject.css("top");
        // let bottom3 = element1JqueryObject.css("bottom");
        // let left3 = element1JqueryObject.css("left");
        // let position3 = element1JqueryObject.css("position");
        // console.log('width3', width3); 
        // console.log('height3', height3); 
        // console.log('top3', top3); 
        // console.log('bottom3', bottom3);
        // console.log('left3', left3);
        // console.log('position3', position3); 
        
        // let style1a = window.getComputedStyle(element1);
        // let width1 = style1a.getPropertyValue('width');
        // let left1 = style1a.getPropertyValue('left');
        // let position1 = style1a.getPropertyValue('position');
        // console.log('width1', width1); 
        // console.log('left1', left1); 
        // console.log('position1', position1); 

        globalIndex += 1;
        // let _3DSize1 = get3DSize();
        // console.log('_3DSize1', _3DSize1);
        
        // let _3DOffset1 = get3DOffset();
        // console.log('_3DOffset1', _3DOffset1);
    };
    
    function onDocumentTouchMove3D( event ) {
        // console.log('BEG onDocumentTouchMove3D'); 

        if(_controls3D.isTouchDown)
        {
            event.preventDefault();

            if( event.touches.length > 0 )
            {
                _mouse3D.x = ( ( event.touches[0].clientX - get3DOffset().left - _renderer3D.domElement.offsetLeft ) /
                               _renderer3D.domElement.clientWidth ) * 2 - 1;
                
                _mouse3D.y = - ( ( event.touches[0].clientY - get3DOffset().top - _renderer3D.domElement.offsetTop ) /
                                 _renderer3D.domElement.clientHeight ) * 2 + 1;

                // console.log('_mouse3D', _mouse3D);
                
                MLJ.core.Scene3D.render();
            }
        }
    }

    function onDocumentMouseMove3D( event ) {
        event.preventDefault();

        _mouse3D.x = ( ( event.clientX - get3DOffset().left - _renderer3D.domElement.offsetLeft ) /
                       _renderer3D.domElement.clientWidth ) * 2 - 1;
        
        _mouse3D.y = - ( ( event.clientY - get3DOffset().top - _renderer3D.domElement.offsetTop ) /
                         _renderer3D.domElement.clientHeight ) * 2 + 1;

        // console.log('_mouse3D', _mouse3D);
        
        MLJ.core.Scene3D.render();
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
        _controls3D.update();
        MLJ.core.Scene3D.render();
        // console.log('_camera3D.position', _camera3D.position); 
        // console.log('_camera3D.rotation', _camera3D.rotation);
        // console.log('_controls3D.target', _controls3D.target); 
    }
    
    ////////////////////////////////////////////////////
    // BEG openImageFile
    // https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
    // https://jsfiddle.net/0GiS0/4ZYq3/
    ////////////////////////////////////////////////////

    function createVertexFromPoint(point) {
        var vector1 = new THREE.Vector3(point.worldcoords.x, point.worldcoords.y, point.worldcoords.z);
        return vector1;
    };

    var fileToOpenData;
    
    function updateMaterial(selectedOverlayRectObj, fileToOpenUrl, fileToOpenFilename, imageOrientation) {

        // instantiate a loader
        var loader = new THREE.TextureLoader();

        // load a resource
        loader.load(
            // resource URL
            fileToOpenUrl,
            
            // onLoad callback
            function ( texture ) {
                selectedOverlayRectObj.material.map = texture;

                let urlArray = MLJ.util.getNestedObject(selectedOverlayRectObj, ['material', 'userData', 'urlArray']);
                if(!urlArray)
                {
                    selectedOverlayRectObj.material.userData.urlArray = new MLJ.util.AssociativeArray();
                }

                let imageInfo = {imageFilename: fileToOpenFilename,
                                 imageOrientation: imageOrientation};
                
                urlArray.set(fileToOpenFilename, imageInfo);

                let imageInfoVec = MLJ.core.Scene3D.getImageInfoVec();
                imageInfoVec.set(fileToOpenFilename, imageInfo);
                MLJ.core.Scene3D.setImageInfoVec(imageInfoVec);
                
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


    this.openImageFile = function (filesToOpen) {
        
        // console.log('BEG openImageFile');

        if( !MLJ.core.Scene3D.getEdit3dModelOverlayFlag() )
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
        let canvas3D = document.getElementById('canvas3D');
        canvas3D.className = "area";

        var filesInfo = "";

        for (var i = 0; i < filesToOpen.length; i++) {
            var fileToOpen = filesToOpen[i];

            // Load the dragged file
            
            // https://stackoverflow.com/questions/31433413/return-the-array-of-bytes-from-filereader
            fileToOpenData = new Blob([fileToOpen]);
            var promise1 = new Promise(getBuffer);
            
            promise1.then(function(data) {
                var fileToOpenUrl = URL.createObjectURL(fileToOpenData);

                var fileToOpenFilename1 = fileToOpen.name;
                console.log('fileToOpenFilename1', fileToOpenFilename1);

                // Update _blobs with the new image
                _blobs[fileToOpenFilename1] = fileToOpenUrl;

                let promise2 = _zipLoaderInstance.getOrientation(fileToOpenData);
                
                promise2.then(function(result2) {
                    let imageOrientation = result2.orientation;
                    let imageInfo = {imageFilename: fileToOpenFilename1,
                                     imageOrientation: imageOrientation};
                    
                    let imageInfoVec = MLJ.core.Scene3D.getImageInfoVec();
                    imageInfoVec.set(fileToOpenFilename1, imageInfo);
                    MLJ.core.Scene3D.setImageInfoVec(imageInfoVec);
                    
                    //////////////////////////////////////////////
                    // BEG create a thumbnail for the image
                    //////////////////////////////////////////////

                    // TBD generalize the thumblify code block into a function in e.g. imageUtils.js ?
                    
                    let thumbnailFilename = fileToOpenFilename1.substr(0, fileToOpenFilename1.lastIndexOf(".")) + ".thumbnail.jpg";
                    if(!_blobs[thumbnailFilename])
                    {
                        thumbnailify(_blobs[fileToOpenFilename1], 100, function(base64Thumbnail) {
                            console.log('done thumbnailify'); 
	                    // thumbnail.src = base64Thumbnail;
                            var thumbnailFileUrl = URL.createObjectURL(base64Thumbnail)

                            _blobs[thumbnailFilename] = thumbnailFileUrl;

                            ////////////////////////////////////////////////////
                            // refresh the texture of the intersectedOverlayRect in the 3d model
                            ////////////////////////////////////////////////////

                            let selectedOverlayRectObj = _intersectionInfo.intersectedOverlayRect.object;
                            
                            updateMaterial(selectedOverlayRectObj, thumbnailFileUrl, thumbnailFilename, imageOrientation);
                            
                            
                            ////////////////////////////////////////////////////
                            // refresh the texture in the 2d pane
                            ////////////////////////////////////////////////////
                            
                            _selectedImageFilename = fileToOpenFilename1;
                            
                            // The file already exists in memory. Load it from the memory and render in the 2d pane
                            MLJ.core.MeshFile.loadTexture2FromFile(_blobs[fileToOpenFilename1]);
                            
                        });

                    }
                    else
                    {
                        ////////////////////////////////////////////////////
                        // refresh the texture of the intersectedOverlayRect in the 3d model
                        ////////////////////////////////////////////////////

                        let selectedOverlayRectObj = _intersectionInfo.intersectedOverlayRect.object;
                        let thumbnailFileUrl = _blobs[thumbnailFilename];
                        updateMaterial(selectedOverlayRectObj, thumbnailFileUrl, thumbnailFilename, imageOrientation);
                        
                        
                        ////////////////////////////////////////////////////
                        // refresh the texture in the 2d pane
                        ////////////////////////////////////////////////////
                        
                        _selectedImageFilename = fileToOpenFilename1;
                        
                        // The file already exists in memory. Load it from the memory and render in the 2d pane
                        MLJ.core.MeshFile.loadTexture2FromFile(_blobs[fileToOpenFilename1]);

                    }
                    
                }).catch(function(err) {

                    console.error('err1', err); 
                });                         
                
            }).catch(function(err) {

                console.error('err', err); 
            });
        }
    };

    // read the file data from blob into Uint8Array buffer in memory
    function getBuffer(resolve) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(fileToOpenData);
        reader.onload = function() {
            var arrayBuffer = reader.result
            var bytes = new Uint8Array(arrayBuffer);
            resolve(bytes);
        }
    }
    
    ////////////////////////////////////////////////////
    // END openImageFile
    ////////////////////////////////////////////////////
    
    function initScene() {

        ////////////////////////////////////////////////////
        // 3D
        ////////////////////////////////////////////////////
        
        _scene3D = new THREE.Scene();
        _scene3D._structureObjFileName = "structure.obj";
        _scene3D._overlayObjFileName = "overlay.obj";

        let _3DSize = get3DSize();

        let cameraFrustumAspectRatio = _3DSize.width / _3DSize.height;
        let cameraFrustumNearPlane = 0.1;
        let cameraFrustumFarPlane = 100000;
        let fov = 60;
        _camera3D = new THREE.PerspectiveCamera(fov, cameraFrustumAspectRatio, cameraFrustumNearPlane, cameraFrustumFarPlane);
            
        _camera3D.lookAt( _scene3D.position );
        _camera3D.updateMatrixWorld();
        _camera3D.updateProjectionMatrix();
        
        _group3D = new THREE.Object3D();
        _scene3D.add(_group3D);

        _scene2D = new THREE.Scene();
        _camera2D = new THREE.OrthographicCamera(0, _3DSize.width / _3DSize.height, 1, 0, -1, 1);
        _camera2D.position.z = -1;
        
        _raycaster = new THREE.Raycaster();

        _renderer3D = new THREE.WebGLRenderer();
        _renderer3D.domElement.id = 'canvas3D';
        _renderer3D.setPixelRatio(window.devicePixelRatio);
        _renderer3D.setSize(_3DSize.width, _3DSize.height);

        $('#_3D').append(_renderer3D.domElement);
        _scene3D.add(_camera3D);

        ////////////////////////////////////////////////////
        // OverlayRect
        ////////////////////////////////////////////////////
        
        MLJ.core.Scene3D.initOverlayRectVertexHelpers();
        
        ////////////////////////////////////////////////////
        // Helpers
        ////////////////////////////////////////////////////

        _originAxisHelper = new THREE.AxesHelper(10);
        _originAxisHelper.material.linewidth = 5000;
        _scene3D.add(_originAxisHelper);

        _axisHelper1 = new THREE.AxesHelper(4);
        _axisHelper1.material.linewidth = 10;
        _scene3D.add(_axisHelper1);

        ////////////////////////////////////////////////////
        // INIT CONTROLS
        ////////////////////////////////////////////////////

        let container3D = document.getElementById('_3D');
        
        _controls3D = new THREE.OrbitControls3Dpane(_camera3D, container3D);

        //////////////////////////////////////
        // Set rotate related parameters
        //////////////////////////////////////

        _controls3D.enableRotate = true;
        // _controls3D.enableRotate = false;
        _controls3D.rotateSpeed = 2.0;
        // How far you can orbit vertically, upper and lower limits.
        _controls3D.minPolarAngle = Math.PI/2; // radians
        _controls3D.maxPolarAngle = Math.PI/2; // radians
        // How far you can orbit horizontally, upper and lower limits.
        // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
        _controls3D.minAzimuthAngle = - Infinity; // radians
        _controls3D.maxAzimuthAngle = Infinity; // radians

        
        //////////////////////////////////////
        // Set zoom related parameters
        //////////////////////////////////////

        _controls3D.enableZoom = true;
        _controls3D.zoomSpeed = 1.2;

        // How far you can zoom in and out
        // Relevant for the implementation of OrbitControls3Dpane with PerspectiveCamera
        // (zoom was changed from dollying to use the fov and digital zoom)
        _controls3D.minZoom = 0.5;
        _controls3D.maxZoom = Infinity;

        // How far you can dolly in and out
        // Not relevant for the implementation of OrbitControls3Dpane with PerspectiveCamera
        // (zoom was changed from dollying to use the fov and digital zoom)
        // _controls3D.minDistance = 0.1;
        // _controls3D.maxDistance = Infinity;

        
        //////////////////////////////////////
        // Set pan related parameters
        //////////////////////////////////////

        _controls3D.enablePan = true;
        _controls3D.screenSpacePanning = true;
        // pixels moved per arrow key push
	_controls3D.keyPanSpeed = 7000.0;
        _controls3D.panSpeed = 7000.0;
        _controls3D.enableDamping = true;
        _controls3D.dampingFactor = 0.3;
        
        // this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
        // // https://theasciicode.com.ar/
        // // 65 'A'
        // // 83 'S'
        // // 68 'D'
        // // 70 'F'
        // // 71 'G'
        // // 72 'H'
        // _controls3D.keys = [65, 83, 68, 70, 71, 72];

        // $(document).keydown(function (event) {
        //     // ASCII 72 is 'h', so clicking Ctrl+h (or Meta+Shift+h) is intercepted here.
        //     // Inside the code calls the TexturePanelPlugin.reset, i.e. 
        //     // Ctrl+h is mapped to reseting the view of the scene

        //     if ((event.ctrlKey || (event.metaKey && event.shiftKey)) && event.which === 72) {
        //         event.preventDefault();
        //         _controls3D.reset();
        //     }
        // });
        
        // need to set _camera3DOffsetFromOrigin after construction of _controls3D
        _camera3DOffsetFromOrigin = new THREE.Vector3(0, 0.1, 0);
        _camera3D.position.copy( _camera3DOffsetFromOrigin );
        _camera3D.zoom = 0.24;

        // TBD - figure out how to set intial rotation for sceneCamera3D
        // var camera3DRotation0 = new THREE.Vector3(-3.141592653589793, 0.04478848996971253, 3.141592653589793);
        // _camera3D.rotation.copy( camera3DRotation0 );
        // //    -3.141592653589793, _y: 0.04478848996971253, _z: 3.141592653589793
        // let targetPosition0 = new THREE.Vector3(0, 0, 0);
        // _controls3D.target.copy( targetPosition0 );
        // console.log('_controls3D.target', _controls3D.target); 

        ////////////////////////////////////////////////////
        // INIT LIGHTS 
        ////////////////////////////////////////////////////

        var light = new THREE.AmbientLight("#808080");
        _scene3D.add(light);

        _this.lights.AmbientLight = new MLJ.core.AmbientLight(_scene3D, _camera3D, _renderer3D);
        _this.lights.Headlight = new MLJ.core.Headlight(_scene3D, _camera3D, _renderer3D);

        ////////////////////////////////////////////////////
        // EVENT HANDLERS
        ////////////////////////////////////////////////////

        let canvas3D = document.getElementById('canvas3D');
        canvas3D.addEventListener('touchmove', _controls3D.update.bind(_controls3D), false);
        canvas3D.addEventListener('mousemove', _controls3D.update.bind(_controls3D), false);
        canvas3D.addEventListener('mousewheel', _controls3D.update.bind(_controls3D), false);
        canvas3D.addEventListener('DOMMouseScroll', _controls3D.update.bind(_controls3D), false); // firefox
        canvas3D.addEventListener( 'mousemove', onDocumentMouseMove3D, false );

        canvas3D.addEventListener( 'touchmove', onDocumentTouchMove3D, false );
        
        _controls3D.addEventListener('change', function () {
            MLJ.core.Scene3D.render();

            $('#canvas3D').trigger('onControlsChange');
        });


        ////////////////////////////////////////////////////
        // BEG Handle doubletap 
        ////////////////////////////////////////////////////

        let element1Id = '_3DWrapper';
        let element1JqueryObject = $('#' + element1Id);
        console.log('element1JqueryObject', element1JqueryObject); 

        element1JqueryObject.on('doubletap', function(event) {
            // Takes care both of "double touch" (with the finger) and double click (with the mouse)
            console.log('User doubletapped #myElement');
            onDocumentTouchDoubleTap(event);
        });

        ////////////////////////////////////////////////////
        // END Handle doubletap 
        ////////////////////////////////////////////////////
        
        MLJ.core.Scene3D.resizeCanvas();

        $(window).resize(function () {
            let size3D = get3DSize();
            _camera3D.aspect = size3D.width / size3D.height;
            _camera3D.updateProjectionMatrix();
            _renderer3D.setSize(size3D.width, size3D.height);

            MLJ.core.Scene3DtopDown.render();
        });

        $(document).on("MeshFileOpened", function (event, layer) {
            MLJ.core.Scene3D.addLayer(layer);
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

    this.resizeCanvas = function () {
        console.log('BEG Scene3D resize'); 
        var size3D = get3DSize();
        // console.log('size3D', size3D); 
        _camera3D.aspect = size3D.width / size3D.height;
        // console.log('_camera3D.aspect', _camera3D.aspect); 
        // console.log('_renderer3D.getCurrentViewport()', _renderer3D.getCurrentViewport()); 
        _camera3D.updateProjectionMatrix();
        _renderer3D.setSize(size3D.width, size3D.height);
        let pixelRatio = _renderer3D.getPixelRatio();
        // console.log('pixelRatio', pixelRatio); 
        _camera2D.left = size3D.width / size3D.height;
        _camera2D.updateProjectionMatrix;
        
        MLJ.core.Scene3D.render();
    };

    this.addToScene3D = function (obj) {
        _scene3D.add( obj );
    };
    
    this.removeFromScene3D = function (obj) {
        _scene3D.remove( obj );
    };

    this.setEdit3dModelControl = function (pivotGroup, structureMeshGroup, overlayMeshGroup) {
        _edit3dModelOverlayTrackballControls = new THREE.Edit3dModelOverlayTrackballControls( pivotGroup,
                                                                                              structureMeshGroup,
                                                                                              overlayMeshGroup,
                                                                                              _intersectionInfo,
                                                                                              _selectedOverlayVertexHelperGroup,
                                                                                              _camera3D,
                                                                                              _renderer3D.domElement );
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
        // _group3D.add(layer.getThreeMesh());

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
                _scene3D.remove( intersectedOverlayRectObject );
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

        _scene3D.add( _selectedOverlayVertexHelperGroup );
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
             *  @event MLJ.core.Scene3D#SceneLayerUpdated
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
            MLJ.core.Scene3D.render();
        }
    };

    // this.addSceneDecorator = function (name, decorator) {
    //     if (!(decorator instanceof THREE.Object3D)) {
    //         console.warn("MLJ.core.Scene3D.addSceneDecorator(): decorator parameter not an instance of THREE.Object3D");
    //         return;
    //     }

    //     _decorators.set(name, decorator)
    //     _group3D.add(decorator);

    //     _this.render();
    // };
    
    this.getReleaseVersion = function () {
        return _releaseVersion;
    };

    this.setReleaseVersion = function (releaseVersion) {
        _releaseVersion = releaseVersion;
    };

    this.getMouse3D = function () {
        return _mouse3D;
    };

    this.getCamera3D = function () {
        return _camera3D;
    };

    this.getCamera3DoffsetFromOrigin = function () {
        return _camera3DOffsetFromOrigin;
    };

    this.setCamera3Dposition = function (position) {
//         console.log('position0', position);

        _axisHelper1.position.copy( position );
        // _originAxisHelper.position.copy( position );

        let pivotGroup = _selectedLayer.getPivotGroup();
        // restore position to previous position
        pivotGroup.position.add(positionPrev);
        
        positionPrev.copy( position );
        // update position to new position
        pivotGroup.position.sub(position);
        
        // Here we can play with _controls3D params,
        // e.g. minPolarAngle, minAzimuthAngle, minZoom
        // to change the behavior on the fly
        _controls3D.minZoom = 0.1;
        
        _camera3D.updateMatrixWorld();
        // updateProjectionMatrix only applies to camera after changing the camera params,
        // (e.g. in Orthographic camera if changing the near/far)
        _camera3D.updateProjectionMatrix();

        // console.log('_camera3D', _camera3D);
        // console.log('_camera3D.position', _camera3D.position); 
        // console.log('_camera3D.fov', _camera3D.fov); 
        // console.log('_camera3D.near', _camera3D.near); 
        // console.log('_camera3D.zoom', _camera3D.zoom); 

        // console.log('_controls3D', _controls3D); 
        // console.log('_controls3D.minZoom', _controls3D.minZoom); 
        // console.log('_camera3D.rotation', _camera3D.rotation);
        
    };

    this.getEdit3dModelOverlayFlag = function () {
        return _edit3dModelOverlayFlag;
    };

    this.setEdit3dModelOverlayFlag = function (edit3dModelOverlayFlag) {
        _edit3dModelOverlayFlag = edit3dModelOverlayFlag;

        if(_edit3dModelOverlayFlag)
        {
            _controls3D.enabled = false;
        }
        else
        {
            _controls3D.enabled = true;
        }
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
        return false;
        // return true;
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
    
    this.getRenderer3D = function () {
        return _renderer3D;
    };

    this.getScene3D = function () {
        return _scene3D;
    };

    this.getSelectedOverlayVertexHelperGroup = function () {
        return _selectedOverlayVertexHelperGroup;
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
        // console.log('BEG loadTheSelectedImageAndRender'); 

        let imageInfo = _imageInfoVec.getByKey(_selectedThumbnailImageFilename);
        
        // TBD - leave here until showImageInfo button is implemented
        // console.log('_selectedThumbnailImageFilename', _selectedThumbnailImageFilename);
        // console.log('imageInfo', imageInfo); 

        // sanity check
        if( _selectedThumbnailImageFilename !== imageInfo.imageFilename)
        {
            // console.error('Reached failure condition: "_selectedThumbnailImageFilename !== imageInfo.imageFilename"');
            console.log('_selectedThumbnailImageFilename', _selectedThumbnailImageFilename); 
            console.log('imageInfo.imageFilename', imageInfo.imageFilename);
            throw 'Reached failure condition: "_selectedThumbnailImageFilename !== imageInfo.imageFilename"';
        }

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

        // console.log('BEG findIntersections');

        ///////////////////////////////////////////////
        // Intersect with the center of window (mouse at 0,0)
        ///////////////////////////////////////////////

        var scene3dWindowCenter = new THREE.Vector2();
        _raycaster.setFromCamera( scene3dWindowCenter, _camera3D );

        var cameraLookAtIntersects = _raycaster.intersectObjects( _scene3D.children, true );
        if(cameraLookAtIntersects[0])
        {
            cameraLookAtIntersectionPoint = cameraLookAtIntersects[0].point;
        }
        
        ///////////////////////////////////////////////
        // Intersect with the mouse position
        ///////////////////////////////////////////////

        _raycaster.setFromCamera( _mouse3D, _camera3D );

        var intersects = _raycaster.intersectObjects( _scene3D.children, true );

        // console.log('intersects', intersects); 
        _intersectionInfo.intersectionLayer = undefined;
        _intersectionInfo.intersectedStructure = undefined;
        _intersectionInfo.intersectedOverlayRect = undefined;
        _intersectionInfo.intersectedOverlayVertex = undefined;
        
        this.getLayerIntersectionsInfo(intersects);
        
        if(_intersectionInfo.intersectedStructure)
        {
            ///////////////////////////////////////////////
            // Update the scene3D intersection points in Scene3DtopDown
            ///////////////////////////////////////////////

            MLJ.core.Scene3DtopDown.setScene3DintersectionPoint(cameraLookAtIntersectionPoint,
                                                                _intersectionInfo.intersectedStructure.point);
        }

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

        ///////////////////////////////////////////////
        // Manage intersectedOverlayRect
        ///////////////////////////////////////////////

        result = this.highlightIntersection(_intersectionInfo.intersectedOverlayRect,
                                            _intersectionInfo.intersectedOverlayRectPrev,
                                            MLJ.util.yellowColor);

        let sceneBar = MLJ.gui.getWidget("SceneBar");
        let openImageFileButton = sceneBar.getOpenImageFileButton();
        // let isDisabled = openImageFileButton.isDisabled();
        // console.log('isDisabled', isDisabled); 
        
        // Load the file, and render the image
        var intersectedOverlayRectObject = MLJ.util.getNestedObject(_intersectionInfo, ['intersectedOverlayRect', 'object']);
        if(intersectedOverlayRectObject)
        {
            if(_edit3dModelOverlayFlag)
            {
                // Support adding images via the openImage menu instead of dragAndDrop
                // In edit mode, do findIntersections only on left click (and not continuously)
                // This causes that on left click, if intersecting with new or used OverlayRect, keep the OverlayRectId after mouseup
                //
                // enable openFile button only if there is a selected OverlayRect (yellow for new OverlayRect, or where existing images are for used OverlayRect)
                // set _intersectionInfo.intersectedOverlayRect to be the selected OverlayRect

                // There is an intersection with overlayRect and in edit mode. Enable the openImageFileButton
                openImageFileButton.disabled(false);
                // let isDisabled1 = openImageFileButton.isDisabled();
                // console.log('isDisabled1', isDisabled1); 
            }
            
            var intersectedOverlayRectObjectPrev = MLJ.util.getNestedObject(_intersectionInfo, ['intersectedOverlayRectPrev', 'object']);
            if ( !intersectedOverlayRectObjectPrev || (intersectedOverlayRectObjectPrev != intersectedOverlayRectObject) )
            {
                let urlArray = MLJ.util.getNestedObject(_intersectionInfo, ['intersectedOverlayRect', 'object', 'material', 'userData', 'urlArray']);
                if(!urlArray || (urlArray.size() === 0))
                {
                    // console.log("intersectionObj.material.userData.urlArray is undefined")
                    return false;
                }
                _selectedImageFilenames = urlArray.getKeys();
                _selectedImageFilenameIndex = 0;
                _selectedThumbnailImageFilename = _selectedImageFilenames[_selectedImageFilenameIndex];
                
                if(_this.loadTheSelectedImageAndRender() == false)
                {
                    console.error('Failed to load and render the selected image.'); 
                }
            }
            
        }
        else
        {
            if(_edit3dModelOverlayFlag)
            {
                // There is NO intersection with overlayRect and we are in edit mode. Disable the openImageFileButton
                openImageFileButton.disabled(true);
            }
        }
        
        _intersectionInfo.intersectedOverlayRect = result.intersectionCurr;
        _intersectionInfo.intersectedOverlayRectPrev = result.intersectionPrev;

    }


    this.render = function (fromReqAnimFrame) {

        // if(_controls3D.isKeyDown)
        if(_controls3D.isMouseDown || _controls3D.isTouchDown)
        {
            _this.findIntersections();
        }

        if(_selectedLayer)
        {
            // experiment with rotation through automatic changes to position/rotation

            // let pivotGroup = _selectedLayer.getPivotGroup();
            // pivotGroup.rotation.y += 0.002;
            // pivotGroup.position.y += 0;

            // let deltaY = +0.0;
            // _camera3D.position.y += deltaY;
            // _controls3D.target.y += deltaY;

            // _camera3D.zoom = 0.5;

            // pivotGroup.updateMatrixWorld();
            // _scene3D.updateMatrixWorld();
            
            // console.log('_camera3D.position', _camera3D.position);
            // console.log('_camera3D.rotation', _camera3D.rotation);
            // console.log('_camera3D.zoom', _camera3D.zoom); 
            // console.log('_controls3D.target', _controls3D.target);
            // console.log('_controls3D.getPolarAngle()', _controls3D.getPolarAngle());
            // console.log('_controls3D.getAzimuthalAngle()', _controls3D.getAzimuthalAngle());
            // console.log('pivotGroup.position', pivotGroup.position);
            // console.log('_axisHelper1.position', _axisHelper1.position);
            // console.log('_originAxisHelper.position', _originAxisHelper.position);
        }
        
        _renderer3D.render(_scene3D, _camera3D);

        // render the 2D overlays
        _renderer3D.autoClear = false;
        _renderer3D.render(_scene2D, _camera2D);
        _renderer3D.autoClear = true;
    };

    this.loadNextImage = function () {
        if(_selectedImageFilenames.length > 0)
        {
            _selectedImageFilenameIndex = (_selectedImageFilenameIndex + 1) % _selectedImageFilenames.length
            _selectedThumbnailImageFilename = _selectedImageFilenames[_selectedImageFilenameIndex];
            
            if(MLJ.core.Scene3D.loadTheSelectedImageAndRender() == false)
            {
                console.error('Failed to load and render the selected image.'); 
            }
        }
    };

    this.resetTrackball3D = function () {
        _controls3D.reset();
    };

    //INIT
    $(window).ready(function () {
        initScene();
        animate();
    });
    
}).call(MLJ.core.Scene3D);
