var loadCubes = false;
var doLoadFromZipFile = true;
var doLoadFromObjAndMaterialFiles = true;

var firstTime2 = true;

var container, stats;
var camera, scene, raycaster, renderer;

var mouse = new THREE.Vector2(), INTERSECTED;
var radius = 100, theta = 0;

init();
animate();

function loadObjFile(loadingManager, objFileName, materials) {
    var objLoader = new THREE.OBJLoader(loadingManager);
    if(materials)
    {
	objLoader.setMaterials( materials );
    }
    
    objLoader.load( objFileName, function ( object ) {
        object.traverse(function ( child ) {
            if( child.material ) {
               child.material.side = THREE.DoubleSide;
            }
            if ( child instanceof THREE.Mesh ) {
                child.geometry.computeBoundingBox();
                object.bBox = child.geometry.boundingBox;
            }
        });
        scene.add( object );
    });

    return 0;
}

function loadObjAndMaterialFiles(loadingManager, objFileName, mtlFileName) {

    var mtlLoader = new THREE.MTLLoader(loadingManager);
    mtlLoader.setMaterialOptions( {side: THREE.DoubleSide} );
    mtlLoader.load( mtlFileName, function( materials ) {
	materials.preload();
        loadObjFile(loadingManager, objFileName, materials);
    });
    
    return 0;
}


var getFileExtention = function (filename2)
{
    var fileExt = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    return fileExt;
};


function loadZipFile(archiveFileName) {
    // https://github.com/yomotsu/ZipLoader
    // var zipLoader = new ZipLoader( archiveFileName );
    var zipLoader = new ZipLoader( 'example3_zip_mtl_obj_loader_raycasting.zip' );

    zipLoader.on( 'load', function ( e ) {

        console.log( 'loaded!' );
        filenames = Object.keys(zipLoader.files);
        
        // loop over keys
        var blobs = {};
        var mtlFileName;
        var objFileName;
        for (var key in filenames)
        {
            filename = filenames[key];
            var fileExtention = getFileExtention(filename);

            switch(fileExtention) {
                case "jpg":
                    blobs[filename] = zipLoader.extractAsBlobUrl( filename, 'image/jpeg' );
                    break;
                case "mtl":
                    blobs[filename] = zipLoader.extractAsBlobUrl( filename, 'text/plain' );
                    mtlFileName = filename;
                    break;
                case "obj":
                    blobs[filename] = zipLoader.extractAsBlobUrl( filename, 'text/plain' );
                    objFileName = filename;
                    break;
                default:
                    var msgStr = 'fileExtention: ' + fileExtention + 'in .zip file is not supported';
                    console.log( msgStr );
                    return;
            }
            
        }

        var loadingManager = new THREE.LoadingManager();

        // Initialize loading manager with URL callback.
        var objectURLs = [];
        loadingManager.setURLModifier( ( url ) => {
	    url = blobs[ url ];
	    objectURLs.push( url );
	    return url;
        } );

        console.log("objFileName: " + objFileName);
        console.log("mtlFileName: " + mtlFileName);
        loadObjAndMaterialFiles(loadingManager, objFileName, mtlFileName);

    } );

    zipLoader.load();

    return 0;
}

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    var info = document.createElement( 'div' );
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = '<a href="http://threejs.org" target="_blank" rel="noopener">three.js</a> webgl - interactive cubes';
    container.appendChild( info );

    // camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100000 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    // var light = new THREE.DirectionalLight( 0xffffff, 1 );
    // light.position.set( 1, 1, 1 ).normalize();
    // scene.add( light );

    var light = new THREE.AmbientLight("#808080");
    scene.add(light);

