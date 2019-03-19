
class IntersectionInfo {
    constructor({intersectionLayer = null,
                 currentIntersection = null,
                 previousIntersection = null}) {

        this.intersectionLayer = intersectionLayer;
        this.currentIntersection = currentIntersection;
        this.previousIntersection = previousIntersection;
    }

    clearCurrentIntersection() {
//         console.log('BEG clearCurrentIntersection'); 
        this.intersectionLayer = undefined;
        this.currentIntersection = undefined;
    };

    toString() {
        let intersectionInfoStr = 'intersectionLayer: ' + this.intersectionLayer + '\n' +
            'currentIntersection: ' + this.currentIntersection + '\n' +
            'previousIntersection: ' + this.previousIntersection;

        return intersectionInfoStr;
    };

    highlightIntersection(color0) {

        if ( this.currentIntersection ) {

            var previousIntersectionObj = MLJ.util.getNestedObject(this.previousIntersection, ['object']);

            if ( !this.previousIntersection || (previousIntersectionObj != this.currentIntersection.object) )
            {
                if ( this.previousIntersection )
                {
                    // recover the color of the old intersection, before setting previousIntersection
                    this.previousIntersection.object.material.color.setHex( this.previousIntersection.currentHex );
                }

                // keep the intersection so that we can recover in the future
                this.previousIntersection = this.currentIntersection;

                // save the color for future recovery
                var object_material_color = MLJ.util.getNestedObject(this.previousIntersection, ['object', 'material', 'color']);
                if( object_material_color == undefined)
                {
                    console.error('Failed to get previousIntersection.object.material.color'); 
                }
                this.previousIntersection.currentHex = object_material_color.getHex();
                
                // set the highlight color 
                this.previousIntersection.object.material.color.setHex( color0 );
                
            }
        }
        else {
            
            if ( this.previousIntersection )
            {
                // recover the color of the old intersection
                this.previousIntersection.object.material.color.setHex( this.previousIntersection.currentHex );
            }
            this.previousIntersection = null;
        }            
        
    };
    
}
