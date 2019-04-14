////////////////////////////////////////////////////////////////
//
// The scene file is the main container for the application
// In the threejs examples there are e.g. scene, camera, light, renderer in the main html file
// The MLJ.core.Scene3DtopDown class stores such telements
//
////////////////////////////////////////////////////////////////

MLJ.core.Scene3DtopDown = {};
MLJ.core.Scene3DtopDown.timeStamp = 0;

const camera3DtopDownHeight = 2000;
var camera3DtopDownPosition0 = new THREE.Vector3(643, camera3DtopDownHeight, 603);

(function () {
    const _heightOffset = 1000;

    var _scene3DtopDown;
    var _camera3DtopDown;
    var _controls3DtopDown;
    var _renderer3DtopDown;
    var _group3DtopDown;
    var _mouse3DtopDown = new THREE.Vector2();
    var _bbox;
    var _raycaster3DtopDown;
    var _viewportExtendsOnX = false;
    var _currentViewportNormalized;

    var _this = this;

    ////////////////////////////////////////////////////
    // OverlayRect
    ////////////////////////////////////////////////////
    
    var _editOverlayRect_Scene3DtopDown_TrackballControls;

    ////////////////////////////////////////////////////
    // Helpers
    ////////////////////////////////////////////////////

    // _cube_camera3D - position of the camera in the 2dPane
    var _cube_camera3D;

    var _axesHelperIntersection;
    var _arrowCameraDirection;

    var _intersectedStructureInfo = new IntersectionInfo({intersectionLayer: undefined});
    var _intersectedOverlayRectInfo2 = new IntersectionInfo({intersectionLayer: undefined});
    
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
        event.preventDefault();

        if( event.touches.length > 0 )
        {
            setMouseCoords(event.touches[0]);
        }
        
        MLJ.core.Scene3DtopDown.render();
    }

    function onDocumentMouseMove3DtopDown( event ) {
        //         console.log('Beg onDocumentMouseMove3DtopDown'); 
        event.preventDefault();

        setMouseCoords(event);
        
        MLJ.core.Scene3DtopDown.render();
    }


    function setMouseCoords( event ) {

        // console.log('BEG setMouseCoords');
        
        // https://stackoverflow.com/questions/18625858/object-picking-from-small-three-js-viewport
        // https://stackoverflow.com/questions/28632241/object-picking-with-3-orthographic-cameras-and-3-viewports-three-js
        // You need to consider the viewport parameters and adjust the mouse.x and mouse.y values so they always remain in the interval [ - 1, + 1 ]. – WestLangley

        if(!_mouse3DtopDown || !_currentViewportNormalized)
        {
            // _mouse3DtopDown, or _currentViewportNormalized are not defined yet!!
            return;
        }
        
        _mouse3DtopDown.x = ( ( event.clientX - get3DtopDownOffset().left - _renderer3DtopDown.domElement.offsetLeft - _currentViewportNormalized.x ) /
                              _currentViewportNormalized.z ) * 2 - 1;

        _mouse3DtopDown.y = - ( ( event.clientY - get3DtopDownOffset().top - _renderer3DtopDown.domElement.offsetTop - _currentViewportNormalized.y ) /
                                _currentViewportNormalized.w ) * 2 + 1;
        
        // console.log('_mouse3DtopDown1', _mouse3DtopDown); 
    };

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
    
    this.resizeCanvas = function () {
        // console.log('BEG Scene3DtopDown resizeCanvas');

        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        let selectedFloorInfo = selectedLayer.getSelectedFloorInfo();

        if(selectedFloorInfo && selectedFloorInfo["mesh"])
        {
            let selectedFloorObj = selectedFloorInfo["mesh"].getObjectByName('ground_1');
            if(selectedFloorObj)
            {
                // size3DtopDown - the size of the gui window
                let size3DtopDown = get3DtopDownSize();

                // _bbox = new THREE.Box3().setFromObject(selectedFloorObj);
                _bbox = new THREE.Box3().setFromObject(selectedFloorInfo["mesh"]);
                _bbox.getCenter( _camera3DtopDown.position ); // this re-sets the position
                let height = selectedFloorInfo["height"] + _heightOffset;
                _camera3DtopDown.position.setY(height);

                // Update the camera frustum to cover the entire image
                let width1 = (_bbox.max.x - _bbox.min.x);
                let height1 = (_bbox.max.z - _bbox.min.z);
                let orientation = 1;

                let retVal = _controls3DtopDown.setCameraAndCanvas(size3DtopDown.width,
                                                                   size3DtopDown.height,
                                                                   width1,
                                                                   height1,                             
                                                                   orientation);

                _viewportExtendsOnX = retVal.viewportExtendsOnX;

                _renderer3DtopDown.setSize(size3DtopDown.width, size3DtopDown.height);

                // Set _currentViewportNormalized (normalized by the pixelRatio)
                _renderer3DtopDown.setViewport ( -retVal.canvasOffsetLeft, -retVal.canvasOffsetTop, retVal.canvasWidth, retVal.canvasHeight );

                let currentViewport = _renderer3DtopDown.getCurrentViewport();
                let pixelRatio = _renderer3DtopDown.getPixelRatio();
                _currentViewportNormalized = new THREE.Vector4();
                _currentViewportNormalized.copy(currentViewport)
                _currentViewportNormalized.divideScalar(pixelRatio);
            }
        }
    };
    

    function onMouseWheelOrTouchMoveIn_mlj_scenebar_widget(event) {
        console.log('BEG onMouseWheelOrTouchMoveIn_mlj_scenebar_widget');

        // TBD implement in a more general place. mlj-scenebar-widget does not belong to Scene3DtopDown
        
        // intercept wheel/touchmove events and prevent from zooming the DOM element
        event.preventDefault();
    }     
    
    function initScene3DtopDown() {

        ////////////////////////////////////////////////////
        // 3DtopDown
        ////////////////////////////////////////////////////
        
        //////////////////////////////////////
        // Set camera related parameters
        //////////////////////////////////////

        _scene3DtopDown = new THREE.Scene();
        _scene3DtopDown.name = "_scene3DtopDown";
        
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
        // floorInfo.mesh (polygonOffsetUnits = 4, polygonOffsetFactor = 1)
        // _axesHelperIntersection (polygonOffsetUnits = -4, polygonOffsetFactor = -1)
        // _cube_camera3D (red cube) (polygonOffsetUnits = -6, polygonOffsetFactor = -1)
        // _cube_scene3DcameraMouseIntersectionPoint (orange cube) (polygonOffsetUnits = -8, polygonOffsetFactor = -1)
        // _cube_scene3DcameraLookAtIntersectionPoint (yellow cube) (polygonOffsetUnits = -9, polygonOffsetFactor = -1)
        

        
        _axesHelperIntersection = new THREE.AxesHelper(500);
        _axesHelperIntersection.material.linewidth = 20;
        _axesHelperIntersection.material.polygonOffset = true;
        _axesHelperIntersection.material.polygonOffsetUnits = -4;
	// _axesHelperIntersection more in front, compared to e.g. selectedFloorInfo["mesh"]
        _axesHelperIntersection.material.polygonOffsetFactor = -1;
        
        // _scene3DtopDown.add(_axesHelperIntersection);

        // Set _cube_camera3D - position of the camera in the 2dPane
        let cubeWidth = 2;
        let cubeHeight = 2;
        let cubeDepth = 2;
        
        var geometry1 = new THREE.BoxGeometry( cubeWidth, cubeHeight, cubeDepth );
        var material1 = new THREE.MeshBasicMaterial( {color: MLJ.util.redColor} );
        _cube_camera3D = new THREE.Mesh( geometry1, material1 );
        _cube_camera3D.name = "_cube_camera3D";
        _cube_camera3D.position.set( 0, 0, 0 );
        _cube_camera3D.material.polygonOffset = true;
        _cube_camera3D.material.polygonOffsetUnits = -6;
	// _cube_camera3D more in front, compared to e.g. selectedFloorInfo["mesh"]
        _cube_camera3D.material.polygonOffsetFactor = -1;
        _scene3DtopDown.add( _cube_camera3D );

        cubeWidth = 80;
        cubeHeight = 80;
        cubeDepth = 80;
        
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

        if(_this.doShowCameraDirection())
        {
            _scene3DtopDown.add(_arrowCameraDirection);
        }

        let geometry2 = new THREE.BoxGeometry( cubeWidth, cubeHeight, cubeDepth );
        let material2 = new THREE.MeshBasicMaterial( {color: MLJ.util.yellowColor} );
        _cube_scene3DcameraLookAtIntersectionPoint = new THREE.Mesh( geometry2, material2 );
        _cube_scene3DcameraLookAtIntersectionPoint.name = "_cube_scene3DcameraLookAtIntersectionPoint";
        _cube_scene3DcameraLookAtIntersectionPoint.position.set( 0, 0, 0 );
        _cube_scene3DcameraLookAtIntersectionPoint.material.polygonOffset = true;
        _cube_scene3DcameraLookAtIntersectionPoint.material.polygonOffsetUnits = -8;
	// _cube_scene3DcameraLookAtIntersectionPoint more in front, compared to e.g. selectedFloorInfo["mesh"]
        _cube_scene3DcameraLookAtIntersectionPoint.material.polygonOffsetFactor = -1;
        _scene3DtopDown.add( _cube_scene3DcameraLookAtIntersectionPoint );

        let geometry3 = new THREE.BoxGeometry( cubeWidth, cubeHeight, cubeDepth );
        material2 = new THREE.MeshBasicMaterial( {color: MLJ.util.darkOrangeColor} );
        _cube_scene3DcameraMouseIntersectionPoint = new THREE.Mesh( geometry3, material2 );
        _cube_scene3DcameraMouseIntersectionPoint.name = "_cube_scene3DcameraMouseIntersectionPoint";
        _cube_scene3DcameraMouseIntersectionPoint.position.set( 0, 0, 0 );
        _cube_scene3DcameraMouseIntersectionPoint.material.polygonOffset = true;
        _cube_scene3DcameraMouseIntersectionPoint.material.polygonOffsetUnits = -9;
	// _cube_scene3DcameraMouseIntersectionPoint more in front, compared to e.g. selectedFloorInfo["mesh"]
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
            // console.log('BEG topDown resize');
            _this.resizeCanvas();
        });


        let element1 = document.getElementById("mlj-scenebar-widget");
        console.log('element1', element1);
        
        element1.addEventListener( 'wheel', onMouseWheelOrTouchMoveIn_mlj_scenebar_widget, false );
        element1.addEventListener( 'touchmove', onMouseWheelOrTouchMoveIn_mlj_scenebar_widget, false );
        
    }

    this.setEditTopDownOverlayControl = function () {
        _editOverlayRect_Scene3DtopDown_TrackballControls = new THREE.EditOverlayRect_Scene3DtopDown_TrackballControls( _camera3DtopDown,
                                                                                                                        _renderer3DtopDown.domElement );
    };

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

    this.getIntersectionStructureInfo = function () {
        return _intersectedStructureInfo;    
    }
    
    this.getIntersectionOverlayRectInfo2 = function () {
        return _intersectedOverlayRectInfo2;    
    }

    this.getMouse3D = function () {
        return _mouse3DtopDown;
    };

    this.getCamera3D = function () {
        return _camera3DtopDown;
    };

    this.doShowCameraDirection = function () {
        // return true;
        return false;
    };
    
    this.getRectangleVertices = function (intersection) {
        
        /////////////////////////////////////////////////////////////
        // Set up the fictitious rectangle vertices.
        // They are not needed for Scene3DtopDown
        // (but are needed for Scene3D)
        /////////////////////////////////////////////////////////////

        let dx = 1;
        let dz = 1;

        let tlPoint = new THREE.Vector3();
        tlPoint.copy(intersection.point)
        tlPoint.x += -dx;
        tlPoint.z += -dz;

        let trPoint = new THREE.Vector3();
        trPoint.copy(intersection.point)
        trPoint.x += dx;
        trPoint.z += -dz;

        let brPoint = new THREE.Vector3();
        brPoint.copy(intersection.point)
        brPoint.x += dx;
        brPoint.z += dz;
        
        let blPoint = new THREE.Vector3();
        blPoint.copy(intersection.point)
        blPoint.x += -dx;
        blPoint.z += dz;
        
        var rectangleVertices = {};
        rectangleVertices["tlPoint"] = tlPoint;
        rectangleVertices["trPoint"] = trPoint;
        rectangleVertices["brPoint"] = brPoint;
        rectangleVertices["blPoint"] = blPoint;

        return rectangleVertices;
    };
    
    this.setCamera3DtopDown = function (selectedFloorInfo) {
        // console.log('BEG setCamera3DtopDown'); 
        if(MLJ.core.Model.isScene3DpaneEnabled())
        {
            let intersectedStructureCurrent = MLJ.util.getNestedObject(_intersectedStructureInfo, ['currentIntersection']);
            if( intersectedStructureCurrent )
            {
                let intersectionPointCurr = _intersectedStructureInfo.currentIntersection.point;
                MLJ.core.Scene3D.setCamera3Dposition(intersectionPointCurr);
            }
        }

        // update the camera positionY to be higher than the floor
        let height = selectedFloorInfo["height"] + _heightOffset;

        // aspect ratio is ok, scale is not ok (image does not fill the entire window)
        _bbox = selectedFloorInfo["mesh"].bBox;

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
    };
    
    this.insertRectangularMesh2 = function () {
        // console.log('BEG insertRectangularMesh2');

        let intersectedStructureCurrent = MLJ.util.getNestedObject(_intersectedStructureInfo, ['currentIntersection']);
        if( intersectedStructureCurrent == undefined)
        {
            console.log('No intersection found');
            return;
        }

        let structureRectangleVertices = _this.getRectangleVertices(intersectedStructureCurrent);

        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        selectedLayer.createRectangleMesh(structureRectangleVertices);
        _this.findIntersections();

        return false;
    };
    
    this.getAxesHelperIntersection = function () {
        return _axesHelperIntersection;
    };

    this.getControls3DtopDown = function () {
        return _controls3DtopDown;
    };

    this.setControls3DtopDown = function (controls) {
        _controls3DtopDown = controls;
    };

    this.enableControls3DtopDown = function (doEnableControls3DtopDown) {
        if(doEnableControls3DtopDown)
        {
            _controls3DtopDown.enabled = false;
        }
        else
        {
            _controls3DtopDown.enabled = true;
        }
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
    
    this.doesViewportExtendOnX = function()
    {
        return _viewportExtendsOnX;
    };

    this.setDirectionArrow = function()
    {
        // Draw arrow in the the topDown pane, from camera3D_position to camera3D_lookAt_direction

        // console.log('BEG setDirectionArrow'); 

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

        if(this.doShowCameraDirection() && _arrowCameraDirection)
        {
            // camera3D.position is the position (very small offset) of the camera relative to the pivot, which is set to _intersectedStructureInfo.currentIntersection.point
            _cube_camera3D.position.addVectors(camera3D.position, _intersectedStructureInfo.currentIntersection.point);
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
        /////////////////////////////////////////////////////////////
        
        let axesHelperIntersection = MLJ.core.Scene3DtopDown.getAxesHelperIntersection();
        _camera3DtopDown.position.copy(axesHelperIntersection.position);
        _camera3DtopDown.position.setY(camera3DtopDownHeight);
        
        let controls3DtopDown = MLJ.core.Scene3DtopDown.getControls3DtopDown();
        controls3DtopDown.target.copy(_camera3DtopDown.position);

        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        let selectedFloorInfo = selectedLayer.getSelectedFloorInfo();
        if(selectedFloorInfo)
        {
            let intersectionHeight = selectedFloorInfo["height"];
            // console.log('intersectionHeight', intersectionHeight); 
            // controls3DtopDown.target.setY(intersectionHeight);
            controls3DtopDown.target.setY(0.0);
        }
        else
        {
            controls3DtopDown.target.setY(0.0);
        }
    };

    this.getLayerIntersectionsInfo = function (intersects)
    {
        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        // let structureMeshGroup = selectedLayer.getStructureMeshGroup();

        for (var i = 0; i < intersects.length; i++)
        {
            var intersectionCurr = intersects[i];
            if(intersectionCurr.object.type == "Mesh")
            {
                var intersectionCurr_object_id = MLJ.util.getNestedObject(intersectionCurr, ['object', 'id']);

                // Assuming that the intersection results are sorted by distance
                // Didn't find a structure intersection before so check if the intersectionCurr_object_id refers to a structure 
                // object
                // let intersectedStructureObject = structureMeshGroup.getObjectById(intersectionCurr_object_id);
                let selectedFloorInfo = selectedLayer.getSelectedFloorInfo();
                let intersectedStructureObject = selectedFloorInfo["mesh"].getObjectById(intersectionCurr_object_id);
                
                if(intersectedStructureObject)
                {
                    _intersectedStructureInfo.intersectionLayer = selectedLayer;
                    _intersectedStructureInfo.currentIntersection = intersectionCurr;
                    return;
                }
            }
            else
            {
                // Can get here e.g. if intersecting with LineSegments
                // console.log('Intersection is not a mesh'); 
            }
        }
        
    };
    
    this.findIntersections = function () {
//         console.log('BEG findIntersections1'); 

        _raycaster3DtopDown.setFromCamera( _mouse3DtopDown, _camera3DtopDown );
        // console.log('_mouse3DtopDown', _mouse3DtopDown); 

        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        let selectedFloorInfo = selectedLayer.getSelectedFloorInfo();
        let intersects = _raycaster3DtopDown.intersectObjects( selectedFloorInfo["mesh"].children, true );
        _intersectedStructureInfo.clearCurrentIntersection();

        this.getLayerIntersectionsInfo(intersects);

        {
            let floorOverlayRectGroup = selectedLayer.getFloorOverlayRectGroup();
            
            let intersects2 = _raycaster3DtopDown.intersectObjects( floorOverlayRectGroup.children, true );
            // Reset any previous intersection info before finding a new one
            _intersectedOverlayRectInfo2.clearCurrentIntersection();

            if(intersects2.length > 0)
            {
                _intersectedOverlayRectInfo2.currentIntersection = intersects2[0];
            }

            selectedLayer.setSelectedImageInfo(_intersectedOverlayRectInfo2);
            _intersectedOverlayRectInfo2.highlightIntersection(MLJ.util.yellowColor);
        }

        
        if(intersects.length > 0)
        {
            // _intersectedStructureInfo.highlightIntersection(MLJ.util.redColor);
            _intersectedStructureInfo.highlightIntersection(MLJ.util.whiteColor);
            
            _intersectedStructureInfo.currentIntersection = intersects[0];
            let intersectionPointCurr = _intersectedStructureInfo.currentIntersection.point;
            let intersectionPointPrev = new THREE.Vector3();
            if(_intersectedStructureInfo.previousIntersection)
            {
                intersectionPointPrev.copy(_intersectedStructureInfo.previousIntersection.point);
            }
            
            intersectionPointCurr.setY(selectedFloorInfo["height"]);

            let height = selectedFloorInfo["height"] + _heightOffset;

            // order from far to near:
            //             console.log('selectedFloorInfo["mesh"].position', selectedFloorInfo["mesh"].position);
            //             console.log('_axesHelperIntersection.position', _axesHelperIntersection.position);
            //             console.log('_cube_camera3D.position', _cube_camera3D.position);
            //             console.log('_cube_scene3DcameraMouseIntersectionPoint.position', _cube_scene3DcameraMouseIntersectionPoint.position);
            //             console.log('_cube_scene3DcameraLookAtIntersectionPoint.position', _cube_scene3DcameraLookAtIntersectionPoint.position);

            let dist1 = intersectionPointCurr.distanceTo( intersectionPointPrev );
            let epsilon = 1.0;
            if ( dist1 > epsilon )
            {
                intersectionPointPrev.copy(intersectionPointCurr);
                _axesHelperIntersection.position.copy( intersectionPointCurr );
                
                if(MLJ.core.Model.isScene3DpaneEnabled() && this.doShowCameraDirection())
                {
                    let camera3D = MLJ.core.Scene3D.getCamera3D();
                    _cube_camera3D.position.addVectors(camera3D.position, intersectionPointCurr);
                    
                    // Update the camera position to the new intersection, keep the previous camera direction
                    _arrowCameraDirection.position.copy(_cube_camera3D.position);

                    MLJ.core.Scene3D.setCamera3Dposition(intersectionPointCurr);
                }
            }
        }
    };
    
    this.render = function (fromReqAnimFrame) {
        let editTopDownOverlayTrackballControlsIsMouseDown = undefined;
        if(_editOverlayRect_Scene3DtopDown_TrackballControls)
        {
            editTopDownOverlayTrackballControlsIsMouseDown = _editOverlayRect_Scene3DtopDown_TrackballControls.isMouseDown;
        }
        if((_controls3DtopDown.isMouseDown || _controls3DtopDown.isTouchDown ||
            editTopDownOverlayTrackballControlsIsMouseDown ))
        {
            _this.findIntersections();
        }
        
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
