
MLJ.core.Scene = {};
MLJ.core.Scene.timeStamp = 0;

var firstTime2 = true;
var radius = 100;

var intersectionPrev = 0;
var wallIndexPrev = 0;
var imageIndexPrev = 0;

var doEnableOverlayImageBoundaries = true;
// doEnableOverlayImageBoundaries = false;

(function () {
    var _layers = new MLJ.util.AssociativeArray();
    var _decorators = new MLJ.util.AssociativeArray();
    var _scene;
    var _group;
    var _camera;
    var _cameraPosition;
    var _scene2D;
    var _camera2D;
    var _controls;
    var _raycaster;
    var _mouse = new THREE.Vector2();
    var _renderer;
    var _this = this;
    var _selectedImageGeometry;
    var _selectedImageGeometry2;
    var _selectedImageLineSegments;
    var _selectedImageLineSegments2;
    var _selectedLayer;
    var _objFileName;
    var _mtlFileName;
    var _selectedImageFilename;
    var _selectedWallIndex = -1;
    var _selectedImageIndex = -1;
    var _blobs = {};
    var _zipFileArrayBuffer;
    var _zipLoaderInstance = -1;
    var _materialBlue = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth: 5});
    
    function onDocumentMouseMove( event ) {

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

    function dragHandler2(event) {

        event.stopPropagation();
        event.preventDefault();

        _mouse.x = ( ( event.clientX - get3DOffset().left - _renderer.domElement.offsetLeft ) /
                     _renderer.domElement.clientWidth ) * 2 - 1;
        
        _mouse.y = - ( ( event.clientY - get3DOffset().top - _renderer.domElement.offsetTop ) /
                       _renderer.domElement.clientHeight ) * 2 + 1;
        
        // var drop_area = document.getElementById("drop_area");
        // drop_area.className = "area drag";
        var $canvas = $('canvas')[0];
        $canvas.className = "area drag";

    }

    var droppedFileData;
    function filesDroped2(event) {

        event.stopPropagation();
        event.preventDefault();

        // var drop_area = document.getElementById("drop_area");
        // drop_area.className = "area";
        var $canvas = $('canvas')[0];
        $canvas.className = "area";
        
        var droppedFiles = event.dataTransfer.files; //It returns a FileList object
        var filesInfo = "";

        for (var i = 0; i < droppedFiles.length; i++) {
            var droppedFile = droppedFiles[i];

            // Load the file
            
            // Replace blobs[selectedImageFilename]

            // https://stackoverflow.com/questions/31433413/return-the-array-of-bytes-from-filereader
            droppedFileData = new Blob([droppedFile]);
            var promise = new Promise(getBuffer);
            var wallsInfo = _selectedLayer.getWallsInfo();
            var wallInfo = wallsInfo[_selectedWallIndex];
            var imageInfo = wallInfo.imagesInfo[_selectedImageIndex];
            var origImageFilename = imageInfo.imageFilename;
            
            promise.then(function(data) {
	        var droppedFileUrl = URL.createObjectURL(droppedFileData);

                console.log('_selectedWallIndex', _selectedWallIndex);
                console.log('_selectedImageIndex', _selectedImageIndex);

                // replace wallsInfo[wallIndex].imagesInfo[imageIndex] with the dropped file
                console.log('Orig imageInfo.imageFilename', imageInfo.imageFilename);
                
                imageInfo.imageFilename = droppedFile.name;

                ////////////////////////////////////////////////////
                // BEG Update _blobs with the updated wallInfo
                // 
                // Update wallInfo with the new imageFilename
                // Create a blob for the updated wallInfo data (json)
                // Create a blobUrl for the blob
                // Replace the old blobUrl with the updated blobUrl
                ////////////////////////////////////////////////////
                
                // console.log('wallInfo', wallInfo);

                
                var wallInfoBlob = new Blob([JSON.stringify(wallInfo, null, 2)], {type : 'application/json'});
                var wallInfoBlobUrl = URL.createObjectURL(wallInfoBlob);
                
                var wallAttributesFileName = wallInfo.attributesFilename;
                if(_blobs[wallAttributesFileName])
                {
                    _blobs[wallAttributesFileName] = wallInfoBlobUrl;
                }
                else
                {
                    console.error('_blobs[wallAttributesFileName] is undefined'); 
                    console.error('wallAttributesFileName', wallAttributesFileName); 
                }

                ////////////////////////////////////////////////////
                // END Update _blobs with the updated wallInfo
                ////////////////////////////////////////////////////
                
                
                // Update _blobs with the new image
                _blobs[imageInfo.imageFilename] = droppedFileUrl;
            }).then(function() {
                
                ////////////////////////////////////////////////////
                // BEG Update _blobs with the updated mtlFileName
                // 
                // Update mtlFileName with the new thumbnail
                // Create a blob for the updated mtlFileName data (json?)
                // Create a blobUrl for the blob
                // Replace the old blobUrl with the updated blobUrl
                ////////////////////////////////////////////////////
                
                mtlInfo = _selectedLayer.getMtlInfo();

                // Map
                // from
                // map_Kd ./floor1/wall_10/flatten_canvas.resized.jpg
                // to
                // map_Kd sec_2_37.jpg

                // extract e.g. wall_10 from ./floor1/wall_10/flatten_canvas.resized.jpg
                var res1 = origImageFilename.match(/(wall.*)\//);
                var wallSubString = res1[1];

                // create the regex from string
                var regexpStr = "map_Kd.*\/" + wallSubString + "\/flatten_canvas.resized.jpg";
                var regexp0 = new RegExp(regexpStr);
                    
                // create the replacement string newStr
                var newStr = "map_Kd " + imageInfo.imageFilename;
                var mtlInfo3 = mtlInfo.replace(regexp0, newStr);

                // create a new blobUrl from the updated mtlInfo
                var mtlBlob = new Blob([mtlInfo3], {type : 'application/text'});
                var mtlBlobUrl = URL.createObjectURL(mtlBlob);
                
                var mtlFileName = MLJ.core.Scene._mtlFileName;
                
                // set the updated blobUrl with the updated mtlInfo in _blobs
                if(_blobs[mtlFileName])
                {
                    _blobs[mtlFileName] = mtlBlobUrl;
                }
                else
                {
                    console.error('_blobs[mtlFileName] is undefined'); 
                    console.error('mtlFileName', mtlFileName); 
                }

                ////////////////////////////////////////////////////
                // END Update _blobs with the updated mtlFileName
                ////////////////////////////////////////////////////

                ////////////////////////////////////////////////////
                // refresh the texture, and refresh the 3d model
                ////////////////////////////////////////////////////

                var groupObject = _selectedLayer.getGroup();
                if(_selectedLayer.groupObject)
                {
                    MLJ.core.Scene.removeFromScene( _selectedLayer.groupObject );
                    delete _selectedLayer.groupObject;
                    _selectedLayer.groupObject = null;
                }

                MLJ.core.MeshFile.loadObjectAndMaterialFiles(MLJ.core.Scene._objFileName, mtlFileName, _selectedLayer);

            }).catch(function(err) {

            });
        }
    }

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

        var fov = 70;
        var cameraFrustumAspectRatio = _3DSize.width / _3DSize.height;
        var cameraFrustumNearPlane = 0.1;
        var cameraFrustumFarPlane = 100000;
        _camera = new THREE.PerspectiveCamera(fov, cameraFrustumAspectRatio, cameraFrustumNearPlane, cameraFrustumFarPlane);

        _camera.position.z = -1500;
        _camera.position.x = 1500;
        _camera.position.y = 1500;

        
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
        
        // _renderer = new THREE.WebGLRenderer({
        //     antialias: true,
        //     alpha: true,
        //     preserveDrawingBuffer: true});
        // _renderer.context.getExtension("EXT_frag_depth");

        _renderer = new THREE.WebGLRenderer();

        _renderer.setPixelRatio(window.devicePixelRatio);
        _renderer.setSize(_3DSize.width, _3DSize.height);

        
        $('#_3D').append(_renderer.domElement);
        _scene.add(_camera);

        //INIT CONTROLS
        var container = document.getElementsByTagName('canvas')[0];
        _controls = new THREE.TrackballControls(_camera, container);

        _controls.rotateSpeed = 2.0;
        _controls.zoomSpeed = 1.2;
        _controls.panSpeed = 2.0;

        _controls.noZoom = false;
        _controls.noPan = false;
        _controls.staticMoving = true;
        _controls.dynamicDampingFactor = 0.3;
        _controls.keys = [65, 83, 68];

        $(document).keydown(function (event) {
            if ((event.ctrlKey || (event.metaKey && event.shiftKey)) && event.which === 72) {
                event.preventDefault();
                _controls.reset();
            }
        });

        /////////////////////////////////////////////////////////////////
        // add selected image
        /////////////////////////////////////////////////////////////////

        _selectedImageGeometry = new THREE.Geometry();

        var geometry1 = new THREE.Geometry();
        geometry1.colorsNeedUpdate = true;
        geometry1.verticesNeedUpdate = true;
        geometry1.needsUpdate = true;

        document.addEventListener( 'mousemove', onDocumentMouseMove, false );

        var light = new THREE.AmbientLight("#808080");
        _scene.add(light);

        //INIT LIGHTS 
        _this.lights.AmbientLight = new MLJ.core.AmbientLight(_scene, _camera, _renderer);
        _this.lights.Headlight = new MLJ.core.Headlight(_scene, _camera, _renderer);

        //EVENT HANDLERS
        var $canvas = $('canvas')[0];
        $canvas.addEventListener('touchmove', _controls.update.bind(_controls), false);
        $canvas.addEventListener('mousemove', _controls.update.bind(_controls), false);
        $canvas.addEventListener('mousewheel', _controls.update.bind(_controls), false);
        $canvas.addEventListener('DOMMouseScroll', _controls.update.bind(_controls), false); // firefox

        ////////////////////////////////////////////////////
        // BEG drag drop file via canvas
        ////////////////////////////////////////////////////
                
        $canvas.addEventListener("dragover", dragHandler2);
        $canvas.addEventListener("drop", filesDroped2);

        
        _controls.addEventListener('change', function () {
            MLJ.core.Scene.render();
            $($canvas).trigger('onControlsChange');
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

            if(doEnableOverlayImageBoundaries)
            {
                /////////////////////////////////////////////////////////////////
                // overlay images boundaries on 3d model
                /////////////////////////////////////////////////////////////////

                _this.overlayWallsImagesBoundariesOn3dModel(layer);
            }
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

    function _computeGlobalBBbox()
    {
        //console.time("Time to update bbox: ");
        _group.scale.set(1, 1, 1);
        _group.position.set(0, 0, 0);
        _group.updateMatrixWorld();

        if (_layers.size() === 0) // map to the canonical cube
            BBGlobal = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
        else {
            // Defining the starting bounding box as the one from the first layer
            BBGlobal = new THREE.Box3().setFromObject(_layers.getFirst().getThreeMesh());

            var iter = _layers.iterator();

            // Iterating over all the layers
            while (iter.hasNext()) {
                // Getting the bounding box of the current layer
                var bbox = new THREE.Box3().setFromObject(iter.next().getThreeMesh());

                // Applying the union of the previous bounding box to the current one
                BBGlobal.union(bbox);
            }
        }
        var scaleFac = 15.0 / (BBGlobal.min.distanceTo(BBGlobal.max));
        // var offset = BBGlobal.center().negate();
        var target = new THREE.Vector3();
        var offset = BBGlobal.getCenter(target).negate();
        offset.multiplyScalar(scaleFac);
        _group.scale.set(scaleFac, scaleFac, scaleFac);
        _group.position.set(offset.x, offset.y, offset.z);
        _group.updateMatrixWorld();
        return BBGlobal;
    }

    this.getBBox = function () {
        return _computeGlobalBBbox();
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
        _group.add(layer.getThreeMesh());

        //Add new mesh to associative array _layers            
        _layers.set(layer.name, layer);
        
        _selectedLayer = layer;
        
        _computeGlobalBBbox();

        $(document).trigger("SceneLayerAdded", [layer, _layers.size()]);
        _this.render();

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
            _computeGlobalBBbox();
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
            //remove layer from list
            _group.remove(layer.getThreeMesh());

            layer = _layers.remove(layer.name);
            
            $(document).trigger("SceneLayerRemoved", [layer, _layers.size()]);
            if (layer) {
                var objInstanceUuid = layer.getObjInstanceUuid();
                console.log('objInstanceUuid', objInstanceUuid); 
                _scene.remove( objInstanceUuid );
                _scene.remove( layer.getThreeMesh() );

                _scene.remove( layer );
                layer.dispose();
                layer = null;
                // delete layer;
            }

            if (_layers.size() > 0) {
                _this.selectLayerByName(_layers.getFirst().name);
            } else {
                _this._selectedLayer = undefined;
            }
            _computeGlobalBBbox();
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

    this.calcDistance = function (point1, point2) {
        
        var a = point1.x - point2.x;
        var b = point1.y - point2.y;

        var dist = Math.sqrt( a*a + b*b );
        return dist;
    };
    
    this.calcNearestImage = function (layer, faceIndex, materialIndex, intersectionUvCoord) {

        var minDist = 1E6;
        var wallIndex = -1;
        var imageIndex = -1;
        if(!intersectionUvCoord)
        {
            return {wallIndex : -1, imageIndex : -1}
        }

        var wallsInfo = layer.getWallsInfo();

        for (var i = 0; i < wallsInfo.length; ++i) {

            if(!wallsInfo[i])
            {
                continue;
            }
            
            if(materialIndex == wallsInfo[i].materialIndex)
            {
                wallIndex = i;
                for (var j = 0; j < wallsInfo[i].imagesInfo.length; ++j) {
                    var imageInfo = wallsInfo[i].imagesInfo[j];

                    var centerPointUvCoordNormalized = imageInfo.centerPoint.uvCoordsNormalized;
                    
                    if(!(centerPointUvCoordNormalized))
                    {
                        return {wallIndex : -1, imageIndex : -1}
                    }
                    
                    dist = _this.calcDistance(intersectionUvCoord, centerPointUvCoordNormalized);
                    if(dist < minDist)
                    {
                        minDist = dist;
                        imageIndex = j;
                    }
                }
            }
        }

        return {wallIndex : wallIndex, imageIndex : imageIndex}
    };

    this.addSegmentVertex = function (point) {
        var vector1 = new THREE.Vector3(point.worldcoords.x, point.worldcoords.y, point.worldcoords.z);
        return vector1;
    };

    this.addImageBoundaries = function (imageInfo) {
        var imageFilename = imageInfo.imageFilename;

        var vertices = [];
        var vertex1 = this.addSegmentVertex(imageInfo.tlPoint);
        vertices.push(vertex1);

        var vertex = this.addSegmentVertex(imageInfo.trPoint);
        vertices.push(vertex);
        vertices.push(vertex);

        vertex = this.addSegmentVertex(imageInfo.brPoint);
        vertices.push(vertex);
        vertices.push(vertex);

        vertex = this.addSegmentVertex(imageInfo.blPoint);
        vertices.push(vertex);
        vertices.push(vertex);

        vertices.push(vertex1);

        return vertices;
    };
    
    this.addImagesBoundaries = function (imagesInfo) {
        var vertices1 = [];

        for (var i = 0; i < imagesInfo.length; ++i) {
            var vertices2 = _this.addImageBoundaries(imagesInfo[i]);
            vertices1.push.apply(vertices1, vertices2)
        }

        return vertices1;
    };
    
    this.overlayWallImageBoundariesOn3dModel = function (imageInfo) {

        _selectedImageGeometry = new THREE.Geometry();

        _selectedImageGeometry.vertices = _this.addImageBoundaries(imageInfo);
        _selectedImageGeometry.colorsNeedUpdate = true;
        _selectedImageGeometry.verticesNeedUpdate = true;
        _selectedImageGeometry.needsUpdate = true;

        // _scene.remove( _selectedImageLineSegments );
        if (_selectedImageLineSegments) {
            _scene.remove( _selectedImageLineSegments )
            // _selectedImageLineSegments.dispose();
            // _selectedImageLineSegments = null;
            delete _selectedImageLineSegments;
        }

        _selectedImageLineSegments = new THREE.LineSegments( _selectedImageGeometry, _materialBlue );
        _selectedImageLineSegments.material.needsUpdate = true;
        _scene.add( _selectedImageLineSegments )
        
        _renderer.render(_scene, _camera);
    };

    this.overlayWallsImagesBoundariesOn3dModel = function (layer) {

        
        var vertices1 = [];
        _selectedImageGeometry2 = new THREE.Geometry();
        var materialForSelectedLine = layer.getMaterialForSelectedLine();
        
        var wallsInfo = layer.getWallsInfo();

        for (var i = 0; i < wallsInfo.length; ++i) {

            var vertices2 = _this.addImagesBoundaries(wallsInfo[i].imagesInfo);
            vertices1.push.apply(vertices1, vertices2)
        }
        _selectedImageGeometry2.vertices = vertices1;

        if (_selectedImageLineSegments2) {
            _scene.remove( _selectedImageLineSegments2 )
            delete _selectedImageLineSegments2;
        }
        _selectedImageLineSegments2 = new THREE.LineSegments( _selectedImageGeometry2, materialForSelectedLine );
        _scene.add( _selectedImageLineSegments2 )
    }

    this.getIntersectionLayer = function (intersectionSceneChildUuid) {

        var iter = _layers.iterator();

        // Iterating over all the layers
        while (iter.hasNext()) {
            var layer = iter.next();
            var objInstanceUuid = layer.getObjInstanceUuid();
            
            if(objInstanceUuid === intersectionSceneChildUuid)
            {
                return layer;
            }
        }
        
        // shouldn't reach here
        console.error("Did not find a layer for the intersection");

        {
            console.log('_scene.children', _scene.children);
            console.log('_scene', _scene);
            console.log('intersectionSceneChildUuid bar3', intersectionSceneChildUuid); 
            console.log('_layers.size()', _layers.size());

            let iter2 = _layers.iterator();
            while (iter2.hasNext()) {
                let layer2 = iter2.next();
                console.error('objInstanceUuid', layer2.getObjInstanceUuid());
            }
        }
        
        return;
    }

    this.loadTheSelectedImageAndRender = function (intersectionLayer, wallIndex, imageIndex) {

        /////////////////////////////////////////////////////////////////
        // overlay closest image boundaries on 3d model in blue
        /////////////////////////////////////////////////////////////////

        var wallsInfo = intersectionLayer.getWallsInfo();
        
        if(!wallsInfo[wallIndex])
        {
            return false;
        }
        
        var imageInfo = wallsInfo[wallIndex].imagesInfo[imageIndex];

        // e.g. 
        // "room1/wall1/IMG_6841.JPG"
        // ./floor0/wall_9/flatten_canvas.resized.jpg
        var materialName = wallsInfo[wallIndex].materialName;

        // |room1.*/|
        // room1/wall1/wall_fused.jpg -> room1/wall1/

        // var reg = /room1.*\//g;
        // var matches = materialName.match(reg);

        // var wallDir = matches[0];
        
        // Remove the filename in the directory (e.g. ./floor0/wall_9/flatten_canvas.resized.jpg -> ./floor0/wall_9)
        //
        // https://stackoverflow.com/questions/7601674/id-like-to-remove-the-filename-from-a-path-using-javascript?rq=1
        // '/this/is/a/folder/'
        // var urlstr = '/this/is/a/folder/aFile.txt';
        var regexp1 = /[^\/]*$/;
        var wallDir = materialName.replace(regexp1, '');

        // // Remove the leading "./" in the directory (e.g. ./floor0/wall_9 -> floor0/wall_9)
        // var regexp2 = /^\.\//;
        // wallDir = wallDir.replace(regexp2, '');

        var imageFilename = imageInfo.imageFilename;
        _selectedImageFilename = imageFilename;

        var blobs = _this.getBlobs();
        if(blobs[imageFilename])
        {
            // The file already exists in memory. Load it from the memory and render
            MLJ.core.MeshFile.loadTexture2FromFile(blobs[imageFilename]);
        }
        else
        {
            // The file is not yet in memory.
            var zipLoaderInstance = _this._zipLoaderInstance;
            var offsetInReader = zipLoaderInstance.files[imageFilename].offset;
            if(offsetInReader > 0)
            {
                // The file is not yet in memory, but its offset is stored in memory.
                // Load the file from the zip file into memory and render
                // unzip the image files of specific wall (that were skipped in the initial load)
                var doSkipJPG = false;
                ZipLoader.unzip( _this._zipFileArrayBuffer, doSkipJPG, offsetInReader ).then( function ( zipLoaderInstance ) {
                    zipLoaderInstance2 = MLJ.core.MeshFile.addImageToBlobs(zipLoaderInstance);
                    MLJ.core.MeshFile.loadTexture2FromFile(blobs[imageFilename]);
                });
            }
        }

        // Overlay the selected file boundary in blue                    
        _this.overlayWallImageBoundariesOn3dModel(imageInfo);

        return true;
    }
    
    this.findIntersections = function () {

        // BEG from example2_objLoader_raycasting.js
        if(firstTime2)
        {
            _camera.position.x = 2205;
            _camera.position.y = 569;
            _camera.position.z = 572;
            
            _camera.updateMatrixWorld();
            firstTime2 = false;
        }
        
        _raycaster.setFromCamera( _mouse, _camera );

        var intersects = _raycaster.intersectObjects( _scene.children, true );
        
        if ( intersects.length > 0 ) {

            var intersection = intersects[0];
            var faceIndex = intersection.faceIndex / 3;
            var materialIndex1 = Math.floor(faceIndex/2);
            var indexInMaterialIndices = faceIndex;
            var materialIndex = materialIndex1;
            var intersectionObj = intersection.object;
            
            var intersectionSceneChildUuid = intersectionObj.parent.uuid;

            var intersectionLayer = _this.getIntersectionLayer(intersectionSceneChildUuid);
            if(intersectionLayer === undefined)
            {
                console.error('intersectionLayer is undefined');
                // console.error('_scene.children', _scene.children);
                // console.error('intersectionObj.parent.uuid', intersectionObj.parent.uuid);
                // console.error('intersectionObj', intersectionObj);
                return;
            }
            
            // geom has "type: "BufferGeometry""
            var geom = intersectionObj.geometry;
            var groupIndex = Math.floor(intersection.faceIndex / 6);
            var intersectionUvCoord = intersection.uv;

            if(doEnableOverlayImageBoundaries)
            {
                /////////////////////////////////////////////////////////////
                // Calc the nearest image to the point
                /////////////////////////////////////////////////////////////

                // _selectedLayer = intersectionLayer;
                var retVal = _this.calcNearestImage(intersectionLayer, faceIndex, materialIndex, intersectionUvCoord);
                _selectedWallIndex = retVal.wallIndex;
                _selectedImageIndex = retVal.imageIndex;
            }
            
            // if ( ( intersectionPrev != intersectionObj ) ||
            //      ((intersectionPrev != null) && (intersectionPrev.materialIndex != materialIndex)) )

            if ( ( intersectionPrev != intersectionObj ) ||
                 ((intersectionPrev != null) && (intersectionPrev.materialIndex != materialIndex)) ||
                 (_selectedWallIndex != wallIndexPrev) || (_selectedImageIndex != imageIndexPrev) )
            {

                if ( intersectionPrev  && intersectionPrev.material[intersectionPrev.materialIndex])
                {
                    intersectionPrev.material[intersectionPrev.materialIndex].emissive.setHex( intersectionPrev.currentHex );
                }

                intersectionPrev = intersectionObj;
                wallIndexPrev = _selectedWallIndex;
                imageIndexPrev = _selectedImageIndex;
                
                if(intersectionPrev.material[materialIndex])
                {
                    intersectionPrev.currentHex = intersectionPrev.material[materialIndex].emissive.getHex();
                }
                intersectionPrev.materialIndex = materialIndex;
                intersectionPrev.material[materialIndex].emissive.setHex( 0xff0000 );

                if(doEnableOverlayImageBoundaries)
                {
                    /////////////////////////////////////////////////////////////////
                    // overlay closest image boundaries on 3d model in blue
                    // Load the file, render the image, and render the image boundary
                    ///////////////////////////////////////////////

                    let retval = _this.loadTheSelectedImageAndRender(intersectionLayer, _selectedWallIndex, _selectedImageIndex);
                    if(retval == false)
                    {
                        return;
                    }
                    
                }
            }
            
        } else {

            if ( intersectionPrev  && intersectionPrev.material[intersectionPrev.materialIndex])
            {
                intersectionPrev.material[intersectionPrev.materialIndex].emissive.setHex( intersectionPrev.currentHex );
            }
            intersectionPrev = null;
        }
    }

    this.render = function (fromReqAnimFrame) {

        // if(_controls.isKeyDown)
        {
            /////////////////////////////////////////////////////////////////
            // find intersections
            /////////////////////////////////////////////////////////////////

            _this.findIntersections();
        }

        // END from example2_objLoader_raycasting.js

        _renderer.render(_scene, _camera);

        // render the 2D overlays
        _renderer.autoClear = false;
        _renderer.render(_scene2D, _camera2D);
        _renderer.autoClear = true;
        
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