if(loadCubes)
    {
        var geometry = new THREE.BoxBufferGeometry( 20, 20, 20 );

        for ( var i = 0; i < 2000; i ++ ) {

            var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

            object.position.x = Math.random() * 800 - 400;
            object.position.y = Math.random() * 800 - 400;
            object.position.z = Math.random() * 800 - 400;

            object.rotation.x = Math.random() * 2 * Math.PI;
            object.rotation.y = Math.random() * 2 * Math.PI;
            object.rotation.z = Math.random() * 2 * Math.PI;

            object.scale.x = Math.random() + 0.5;
            object.scale.y = Math.random() + 0.5;
            object.scale.z = Math.random() + 0.5;

            scene.add( object );

        }
    }
    else
    {
        var objFileName = "example2_zipLoader_raycasting_data.obj";
        var mtlFileName = "example2_zipLoader_raycasting_data.obj.mtl";
        if(doLoadFromZipFile)
        {
	    console.log("Option loadZipFile");
            loadZipFile();
        }
        else if(doLoadFromObjAndMaterialFiles)
        {
	    console.log("Option loadObjAndMaterialFiles");
            var loadingManager = new THREE.LoadingManager();
            loadObjAndMaterialFiles(loadingManager, objFileName, mtlFileName);
        }
        else
        {
	    console.log("Option loadObjFile");
            var loadingManager = new THREE.LoadingManager();
            // objFileName = "example2_objLoader_raycasting.obj";
            objFileName = "example2_zipLoader_raycasting_data.obj";
            materials = 0;
            loadObjFile(loadingManager, objFileName, materials);
        }
    }


    
    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild(renderer.domElement);

    controls = new THREE.TrackballControls( camera, renderer.domElement );
    controls.rotateSpeed = 0.5;
    controls.addEventListener( 'change', render );
    
    stats = new Stats();
    container.appendChild( stats.dom );

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function animate() {

    requestAnimationFrame( animate );
    controls.update();

    render();
    stats.update();

}

function render() {

    if(firstTime2)
    {
        theta = 210;

        camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
        camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
        camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
        camera.lookAt( scene.position );

        camera.updateMatrixWorld();
        
        firstTime2 = false;
    }


    // find intersections

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( scene.children, true );

    if ( intersects.length > 0 ) {
        // console.log("Found intersections");
        var intersect1 = intersects[0];
        // console.log("intersect1");
        // console.log(intersect1);

        // if(intersect1.point)
        // {
        //     var point1 = intersect1.point;
        //     console.log("point1 x,y,z: " + point1.x + ", " + point1.y + ", " + point1.z);
        // }
        // if(intersect1.uv)
        // {
        //     var uvPoint = intersect1.uv;
        //     console.log("uvPoint x,y: " + uvPoint.x + ", " + uvPoint.y);
        // }
        
        var faceIndex = intersect1.faceIndex / 3;
        // console.log("faceIndex: " + faceIndex);

        var materialIndex = Math.floor(faceIndex/2);
        // console.log("materialIndex: " + materialIndex);

        
        var intersect1Obj = intersect1.object;
        // console.log("intersect1Obj");
        // console.log(intersect1Obj);

        // // geom has "type: "BufferGeometry""
        var geom = intersect1Obj.geometry;
        // console.log("geom");
        // console.log(geom);
        // geom.addAttribute('VCGColor', colorAttrib);

        if ( ( INTERSECTED != intersect1Obj ) ||
             ((INTERSECTED != null) && (INTERSECTED.materialIndex != materialIndex)) )
        {
            // console.log("New intersection");

            if(doLoadFromZipFile || doLoadFromObjAndMaterialFiles)
            {
                if ( INTERSECTED )
                {
                    // Revert material of previous intersection
                    INTERSECTED.material[INTERSECTED.materialIndex].emissive.setHex( INTERSECTED.currentHex );
                    // INTERSECTED.material[INTERSECTED.materialIndex].emissive.setHex( 0x000000 );
                }
                INTERSECTED = intersect1Obj;
                INTERSECTED.currentHex = INTERSECTED.material[materialIndex].emissive.getHex();
                INTERSECTED.materialIndex = materialIndex;
                // Set material of current intersection
                INTERSECTED.material[materialIndex].emissive.setHex( 0xff0000 );
            }
            else
            {
                // if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
                // INTERSECTED = intersect1Obj;
                // INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                // INTERSECTED.material.emissive.setHex( 0xff0000 );
            }
        }

    } else {
        // console.log("NOT Found intersections");

        if(doLoadFromZipFile || doLoadFromObjAndMaterialFiles)
        {
            if ( INTERSECTED )
            {
                INTERSECTED.material[INTERSECTED.materialIndex].emissive.setHex( INTERSECTED.currentHex );
            }
        }
        else
        {
            // if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        }

        INTERSECTED = null;

    }

    renderer.render( scene, camera );

}
