/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.OBJExporter = function () {};

THREE.OBJExporter.prototype = {

    constructor: THREE.OBJExporter,

    parse: function ( object ) {

        var output = '';
        var mtlOutput = '';

        var indexVertex = 0;
        var indexVertexUvs = 0;
        var indexNormals = 0;
        
        var vertex = new THREE.Vector3();
        var normal = new THREE.Vector3();
        var uv = new THREE.Vector2();

        var i, j, k, l, m, face = [];

        if ( object instanceof THREE.Group ) {
            var mtlFileName = object.materialLibraries[0];
            output += 'mtllib ' + mtlFileName +  '\n';
        }
        
        var exportMtlFile = function ( materialsDict )
        {
            for (var key in materialsDict) {
                
                var mat = materialsDict[key];
                
                if (mat.name !== '')
                    mtlOutput += 'newmtl ' + mat.name + '\n';
                else
                    mtlOutput += 'newmtl material' + mat.id + '\n';
                
                mtlOutput += 'illum 2\n';

                // needed for diagonal stripes
                let condition1 = (mat.map && mat.map instanceof THREE.Texture);

                // needed for newRect via topDown pane (which doesn't have "material.map")
                let condition2 = (mat.userData.urlArray && mat.userData.urlArray.size() > 0);

                // if (mat.map && mat.map instanceof THREE.Texture)
                if (condition1 || condition2)
                {

                    // var file = mat.map.image.currentSrc.slice( mat.map.image.currentSrc.slice.lastIndexOf("/"), mat.map.image.currentSrc.length - 1 );
                    // mtlOutput += 'map_Ka ' + file + '\n';
                    // mtlOutput += 'map_Kd ' + file + '\n';
                    
                    // store the texture file name(s) and orientation(s)
                    let textureFilenames = "";
                    let textureOrientations = "";
                    var iter = mat.userData.urlArray.iterator();
                    while (iter.hasNext()) {
                        let imageInfo = iter.next();
                        let imageFilename = imageInfo.filename;
                        let imageOrientation = imageInfo.orientation;
                        
                        if((mat.userData.urlArray.size() > 1) && (imageFilename === 'default_image.jpg'))
                        {
                            // not removing, as this will confuse the iterator
                            // instead just ignore the default image (it won't be added to the list of images)
                            // let removedEl = mat.userData.urlArray.remove(imageFilename);
                        }
                        else
                        {
                            textureFilenames = textureFilenames + " " + imageFilename;
                            textureOrientations = textureOrientations + " " + imageOrientation;
                        }
                    }
                    
                    // console.log('textureFilenames', textureFilenames);
                    mtlOutput += 'Kd 0.8 0.8 0.8\n';
                    
                    // https://en.wikipedia.org/wiki/Wavefront_.obj_file
                    // map_Kd - the diffuse texture map
                    mtlOutput += 'map_Kd ' + textureFilenames + '\n';

                    mtlOutput += 'map_Kd_orientation ' + textureOrientations + '\n';
                }
                else
                {
                    // // red color
                    // // mtlOutput += 'Kd 1.0 0.0 0.0 ' + '\n';

                    // // white
                    // mtlOutput += 'Kd 1.0 1.0 1.0 ' + '\n';

                    mtlOutput += 'Kd 0.8 0.8 0.8\n';
                    
                }

                // export origPosition
                var material_userData_origPosition = MLJ.util.getNestedObject(mat, ['userData', 'origPosition']);
                if(material_userData_origPosition)
                {
                    mtlOutput += 'OrigPosition ' + material_userData_origPosition.x  +
                        ' ' + material_userData_origPosition.y +
                        ' ' + material_userData_origPosition.z +
                        '\n';
                }
                
                // export scale
                var material_userData_scale = MLJ.util.getNestedObject(mat, ['userData', 'scale']);
                if(material_userData_scale)
                {
                    mtlOutput += 'Scale ' + material_userData_scale.x  +
                        ' ' + material_userData_scale.y +
                        ' ' + material_userData_scale.z +
                        '\n';
                }
                
                mtlOutput += '\n';
                
            }
        };
        
        var insertMaterial = function ( material )
        {
            if (material.name !== '')
            {
                output += 'usemtl ' + material.name + '\n';
            }
            else
            {
                output += 'usemtl material' + material.id + '\n';
            }
            
        };
        
        var parseMesh = function ( mesh ) {

            var materialsDict = {};
            var nbVertex = 0;
            var nbNormals = 0;
            var nbVertexUvs = 0;

            var geometry = mesh.geometry;

            var normalMatrixWorld = new THREE.Matrix3();

            if ( geometry instanceof THREE.Geometry ) {

                geometry = new THREE.BufferGeometry().setFromObject( mesh );

            }

            if ( geometry instanceof THREE.BufferGeometry ) {

                // shortcuts
                var vertices = geometry.getAttribute( 'position' );
                var normals = geometry.getAttribute( 'normal' );
                var uvs = geometry.getAttribute( 'uv' );
                var indices = geometry.getIndex();

                // name of the mesh object
                output += 'o ' + mesh.name + '\n';

                // name of the mesh material
                // if ( mesh.material && mesh.material.name ) {

                //     output += 'usemtl ' + mesh.material.name + '\n';

                // }
                if(mesh.material && mesh.material.id)
                {
                    materialsDict[mesh.material.id] = mesh.material;
                    insertMaterial(mesh.material);
                }

                // vertices

                if ( vertices !== undefined ) {

                    for ( i = 0, l = vertices.count; i < l; i ++, nbVertex ++ ) {

                        vertex.x = vertices.getX( i );
                        vertex.y = vertices.getY( i );
                        vertex.z = vertices.getZ( i );

                        if((mesh.name == "ground_1") && (i == 0) && (vertex.x < -650) )
                        {
                            console.log('vertex', vertex); 
                        }

                        // Avner - disable transfroming the vertex to world space, as we want the vertex in original coordinates
                        //  The end effects are:
                        //  We can set the camera above the floor (heightAboveFloor in MeshFile - to see the room from half the height results in better intersection with the walls)
                        //  We can move te camera freely in scene3D on the floor, in x,y and the vertices stay the same as the original vertices.
                        // 
                        // option1 - disabled this line as we want the vertex in original coordinates ???
                        // option2 - (better ??) set the pivot position to (0,0,0) this will cause mesh.matrixWorld to be unit matrix
                        //           We can do it by
                        //   - placing the camera temporarily in (0,0,0)
                        //   - Calling save (i.e. triggering this function)
                        //   - placing the camera back in the previous location

                        // // transfrom the vertex to world space
                        // vertex.applyMatrix4( mesh.matrixWorld );

                        if(mesh.material.userData.scale)
                        {
                            // this is an overlayRect.
                            //
                            // mesh.matrix stores the object's transformation relative to the object's parent 
                            // we want the structure vertices and overlayRect vertices to align
                            // the structure vertices are relative to the parent "pivotGroup"
                            // Therefore for overlayRect, we want to get the vertices relative to the parent "pivotGroup" as well
                            let vertex2 = new THREE.Vector3();
                            vertex2.copy(vertex);
                            vertex2.applyMatrix4( mesh.matrix );
                            vertex.copy(vertex2);
                        }
                        
                        if((mesh.name == "ground_1") && (i == 0) && (vertex.x < -650) )
                        {
                            console.log('vertex1', vertex); 
                        }

                        // transform the vertex to export format
                        output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';

                    }

                }

                // uvs

                if ( uvs !== undefined ) {

                    for ( i = 0, l = uvs.count; i < l; i ++, nbVertexUvs ++ ) {

                        uv.x = uvs.getX( i );
                        uv.y = uvs.getY( i );

                        // transform the uv to export format
                        output += 'vt ' + uv.x + ' ' + uv.y + '\n';

                    }

                }

                // normals

                if ( normals !== undefined ) {

                    normalMatrixWorld.getNormalMatrix( mesh.matrixWorld );

                    for ( i = 0, l = normals.count; i < l; i ++, nbNormals ++ ) {

                        normal.x = normals.getX( i );
                        normal.y = normals.getY( i );
                        normal.z = normals.getZ( i );

                        // transfrom the normal to world space
                        normal.applyMatrix3( normalMatrixWorld );

                        // transform the normal to export format
                        output += 'vn ' + normal.x + ' ' + normal.y + ' ' + normal.z + '\n';

                    }

                }

                // faces

                if ( indices !== null ) {

                    for ( i = 0, l = indices.count; i < l; i += 3 ) {

                        for ( m = 0; m < 3; m ++ ) {

                            j = indices.getX( i + m ) + 1;

                            face[ m ] = ( indexVertex + j ) + ( normals || uvs ? '/' + ( uvs ? ( indexVertexUvs + j ) : '' ) + ( normals ? '/' + ( indexNormals + j ) : '' ) : '' );

                        }

                        // 3 vertices per face, 2 faces per material
                        var numVerticesPerMaterial = 6;
                        if( (i % numVerticesPerMaterial) == 0)
                        {
                            var matIndex = Math.floor( i / numVerticesPerMaterial );
                            console.log('matIndex', matIndex); 
                            var material = mesh.material[matIndex];
                            if(material  !== undefined)
                            {
                                materialsDict[material.id] = material;
                                insertMaterial(mesh.material[matIndex]);
                            }
                        }

                        // transform the face to export format
                        output += 'f ' + face.join( ' ' ) + "\n";

                    }

                } else {

                    for ( i = 0, l = vertices.count; i < l; i += 3 ) {

                        for ( m = 0; m < 3; m ++ ) {

                            j = i + m + 1;

                            face[ m ] = ( indexVertex + j ) + ( normals || uvs ? '/' + ( uvs ? ( indexVertexUvs + j ) : '' ) + ( normals ? '/' + ( indexNormals + j ) : '' ) : '' );

                        }

                        // 3 vertices per face, 2 faces per material
                        var numVerticesPerMaterial = 6;
                        if( (i % numVerticesPerMaterial) == 0)
                        {
                            var matIndex = Math.floor( i / numVerticesPerMaterial );
                            var material = mesh.material[matIndex];
                            if(material  !== undefined)
                            {
                                materialsDict[material.id] = material;
                                insertMaterial(mesh.material[matIndex]);
                            }
                        }

                        // transform the face to export format
                        output += 'f ' + face.join( ' ' ) + "\n";

                    }

                }

            } else {

                console.warn( 'THREE.OBJExporter.parseMesh(): geometry type unsupported', geometry );

            }

            // update index
            indexVertex += nbVertex;
            indexVertexUvs += nbVertexUvs;
            indexNormals += nbNormals;

            // mtl output
            exportMtlFile(materialsDict);

        };

        var parseLine = function ( line ) {

            var nbVertex = 0;

            var geometry = line.geometry;
            var type = line.type;

            if ( geometry instanceof THREE.Geometry ) {

                geometry = new THREE.BufferGeometry().setFromObject( line );

            }

            if ( geometry instanceof THREE.BufferGeometry ) {

                // shortcuts
                var vertices = geometry.getAttribute( 'position' );

                // name of the line object
                output += 'o ' + line.name + '\n';

                if ( vertices !== undefined ) {

                    for ( i = 0, l = vertices.count; i < l; i ++, nbVertex ++ ) {

                        vertex.x = vertices.getX( i );
                        vertex.y = vertices.getY( i );
                        vertex.z = vertices.getZ( i );

                        // transfrom the vertex to world space
                        vertex.applyMatrix4( line.matrixWorld );

                        // transform the vertex to export format
                        output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';

                    }

                }

                if ( type === 'Line' ) {

                    output += 'l ';

                    for ( j = 1, l = vertices.count; j <= l; j ++ ) {

                        output += ( indexVertex + j ) + ' ';

                    }

                    output += '\n';

                }

                if ( type === 'LineSegments' ) {

                    for ( j = 1, k = j + 1, l = vertices.count; j < l; j += 2, k = j + 1 ) {

                        output += 'l ' + ( indexVertex + j ) + ' ' + ( indexVertex + k ) + '\n';

                    }

                }

            } else {

                console.warn( 'THREE.OBJExporter.parseLine(): geometry type unsupported', geometry );

            }

            // update index
            indexVertex += nbVertex;

        };

        object.traverse( function ( child ) {

            if ( child instanceof THREE.Mesh ) {

                parseMesh( child );

            }

            if ( child instanceof THREE.Line ) {

                parseLine( child );

            }

        } );
        
        return {
            obj: output,
            mtl: mtlOutput
        }

    }

};
