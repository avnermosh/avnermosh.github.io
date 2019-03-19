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

var globalIndex = 0;

if(MLJ.core.Model.isScene3DpaneEnabled())
{

    (function () {
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
        
        var _doDisableRotateUpIn_3D = true;

        ////////////////////////////////////////////////////
        // OverlayRect
        ////////////////////////////////////////////////////
        
        var _editOverlayRect_Scene3D_TrackballControls;

        var _selectedOverlayVertexHelperGroup = new THREE.Object3D();
        _selectedOverlayVertexHelperGroup.name = "_selectedOverlayVertexHelperGroup";

        var _intersectedStructureInfo = new IntersectionInfo({intersectionLayer: undefined});
        var _intersectedOverlayRectInfo = new IntersectionInfo({intersectionLayer: undefined});
        var _intersectedOverlayVertexInfo = new IntersectionInfo({intersectionLayer: undefined});
        
        
        ////////////////////////////////////////////////////
        // Helpers
        ////////////////////////////////////////////////////
        
        var _originAxisHelper;

        // x-red - directed right (on the screen), y-green directed up (on the screen), z-blue directed towards the camera
        var _axesHelper1;
        
        var _camera3DOffsetFromOrigin = new THREE.Vector3();
        
        ////////////////////////////////////////////////////
        // Other stuff
        ////////////////////////////////////////////////////

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

            globalIndex += 1;
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

        function createVertexFromPoint(point) {
            var vector1 = new THREE.Vector3(point.worldcoords.x, point.worldcoords.y, point.worldcoords.z);
            return vector1;
        };
        
        
        function initScene() {

            ////////////////////////////////////////////////////
            // 3D
            ////////////////////////////////////////////////////
            
            _scene3D = new THREE.Scene();

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

            _originAxesHelper = new THREE.AxesHelper(10);
            _originAxesHelper.material.linewidth = 5000;
            _scene3D.add(_originAxesHelper);

            _axesHelper1 = new THREE.AxesHelper(4);
            _axesHelper1.material.linewidth = 10;
            _scene3D.add(_axesHelper1);

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
            _doDisableRotateUpIn_3D = true;
            if(_doDisableRotateUpIn_3D)
            {
                _controls3D.minPolarAngle = Math.PI/2; // radians
                _controls3D.maxPolarAngle = Math.PI/2; // radians
            }
            else
            {
                // TBD - Add ceiling and ground rotate scene 360 deg
                _controls3D.minPolarAngle = 0; // radians
                _controls3D.maxPolarAngle = Math.PI; // radians
            }

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

            _controls3D.enablePan = false;
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
                // for the scene3D and topDownScene3D pane
                console.log('User doubletapped #myElement');
                // onDocumentTouchDoubleTap(event);
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

        }

        this.lights = {
            AmbientLight: null,
            Headlight: null
        };

        this.resizeCanvas = function () {
            console.log('BEG Scene3D resize'); 
            var size3D = get3DSize();
            _camera3D.aspect = size3D.width / size3D.height;
            _camera3D.updateProjectionMatrix();
            _renderer3D.setSize(size3D.width, size3D.height);
            let pixelRatio = _renderer3D.getPixelRatio();
            // console.log('pixelRatio', pixelRatio); 
            _camera2D.left = size3D.width / size3D.height;
            _camera2D.updateProjectionMatrix;
            
            MLJ.core.Scene3D.render();
        };

        this.removeFromScene3D = function (obj) {
            _scene3D.remove( obj );
        };

        this.setEdit3dModelControl = function (pivotGroup, structureMeshGroup, overlayMeshGroup) {
            _editOverlayRect_Scene3D_TrackballControls = new THREE.EditOverlayRect_Scene3D_TrackballControls( pivotGroup,
                                                                                                              structureMeshGroup,
                                                                                                              overlayMeshGroup,
                                                                                                              _selectedOverlayVertexHelperGroup,
                                                                                                              _camera3D,
                                                                                                              _renderer3D.domElement );
        };
        
        this.getIntersectionStructureInfo = function () {
            return _intersectedStructureInfo;    
        }

        this.getIntersectionOverlayRectInfo = function () {
            return _intersectedOverlayRectInfo;    
        }

        this.getIntersectionOverlayVertexInfo = function () {
            return _intersectedOverlayVertexInfo;    
        }
        
        this.insertRectangularMesh = function () {
            // console.log('BEG insertRectangularMesh');

            let intersectedStructureCurrent = MLJ.util.getNestedObject(_intersectedStructureInfo, ['currentIntersection']);
            if( intersectedStructureCurrent == undefined)
            {
                console.log('No intersection found');
                return;
            }

            let structureRectangleVertices = MLJ.core.Scene3D.getRectangleVertices(intersectedStructureCurrent);

            let selectedLayer = MLJ.core.Model.getSelectedLayer();
            selectedLayer.createRectangleMesh(structureRectangleVertices);
            _this.findIntersections();

            return false;
        };

        this.initOverlayRectVertexHelpers = function () {

            // create vertexHelpers - create spheres around the corners
            var sphere=new THREE.Mesh(
                new THREE.SphereGeometry(20),
                new THREE.MeshBasicMaterial({color:MLJ.util.blueColor})
            );
            sphere.name = "sphere";

            // Create array of spheres, one for each corner
            var overlayRectDummy = new THREE.Mesh(
                new THREE.PlaneGeometry(3, 2, 1, 1),
                new THREE.MeshLambertMaterial({color:MLJ.util.islamicGreenColor,transparent:true})
            );
            overlayRectDummy.name = "overlayRectDummy";

            
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

            _axesHelper1.position.copy( position );
            // _originAxesHelper.position.copy( position );

            let selectedLayer = MLJ.core.Model.getSelectedLayer();
            let pivotGroup = selectedLayer.getPivotGroup();
            // restore pivotGroup position to previous position
            pivotGroup.position.add(positionPrev);
            
            positionPrev.copy( position );
            // update pivotGroup position to new position
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

        this.isDisableRotateUpIn_3D = function () {
            return _doDisableRotateUpIn_3D;
        };

        
        this.enableControls3D = function (doEnableControls3D) {
            if(doEnableControls3D)
            {
                _controls3D.enabled = false;
            }
            else
            {
                _controls3D.enabled = true;
            }
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
        
        var plane = new THREE.PlaneBufferGeometry(2, 2);
        var quadMesh = new THREE.Mesh(
            plane
        );
        quadMesh.name = "quadMesh";

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

                var rectangleVertices = {};
                rectangleVertices["tlPoint"] = v0;
                rectangleVertices["trPoint"] = v1;
                rectangleVertices["brPoint"] = v2;
                rectangleVertices["blPoint"] = v5;

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

        
        this.getLayerIntersectionsInfo = function (intersects)
        {
            // console.log('BEG getLayerIntersectionsInfo');
            
            let intersectedStructureFound = false;
            let intersectedOverlayRectFound = false;
            let intersectedOverlayVertexFound = false;

            for (var i = 0; i < intersects.length; i++)
            {
                var intersectionCurr = intersects[i];
                if(intersectionCurr.object.type == "Mesh")
                {
                    // Iterating over all the layers
                    let layers = MLJ.core.Model.getLayers();
                    var iter = layers.iterator();
                    while (iter.hasNext()) {
                        var layer = iter.next();
                        let structureMeshGroup = layer.getStructureMeshGroup();

                        // TBD verify that intersectedStructureObject, intersectedOverlayRectObject refer to the same layer
                        var intersectionCurr_object_id = MLJ.util.getNestedObject(intersectionCurr, ['object', 'id']);

                        // Assuming that the intersection results are sorted by distance
                        if(!intersectedStructureFound)
                        {
                            // Didn't find a structure intersection before so check if the intersectionCurr_object_id refers to a structure 
                            // object
                            let intersectedStructureObject = structureMeshGroup.getObjectById(intersectionCurr_object_id);
                            if(intersectedStructureObject)
                            {
                                intersectedStructureFound = true;
                                _intersectedStructureInfo.intersectionLayer = layer;
                                _intersectedStructureInfo.currentIntersection = intersectionCurr;
                                break;
                            }
                        }

                        if(!intersectedOverlayVertexFound)
                        {
                            // Didn't find an overlay vertex intersection before so check if the intersectionCurr_object_id refers to a overlay vertex 
                            // object
                            var overlayMeshGroup = layer.getOverlayMeshGroup();
                            var intersectedOverlayVertexObject = _selectedOverlayVertexHelperGroup.getObjectById(intersectionCurr_object_id);
                            if(intersectedOverlayVertexObject)
                            {
                                intersectedOverlayVertexFound = true;
                                _intersectedOverlayVertexInfo.currentIntersection = intersectionCurr;

                                var userData_intersectedOverlayRectObjectId = MLJ.util.getNestedObject(_selectedOverlayVertexHelperGroup, ['userData', 'intersectedOverlayRectObjectId']);
                                if(userData_intersectedOverlayRectObjectId)
                                {
                                    let intersectedOverlayRectObject = overlayMeshGroup.getObjectById(userData_intersectedOverlayRectObjectId);
                                    if(intersectedOverlayRectObject)
                                    {
                                        intersectedOverlayRectFound = true;
                                        _intersectedOverlayRectInfo.intersectionLayer = layer;

                                        _intersectedOverlayRectInfo.currentIntersection = {object: null};
                                        _intersectedOverlayRectInfo.currentIntersection.object = intersectedOverlayRectObject;
                                        
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
                            // Didn't find an overlay rect intersection before so check if the intersectionCurr_object_id refers to a overlay rect 
                            // object
                            var overlayMeshGroup = layer.getOverlayMeshGroup();
                            var intersectedOverlayRectObject = overlayMeshGroup.getObjectById(intersectionCurr_object_id);
                            if(intersectedOverlayRectObject)
                            {
                                intersectedOverlayRectFound = true;
                                _intersectedOverlayRectInfo.intersectionLayer = layer;
                                _intersectedOverlayRectInfo.currentIntersection = intersectionCurr;

                                ///////////////////////////////////////
                                // update _selectedOverlayVertexHelperGroup to refer
                                // to _intersectedOverlayRectInfo.currentIntersection
                                ///////////////////////////////////////

                                if ( _intersectedOverlayRectInfo.currentIntersection.object.geometry instanceof THREE.BufferGeometry ) {
                                    
                                    var rectangleVerticesArray = _this.getRectangleVerticesAsArray(_intersectedOverlayRectInfo.currentIntersection);
                                    
                                    for(let j=0;j<rectangleVerticesArray.length;j++)
                                    {
                                        var vertexPosition = rectangleVerticesArray[j];
                                        _selectedOverlayVertexHelperGroup.children[j].position.copy(vertexPosition);
                                    }
                                }
                                else if ( _intersectedOverlayRectInfo.currentIntersection.object.geometry instanceof THREE.Geometry ) {
                                    for(let j=0;j<_intersectedOverlayRectInfo.currentIntersection.object.geometry.vertices.length;j++)
                                    {
                                        let vertex = _intersectedOverlayRectInfo.currentIntersection.object.geometry.vertices[j];
                                        _selectedOverlayVertexHelperGroup.children[j].position.copy(vertex);
                                    }
                                }
                                else
                                {
                                    console.error('Invalid _intersectedOverlayRectInfo.currentIntersection.object.geometry'); 
                                }

                                _selectedOverlayVertexHelperGroup.userData["intersectedOverlayRectObjectId"] = _intersectedOverlayRectInfo.currentIntersection.object.id;
                                break;
                            }
                        }

                        
                    }

                }
                else
                {
                    // Can get here e.g. if intersecting with LineSegments
                    // console.log('Intersection is not a mesh'); 
                }
            }

            if(_intersectedStructureInfo.currentIntersection && _intersectedOverlayRectInfo.currentIntersection)
            {
                ////////////////////////////////////////////////////////////////
                // verify that intersectedStructureObject, intersectedOverlayRectObject
                // refer to the same wall (distance should be the same)
                ////////////////////////////////////////////////////////////////

                let diffDist = _intersectedStructureInfo.currentIntersection.distance - _intersectedOverlayRectInfo.currentIntersection.distance;
                let epsilon = 1E-3;
                if(Math.abs(diffDist) > epsilon)
                {
                    if(diffDist < 0)
                    {
                        // Ommit data related to _intersectedOverlayRectInfo.currentIntersection
                        // because _intersectedOverlayRectInfo.currentIntersection belongs to a different (further) wall
                        _intersectedOverlayRectInfo.currentIntersection = undefined;
                    }
                    else
                    {
                        // Sanity check
                        // Shouldn't reach this situation where overlayRect belongs to a closer wall relative to the intersectedStructure
                        console.error('The intersectedOverlayRect.distance is smaller than the intersectedStructure.distance');
                        console.error('which is impossible since there should be a structure wherever there is overlayRect');
                        console.log('_intersectedStructureInfo', _intersectedStructureInfo); 
                        console.log('_intersectedOverlayRectInfo', _intersectedOverlayRectInfo); 
                        throw 'Reached failure condition: "diffDist > 0"';
                    }
                }
            }

            return;
        };

        
        this.highlightIntersectionElements = function () {

            // Manage intersectedStructure
            _intersectedStructureInfo.highlightIntersection(MLJ.util.redColor);

            if(_intersectedOverlayVertexInfo.currentIntersection ||
               _intersectedOverlayVertexInfo.previousIntersection)
            {
                // Manage intersectedOverlayVertex
                _intersectedOverlayVertexInfo.highlightIntersection(MLJ.util.greenColor);
            }

        };
        

        this.findIntersections = function () {

            // console.log('BEG findIntersections');

            ///////////////////////////////////////////////
            // Intersect with the center of window (mouse at 0,0)
            ///////////////////////////////////////////////

            var scene3dWindowCenter = new THREE.Vector2();
            _raycaster.setFromCamera( scene3dWindowCenter, _camera3D );
            
            // tracing a ray from the camera to the center of the screen.
            let selectedLayer = MLJ.core.Model.getSelectedLayer();
            let pivotGroup = selectedLayer.getPivotGroup();
            // console.log('pivotGroup.children[0].children[0].children[0].name', pivotGroup.children[0].children[0].children[0].name); 
            // console.log('pivotGroup.children[0].children[0].children[0].geometry.boundingBox.min', pivotGroup.children[0].children[0].children[0].geometry.boundingBox.min);
            // console.log('pivotGroup.children[0].children[0].children[0].geometry.boundingBox.max', pivotGroup.children[0].children[0].children[0].geometry.boundingBox.max);
            
            let cameraLookAtIntersects = _raycaster.intersectObjects( pivotGroup.children, true );

            let cameraLookAtIntersectionPoint = new THREE.Vector3();
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

            // Reset any previous intersection info before finding a new one
            _intersectedStructureInfo.clearCurrentIntersection();
            _intersectedOverlayRectInfo.clearCurrentIntersection();
            _intersectedOverlayVertexInfo.clearCurrentIntersection();
            
            this.getLayerIntersectionsInfo(intersects);

            if(_intersectedStructureInfo.currentIntersection)
            {
                ///////////////////////////////////////////////
                // Update the scene3D intersection points in Scene3DtopDown
                ///////////////////////////////////////////////

                MLJ.core.Scene3DtopDown.setScene3DintersectionPoint(cameraLookAtIntersectionPoint,
                                                                    _intersectedStructureInfo.currentIntersection.point);
            }

            // Highlight the intersection elements, e.g. intersectedStructure, intersectedOverlay, intersectedOverlayVertex
            this.highlightIntersectionElements();

            ///////////////////////////////////////////////
            // Manage intersectedOverlayRect
            ///////////////////////////////////////////////

            selectedLayer.setSelectedImageInfo(_intersectedOverlayRectInfo);

            _intersectedOverlayRectInfo.highlightIntersection(MLJ.util.yellowColor);

        };


        this.render = function (fromReqAnimFrame) {

            //         console.log('_controls3D.isMouseDown', _controls3D.isMouseDown);
            //         console.log('_controls3D.isTouchDown', _controls3D.isTouchDown);
            
            let editOverlayRect_Scene3D_TrackballControlsIsMouseDown = undefined;
            if(_editOverlayRect_Scene3D_TrackballControls)
            {
                editOverlayRect_Scene3D_TrackballControlsIsMouseDown = _editOverlayRect_Scene3D_TrackballControls.isMouseDown;
            }
            if((_controls3D.isMouseDown || _controls3D.isTouchDown ||
                editOverlayRect_Scene3D_TrackballControlsIsMouseDown ))
            {
                _this.findIntersections();
            }

            let selectedLayer = MLJ.core.Model.getSelectedLayer();
            if(selectedLayer)
            {
                // experiment with rotation through automatic changes to position/rotation

                // let pivotGroup = selectedLayer.getPivotGroup();
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
                // console.log('_axesHelper1.position', _axesHelper1.position);
                // console.log('_originAxesHelper.position', _originAxesHelper.position);
            }
            
            _renderer3D.render(_scene3D, _camera3D);

            // render the 2D overlays
            _renderer3D.autoClear = false;
            _renderer3D.render(_scene2D, _camera2D);
            _renderer3D.autoClear = true;
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

}
