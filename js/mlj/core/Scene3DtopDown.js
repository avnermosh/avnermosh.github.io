////////////////////////////////////////////////////////////////
//
// The scene file is the main container for the application
// In the threejs examples there are e.g. scene, camera, light, renderer in the main html file
// The MLJ.core.Scene3DtopDown class stores such telements
//
////////////////////////////////////////////////////////////////

MLJ.core.Scene3DtopDown = {};
MLJ.core.Scene3DtopDown.timeStamp = 0;

const heightOffset = 1000;
const camera3DtopDownHeight = 2000;
var camera3DtopDownPosition0 = new THREE.Vector3(643, camera3DtopDownHeight, 603);

(function () {
    var _scene3DtopDown;
    var _camera3DtopDown;
    var _controls3DtopDown;
    var _renderer3DtopDown;
    var _group3DtopDown;
    var _mouse3DtopDown = new THREE.Vector2();
    var _bbox;
    
    // _selectedFloorInfo = {"mesh", "height", "floorName"}
    var _selectedFloorInfo;
    
    var _raycaster3DtopDown;

    var _this = this;

    ////////////////////////////////////////////////////
    // Helpers
    ////////////////////////////////////////////////////

    // _cube_camera3D - position of the camera in the 2dPane
    var _cube_camera3D;

    var _axisHelperIntersection;
    var _arrowCameraDirection;
    
    var _intersectionPointCurr = new THREE.Vector3();
    var _intersectionPointPrev = new THREE.Vector3();

    // intersection of the scene3D camera lookAt direction with the wall,
    // i.e. intersection point for scene3D center of window, mouse at (0,0)
    var _cube_scene3DcameraLookAtIntersectionPoint;

    // intersection of the mouse intersection with the wall,
    var _cube_scene3DcameraMouseIntersectionPoint;

    var globalIndex = 0;
    ////////////////////////////////////////////////////
    // Other stuff
    ////////////////////////////////////////////////////

    function onDocumentTouchMove3DtopDown( event ) {
        // console.log('BEG onDocumentTouchMove3DtopDown'); 
        if(_controls3DtopDown.isTouchDown)
        {
            event.preventDefault();

            console.log('event.touches.length', event.touches.length); 
            if( event.touches.length > 0 )
            {
                _mouse3DtopDown.x = ( ( event.touches[0].clientX - get3DtopDownOffset().left - _renderer3DtopDown.domElement.offsetLeft ) /
                                      _renderer3DtopDown.domElement.clientWidth ) * 2 - 1;
                
                _mouse3DtopDown.y = - ( ( event.touches[0].clientY - get3DtopDownOffset().top - _renderer3DtopDown.domElement.offsetTop ) /
                                        _renderer3DtopDown.domElement.clientHeight ) * 2 + 1;

            }
            
            MLJ.core.Scene3DtopDown.render();
        }
    }

    function onDocumentMouseMove3DtopDown( event ) {
        // console.log('Beg onDocumentMouseMove3DtopDown'); 
        if(_controls3DtopDown.isMouseDown)
        {
            event.preventDefault();

            _mouse3DtopDown.x = ( ( event.clientX - get3DtopDownOffset().left - _renderer3DtopDown.domElement.offsetLeft ) /
                                  _renderer3DtopDown.domElement.clientWidth ) * 2 - 1;
            
            _mouse3DtopDown.y = - ( ( event.clientY - get3DtopDownOffset().top - _renderer3DtopDown.domElement.offsetTop ) /
                                    _renderer3DtopDown.domElement.clientHeight ) * 2 + 1;

        // console.log('_mouse3DtopDown', _mouse3DtopDown);
            
            MLJ.core.Scene3DtopDown.render();
        }
    }


    function onDocumentMouseUp3DtopDown( event ) {
        // console.log('BEG onDocumentMouseUp3DtopDown');
        
        event.preventDefault();

        MLJ.core.Scene3DtopDown.render();
    }

    
    function get3DtopDownSize() {
        var _3DtopDown = $('#_3DtopDown');

        return {
            width: _3DtopDown.innerWidth(),
            height: _3DtopDown.innerHeight()
        };
    }
    
    function get3DtopDownOffset() {
        var _3DtopDown = $('#_3DtopDown');

        return {
            left: _3DtopDown.offset().left,
            top: _3DtopDown.offset().top
        };
    }

    //SCENE INITIALIZATION  ________________________________________________________

    
    function animate() {
        requestAnimationFrame( animate );
        _controls3DtopDown.update();
        MLJ.core.Scene3DtopDown.render();
    }
    
    function resizeCanvas1() {
        // console.log('BEG Scene3DtopDown resizeCanvas1');
        
        let size3DtopDown = get3DtopDownSize();
        // w0, h0 - the size of the gui window
        let w0 = size3DtopDown.width;
        let h0 = size3DtopDown.height;

        //////////////////////////////////////////////////////////
        // Set the aspect ratio of _camera3DtopDown
        //////////////////////////////////////////////////////////

        if(_selectedFloorInfo)
        {
            _bbox = new THREE.Box3().setFromObject(_selectedFloorInfo["mesh"]);
            // _bbox = _selectedFloorInfo["mesh"].bBox;

            _bbox.getCenter( _camera3DtopDown.position ); // this re-sets the position
            let height = _selectedFloorInfo["height"] + heightOffset;
            _camera3DtopDown.position.setY(height);
            
            // Update the camera frustum to cover the entire image
            let width1 = (_bbox.max.x - _bbox.min.x) / 2;
            let height1 = (_bbox.max.z - _bbox.min.z) / 2;
            
            _camera3DtopDown.left = -width1;
            _camera3DtopDown.right = width1;
            _camera3DtopDown.top = height1;
            _camera3DtopDown.bottom = -height1;
            _camera3DtopDown.updateProjectionMatrix();

            let mesh_w_h_ratio = width1 / height1;
            _camera3DtopDown.aspect = mesh_w_h_ratio;
            _camera3DtopDown.updateProjectionMatrix();

            //////////////////////////////////////////////////////////
            // Set canvas width / height
            // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
            // Set the width and height to be such that the entire pane is used for drawing
            // and set the zoom factor such that the entire image is seen 
            //////////////////////////////////////////////////////////

            // w1, h1 - the size of the canvas that preserves the aspectRatio of the image. It exceeds the gui window, i.e. w1>=w0, h1>=h0
            //          w1, h1 is also the size of the viewport.
            let guiViewWindowRatio = w0 / h0;
            let w1 = 1;
            let h1 = 1;

            // x2, y2 - offset from the orgin of the gui window for the origin of the canvas and the viewport
            let x2 = 0;
            let y2 = 0;

            // console.log('guiViewWindowRatio', guiViewWindowRatio);
            // console.log('mesh_w_h_ratio', mesh_w_h_ratio); 
            if(guiViewWindowRatio > mesh_w_h_ratio)
            {
                // console.log('foo0'); 
                w1 = w0;
                h1 = w1 / mesh_w_h_ratio;

                // h1 is bigger than h0
                let zoomFactor = h0 / h1;
                _controls3DtopDown.setZoom(zoomFactor);
                _controls3DtopDown.minZoom = zoomFactor;

                x2 = 0;
                y2 = (h1 - h0) / 2;
            }
            else
            {
                // console.log('foo1'); 
                h1 = h0;
                w1 = h1 * mesh_w_h_ratio;

                // w1 is bigger than w0
                let zoomFactor = w0 / w1;
                _controls3DtopDown.setZoom(zoomFactor);
                _controls3DtopDown.minZoom = zoomFactor;

                y2 = 0;
                x2 = (w1 - w0) / 2;
            }
            
            // console.log('_camera3DtopDown.zoom after', _camera3DtopDown.zoom);
            // console.log('guiViewWindowRatio', guiViewWindowRatio); 
            // console.log('size3DtopDown', size3DtopDown);
            // console.log('mesh_w_h_ratio', mesh_w_h_ratio); 
            // console.log('guiViewWindowRatio > mesh_w_h_ratio', (guiViewWindowRatio > mesh_w_h_ratio)); 
            // console.log('w0', w0);
            // console.log('h0', h0);
            // console.log('w1', w1);
            // console.log('h1', h1);
            // console.log('w1/h1', w1/h1);
            
            _renderer3DtopDown.setSize(size3DtopDown.width, size3DtopDown.height);

            //////////////////////////////////////////////////////////
            // Set viewport
            // https://threejs.org/docs/#api/en/renderers/WebGLRenderer.setViewport
            //////////////////////////////////////////////////////////

            let currentViewport1 = _renderer3DtopDown.getCurrentViewport();

            // proportions ok, fills window ok, offset - ok
            _renderer3DtopDown.setViewport ( -x2, -y2, w1, h1 );
        }
        

        
    }

    function initScene3DtopDown() {

        ////////////////////////////////////////////////////
        // 3DtopDown
        ////////////////////////////////////////////////////
        
        //////////////////////////////////////
        // Set camera related parameters
        //////////////////////////////////////

        _scene3DtopDown = new THREE.Scene();

        // https://discourse.threejs.org/t/does-change-in-camera-position-impact-the-left-top-right-and-bottom-parameters-of-orthographic-camera/5501
        // left,right,top,bottom are in world units, i.e. for OrthographicCamera: leftBorderX = camera.position.x + (camera.left / camera.zoom);
        //
        // left,right,top,bottom (-50, 50, 50, -50) goes together with planeMesh.scale (100, 100, 1)
        // because the vertices of planeMesh.geometry.attributes.position.data.array which is of type THREE.Sprite are normalized (-0.5 - 0.5)
        // then the combination of left,right,top,bottom (-50, 50, 50, -50), and planeMesh.scale (100, 100, 1) fills in the entire window
        // for combination of left,right,top,bottom (-50, 50, 50, -50), and planeMesh.scale (50, 100, 1) the image covers 1/2 of the window on the x axis
        // for combination of left,right,top,bottom (-200, 200, 200, -200), and planeMesh.scale (100, 100, 1) the image covers 1/4 of the window on the x axis, and on the y axis

        // Set camera frustum to arbitrary initial width height
        // These will change later when a selecting a new floor level
        let width1 = 1000 / 2;
        let height1 = 1000 / 2;

        let left = -width1;
        let right = width1;
        let top = height1;
        let bottom = -height1;

        let near = 0.1;
        let far = 100000;
        _camera3DtopDown = new THREE.OrthographicCamera(left, right, top, bottom, near, far);


        let size3DtopDown = get3DtopDownSize();
        let size3DtopDownRatio = size3DtopDown.width / size3DtopDown.height;
        // console.log('size3DtopDownRatio', size3DtopDownRatio); 
        // console.log('size3DtopDown.width3', size3DtopDown.width);

        _camera3DtopDown.aspect = size3DtopDownRatio;
        _camera3DtopDown.updateProjectionMatrix();

        _camera3DtopDown.lookAt( _scene3DtopDown.position );
        _camera3DtopDown.updateMatrixWorld();

        _scene3DtopDown.add(_camera3DtopDown);


        //////////////////////////////////////
        // Set other parameters
        //////////////////////////////////////

        _group3DtopDown = new THREE.Object3D();
        _scene3DtopDown.add(_group3DtopDown);

        _raycaster3DtopDown = new THREE.Raycaster();

        //////////////////////////////////////
        // Set _renderer3DtopDown related parameters
        //////////////////////////////////////

        _renderer3DtopDown = new THREE.WebGLRenderer();
        _renderer3DtopDown.domElement.id = 'canvas3DtopDown';
        _renderer3DtopDown.setPixelRatio(window.devicePixelRatio);
        _renderer3DtopDown.setSize(size3DtopDown.width, size3DtopDown.height);
        // console.log('size3DtopDown.width1', size3DtopDown.width);
        
        $('#_3DtopDown').append(_renderer3DtopDown.domElement);
        
        ////////////////////////////////////////////////////
        // Helpers
        ////////////////////////////////////////////////////
        
        // https://sites.google.com/site/threejstuts/home/polygon_offset
        // When both parameters are negative, (decreased depth), the mesh is pulled towards the camera (hence, gets in front).
        // When both parameters are positive, (increased depth), the mesh is pushed away from the camera (hence, gets behind).
        // order from far to near:
        // floorInfo["mesh"] (polygonOffsetUnits = 4, polygonOffsetFactor = 1)
        // _axisHelperIntersection (polygonOffsetUnits = -4, polygonOffsetFactor = -1)
        // _cube_camera3D (red cube) (polygonOffsetUnits = -6, polygonOffsetFactor = -1)
        // _cube_scene3DcameraMouseIntersectionPoint (orange cube) (polygonOffsetUnits = -8, polygonOffsetFactor = -1)
        // _cube_scene3DcameraLookAtIntersectionPoint (yellow cube) (polygonOffsetUnits = -9, polygonOffsetFactor = -1)
        

        
        _axisHelperIntersection = new THREE.AxesHelper(500);
        _axisHelperIntersection.material.linewidth = 20;
        _axisHelperIntersection.material.polygonOffset = true;
        _axisHelperIntersection.material.polygonOffsetUnits = -4;
	// _axisHelperIntersection more in front, compared to e.g. _selectedFloorInfo["mesh"]
        _axisHelperIntersection.material.polygonOffsetFactor = -1;
        
        _scene3DtopDown.add(_axisHelperIntersection);

        // Set _cube_camera3D - position of the camera in the 2dPane
        let cubeWidth = 80;
        let cubeHeight = 80;
        let cubeDepth = 80;
        
        var geometry1 = new THREE.BoxGeometry( cubeWidth, cubeHeight, cubeDepth );
        var material1 = new THREE.MeshBasicMaterial( {color: MLJ.util.redColor} );
        _cube_camera3D = new THREE.Mesh( geometry1, material1 );
        _cube_camera3D.position.set( 0, 0, 0 );
        _cube_camera3D.material.polygonOffset = true;
        _cube_camera3D.material.polygonOffsetUnits = -6;
	// _cube_camera3D more in front, compared to e.g. _selectedFloorInfo["mesh"]
        _cube_camera3D.material.polygonOffsetFactor = -1;
        _scene3DtopDown.add( _cube_camera3D );

        // https://stackoverflow.com/questions/20554946/three-js-how-can-i-update-an-arrowhelper
        var sourcePos = _scene3DtopDown.position;
        sourcePos = new THREE.Vector3(0,0,0);

        var targetPos = _camera3DtopDown.position;
        targetPos = new THREE.Vector3(1000 ,100 , 100);

        var direction = new THREE.Vector3().subVectors(targetPos, sourcePos);
        let arrowLength = direction.length();
        _arrowCameraDirection = new THREE.ArrowHelper(direction.clone().normalize(), sourcePos, arrowLength, 0x00ff00);
        _arrowCameraDirection.line.material.linewidth = 20;
        console.log('_arrowCameraDirection', _arrowCameraDirection);

        _scene3DtopDown.add(_arrowCameraDirection);

        let geometry2 = new THREE.BoxGeometry( cubeWidth, cubeHeight, cubeDepth );
        let material2 = new THREE.MeshBasicMaterial( {color: MLJ.util.yellowColor} );
        _cube_scene3DcameraLookAtIntersectionPoint = new THREE.Mesh( geometry2, material2 );
        _cube_scene3DcameraLookAtIntersectionPoint.position.set( 0, 0, 0 );
        _cube_scene3DcameraLookAtIntersectionPoint.material.polygonOffset = true;
        _cube_scene3DcameraLookAtIntersectionPoint.material.polygonOffsetUnits = -8;
	// _cube_scene3DcameraLookAtIntersectionPoint more in front, compared to e.g. _selectedFloorInfo["mesh"]
        _cube_scene3DcameraLookAtIntersectionPoint.material.polygonOffsetFactor = -1;
        _scene3DtopDown.add( _cube_scene3DcameraLookAtIntersectionPoint );

        let geometry3 = new THREE.BoxGeometry( cubeWidth, cubeHeight, cubeDepth );
        material2 = new THREE.MeshBasicMaterial( {color: MLJ.util.darkOrangeColor} );
        _cube_scene3DcameraMouseIntersectionPoint = new THREE.Mesh( geometry3, material2 );
        _cube_scene3DcameraMouseIntersectionPoint.position.set( 0, 0, 0 );
        _cube_scene3DcameraMouseIntersectionPoint.material.polygonOffset = true;
        _cube_scene3DcameraMouseIntersectionPoint.material.polygonOffsetUnits = -9;
	// _cube_scene3DcameraMouseIntersectionPoint more in front, compared to e.g. _selectedFloorInfo["mesh"]
        _cube_scene3DcameraMouseIntersectionPoint.material.polygonOffsetFactor = -1;
        
        _scene3DtopDown.add( _cube_scene3DcameraMouseIntersectionPoint );

        ////////////////////////////////////////////////////
        // INIT CONTROLS
        ////////////////////////////////////////////////////

        let container3DtopDown = document.getElementById('_3DtopDown');
        _controls3DtopDown = new THREE.OrbitControls3Dpane(_camera3DtopDown, container3DtopDown);

        //////////////////////////////////////
        // Set rotate related parameters
        //////////////////////////////////////

        // No rotation.
        _controls3DtopDown.enableRotate = false;

        // Set the rotation angle (with 0 angle change range) to 0
        // coordinate axis system is:
        // x-red - directed right (on the screen), z-blue directed down (on the screen), y-green directed towards the camera
        _controls3DtopDown.minPolarAngle = 0; // radians
        _controls3DtopDown.maxPolarAngle = 0; // radians

        // No orbit horizontally.
        _controls3DtopDown.minAzimuthAngle = 0; // radians
        _controls3DtopDown.maxAzimuthAngle = 0; // radians

        //////////////////////////////////////
        // Set zoom related parameters
        //////////////////////////////////////

        _controls3DtopDown.enableZoom = true;
        _controls3DtopDown.zoomSpeed = 1.2;
        // _controls3DtopDown.minZoom = 1;
        // _controls3DtopDown.maxZoom = Infinity;

        //////////////////////////////////////
        // Set pan related parameters
        //////////////////////////////////////

        _controls3DtopDown.enablePan = true;
        _controls3DtopDown.panSpeed = 0.6;
        // if true, pan in screen-space
        _controls3DtopDown.screenSpacePanning = true;
        // // pixels moved per arrow key push
        // _controls3DtopDown.keyPanSpeed = 7.0;

        _controls3DtopDown.enableDamping = false;
        _controls3DtopDown.dampingFactor = 0.3;

        



        
        _controls3DtopDown.keys = [65, 83, 68, 70, 71, 72];

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
                _controls3DtopDown.reset();
            }
        });

        // need to set _camera3DtopDown.position after construction of _controls3DtopDown
        _camera3DtopDown.position.copy( camera3DtopDownPosition0 );
        _camera3DtopDown.zoom = 0.42;

        _controls3DtopDown.target.copy(_camera3DtopDown.position);
        // initial _controls3DtopDown.target.Y is set to 0
        _controls3DtopDown.target.setY(0.0);

        ////////////////////////////////////////////////////
        // INIT LIGHTS 
        ////////////////////////////////////////////////////

        let lightTopDown = new THREE.AmbientLight("#808080");
        _scene3DtopDown.add(lightTopDown);

        _this.lightsTopDown.AmbientLight = new MLJ.core.AmbientLight(_scene3DtopDown, _camera3DtopDown, _renderer3DtopDown);
        _this.lightsTopDown.Headlight = new MLJ.core.Headlight(_scene3DtopDown, _camera3DtopDown, _renderer3DtopDown);
        
        ////////////////////////////////////////////////////
        // EVENT HANDLERS
        ////////////////////////////////////////////////////

        let canvas3DtopDown = document.getElementById('canvas3DtopDown');
        canvas3DtopDown.addEventListener('touchmove', _controls3DtopDown.update.bind(_controls3DtopDown), false);
        canvas3DtopDown.addEventListener('mousemove', _controls3DtopDown.update.bind(_controls3DtopDown), false);
        canvas3DtopDown.addEventListener('mousewheel', _controls3DtopDown.update.bind(_controls3DtopDown), false);
        canvas3DtopDown.addEventListener('DOMMouseScroll', _controls3DtopDown.update.bind(_controls3DtopDown), false); // firefox
        canvas3DtopDown.addEventListener( 'mousemove', onDocumentMouseMove3DtopDown, false );
        canvas3DtopDown.addEventListener( 'mouseup', onDocumentMouseUp3DtopDown, false );
        
        canvas3DtopDown.addEventListener( 'touchmove', onDocumentTouchMove3DtopDown, false );
        
        _controls3DtopDown.addEventListener('change', function () {
            MLJ.core.Scene3DtopDown.render();

            $('#canvas3DtopDown').trigger('onControlsChange');
        });
        
        $(window).resize(function () {
            resizeCanvas1();
            MLJ.core.Scene3DtopDown.render();
        });

    }

    this.lights = {
        AmbientLight: null,
        Headlight: null
    };

    this.lightsTopDown = {
        AmbientLight: null,
        Headlight: null
    };
    
    this.addToScene3DtopDown = function (obj) {
        _scene3DtopDown.add( obj );
    };

    this.removeFromScene3DtopDown = function (obj) {
        _scene3DtopDown.remove( obj );
    };

    var lastID = 0;
    this.createLayer = function (layerName) {
        // layerName = "MyLayer";

        // remove layer from list if layer by such name exist before creating a new layer
        _this.removeLayerByName(layerName);
        
        var layer = new MLJ.core.Layer(lastID++, layerName);

        return layer;
    };

    this.getCamera3DtopDown = function () {
        return _camera3DtopDown;
    };

    this.get3DtopDownSize = function () {
        return get3DtopDownSize();
    };

    this.getRenderer3DtopDown = function () {
        return _renderer3DtopDown;
    };

    this.getScene3DtopDown = function () {
        return _scene3DtopDown;
    };

    this.getSelectedFloorInfo = function () {
        return _selectedFloorInfo;
    };

    this.setSelectedFloorInfo = function (floorName2) {
        console.log('BEG setSelectedFloorInfo'); 

        let selectedLayer = MLJ.core.Scene3D.getSelectedLayer();
        if (selectedLayer === undefined)
        {
            console.log('selectedLayer is undefined'); 
            return;
        }
        
        let floorInfoArray = selectedLayer.getFloorInfoArray();

        // Loop over floorInfoArray and match
        let floorName = "NA";
        let iter = floorInfoArray.iterator();
        while (iter.hasNext()) {
            let floorInfo = iter.next();
            console.log('floorInfo', floorInfo);

            let topDownStructureObjRegexMatched = "na";
            if( (topDownStructureObjRegexMatched = floorInfo["floorName"].match(floorName2)) )
            {
                floorName = floorInfo["floorName"];
                break;
            }
            
        }

        if(_selectedFloorInfo)
        {
            // remove the previous _selectedFloorInfo["mesh"]
            _scene3DtopDown.remove(_selectedFloorInfo["mesh"]);
        }
        
        _selectedFloorInfo = selectedLayer.getFloorInfoByName(floorName);

        if(_selectedFloorInfo)
        {
            // add the current _selectedFloorInfo["mesh"]
            _scene3DtopDown.add(_selectedFloorInfo["mesh"]);

            // update the camera positionY to the floor
            let height = _selectedFloorInfo["height"] + heightOffset;
            // let intersectionPointCurr2 = new THREE.Vector3(_intersectionPointCurr.x, height, _intersectionPointCurr.z);
            // intersectionPointCurr2.copy(_intersectionPointCurr);
            
            // MLJ.core.Scene3D.setCamera3Dposition(intersectionPointCurr2);
            MLJ.core.Scene3D.setCamera3Dposition(_intersectionPointCurr);

            // aspect ratio is not ok, scale is not ok (image does not fill the entire window)
            // _bbox = new THREE.Box3().setFromObject(_selectedFloorInfo["mesh"]);

            // aspect ratio is ok, scale is not ok (image does not fill the entire window)
            _bbox = _selectedFloorInfo["mesh"].bBox;

            if(_bbox)
            {
                _bbox.getCenter( _camera3DtopDown.position ); // this re-sets the position
                _camera3DtopDown.position.setY(height);
            }
            
            // Update the camera frustum to cover the entire image
            let width1 = (_bbox.max.x - _bbox.min.x) / 2;
            let height1 = (_bbox.max.z - _bbox.min.z) / 2;
            
            _camera3DtopDown.left = -width1;
            _camera3DtopDown.right = width1;
            _camera3DtopDown.top = height1;
            _camera3DtopDown.bottom = -height1;
            _camera3DtopDown.updateProjectionMatrix();
        }
        else
        {
            throw new Error("Reached error condition: if(_selectedFloorInfo)");
        }
        
        // console.log('_scene3DtopDown1', _scene3DtopDown);
    };

    this.getAxisHelperIntersection = function () {
        return _axisHelperIntersection;
    };

    this.getControls3DtopDown = function () {
        return _controls3DtopDown;
    };

    this.setControls3DtopDown = function (controls) {
        _controls3DtopDown = controls;
    };

    ///////////////////////////////////////////////
    // Update the scene3D intersection point in Scene3DtopDown
    //  _cube_scene3DcameraLookAtIntersectionPoint - in yellow color
    //  _cube_scene3DcameraMouseIntersectionPoint - in darkOrange color
    ///////////////////////////////////////////////
    
    this.setScene3DintersectionPoint = function(scene3dCameraLookAtIntersectionPoint, scene3dMouseIntersectionPoint) {

        if(scene3dCameraLookAtIntersectionPoint)
        {
            // console.log('scene3dCameraLookAtIntersectionPoint', scene3dCameraLookAtIntersectionPoint); 
            // intersection of the scene3D window center (yellow)

            _cube_scene3DcameraLookAtIntersectionPoint.position.copy(_cube_camera3D.position);
            // Y doesn't need to be translated, because _cube_camera3D.y is 0, and changing the elevation of the camera3D (changing the y value) does not need to be compensated
            _cube_scene3DcameraLookAtIntersectionPoint.translateX(scene3dCameraLookAtIntersectionPoint.x);
            _cube_scene3DcameraLookAtIntersectionPoint.translateZ(scene3dCameraLookAtIntersectionPoint.z);
        }

        if(scene3dMouseIntersectionPoint)
        {
            // intersection of the scene3D mouse position (darkOrangeColor)
            _cube_scene3DcameraMouseIntersectionPoint.position.copy(_cube_camera3D.position);
            _cube_scene3DcameraMouseIntersectionPoint.position.add(scene3dMouseIntersectionPoint);
        }

    };

    this.getBoundingBox = function()
    {
        return _bbox;
    };
    
    this.setArrowHelper = function()
    {
        // console.log('BEG setArrowHelper'); 
        //     TBD - draw arrow from camera3D_position to camera3D_lookAt_direction
        // https://threejs.org/docs/#api/en/helpers/ArrowHelper

        let camera3D = MLJ.core.Scene3D.getCamera3D();

        let direction1 = new THREE.Vector3();
        camera3D.getWorldDirection( direction1 );

        // Set the distance to be from _cube_camera3D.position to _cube_scene3DcameraLookAtIntersectionPoint.position
        let arrowLength = 5000;
        if(_cube_scene3DcameraLookAtIntersectionPoint && _cube_camera3D)
        {
            let direction2 = new THREE.Vector3().subVectors(_cube_scene3DcameraLookAtIntersectionPoint.position, _cube_camera3D.position);
            arrowLength = direction2.length();
        }

        if(_arrowCameraDirection)
        {
            _cube_camera3D.position.addVectors(camera3D.position, _intersectionPointCurr);
            _arrowCameraDirection.position.copy(_cube_camera3D.position);

            // set direction in Y to 0, i.e. parallel, on the y plane, to _arrowCameraDirection.position.y
            direction1.setY(0);
            _arrowCameraDirection.setDirection(direction1.normalize());
            _arrowCameraDirection.setLength(arrowLength);
        }
    };
    
    this.centerIntersectionPointInTopDownView = function () {

        console.log('BEG centerIntersectionPointInTopDownView'); 
        
        /////////////////////////////////////////////////////////////
        // center the topDown view by changing both
        // - the cameraTopDown position, and
        // - the cameraTopDown target (lookAt)
        // 
        // It looks like changing only the cameraTopDown target (lookAt) is sufficient
        // (maybe because the cameraTopDown is forced to look top down, so by moving the target practically we are also moving the cameraTopDown)
        // To be complete, we are changing here both the cameraTopDown position, and the cameraTopDown target (lookAt)
        /////////////////////////////////////////////////////////////
        
        let axisHelperIntersection = MLJ.core.Scene3DtopDown.getAxisHelperIntersection();
        _camera3DtopDown.position.copy(axisHelperIntersection.position);
        _camera3DtopDown.position.setY(camera3DtopDownHeight);
        
        let controls3DtopDown = MLJ.core.Scene3DtopDown.getControls3DtopDown();
        controls3DtopDown.target.copy(_camera3DtopDown.position);

        if(_selectedFloorInfo)
        {
            let intersectionHeight = _selectedFloorInfo["height"];
            // console.log('intersectionHeight', intersectionHeight); 
            // controls3DtopDown.target.setY(intersectionHeight);
            controls3DtopDown.target.setY(0.0);
        }
        else
        {
            controls3DtopDown.target.setY(0.0);
        }
    }

    this.findIntersections = function () {
        // console.log('BEG findIntersections1'); 

        _raycaster3DtopDown.setFromCamera( _mouse3DtopDown, _camera3DtopDown );

        let intersects = _raycaster3DtopDown.intersectObjects( _selectedFloorInfo["mesh"].children, true );
        if(intersects.length > 0)
        {
            _intersectionPointCurr = intersects[0].point;
//             console.log('_intersectionPointCurr', _intersectionPointCurr); 

            let intersectionHeight = _selectedFloorInfo["height"];
            _intersectionPointCurr.setY(intersectionHeight);

            let height = _selectedFloorInfo["height"] + heightOffset;

            // order from far to near:
//             console.log('_selectedFloorInfo["mesh"].position', _selectedFloorInfo["mesh"].position);
//             console.log('_axisHelperIntersection.position', _axisHelperIntersection.position);
//             console.log('_cube_camera3D.position', _cube_camera3D.position);
//             console.log('_cube_scene3DcameraMouseIntersectionPoint.position', _cube_scene3DcameraMouseIntersectionPoint.position);
//             console.log('_cube_scene3DcameraLookAtIntersectionPoint.position', _cube_scene3DcameraLookAtIntersectionPoint.position);

            var dist1 = _intersectionPointCurr.distanceTo( _intersectionPointPrev );
            let epsilon = 1.0;
            if ( dist1 > epsilon )
            {
                _intersectionPointPrev.copy(_intersectionPointCurr);

                _axisHelperIntersection.position.copy( _intersectionPointCurr );
                
                let camera3D = MLJ.core.Scene3D.getCamera3D();
                _cube_camera3D.position.addVectors(camera3D.position, _intersectionPointCurr);
                
                // Update the camera position to the new intersection, keep the previous camera direction
                _arrowCameraDirection.position.copy(_cube_camera3D.position);
                
                let intersectionPointCurr2 = new THREE.Vector3(_intersectionPointCurr.x, height, _intersectionPointCurr.z);
                intersectionPointCurr2.copy(_intersectionPointCurr);
                
                MLJ.core.Scene3D.setCamera3Dposition(_intersectionPointCurr);
                // MLJ.core.Scene3D.setCamera3Dposition(intersectionPointCurr2);

                _this.render();
            }
            
        }
                    
    };
    
    this.render = function (fromReqAnimFrame) {
        _renderer3DtopDown.render(_scene3DtopDown, _camera3DtopDown);
    };

    this.resetTrackball3DtopDown = function () {
        _controls3DtopDown.reset();
    };
    
    //INIT
    $(window).ready(function () {
        initScene3DtopDown();
        animate();
    });
    
}).call(MLJ.core.Scene3DtopDown);
