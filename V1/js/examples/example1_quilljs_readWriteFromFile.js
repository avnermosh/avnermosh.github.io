var camera, scene, renderer;

init();
// animate();

function init() {

    // var frustumSize = 50000;
    // var aspect = window.innerWidth / window.innerHeight;
    // camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );

    // camera.position.set( 0, 200, 200 );
    
    // scene = new THREE.Scene();

    // renderer = new THREE.CSS2DRenderer();
    // renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.domElement.style.position = 'absolute';
    // renderer.domElement.style.top = 0;
    // document.body.appendChild( renderer.domElement );

    var box2 = document.getElementById('box');
    // var object2 = new THREE.CSS2DObject( box2 );
    // scene.add( object2 );
    
    var quill = new Quill('#editor', {
        theme: 'snow'
    });
    



    ////////////////////////////////
    // BEG load note from file
    ////////////////////////////////

    var deltaAsJson;

    function doOpen(evt) {
        var files = evt.target.files,
            reader = new FileReader();
        reader.onload = function() {
            showout.value = this.result;
            deltaAsJson = showout.value;
        };
        reader.readAsText(files[0]);
    }
    
    var openbtn = document.getElementById("openselect"),
        showout = document.getElementById("showresult");
    openselect.addEventListener("change", doOpen, false);


    var loadDataButton=document.createElement('button');
    loadDataButton.innerHTML = "loadData";
    loadDataButton.style.cssText='position:absolute;top:50px;';
    loadDataButton.addEventListener('click', inLoadDataButtonClick, false);
    document.body.appendChild(loadDataButton);
    
    function inLoadDataButtonClick( event ) {
        // Load data
        // console.log('event', event); 
        fnSetDELTA();
    }

    
    function fnSetDELTA() {
        console.log('foo1'); 
        
        console.log(deltaAsJson);
        quill.setContents(deltaAsJson);
    }


    ////////////////////////////////
    // END load note from file
    ////////////////////////////////

    
    ////////////////////////////////
    // BEG save note to file
    ////////////////////////////////

    var saveDataButton=document.createElement('button');
    saveDataButton.innerHTML = "saveData";
    saveDataButton.style.cssText='position:absolute;top:10px;';
    saveDataButton.addEventListener('click', inSaveDataButtonClick, false);
    document.body.appendChild(saveDataButton);
    
    function inSaveDataButtonClick( event ) {
        // Save data
        // console.log('event', event); 
        fnGetDELTA();
    }

    // https://jsfiddle.net/lidbanger/pyo5ekub/
    function fnGetDELTA() {
        var myDelta = quill.getContents();
        var dataAsJson = JSON.stringify(myDelta);
        console.log('dataAsJson', dataAsJson);

        saveJsonToFile(dataAsJson, 'json.txt', 'text/plain');        
    }

    function saveJsonToFile(content, fileName, contentType) {
        var a = document.createElement("a");
        var file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }

    ////////////////////////////////
    // END save note to file
    ////////////////////////////////
    
    ////////////////////////////////
    // BEG drag
    ////////////////////////////////

    /* https://stackoverflow.com/questions/22138780/disabling-drag-if-shift-key-is-held-down*/

    var box_dragOps = {	
	start : box_start_drag,
	drag  : box_dragging,
	stop : box_stop_drag
    };
    
    $('#box').draggable(box_dragOps);

    function box_start_drag(e, ui) {
        console.log("e.shiftKey", e.shiftKey);
        
        if(!e.shiftKey)
            return false;
    }

    function box_dragging(e,ui) {

    }

    function box_stop_drag(e, ui) {

    }                 
    
    ////////////////////////////////
    // END drag
    ////////////////////////////////

}

function animate() {

    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
