/*
 * @author zz85 / https://github.com/zz85
 * @author mrdoob / http://mrdoob.com
 * Running this will allow you to drag three.js objects around the screen.
 */

THREE.EditOverlayRect_Scene3DtopDown_TrackballControls = function ( _camera,
                                                                    _domElement ) {

    var STATE = { NONE: - 1, EDIT_OVERLAY_RECT: 0, NA1: 1, NA2: 2 };
    var _raycaster = new THREE.Raycaster();
    var _mouse = new THREE.Vector2();
    var _offset = new THREE.Vector3();
    var _intersection = new THREE.Vector3();

    var _selectedStructureObj = null;
    var _selectedOverlayRectObj = null;

    var _hovered = null;
    var scope = this;

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

    function translateOverlayRect2() {

//         console.log('BEG translateOverlayRect2'); 

        ///////////////////////////////////////
        // move the position of overlayRect
        ///////////////////////////////////////

        _selectedOverlayRectObj.position.copy( _intersection.point.sub( _offset ) );
        // console.log('_intersection.point', _intersection.point);
        
//         console.log('_selectedOverlayRectObj.position', _selectedOverlayRectObj.position);
//         console.log('_selectedOverlayRectObj', _selectedOverlayRectObj);


        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        let overlayMeshGroup = selectedLayer.getOverlayMeshGroup();
        var object = overlayMeshGroup.getObjectByName( _selectedOverlayRectObj.name, true );
        object.position.copy(_selectedOverlayRectObj.position);
    };

    function onDocumentMouseDown( event ) {

//         console.log('BEG onDocumentMouseDown');
        scope.isMouseDown = true;
        
        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        if( !selectedLayer.getEditOverlayRectFlag() )
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
        MLJ.core.Scene3DtopDown.findIntersections();

        let intersectedStructureInfo = MLJ.core.Scene3DtopDown.getIntersectionStructureInfo();
        let intersectedOverlayRectInfo = MLJ.core.Scene3DtopDown.getIntersectionOverlayRectInfo2();

        let selectedFloorInfo = selectedLayer.getSelectedFloorInfo();

        event.preventDefault();
        event.stopPropagation();
        
        switch ( event.button ) {

            case STATE.EDIT_OVERLAY_RECT:

                _mouse = MLJ.core.Scene3DtopDown.getMouse3D();
//                 console.log('_mouse', _mouse); 
                _camera = MLJ.core.Scene3DtopDown.getCamera3D();
                _raycaster.setFromCamera( _mouse, _camera );

                _selectedStructureObj = MLJ.util.getNestedObject(intersectedStructureInfo, ['currentIntersection', 'object']);
                _selectedOverlayRectObj = MLJ.util.getNestedObject(intersectedOverlayRectInfo, ['currentIntersection', 'object']);

                let editMode = selectedLayer.getEditMode();

                if(editMode == 'NewRect')
                {
                    // let intersectedStructureObjectId = MLJ.util.getNestedObject(intersectedStructureInfo, ['currentIntersection', 'object', 'id']);
                    // if( intersectedStructureObjectId )
                    // {
                    //     MLJ.core.Scene3DtopDown.insertRectangularMesh();
                    // }

                    
                    MLJ.core.Scene3DtopDown.insertRectangularMesh2();
                }
                else if(editMode == 'DeleteRect')
                {

                    let overlayMeshGroup = selectedLayer.getOverlayMeshGroup();
                    var overlayMeshRect = overlayMeshGroup.getObjectByName( _selectedOverlayRectObj.name, true );
                    if(overlayMeshRect)
                    {
                        selectedLayer.deleteImageFromOverlayRect(overlayMeshRect);
                    }
                }
                else if(editMode == 'UpdateRect')
                {
                    if(_selectedOverlayRectObj)
                    {

//                         /////////////////////////////////////////////////////////
//                         // An overlayRect is selected
//                         // intersect with the structureMeshGroup (which must be selected)
//                         // and set _selectedStructureObj in the group
//                         // (which sets the boundaries for moving _selectedOverlayRectObj)
//                         /////////////////////////////////////////////////////////
//                         let intersects = _raycaster.intersectObjects( selectedFloorInfo["mesh"].children, true );
//                         if(intersects.length > 0)
//                         {
//                             // _intersection = intersects[0];
//                             _intersection = MLJ.util.getNestedObject(intersectedStructureInfo, ['currentIntersection']);
//                             _selectedStructureObj = _intersection.object;
//                             // set _offset to be the offset between
//                             // the intersection point and the _selectedOverlayRectObj position 
//                             _offset.copy(_intersection.point).sub(_selectedOverlayRectObj.position);
//                         }

                        _intersection = MLJ.util.getNestedObject(intersectedStructureInfo, ['currentIntersection']);
                        _selectedStructureObj = _intersection.object;
                        
                        // set _offset to be the offset between
                        // the intersection point and the _selectedOverlayRectObj position 
                        _offset.copy(_intersection.point).sub(_selectedOverlayRectObj.position);
                    }

                    _domElement.style.cursor = 'move';
                }
                
                break;
                
        }
        
    }

    function onDocumentMouseMove( event ) {

//         console.log('BEG onDocumentMouseMove');

        // disable isMouseDown to prevent calling findIntersections, when resizing the vertices ??
        // scope.isMouseDown = false;

        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        if(!selectedLayer)
        {
            // Layer is not yet defined
            return;
        }

        if( !selectedLayer.getEditOverlayRectFlag() )
        {
            // Do nothing. Not in editing mode.
            return;
        }

        event.preventDefault();

        let editMode = selectedLayer.getEditMode();
        if(editMode == 'UpdateRect')
        {
            
            var rect = _domElement.getBoundingClientRect();

            _mouse = MLJ.core.Scene3DtopDown.getMouse3D();
            _camera = MLJ.core.Scene3DtopDown.getCamera3D();
            
            _raycaster.setFromCamera( _mouse, _camera );

            if ( _selectedOverlayRectObj ) {

                /////////////////////////////////////////////////////////
                // An overlayRect is selected
                // intersect with the selected structure (which must be selected)
                // and use the new intersection point for translation
                // of the overlayRect
                /////////////////////////////////////////////////////////

                var intersects2 = _raycaster.intersectObjects( [_selectedStructureObj] );
                if(intersects2.length > 0)
                {
                    _intersection = intersects2[0];
                    translateOverlayRect2();
                }

                scope.dispatchEvent( { type: 'drag', object: _selectedOverlayRectObj } );

                return;
            }

            _raycaster.setFromCamera( _mouse, _camera );

            let floorOverlayRectGroup = selectedLayer.getFloorOverlayRectGroup();

            // loop over floorOverlayRectGroup
            //         floorOverlayRectGroup.traverse(function(element) {
            //             console.log('element.name', element.name);
            //             if((element.name == "rectangleMesh143"))
            //             {
            //                 console.log('element', element); 
            //             }            
            //         });


            
            
            let intersects = _raycaster.intersectObjects( floorOverlayRectGroup.children, true );
            
            if ( intersects.length > 0 ) {
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

    }


    function handleMouseWheel( event ) {
        // console.log( 'handleMouseWheel' );
    }

    function onMouseWheel( event ) {
//         console.log('BEG onMouseWheel');
        
        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        if( !selectedLayer.getEditOverlayRectFlag() )
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
//                  console.log('BEG onDocumentMouseCancel');

        scope.isMouseDown = false;
        
        let selectedLayer = MLJ.core.Model.getSelectedLayer();
        if(!selectedLayer)
        {
            return;
        }        
        
        if( !selectedLayer.getEditOverlayRectFlag() )
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

};

THREE.EditOverlayRect_Scene3DtopDown_TrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.EditOverlayRect_Scene3DtopDown_TrackballControls.prototype.constructor = THREE.EditOverlayRect_Scene3DtopDown_TrackballControls;
