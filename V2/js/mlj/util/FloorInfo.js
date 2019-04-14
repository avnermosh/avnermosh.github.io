
class FloorInfo {

    constructor({name = null,
                 floorLevel = null,
                 floorHeight = null,
                 floorThickness = null,
                 heightAboveFloor = null,
                 mesh = null}) {

        this.name = name;
        this.floorLevel = floorLevel;
        this.height = (floorLevel * (floorHeight + floorThickness)) + heightAboveFloor;
        this.mesh = mesh;
        this.mesh.translateY( this.height );
        this.minHeight = (floorLevel * (floorHeight + floorThickness));
        this.maxHeight = (floorLevel * (floorHeight + floorThickness)) + floorHeight;
    }

    toString() {
        let floorInfoStr = 'name: ' + this.name + '\n' +
            'floorLevel: ' + this.floorLevel + '\n' +
            'height: ' + this.height + '\n' +
            'minHeight: ' + this.minHeight + '\n' +
            'maxHeight: ' + this.maxHeight + '\n' +
            'mesh: ' + this.mesh;

        return floorInfoStr;
    }
    
}

