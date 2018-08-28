/*
 * @author zz85 / https://github.com/zz85
 * @author mrdoob / http://mrdoob.com
 * Running this will allow you to drag three.js objects around the screen.
 */

THREE.Edit3dModelOverlayTrackballControls = function ( structureMeshGroup,
                                                       overlayMeshGroup,
                                                       intersectionInfo,
                                                       selectedOverlayVertexHelperGroup,
                                                       _camera,
                                                       _domElement ) {

    var STATE = { NONE: - 1, INSERT_UPDATE_OVERLAY_RECT: 0, NA: 1, DELETE_OVERLAY_RECT: 2 };
    var _raycaster = new THREE.Raycaster();
    var _mouse = new THREE.Vector2();
    var _offset = new THREE.Vector3();
    var _intersection = new THREE.Vector3();

    var _selectedStructureObj = null;
    var _selectedOverlayRectObj = null;
    var _selectedOverlayVertexObj = null;
    
    var _hovered = null;
    var scope = this;

    function activate() {

        _domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
        _domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
        _domElement.addEventListener( 'mouseup', onDocumentMouseCancel, false );
        _domElement.addEventListener( 'mouseleave', onDocumentMouseCancel, false );

    }

    function deactivate() {

        _domElement.removeEventListener( 'mousemove', onDocumentMouseMove, false );
        _domElement.removeEventListener( 'mousedown', onDocumentMouseDown, false );
        _domElement.removeEventListener( 'mouseup', onDocumentMouseCancel, false );
        _domElement.removeEventListener( 'mouseleave', onDocumentMouseCancel, false );

    }

    function dispose() {

        deactivate();
    }

    function clampOverlayRectPosition() {

        ///////////////////////////////////////
        // clamp the position of overlayRect
        ///////////////////////////////////////

        let diff_overlayRect_vertex_position = new THREE.Vector3();
        let positionRange = new THREE.Vector3();
        
        if ( _selectedOverlayRectObj.geometry instanceof THREE.Geometry )
        {
            diff_overlayRect_vertex_position.copy( _selectedOverlayRectObj.geometry.vertices[0] );
            
        }
        else if ( _selectedOverlayRectObj.geometry instanceof THREE.BufferGeometry ) {
//             console.error('Handling of _selectedOverlayRectObj.geometry instanceof THREE.BufferGeometry is not implemented yet2');
//             return;
    
            _selectedOverlayRectObj.geometry = new THREE.Geometry().fromBufferGeometry( _selectedOverlayRectObj.geometry );
            _selectedOverlayRectObj.geometry.mergeVertices();
            diff_overlayRect_vertex_position.copy( _selectedOverlayRectObj.geometry.vertices[0] );

        }
        else
        {
            console.error('Invalid _selectedOverlayRectObj.geometry'); 
       }

        let scale_complement = new THREE.Vector3();
        scale_complement.set(1,1,1).sub(_selectedOverlayRectObj.scale);
        
        var positionRangeTmp = new THREE.Vector3();
        positionRangeTmp.multiplyVectors( diff_overlayRect_vertex_position, scale_complement );
        
        positionRange.set(Math.abs(positionRangeTmp.x), Math.abs(positionRangeTmp.y), Math.abs(positionRangeTmp.z));

        let material_userData_origPosition = MLJ.util.getNestedObject(_selectedOverlayRectObj, ['material', 'userData', 'origPosition']);
        
        if(material_userData_origPosition)
        {
            let positionMin = new THREE.Vector3(0, 0, 0);
            positionMin.copy(material_userData_origPosition).sub(positionRange);

            let positionMax = new THREE.Vector3(0, 0, 0);
            positionMax.copy(material_userData_origPosition).add(positionRange);

            var positionRectNewClamped = new THREE.Vector3();
            positionRectNewClamped.copy(_selectedOverlayRectObj.position);
            
            positionRectNewClamped.clamp(positionMin, positionMax);

            _selectedOverlayRectObj.position.copy(positionRectNewClamped);
        }

        console.log('_selectedOverlayRectObj.position', _selectedOverlayRectObj.position); 
        console.log('_selectedOverlayRectObj.scale', _selectedOverlayRectObj.scale); 
        console.log('_selectedOverlayRectObj.geometry.vertices', _selectedOverlayRectObj.geometry.vertices); 
        console.log('_selectedOverlayRectObj.geometry.boundingBox', _selectedOverlayRectObj.geometry.boundingBox); 
    };


    function updateVertexHelpersLocation() {

        ///////////////////////////////////////
        // update the location of vertexHelpers
        ///////////////////////////////////////

        if ( _selectedOverlayRectObj.geometry instanceof THREE.BufferGeometry ) {
            console.error('Handling of _selectedOverlayRectObj.geometry instanceof THREE.BufferGeometry is not implemented yet'); 

            _selectedOverlayRectObj.geometry = new THREE.Geometry().fromBufferGeometry( _selectedOverlayRectObj.geometry );
            _selectedOverlayRectObj.geometry.mergeVertices();
            
            for(var i=0;i<_selectedOverlayRectObj.geometry.vertices.length;i++)
            {
                var vertex = _selectedOverlayRectObj.geometry.vertices[i];
                selectedOverlayVertexHelperGroup.children[i].position.copy(vertex);
            }
            selectedOverlayVertexHelperGroup.position.copy(_selectedOverlayRectObj.position);
            selectedOverlayVertexHelperGroup.scale.copy(_selectedOverlayRectObj.scale);

        }
        else if ( _selectedOverlayRectObj.geometry instanceof THREE.Geometry ) {
            for(var i=0;i<_selectedOverlayRectObj.geometry.vertices.length;i++)
            {
                var vertex = _selectedOverlayRectObj.geometry.vertices[i];
                selectedOverlayVertexHelperGroup.children[i].position.copy(vertex);
            }
            selectedOverlayVertexHelperGroup.position.copy(_selectedOverlayRectObj.position);
            selectedOverlayVertexHelperGroup.scale.copy(_selectedOverlayRectObj.scale);
        }
        else
        {
            console.error('Invalid _selectedOverlayRectObj.geometry');
            return;
        }
    };
    
    function translateOverlayRect() {
        
        ///////////////////////////////////////
        // move the position of overlayRect
        ///////////////////////////////////////

        _selectedOverlayRectObj.position.copy( _intersection.point.sub( _offset ) );
            // console.log('_selectedOverlayRectObj.position', _selectedOverlayRectObj.position);

         clampOverlayRectPosition(); 

         updateVertexHelpersLocation();
    };


    function resizeOverlayRect() {

        let _selectedOverlayRectObj_position = MLJ.util.getNestedObject(_selectedOverlayRectObj, ['position']);
        if(!_selectedOverlayRectObj_position)
        {
            return;
        }

        // arg1 - distance between intersection point and the origin of _selectedOverlayRectObj
        // arg2 - distance between vertexHelper and the origin of _selectedOverlayRectObj
        var arg1 = new THREE.Vector3();
        arg1.copy(_intersection.point).sub(_selectedOverlayRectObj.position);

        var arg2 = new THREE.Vector3();
        arg2.copy(_selectedOverlayVertexObj.position);

        let scaleX = 1.0;
        if(arg2.x != 0) {scaleX = arg1.x / arg2.x;} 

        let scaleY = 1.0;
        if(arg2.y != 0){scaleY = arg1.y / arg2.y;}

        let scaleZ = 1.0;
        if(arg2.z != 0){scaleZ = arg1.z / arg2.z;}

        var arg = new THREE.Vector3(scaleX, scaleY, scaleZ);

        var increaseRatio = new THREE.Vector3(Math.abs(arg.x), Math.abs(arg.y), Math.abs(arg.z));

        // clamp scale
        let scaleMin = new THREE.Vector3(0.2, 0.2, 0.2);
        let scaleMax = new THREE.Vector3(1, 1, 1);

        increaseRatio.clamp(scaleMin, scaleMax);
        // console.log('increaseRatio', increaseRatio);

        _selectedOverlayRectObj.scale.set(increaseRatio.x, increaseRatio.y, increaseRatio.z);

        let scale1 = new THREE.Vector3(0, 0, 0);
        scale1.copy(_selectedOverlayRectObj.scale);
        _selectedOverlayRectObj.material.userData.scale = scale1;

        clampOverlayRectPosition();
        
        updateVertexHelpersLocation();
    };


    function onDocumentMouseDown( event ) {

        if( !MLJ.core.Scene.getEdit3dModelOverlayFlag() )
        {
            // Do nothing. Not in editing mode.
            return;
        }

        if(event.button === STATE.INSERT_UPDATE_OVERLAY_RECT)
        {
            event.preventDefault();

            _mouse = MLJ.core.Scene.getMouse();
            _camera = MLJ.core.Scene.getCamera();
            _raycaster.setFromCamera( _mouse, _camera );
            
            // _selectedStructureObj = MLJ.util.getNestedObject(intersectionInfo, ['intersectedStructure', 'object']);
            _selectedOverlayRectObj = MLJ.util.getNestedObject(intersectionInfo, ['intersectedOverlayRect', 'object']);
            _selectedOverlayVertexObj = MLJ.util.getNestedObject(intersectionInfo, ['intersectedOverlayVertex', 'object']);

           
            if(_selectedOverlayRectObj || _selectedOverlayVertexObj)
            {
                if(_selectedOverlayRectObj)
                {
                    let intersects = _raycaster.intersectObjects( structureMeshGroup.children, true );
                    if(intersects.length > 0)
                    {
                        _intersection = intersects[0];

                        _selectedStructureObj = _intersection.object;

                        // set _offset to be the offset between the intersection point and the origin 
                        _offset.copy( _intersection.point ).sub( _selectedOverlayRectObj.position );
                    }
                }

                _domElement.style.cursor = 'move';

                scope.dispatchEvent( { type: 'dragstart', object: _selectedOverlayRectObj } );
            }
            else
            {
                var intersectedStructureObjectId = MLJ.util.getNestedObject(intersectionInfo, ['intersectedStructure', 'object', 'id']);
                if( intersectedStructureObjectId )
                {
                    MLJ.core.Scene.insertRectangularMesh();
                }
            }
            
        }

    }

    function onDocumentMouseMove( event ) {

        if( !MLJ.core.Scene.getEdit3dModelOverlayFlag() )
        {
            // Do nothing. Not in editing mode.
            return;
        }

        event.preventDefault();

        var rect = _domElement.getBoundingClientRect();

        _mouse = MLJ.core.Scene.getMouse();
        _camera = MLJ.core.Scene.getCamera();
        
        _raycaster.setFromCamera( _mouse, _camera );


        // if ( _selectedOverlayRectObj && scope.enabled ) {
        if ( _selectedOverlayRectObj || _selectedOverlayVertexObj ) {

//             _selectedOverlayRectObj.rotation.y += 0.05;

            var intersects2 = _raycaster.intersectObjects( [_selectedStructureObj] );
            if(intersects2.length > 0)
            {
                _intersection = intersects2[0];

                if(_selectedOverlayVertexObj)
                {
                    resizeOverlayRect();
                }
                else
                {
                    translateOverlayRect();
                }
                
            }

            scope.dispatchEvent( { type: 'drag', object: _selectedOverlayRectObj } );

            return;

        }

        _raycaster.setFromCamera( _mouse, _camera );

        var overlayRectAndVertices = overlayMeshGroup.children.concat(selectedOverlayVertexHelperGroup.children);
        var intersects = _raycaster.intersectObjects( overlayRectAndVertices, true );
        
        if ( intersects.length > 0 ) {
            // console.log('intersects3', intersects);
            
            var object = intersects[0].object;
            
            if ( _hovered !== object ) {

                scope.dispatchEvent( { type: 'hoveron', object: object } );

                _domElement.style.cursor = 'pointer';
                _hovered = object;

            }

        }
        else {

            if ( _hovered !== null ) {

                scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );

                _domElement.style.cursor = 'auto';
                _hovered = null;

            }

        }

    }

    function onDocumentMouseCancel( event ) {

        if( !MLJ.core.Scene.getEdit3dModelOverlayFlag() )
        {
            // Do nothing. Not in editing mode.
            return;
        }

        event.preventDefault();

        if ( _selectedOverlayRectObj ) {

            scope.dispatchEvent( { type: 'dragend', object: _selectedOverlayRectObj } );

            _selectedOverlayRectObj = null;

        }

        _domElement.style.cursor = _hovered ? 'pointer' : 'auto';

    }

    activate();

    // API

    // this.enabled = true;

    this.activate = activate;
    this.deactivate = deactivate;
    this.dispose = dispose;

    
    // Backward compatibility

    this.setObjects = function () {

        console.error( 'THREE.Edit3dModelOverlayTrackballControls: setObjects() has been removed.' );

    };

    this.on = function ( type, listener ) {

        console.warn( 'THREE.Edit3dModelOverlayTrackballControls: on() has been deprecated. Use addEventListener() instead.' );
        scope.addEventListener( type, listener );

    };

    this.off = function ( type, listener ) {

        console.warn( 'THREE.Edit3dModelOverlayTrackballControls: off() has been deprecated. Use removeEventListener() instead.' );
        scope.removeEventListener( type, listener );

    };

    this.notify = function ( type ) {

        console.error( 'THREE.Edit3dModelOverlayTrackballControls: notify() has been deprecated. Use dispatchEvent() instead.' );
        scope.dispatchEvent( { type: type } );

    };

};

THREE.Edit3dModelOverlayTrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.Edit3dModelOverlayTrackballControls.prototype.constructor = THREE.Edit3dModelOverlayTrackballControls;
