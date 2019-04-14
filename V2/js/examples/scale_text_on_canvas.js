
$(document).ready(function() {
    var d_canvas = document.getElementById('canvas');
    var d_container1 = document.getElementById('container1');
    var context = d_canvas.getContext('2d');
    var background = document.getElementById('background');
    var ballon = document.getElementById('ballon')
    context.drawImage(background, 0, 0);
    var scaleFactor = 1.0;

    var quill = new Quill('#editor', {
        theme: 'snow'
    });

    $('#ballon').draggable();
    $('#box').draggable();
    // $('#editor').draggable();

    
    function saveResizeAndRedisplay(scaleFactor) {

//         d_canvas.style.transform = 'scale(' + scaleFactor + ')';
        d_container1.style.transform = 'scale(' + scaleFactor + ')';

    }

    $("#scale_up").click(function () {
        scaleFactor = scaleFactor * 1.5;
        saveResizeAndRedisplay(scaleFactor);
    });    

    $("#scale_down").click(function () {
        scaleFactor = scaleFactor / 1.5;
        saveResizeAndRedisplay(scaleFactor);
    });    

});
