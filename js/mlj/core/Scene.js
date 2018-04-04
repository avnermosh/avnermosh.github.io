
MLJ.core.Scene = {};
MLJ.core.Scene.timeStamp = 0;

var firstTime2 = true;
var radius = 100, theta = 0;

var intersectionPrev = 0;

(function () {
    // var _decorators = new MLJ.util.AssociativeArray();
    var _scene;
    var _camera;
    var _cameraPosition;
    var _controls;
    var _raycaster;
    var _mouse = new THREE.Vector2();
    var _renderer;
    var _this = this;
    var _wallsInfo;
    var _threedModelAttributes;
    var _selectedImageGeometry;    
    var _selectedImageLineSegments;
    
    function get3DSize() {
        var _3D = $('#_3D');

        return {
            width: _3D.innerWidth(),
            height: _3D.innerHeight()
        };
    }

    function get3DOffset() {
        var _3D = $('#_3D');

        // console.log('_3D.offset()', _3D.offset());
        
        return {
            left: _3D.offset().left,
            top: _3D.offset().top
        };
    }

//SCENE INITIALIZATION  ________________________________________________________

    function onDocumentMouseMove( event ) {
        // console.log("BEG onDocumentMouseMove");

        event.preventDefault();

        // _mouse.x = ( ( event.clientX - _renderer.domElement.offsetLeft ) / _renderer.domElement.clientWidth ) * 2 - 1;
        // _mouse.y = - ( ( event.clientY - _renderer.domElement.offsetTop ) / _renderer.domElement.clientHeight ) * 2 + 1;

        _mouse.x = ( ( event.clientX - get3DOffset().left - _renderer.domElement.offsetLeft ) /
                    _renderer.domElement.clientWidth ) * 2 - 1;
        
        _mouse.y = - ( ( event.clientY - get3DOffset().top - _renderer.domElement.offsetTop ) /
                      _renderer.domElement.clientHeight ) * 2 + 1;

        // console.log('_mouse.x, _mouse.y 2', _mouse.x, _mouse.y);
        
        MLJ.core.Scene.render();

    }

    
function animate() {
    requestAnimationFrame( animate );
    _controls.update();
    MLJ.core.Scene.render();
}
    
    function initScene() {
        var _3DSize = get3DSize();

        _scene = new THREE.Scene();

        // _camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100000 );
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
        
    _raycaster = new THREE.Raycaster();
        
        // _renderer = new THREE.WebGLRenderer({
        //     antialias: true,
        //     alpha: true,
        //     preserveDrawingBuffer: true});
        // _renderer.context.getExtension("EXT_frag_depth");

        _renderer = new THREE.WebGLRenderer();

        console.log("window.devicePixelRatio: " + window.devicePixelRatio);
        console.log(_3DSize);
        
        _renderer.setPixelRatio(window.devicePixelRatio);
        _renderer.setSize(_3DSize.width, _3DSize.height);


        
        $('#_3D').append(_renderer.domElement);
        _scene.add(_camera);

        //INIT CONTROLS
        var container = document.getElementsByTagName('canvas')[0];
        _controls = new THREE.TrackballControls(_camera, container);
        _controls.rotateSpeed = 4.0;
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


// BEG from example2_objLoader_raycasting.js
    // renderer = new THREE.WebGLRenderer();
    // renderer.setPixelRatio( window.devicePixelRatio );
        _threedModelAttributes = _this.loadJson("mesh/3543_W18_shimi_mainHouse.json");
        console.log("_threedModelAttributes");
        console.log(_threedModelAttributes);
    // renderer.setSize( window.innerWidth, window.innerHeight );
        console.log("_threedModelAttributes.connectivity[0].materialIndices");
        console.log(_threedModelAttributes.connectivity[0].materialIndices);
    // container.appendChild(renderer.domElement);

    // controls = new THREE.TrackballControls( camera, renderer.domElement );
    // controls.rotateSpeed = 0.5;
    // _controls.addEventListener( 'change', render );
        _wallsInfo = [];

        var wallInfo;
        
        wallInfo = _this.loadJson("mesh/room1/wall1/wall_image_attributes2.json");
        _wallsInfo.push(wallInfo);

        wallInfo = _this.loadJson("mesh/room1/wall3/wall_image_attributes2.json");
        _wallsInfo.push(wallInfo);

        wallInfo = _this.loadJson("mesh/room1/wall4/wall_image_attributes2.json");
        _wallsInfo.push(wallInfo);

        wallInfo = _this.loadJson("mesh/room1/wall5/wall_image_attributes2.json");
        _wallsInfo.push(wallInfo);

        wallInfo = _this.loadJson("mesh/room1/wall6/wall_image_attributes2.json");
        _wallsInfo.push(wallInfo);

        /////////////////////////////////////////////////////////////////
        // overlay images boundaries on 3d model
        /////////////////////////////////////////////////////////////////

        var materialYellow = new THREE.LineBasicMaterial({color: 0xffff00});
        _this.overlayWallsImagesBoundariesOn3dModel(materialYellow);

        /////////////////////////////////////////////////////////////////
        // add selected image
        /////////////////////////////////////////////////////////////////

        _selectedImageGeometry = new THREE.Geometry();

        var geometry1 = new THREE.Geometry();
        geometry1.colorsNeedUpdate = true;
        geometry1.verticesNeedUpdate = true;
        geometry1.needsUpdate = true;

        var materialBlue = new THREE.LineBasicMaterial({color: 0x0000ff});
        _selectedImageLineSegments = new THREE.LineSegments(geometry1, materialBlue);
        _scene.add( _selectedImageLineSegments )

        
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );

        var light = new THREE.AmbientLight("#808080");
        _scene.add(light);

        //EVENT HANDLERS
        var $canvas = $('canvas')[0];
        $canvas.addEventListener('touchmove', _controls.update.bind(_controls), false);
        $canvas.addEventListener('mousemove', _controls.update.bind(_controls), false);
        $canvas.addEventListener('mousewheel', _controls.update.bind(_controls), false);
        $canvas.addEventListener('DOMMouseScroll', _controls.update.bind(_controls), false); // firefox

        _controls.addEventListener('change', function () {
            MLJ.core.Scene.render();
            $($canvas).trigger('onControlsChange');
        });

        // MLJ.core.File.openMeshFile(input.files);
        console.log('foo1'); 
        MLJ.core.File.loadZipFile();
    }


    this.getCamera = function () {
        return _camera;
    };

    this.add = function (obj) {
	_scene.add( obj );
    };
    
    function disposeObject(obj) {
        if (obj.geometry)
            obj.geometry.dispose();
        if (obj.material)
            obj.material.dispose();
        if (obj.texture)
            obj.texture.dispose();
    }

    var lastID = 0;
    this.createLayer = function (name) {
        var layerName = "foo1";
        var layer = new MLJ.core.Layer(lastID++, layerName, new Module.CppMesh());
        return layer;
    };

    this.addSceneDecorator = function (name, decorator) {
        if (!(decorator instanceof THREE.Object3D)) {
            console.warn("MLJ.core.Scene.addSceneDecorator(): decorator parameter not an instance of THREE.Object3D");
            return;
        }

        _this.render();
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


    this.loadJson = function (json_filename) {
        var data;
        // https://blog-en.openalfa.com/how-to-read-synchronously-json-files-with-jquery
        $.ajax({ 
            url: json_filename, 
            dataType: 'json', 
            data: data, 
            async: false, 
            success: function(json){
                console.log('BEG getJSON'); 
                data = json;
                return;
            }
        });

        console.log('data2');
        console.log(data);

        return data;
    };

    this.calcDistance = function (point1, point2) {
    
        var a = point1.x - point2.x;
        var b = point1.y - point2.y;

        var dist = Math.sqrt( a*a + b*b );
        return dist;
    };
    
    this.calcNearestImage = function (faceIndex, materialIndex, intersectionUvCoord) {
        
        // console.log('materialIndex', materialIndex);
        // console.log('intersectionUvCoord', intersectionUvCoord);
        var minDist = 1E6;
        var wallIndex = -1;
        var imageIndex = -1;
        
        for (var i = 0; i < _wallsInfo.length; ++i) {
            // console.log('_wallsInfo[i].materialIndex', _wallsInfo[i].materialIndex);

            if(!_wallsInfo[i])
            {
                console.log('_wallsInfo[i] is not defined');
                continue;
            }
            
            if(materialIndex == _wallsInfo[i].materialIndex)
            {
                // console.log('_wallsInfo[i].materialName', _wallsInfo[i].materialName);
                
                wallIndex = i;
                for (var j = 0; j < _wallsInfo[i].imagesInfo.length; ++j) {
                    var imageInfo = _wallsInfo[i].imagesInfo[j];
                    // console.log('imageInfo.centerPoint.uvCoordsNormalized', imageInfo.centerPoint.uvCoordsNormalized);

                    dist = _this.calcDistance(intersectionUvCoord, imageInfo.centerPoint.uvCoordsNormalized);
                    if(dist < minDist)
                    {
                        minDist = dist;
                        // console.log('minDist', minDist);
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
        var imageFileName = imageInfo.imageFileName;
        // console.log('imageFileName: ' + imageFileName);

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
        console.log('imagesInfo.length', imagesInfo.length); 
        for (var i = 0; i < imagesInfo.length; ++i) {
            var vertices2 = _this.addImageBoundaries(imagesInfo[i]);
            vertices1.push.apply(vertices1, vertices2)

            // // do only i images
            // if (i==2)
            // {
            //     break;
            // }
            
        }
        console.log('vertices1'); 
        console.log(vertices1); 
        return vertices1;
    };
    
    this.overlayWallImageBoundariesOn3dModel = function (imageInfo, material) {
        _scene.remove( _selectedImageLineSegments );

        _selectedImageGeometry = new THREE.Geometry();
        _selectedImageGeometry.vertices = _this.addImageBoundaries(imageInfo);
        _selectedImageGeometry.colorsNeedUpdate = true;
        _selectedImageGeometry.verticesNeedUpdate = true;
        _selectedImageGeometry.needsUpdate = true;

        // console.log("_selectedImageGeometry.vertices.length 2: " + _selectedImageGeometry.vertices.length);

        _selectedImageLineSegments = new THREE.LineSegments( _selectedImageGeometry, material );
        // _selectedImageLineSegments.geometry.vertices = _selectedImageGeometry.vertices;
        // _selectedImageLineSegments.material = material;
        _selectedImageLineSegments.material.needsUpdate = true;
        
        // console.log('_selectedImageLineSegments'); 
        // console.log(_selectedImageLineSegments); 

        // console.log('_selectedImageLineSegments.geometry.verticesNeedUpdate', _selectedImageLineSegments.geometry.verticesNeedUpdate);
        
        // console.log('_selectedImageLineSegments2'); 
        // console.log(_selectedImageLineSegments); 

        // console.log('_this'); 
        // console.log(_this); 
        // console.log('_scene'); 
        // console.log(_scene); 

        _scene.add( _selectedImageLineSegments )
        _renderer.render(_scene, _camera);
        
        // _selectedImageLineSegments.geometry.setDrawRange( 0, _selectedImageGeometry.vertices.length );
        // _selectedImageLineSegments.geometry.attributes.position.needsUpdate = true;
        // _selectedImageLineSegments.geometry.dynamic = true;
    };

    this.overlayWallsImagesBoundariesOn3dModel = function (material) {
        var vertices1 = [];
        var geometry = new THREE.Geometry();
        console.log('_wallsInfo.length'); 
        console.log(_wallsInfo.length); 
        for (var i = 0; i < _wallsInfo.length; ++i) {
            console.log('i: ' + i); 
            console.log('_wallsInfo[i]'); 
            console.log(_wallsInfo[i]); 
            var vertices2 = _this.addImagesBoundaries(_wallsInfo[i].imagesInfo);
            vertices1.push.apply(vertices1, vertices2)
        }
        geometry.vertices = vertices1;
        console.log("geometry.vertices.length: " + geometry.vertices.length);
        var lineSegments = new THREE.LineSegments( geometry, material );
        _scene.add( lineSegments )
    }


    this.findIntersections = function () {
        // BEG from example2_objLoader_raycasting.js
        if(firstTime2)
        {
            theta = 210;

            // _camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
            // _camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
            // _camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
            // _camera.lookAt( _scene.position );
            // 635.6918948146395, y: 1939.0039473649608, z: 379.935574444918
            _camera.position.z = 800;
            _camera.position.x = 1200;
            _camera.position.y = 3800;
            
            _camera.updateMatrixWorld();
            
            console.log("_camera: ");
            console.log(_camera);
            // str = JSON.stringify(_camera, null, 4); // (Optional) beautiful indented output.
            // console.log(str); // Logs output to dev tools console.
            
            firstTime2 = false;
        }
        
        _raycaster.setFromCamera( _mouse, _camera );

        // str = JSON.stringify(_camera, null, 4); // (Optional) beautiful indented output.
        // console.log(str); // Logs output to dev tools console.
        
        var intersects = _raycaster.intersectObjects( _scene.children, true );
        // find intersections
        
        if ( intersects.length > 0 ) {

        // console.log("_scene.children");
            var intersection = intersects[0];
        // console.log(_scene.children);
        
        // console.log("intersects.length1: " + intersects.length);

            // console.log("Found intersections");

            // console.log("intersection");
            // console.log(intersection);
            
            var faceIndex = intersection.faceIndex / 3;
            // console.log("faceIndex: " + faceIndex);
            
            var materialIndex1 = Math.floor(faceIndex/2);
            // console.log("materialIndex1: " + materialIndex1);

            var indexInMaterialIndices = faceIndex;
            var materialIndex2 = _threedModelAttributes.connectivity[0].materialIndices[indexInMaterialIndices];
            // console.log("materialIndex2: " + materialIndex2);

            var materialIndex = materialIndex1;

            var intersectionObj = intersection.object;

            // // geom has "type: "BufferGeometry""
            var geom = intersectionObj.geometry;
            
            var groupIndex = Math.floor(intersection.faceIndex / 6);
            // console.log("groupIndex: " + groupIndex);

            var intersectionUvCoord = intersection.uv;
            // console.log("intersectionUvCoord x,y: " + intersectionUvCoord.x + ", " + intersectionUvCoord.y);

            /////////////////////////////////////////////////////////////
            // Calc the nearest image to the point
            /////////////////////////////////////////////////////////////

            var retVal = _this.calcNearestImage(faceIndex, materialIndex2, intersectionUvCoord);
            // console.log('retVal.wallIndex: '+ retVal.wallIndex); 
            // console.log('retVal.wallIndex: '+ retVal.wallIndex); 
            // console.log('retVal.imageIndex: '+ retVal.imageIndex); 
            var wallIndex = retVal.wallIndex;
            var imageIndex = retVal.imageIndex;
            
            if ( ( intersectionPrev != intersectionObj ) ||
                 ((intersectionPrev != null) && (intersectionPrev.materialIndex != materialIndex)) )
            {

                if ( intersectionPrev  && intersectionPrev.material[intersectionPrev.materialIndex])
                {
                    intersectionPrev.material[intersectionPrev.materialIndex].emissive.setHex( intersectionPrev.currentHex );
                }

                intersectionPrev = intersectionObj;
                if(intersectionPrev.material[materialIndex])
                {
                    intersectionPrev.currentHex = intersectionPrev.material[materialIndex].emissive.getHex();
                }
                intersectionPrev.materialIndex = materialIndex;
                intersectionPrev.material[materialIndex].emissive.setHex( 0xff0000 );

                /////////////////////////////////////////////////////////////////
                // overlay image boundaries on 3d model in red
                /////////////////////////////////////////////////////////////////

                // console.log('wallIndex: '+ wallIndex); 
                // console.log('imageIndex: '+ imageIndex); 
                // console.log('_wallsInfo[wallIndex]'); 
                // console.log(_wallsInfo[wallIndex]); 
                // console.log('_wallsInfo[wallIndex].imagesInfo[imageIndex]'); 
                // console.log(_wallsInfo[wallIndex].imagesInfo[imageIndex]); 
                
                var imageInfo = _wallsInfo[wallIndex].imagesInfo[imageIndex];
                // var materialRed = new THREE.LineBasicMaterial({color: 0xff0000});
                var materialBlue = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth: 5});
                _this.overlayWallImageBoundariesOn3dModel(imageInfo, materialBlue);
                
            }
            
        } else {
            // console.log("NOT Found intersections");

            if ( intersectionPrev  && intersectionPrev.material[intersectionPrev.materialIndex])
            {
                intersectionPrev.material[intersectionPrev.materialIndex].emissive.setHex( intersectionPrev.currentHex );
            }
            intersectionPrev = null;
        }
    }

    this.render = function (fromReqAnimFrame) {

        /////////////////////////////////////////////////////////////////
        // find intersections
        /////////////////////////////////////////////////////////////////

        _this.findIntersections();

        // END from example2_objLoader_raycasting.js

        _renderer.render(_scene, _camera);

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
