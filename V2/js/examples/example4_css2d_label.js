var camera, scene, renderer, labelRenderer;
var controls;
var clock = new THREE.Clock();
var textureLoader = new THREE.TextureLoader();

var earth, moon;

init();
animate();

function init() {

    camera = new THREE.OrthographicCamera(window.innerWidth / -20,
                                          window.innerWidth / 20,
                                          window.innerHeight / 20,
                                          window.innerHeight / -20,
                                          -500,
                                          1000
                                         );

    camera.position.set( 10, 5, 20 );

    controls = new THREE.OrbitControls( camera );

    scene = new THREE.Scene();

    var dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( 0, 0, 1 );
    scene.add( dirLight );

    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    // --------------------------
    // BEG avner
    // --------------------------

    var spriteMap = new THREE.TextureLoader().load('../../textures/land_ocean_ice_cloud_2048.jpg', () => {
        spriteMap.needsUpdate = true;
        var material = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
        var sprite = new THREE.Sprite( material );
        // sprite.scale.set(20, 20, 1)
        sprite.scale.set(100, 100, 1)
        // sprite.scale.set(1, 1, 1)
        // sprite.scale.set(2, 2, 1)
        scene.add( sprite );



        editorElementId = 'editor1';
        let editorElement = document.getElementById(editorElementId);

        var quill = new Quill(editorElement, {
            theme: 'snow'
        });
        
        let noteElementId = "note1";
        let noteElement = document.getElementById(noteElementId);

        var noteElementLabel = new THREE.CSS2DObject( noteElement );
        noteElementLabel.position.set( 0, 0, 0 );
        // noteElementLabel.scale.x = 100
        // noteElementLabel.scale.y = 100;
        noteElementLabel.scale.x = 1
        noteElementLabel.scale.y = 1;
        console.log('noteElementLabel', noteElementLabel);
        
        sprite.add(noteElementLabel);
        
    });


    
    // --------------------------
    // END avner
    // --------------------------
    
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    console.log('renderer.domElement', renderer.domElement); 

    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = 0;
    document.body.appendChild( labelRenderer.domElement );
    console.log('labelRenderer.domElement', labelRenderer.domElement); 

}

function animate() {

    requestAnimationFrame( animate );

    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}
