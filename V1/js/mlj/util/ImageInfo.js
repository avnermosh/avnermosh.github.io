
class ImageInfo {
    constructor({filename = null,
                 orientation = null,
                 height = null,
                 width = null}) {
        this.filename = filename;
        this.orientation = orientation;
        this.height = height;
        this.width = width;
    }

    toString() {
        let imageInfoStr = 'filename: ' + this.filename + '\n' +
            'orientation: ' + this.orientation + '\n' +
            'height: ' + this.height + '\n' +
            'width: ' + this.width;

        return imageInfoStr;
    }
    
}

