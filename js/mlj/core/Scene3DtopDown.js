////////////////////////////////////////////////////////////////
//
// The scene file is the main container for the application
// In the threejs examples there are e.g. scene, camera, light, renderer in the main html file
// The MLJ.core.Scene3DtopDown class stores such telements
//
////////////////////////////////////////////////////////////////

MLJ.core.Scene3DtopDown = {};
MLJ.core.Scene3DtopDown.timeStamp = 0;

const heightOffset = 100;
const camera3DtopDownHeight = 2000;
var camera3DtopDownPosition0 = new THREE.Vector3(643, camera3DtopDownHeight, 603);

(function () {
    var _scene3DtopDown;
    var _camera3DtopDown;
    var _controls3DtopDown;
    var _renderer3DtopDown;
    var _group3DtopDown;
    var _mouse3DtopDown = new THREE.Vector2();
    
    // _selectedFloorInfo = {"mesh", "height", "floorName"}
    var _selectedFloorInfo;
    
    var _raycaster3DtopDown;

    var _this = this;

    ////////////////////////////////////////////////////
    // Helpers
    ////////////////////////////////////////////////////

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
    
    var _cube1_scene3DtopDown;

    var globalIndex = 0;
    ////////////////////////////////////////////////////
    // Other stuff
    ////////////////////////////////////////////////////

    function onDocumentMouseMove3DtopDown( event ) {
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
        console.log('BEG onDocumentMouseUp3DtopDown');
        
        event.preventDefault();

        /////////////////////////////////////////////////////////////
        // center the topDown view by changing both
        // - the cameraTopDown position, and
        // - the cameraTopDown target (lookAt)
        // 
        // It looks like changing only the cameraTopDown target (lookAt) is sufficient
        // (maybe because the cameraTopDown is forced to look top down, so by moving the target practically we are also moving the cameraTopDown)
        // To be complete, we are changing here both the cameraTopDown position, and the cameraTopDown target (lookAt)
        /////////////////////////////////////////////////////////////
        
        var camera3DtopDown = MLJ.core.Scene3DtopDown.getCamera3DtopDown()
        // console.log('camera3DtopDown.position before restore', camera3DtopDown.position); 

        let axisHelperIntersection = MLJ.core.Scene3DtopDown.getAxisHelperIntersection();
        camera3DtopDown.position.copy(axisHelperIntersection.position);
        camera3DtopDown.position.setY(camera3DtopDownHeight);
        
        // console.log('camera3DtopDown.position after update', camera3DtopDown.position); 

        let controls3DtopDown = MLJ.core.Scene3DtopDown.getControls3DtopDown();
        controls3DtopDown.target.copy(camera3DtopDown.position);

        if(_selectedFloorInfo)
        {
            let intersectionHeight = _selectedFloorInfo["height"];
            console.log('intersectionHeight', intersectionHeight); 
            // controls3DtopDown.target.setY(intersectionHeight);
            controls3DtopDown.target.setY(0.0);
        }
        else
        {
            controls3DtopDown.target.setY(0.0);
        }

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
    
    function initScene3DtopDown() {

        ////////////////////////////////////////////////////
        // 3DtopDown
        ////////////////////////////////////////////////////
        
        _scene3DtopDown = new THREE.Scene();

        let _3DtopDownSize = get3DtopDownSize();
        let cameraFrustumAspectRatio = _3DtopDownSize.width / _3DtopDownSize.height;
        let cameraFrustumNearPlane = 0.1;
        let cameraFrustumFarPlane = 100000;
        let left = -cameraFrustumAspectRatio * _3DtopDownSize.height / 2;
        let right = cameraFrustumAspectRatio * _3DtopDownSize.height / 2;
        let top = _3DtopDownSize.height / 2;
        let bottom = -_3DtopDownSize.height / 2;
        let near = cameraFrustumNearPlane;
        let far = cameraFrustumFarPlane;
        _camera3DtopDown = new THREE.OrthographicCamera(left, right, top, bottom, near, far);

        // _camera3DtopDown.position.set( camera3DtopDownPosition0.x, camera3DtopDownPosition0.y, camera3DtopDownPosition0.z );
        _camera3DtopDown.lookAt( _scene3DtopDown.position );
        _camera3DtopDown.updateMatrixWorld();

        _group3DtopDown = new THREE.Object3D();
        _scene3DtopDown.add(_group3DtopDown);

        _raycaster3DtopDown = new THREE.Raycaster();

        _renderer3DtopDown = new THREE.WebGLRenderer();
        _renderer3DtopDown.domElement.id = 'canvas3DtopDown';
        _renderer3DtopDown.setPixelRatio(window.devicePixelRatio);
        _renderer3DtopDown.setSize(_3DtopDownSize.width, _3DtopDownSize.height);
        
        $('#_3DtopDown').append(_renderer3DtopDown.domElement);
        _scene3DtopDown.add(_camera3DtopDown);
        
        ////////////////////////////////////////////////////
        // Helpers
        ////////////////////////////////////////////////////
        
        _axisHelperIntersection = new THREE.AxisHelper(500);
        _axisHelperIntersection.material.linewidth = 20;
        _scene3DtopDown.add(_axisHelperIntersection);

        var geometry1 = new THREE.BoxGeometry( 20, 1, 20 );
        var material1 = new THREE.MeshBasicMaterial( {color: MLJ.util.redColor} );
        _cube_camera3D = new THREE.Mesh( geometry1, material1 );
        _cube_camera3D.position.set( 0, 0, 0 );
        _scene3DtopDown.add( _cube_camera3D );

        // https://stackoverflow.com/questions/20554946/three-js-how-can-i-update-an-arrowhelper
        var sourcePos = _scene3DtopDown.position;
        sourcePos = new THREE.Vector3(0,0,0);

        var targetPos = _camera3DtopDown.position;
        targetPos = new THREE.Vector3(1000 ,100 , 100);

        var direction = new THREE.Vector3().subVectors(targetPos, sourcePos);
        let arrowLength = direction.length();
        _arrowCameraDirection = new THREE.ArrowHelper(direction.clone().normalize(), sourcePos, arrowLength, 0x00ff00);
        _scene3DtopDown.add(_arrowCameraDirection);

        let geometry2 = new THREE.BoxGeometry( 20, 1, 20 );
        let material2 = new THREE.MeshBasicMaterial( {color: MLJ.util.yellowColor} );
        _cube_scene3DcameraLookAtIntersectionPoint = new THREE.Mesh( geometry2, material2 );
        _cube_scene3DcameraLookAtIntersectionPoint.position.set( 0, 0, 0 );
        _scene3DtopDown.add( _cube_scene3DcameraLookAtIntersectionPoint );

        material2 = new THREE.MeshBasicMaterial( {color: MLJ.util.darkOrangeColor} );
        _cube_scene3DcameraMouseIntersectionPoint = new THREE.Mesh( geometry2, material2 );
        _cube_scene3DcameraMouseIntersectionPoint.position.set( 0, 0, 0 );
        _scene3DtopDown.add( _cube_scene3DcameraMouseIntersectionPoint );

        material2 = new THREE.MeshBasicMaterial( {color: MLJ.util.blueColor} );
        _cube1_scene3DtopDown = new THREE.Mesh( geometry2, material2 );
        _cube1_scene3DtopDown.position.set( 0, 0, 0 );
        _scene3DtopDown.add( _cube1_scene3DtopDown );

        
        ////////////////////////////////////////////////////
        // INIT CONTROLS
        ////////////////////////////////////////////////////

        let container3DtopDown = document.getElementById('_3DtopDown');
        _controls3DtopDown = new THREE.OrbitControls3Dpane(_camera3DtopDown, container3DtopDown);

        _controls3DtopDown.staticMoving = true;
        _controls3DtopDown.dynamicDampingFactor = 0.3;

        // Set rotate related parameters
        // _controls3DtopDown.rotateSpeed = 2.0;
        _controls3DtopDown.enableRotate = false;
        // No rotation.
        _controls3DtopDown.minPolarAngle = 0; // radians
        _controls3DtopDown.maxPolarAngle = 0; // radians
        // No orbit horizontally.
        _controls3DtopDown.minAzimuthAngle = 0; // radians
        _controls3DtopDown.maxAzimuthAngle = 0; // radians

        // Set zoom related parameters
        _controls3DtopDown.zoomSpeed = 1.2;
        _controls3DtopDown.enableZoom = true;

        
        // Set pan related parameters
        _controls3DtopDown.panSpeed = 2.0;
        // _controls3DtopDown.enablePan = true;
        // // if true, pan in screen-space
        // _controls3DtopDown.screenSpacePanning = false;
        // // pixels moved per arrow key push
        // _controls3DtopDown.keyPanSpeed = 7.0;

        



        
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
        
        
        _controls3DtopDown.addEventListener('change', function () {
            MLJ.core.Scene3DtopDown.render();

            $('#canvas3DtopDown').trigger('onControlsChange');
        });
        
        $(window).resize(function () {
            let size3DtopDown = get3DtopDownSize();
            _camera3DtopDown.aspect = size3DtopDown.width / size3DtopDown.height;
            _camera3DtopDown.updateProjectionMatrix();
            _renderer3DtopDown.setSize(size3DtopDown.width, size3DtopDown.height);

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

    this.isStickyNotesEnabled = function () {
        // return false;
        return true;
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

        let floorName = "638_w17_yossi_havusha.structure.layer0.obj";
        if(floorName2 == "layer0")
        {
            floorName = "638_w17_yossi_havusha.structure.layer0.obj";
        }
        else if (floorName2 == "layer1")
        {
            floorName = "638_w17_yossi_havusha.structure.layer1.obj";
        }

        // console.log('_scene3DtopDown0', _scene3DtopDown);
        if(_selectedFloorInfo)
        {
            // remove the previous _selectedFloorInfo["mesh"]
            _scene3DtopDown.remove(_selectedFloorInfo["mesh"]);
        }
        
        console.log('_selectedFloorInfo before', _selectedFloorInfo); 

        let selectedLayer = MLJ.core.Scene3D.getSelectedLayer();
        // console.log('floorName', floorName);

        // // console.log('floorInfoArray', selectedLayer.getFloorInfoArray()); 
        // let iter = selectedLayer.getFloorInfoArray().iterator();
        // while (iter.hasNext()) {
        //     let floorInfo = iter.next();
        //     console.log('floorInfo', floorInfo); 
        // }

        // console.log('getKeys', selectedLayer.getFloorInfoArray().getKeys()); 
        
        _selectedFloorInfo = selectedLayer.getFloorInfoByName(floorName);

        console.log('_selectedFloorInfo after', _selectedFloorInfo);

        if(_selectedFloorInfo)
        {
            // add the current _selectedFloorInfo["mesh"]
            _scene3DtopDown.add(_selectedFloorInfo["mesh"]);

            // update the camera positionY to the floor
            let intersectionHeight = _selectedFloorInfo["height"];
            let height = _selectedFloorInfo["height"] + heightOffset;
            let intersectionPointCurr2 = new THREE.Vector3(_intersectionPointCurr.x, height, _intersectionPointCurr.z);
            MLJ.core.Scene3D.setCamera3Dposition(intersectionPointCurr2);
            
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

    this.setScene3DintersectionPoint = function(scene3dCameraLookAtIntersectionPoint, scene3dMouseIntersectionPoint) {

        if(scene3dCameraLookAtIntersectionPoint)
        {
            // console.log('scene3dCameraLookAtIntersectionPoint', scene3dCameraLookAtIntersectionPoint); 
            // intersection of the scene3D window center 
            // yellow
            _cube_scene3DcameraLookAtIntersectionPoint.position.copy(_cube_camera3D.position);
            _cube_scene3DcameraLookAtIntersectionPoint.position.add(scene3dCameraLookAtIntersectionPoint);
            if(_selectedFloorInfo)
            {
                let intersectionHeight = _selectedFloorInfo["height"];
                let height = _selectedFloorInfo["height"] + heightOffset;
                _cube_scene3DcameraLookAtIntersectionPoint.position.setY(height);
            }
            else
            {
                throw new Error("Reached error condition: if(_selectedFloorInfo)");
                _cube_scene3DcameraLookAtIntersectionPoint.position.setY(2);
            }

        }

        if(scene3dMouseIntersectionPoint)
        {
            // console.log('scene3dMouseIntersectionPoint', scene3dMouseIntersectionPoint); 
            // intersection of the scene3D mouse position 
            // darkOrangeColor
            _cube_scene3DcameraMouseIntersectionPoint.position.copy(_cube_camera3D.position);
            _cube_scene3DcameraMouseIntersectionPoint.position.add(scene3dMouseIntersectionPoint);
            
            if(_selectedFloorInfo)
            {
                let intersectionHeight = _selectedFloorInfo["height"];
                let height = _selectedFloorInfo["height"] + heightOffset;
                _cube_scene3DcameraMouseIntersectionPoint.position.setY(height);
            }
            else
            {
                throw new Error("Reached error condition: if(_selectedFloorInfo)");
                _cube_scene3DcameraMouseIntersectionPoint.position.setY(2);
            }
        }

        // console.log('_cube_camera3D.position', _cube_camera3D.position); 
    };

    this.setArrowHelper = function(rotation)
    {
        // console.log('BEG setArrowHelper'); 
        //     TBD - draw arrow from camera3D_position to camera3D_lookAt_direction
        // https://threejs.org/docs/#api/en/helpers/ArrowHelper

        // direction, rotation - euler coords in radian
        // let direction = new THREE.Vector3(rotation.x, rotation.y, rotation.z);

        let camera3D = MLJ.core.Scene3D.getCamera3D();

        let direction = new THREE.Vector3();
        camera3D.getWorldDirection( direction );
        // console.log('direction', direction);
        // console.log('camera3D.position', camera3D.position);
        // console.log('rotation', rotation);
        
        let arrowLength = 100;

        if(_arrowCameraDirection)
        {
            _cube_camera3D.position.addVectors(camera3D.position, _intersectionPointCurr);
            _arrowCameraDirection.position.copy(_cube_camera3D.position);
            _arrowCameraDirection.setDirection(direction.normalize());
            _arrowCameraDirection.setLength(arrowLength);
        }
    };
    
    this.findIntersections = function () {

        _raycaster3DtopDown.setFromCamera( _mouse3DtopDown, _camera3DtopDown );

        let intersects = _raycaster3DtopDown.intersectObjects( _selectedFloorInfo["mesh"].children, true );
        if(intersects.length > 0)
        {
            _intersectionPointCurr = intersects[0].point;
            console.log('_intersectionPointCurr', _intersectionPointCurr); 

            let intersectionHeight = _selectedFloorInfo["height"];
            _intersectionPointCurr.setY(intersectionHeight);

            let height = _selectedFloorInfo["height"] + heightOffset;

            console.log('_intersectionPointPrev', _intersectionPointPrev);
            console.log('_intersectionPointCurr', _intersectionPointCurr);
            
            var dist1 = _intersectionPointCurr.distanceTo( _intersectionPointPrev );
            let epsilon = 1.0;
            if ( dist1 > epsilon )
            {
                // console.log('dist1', dist1); 
                _intersectionPointPrev.copy(_intersectionPointCurr);

                _axisHelperIntersection.position.set( _intersectionPointCurr.x, height, _intersectionPointCurr.z );
                
                let camera3D = MLJ.core.Scene3D.getCamera3D();
                _cube_camera3D.position.addVectors(camera3D.position, _intersectionPointCurr);
                
                // Update the camera position to the new intersection, keep the previous camera direction
                _arrowCameraDirection.position.copy(_cube_camera3D.position);

                let intersectionPointCurr2 = new THREE.Vector3(_intersectionPointCurr.x, height, _intersectionPointCurr.z);
                
                // // blue
                // _cube1_scene3DtopDown.position.copy(_camera3DtopDown.position);
                // _cube1_scene3DtopDown.position.setY(2)
                
                // MLJ.core.Scene3D.setCamera3Dposition(_intersectionPointCurr);
                MLJ.core.Scene3D.setCamera3Dposition(intersectionPointCurr2);

                _this.render();
            }
            
        }
                    
    };
    
    this.render = function (fromReqAnimFrame) {

        // console.log('_controls3DtopDown.isMouseDown', _controls3DtopDown.isMouseDown); 
        // if(_controls3D.isKeyDown)
        // TBD change to only when clicking on the mouse? (and not while clicking and moving it?)
        // (to prevent from constantly changing the images when navigating the view?)
        if(_controls3DtopDown.isMouseDown)
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
