/*
 * @author zz85 / https://github.com/zz85
 * @author mrdoob / http://mrdoob.com
 * Running this will allow you to drag three.js objects around the screen.
 */

THREE.Edit3dModelOverlayTrackballControls = function ( pivotGroup,
                                                       structureMeshGroup,
                                                       overlayMeshGroup,
                                                       selectedOverlayVertexHelperGroup,
                                                       _camera,
                                                       _domElement ) {

    var STATE = { NONE: - 1, EDIT_OVERLAY_RECT: 0, NA: 1, DELETE_OVERLAY_RECT: 2 };
    var _raycaster = new THREE.Raycaster();
    var _mouse = new THREE.Vector2();
    var _offset = new THREE.Vector3();
    var _intersection = new THREE.Vector3();

    var _selectedStructureObj = null;
    var _selectedOverlayRectObj = null;
    var _selectedOverlayVertexObj = null;
    
    var _hovered = null;
    var scope = this;

    var _scaleVec = new THREE.Vector3(1, 1, 1);
    
    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start' };
    var endEvent = { type: 'end' };
    
    this.isMouseDown = false;
    this.isTouchDown = false;

    function activate() {

        _domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
        _domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
        _domElement.addEventListener( 'mouseup', onDocumentMouseCancel, false );
        _domElement.addEventListener( 'mouseleave', onDocumentMouseCancel, false );
        _domElement.addEventListener( 'wheel', onMouseWheel, false );
    }

    function deactivate() {

        _domElement.removeEventListener( 'mousemove', onDocumentMouseMove, false );
        _domElement.removeEventListener( 'mousedown', onDocumentMouseDown, false );
        _domElement.removeEventListener( 'mouseup', onDocumentMouseCancel, false );
        _domElement.removeEventListener( 'mouseleave', onDocumentMouseCancel, false );
        _domElement.removeEventListener( 'wheel', onMouseWheel, false );
    }

    function dispose() {

        deactivate();
    }

    function clampOverlayRectPosition() {

        // console.log('BEG clampOverlayRectPosition');
        
        ///////////////////////////////////////
        // clamp the position of overlayRect - Using bbox
        ///////////////////////////////////////

        // Get the center and size of of bboxStruct
        // bboxStruct vertices are relative to pivot
        let bboxStruct = _selectedStructureObj.geometry.boundingBox;
        let centerBboxStruct = new THREE.Vector3();
        bboxStruct.getCenter( centerBboxStruct );
        let sizeBboxStruct = new THREE.Vector3();
        bboxStruct.getSize(sizeBboxStruct);

        // Get the size of bboxORect
        // bboxORect vertices are relative to bboxORect position
        let bboxORect = _selectedOverlayRectObj.geometry.boundingBox;
        let sizeBboxORect = new THREE.Vector3();
        bboxORect.getSize(sizeBboxORect);

        let unitScale = new THREE.Vector3(1, 1, 1);
        // TBD - the vertices are in regard to the original scale factor of 0.8
        //       this needs to be generalized (maybe on mousedown see comment in this file: "possibly get the original scale here")
        let origScale = new THREE.Vector3(0.8, 0.8, 0.8);
        let scaleNormalized = new THREE.Vector3();
        scaleNormalized.copy(unitScale);
        scaleNormalized.divide(origScale);
        scaleNormalized.multiply(_selectedOverlayRectObj.scale);

        let sizeScaledBboxORect = new THREE.Vector3();
        sizeScaledBboxORect.multiplyVectors(sizeBboxORect, scaleNormalized);


        // Set bbox1 - the new overlayRect bbox (possibly scaled, and translated)
        // center is centerBboxStruct
        // size is (sizeBboxStruct - (sizeBboxORect*scale))
        let bbox1 = new THREE.Box3();
        bbox1.copy (bboxStruct);
        let centerBbox1 = new THREE.Vector3();
        bbox1.getCenter( centerBbox1 );

        let sizeBbox3 = new THREE.Vector3();
        sizeBbox3.subVectors(sizeBboxStruct, sizeScaledBboxORect);

        bbox1.setFromCenterAndSize ( centerBbox1, sizeBbox3 );

        let positionRectNewClamped = new THREE.Vector3();
        bbox1.clampPoint(_selectedOverlayRectObj.position, positionRectNewClamped);
        _selectedOverlayRectObj.position.copy(positionRectNewClamped);
    };

    
    function updateVertexHelpersLocation() {

        // console.log('BEG updateVertexHelpersLocation');

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

        // console.log('BEG translateOverlayRect'); 

        ///////////////////////////////////////
        // move the position of overlayRect
        ///////////////////////////////////////

        _selectedOverlayRectObj.position.copy( _intersection.point.sub( _offset ) );
        clampOverlayRectPosition();
        
        updateVertexHelpersLocation();
    };

    function calcScaleVec() {
        console.log('BEG calcScaleVec'); 

        let selectedOverlayRectObj_position = MLJ.util.getNestedObject(_selectedOverlayRectObj, ['position']);
        if(!selectedOverlayRectObj_position)
        {
            return;
        }

        // bboxORect vertices are relative to bboxORect position, which is relative to pivot position
        let bboxORect = _selectedOverlayRectObj.geometry.boundingBox;
        let centerBbox1 = new THREE.Vector3();
        bboxORect.getCenter( centerBbox1 );
        
        // https://stackoverflow.com/questions/15098479/how-to-get-the-global-world-position-of-a-child-object
        let selectedOverlayRectObjPosWorld = new THREE.Vector3();
        selectedOverlayRectObjPosWorld.setFromMatrixPosition( _selectedOverlayRectObj.matrixWorld );

        let centerBbox1World = new THREE.Vector3();
        centerBbox1World.addVectors(selectedOverlayRectObjPosWorld, centerBbox1);

        // distIntersectionPoint - distance between intersection point and the center of the bbox of selectedOverlayRectObj (in world coords)
        let distIntersectionPoint = new THREE.Vector3();
        //  _intersection.point is in world coordinates (https://threejs.org/docs/#api/en/core/Raycaster)
        distIntersectionPoint.copy(_intersection.point).sub(centerBbox1World);

        let selectedOverlayVertexObjPosWorld = new THREE.Vector3();
        selectedOverlayVertexObjPosWorld.addVectors(selectedOverlayRectObjPosWorld, _selectedOverlayVertexObj.position);

        // distVertexHelper - distance between vertexHelper and the center of the bbox of selectedOverlayRectObj (in world coords)
        var distVertexHelper = new THREE.Vector3();
        distVertexHelper.copy(selectedOverlayVertexObjPosWorld).sub(centerBbox1World);

        let scaleVec = new THREE.Vector3(1.0, 1.0, 1.0);
        if(distVertexHelper.x != 0) {scaleVec.x = distIntersectionPoint.x / distVertexHelper.x;} 

        if(distVertexHelper.y != 0){scaleVec.y = distIntersectionPoint.y / distVertexHelper.y;}

        if(distVertexHelper.z != 0){scaleVec.z = distIntersectionPoint.z / distVertexHelper.z;}
        
        return scaleVec;
    };

    function resizeOverlayRect(scaleVec) {

        console.log('BEG resizeOverlayRect'); 

        let increaseRatio = new THREE.Vector3(Math.abs(scaleVec.x), Math.abs(scaleVec.y), Math.abs(scaleVec.z));
        console.log('increaseRatio', increaseRatio);
        
        // clamp scale
        // smallest size can be 5% of the intersectedStructureObject
        let scaleMin = new THREE.Vector3(0.05, 0.05, 0.05);
        let scaleMax = new THREE.Vector3(0.9, 0.9, 0.9);

        increaseRatio.clamp(scaleMin, scaleMax);

        _selectedOverlayRectObj.scale.copy(increaseRatio);

        _selectedOverlayRectObj.material.userData.scale.copy(_selectedOverlayRectObj.scale);

        clampOverlayRectPosition();
        
        updateVertexHelpersLocation();
    };


    function onDocumentMouseDown( event ) {

//         console.log('BEG onDocumentMouseDown');
        scope.isMouseDown = true;
        
        if( !MLJ.core.Scene3D.getEdit3dModelOverlayFlag() )
        {
            // Do nothing. Not in editing mode.
            return;
        }

        // findIntersections on mouse down prevents from side effects
        // e.g. the following useCase:
        // - in edit mode
        // - having intersection from previous mousedown interaction
        // - clicking in non overlayRect area
        // - without the call to findIntersections the previously selected overlay rect will be moved
        // - with the call to findIntersections, intersects with the non overlayRect area, and clears the intersection info ->
        //   which results in nothing gets moved - good!
        MLJ.core.Scene3D.findIntersections();
        
        let intersectionInfo = MLJ.core.Scene3D.getIntersectionInfo();
        
        event.preventDefault();
        event.stopPropagation();
        
        switch ( event.button ) {

            case STATE.EDIT_OVERLAY_RECT:

                _mouse = MLJ.core.Scene3D.getMouse3D();
                _camera = MLJ.core.Scene3D.getCamera3D();
                _raycaster.setFromCamera( _mouse, _camera );

                 _selectedOverlayRectObj = MLJ.util.getNestedObject(intersectionInfo, ['intersectedOverlayRect', 'object']);
                _selectedOverlayVertexObj = MLJ.util.getNestedObject(intersectionInfo, ['intersectedOverlayVertex', 'object']);

                let editMode = MLJ.core.Scene3D.getEditMode();

                if(editMode == 'NewRect')
                {
                    let intersectedStructureObjectId = MLJ.util.getNestedObject(intersectionInfo, ['intersectedStructure', 'object', 'id']);
                    if( intersectedStructureObjectId )
                    {
                        MLJ.core.Scene3D.insertRectangularMesh();
                    }
                }
                else if(editMode == 'DeleteRect')
                {
                    MLJ.core.Scene3D.deleteRectangularMesh();
                }
                else if(editMode == 'UpdateRect')
                {
                    console.log('_selectedOverlayRectObj', _selectedOverlayRectObj);
                    
                    if(_selectedOverlayRectObj || _selectedOverlayVertexObj)
                    {
                        if(_selectedOverlayRectObj)
                        {
                            let intersects = _raycaster.intersectObjects( structureMeshGroup.children, true );
                            if(intersects.length > 0)
                            {
                                _intersection = intersects[0];

                                _selectedStructureObj = _intersection.object;

                                // set _offset to be the offset between
                                // the intersection point and the _selectedOverlayRectObj position 
                                _offset.copy(_intersection.point).sub(_selectedOverlayRectObj.position);

                                // TBD - possibly get the original scale here
                                // see comment in this file "this needs to be generalized"
                            }
                        }

                        _domElement.style.cursor = 'move';
                    }
                }
                
                break;
                
        }
                
    }

    function onDocumentMouseMove( event ) {

        // console.log('BEG onDocumentMouseMove');

        // disable isMouseDown to prevent calling findIntersections, when resizing the vertices ??
        // scope.isMouseDown = false;
        
        if( !MLJ.core.Scene3D.getEdit3dModelOverlayFlag() )
        {
            // Do nothing. Not in editing mode.
            return;
        }

        event.preventDefault();

        var rect = _domElement.getBoundingClientRect();

        _mouse = MLJ.core.Scene3D.getMouse3D();
        _camera = MLJ.core.Scene3D.getCamera3D();
        
        _raycaster.setFromCamera( _mouse, _camera );

        // if ( _selectedOverlayRectObj && scope.enabled ) {
        if ( _selectedOverlayRectObj || _selectedOverlayVertexObj ) {

            var intersects2 = _raycaster.intersectObjects( [_selectedStructureObj] );
            if(intersects2.length > 0)
            {
                _intersection = intersects2[0];

                if(_selectedOverlayVertexObj)
                {
                    console.log('_selectedOverlayRectObj', _selectedOverlayRectObj); 
                    let scaleVec1 = calcScaleVec();
                    resizeOverlayRect(scaleVec1);
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


    function handleMouseWheel( event ) {

        console.log( 'handleMouseWheel' );

        if ( event.deltaY < 0 ) {

            console.log('_selectedOverlayRectObj1', _selectedOverlayRectObj);
            let scaleVec1 = new THREE.Vector3(1.1, 1.1, 1.1);
            _scaleVec.multiply(scaleVec1);
            resizeOverlayRect(_scaleVec);

        } else if ( event.deltaY > 0 ) {

            console.log('_selectedOverlayRectObj2', _selectedOverlayRectObj); 
            let scaleVec1 = new THREE.Vector3(0.9, 0.9, 0.9);
            _scaleVec.multiply(scaleVec1);
            resizeOverlayRect(_scaleVec);

        }

        // scope.update();

    }

    function onMouseWheel( event ) {
        console.log('BEG onMouseWheel');
        
        // TBD
        // Resize overlayRect
        if( !MLJ.core.Scene3D.getEdit3dModelOverlayFlag() )
        {
            // Do nothing. Not in editing mode.
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        scope.dispatchEvent( startEvent );

        if(_selectedOverlayRectObj)
        {
            handleMouseWheel( event );
        }
        else
        {
            console.log('_selectedOverlayRectObj is not defined'); 
        }

        scope.dispatchEvent( endEvent );
        
    }

    function onDocumentMouseCancel( event ) {
//         console.log('BEG onDocumentMouseCancel');

        scope.isMouseDown = false;
        
        if( !MLJ.core.Scene3D.getEdit3dModelOverlayFlag() )
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
