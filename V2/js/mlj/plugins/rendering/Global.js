
(function (plugin, core, scene) {
    var DEFAULTS = {
        DefaultUpColor: new THREE.Color('#00000f'),
        DefaultDownColor: new THREE.Color('#8080ff'),
        FieldOfView : scene.getCamera3D()
    };
    var plug = new plugin.Texturing({
        name: "Global",        
        tooltip: "Global Tooltip",
        icon: "img/icons/global.png"        
    }, DEFAULTS);
	
    
    var cullingWidget, topColor, bottomColor, fovWidget;
    
    plug._init = function (guiBuilder) {
        
        cullingWidget = guiBuilder.Choice({
            label: "Backface Culling",
            tooltip: "Enable/disable Backface Culling",
            options: [
                {content: "on", value: true},
                {content: "off", value: false, selected: true}
            ]
        });
        
        fovWidget = guiBuilder.RangedFloat({
            label: "Field of View",
            tooltip: "Change the field of view of the camera.",
            min: 5, max: 90, step: 5,
            defval: DEFAULTS.FieldOfView,
            bindTo: (function() {
                var bindToFun = function (size, overlay) {
                    scene.getCamera3D().fov=fovWidget.getValue();
                    scene.getCamera3D().updateProjectionMatrix();
                    MLJ.core.Scene3DtopDown.render();
                };
                bindToFun.toString = function () { return 'FieldOfView'; }
                return bindToFun;
            }())
        });
        
        statsWidget = guiBuilder.Choice({
            label: "Show Stats",
            tooltip: "Enable/disable the display of rendering performance stats",
            options: [
                {content: "on", value: true},
                {content: "off", value: false, selected: true}
            ],
            bindTo: (function() {

                var stats;
                var show = false;
                var req;

                var updateStats = function() {
                    if (show) {
                        stats.begin();
                        scene.render(true);
                        stats.end();
                        req = requestAnimationFrame(updateStats);
                    } else {
                        stats.active = false;
                        stats.domElement.style.visibility = 'hidden';
                        window.cancelAnimationFrame(req);
                    }
                };

                var callback = function (value) {
                    if (!show) {
                        if (value) {
                            show = true;
                            stats = scene.getStats();
                            stats.active = true;
                            stats.domElement.style.visibility = 'visible';
                            updateStats();
                        }
                    } else show = value;
                };

                callback.toString = function () { return "showStats"; };
                return callback;
            }())
        });
        topColor = guiBuilder.Color({
            label: "Background Top Color",
            tooltip: "Change the default background color of render panel, obtained mixing two different colors by linear-gradient function, at the top",
            color: "#" + DEFAULTS.DefaultUpColor.getHexString(),
            bindTo: (function() {
                var bindToFun = function (color) {
                    $('#_3DtopDown').css('background', 'linear-gradient('+topColor.getColor()+','+bottomColor.getColor()+')');
                };
                bindToFun.toString = function () { return 'DefaultUpColor'; }
                return bindToFun;
            }())
        });
        bottomColor = guiBuilder.Color({
            label: "Background Bottom Color",
            tooltip: "Change the default background color of render panel, obtained mixing two different colors by linear-gradient function, at the bottom",
            color:  "#" + DEFAULTS.DefaultDownColor.getHexString(),
            bindTo: (function() {
                var bindToFun = function (color) {
                    $('#_3DtopDown').css('background', 'linear-gradient('+topColor.getColor()+','+bottomColor.getColor()+')');
                };
                bindToFun.toString = function () { return 'DefaultDownColor'; }
                return bindToFun;
            }())
        });

    };
    plug._applyTo = function (layer, on) {
        //alert(scene.getCamera3D());
    }
    plug.getBackfaceCullingValue = function (type) {
        return cullingWidget.getValue();
    };

    plug.getShowStatsValue = function (type) {
        return statsWidget.getValue();
    };
    plugin.Manager.install(plug);

})(MLJ.core.plugin, MLJ.core, MLJ.core.Scene3D);
