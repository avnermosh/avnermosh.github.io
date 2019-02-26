
(function (plugin, scene) {
    
    var layerWidget = new plugin.Filter({
        name: "Set selected layer",
        tooltip: "Sets the selected layerAAA: <br>"
            +"1: layer0<br>"
            +"2: layer1<br>"
            +"3: ...",
        arity: 1
    });
    
    var choiceWidget;

    layerWidget._init = function (builder) {
        choiceWidget = builder.Choice({
            label: "Choose layerBBB",
            tooltip: "Choose layer",
            options: [
                {content: "layer0", value: "0", selected: true},
                {content: "layer1", value: "1"},
                {content: "layer2", value: "2"},
                {content: "layer3", value: "3"},
            ]
        });
    };
    
    layerWidget._applyTo = function(meshFile) {
        // Module.ComputeQualityAsFaceQuality(meshFile.ptrMesh(), parseInt(choiceWidget.getValue()));
    };

    plugin.Manager.install(layerWidget);
    
})(MLJ.core.plugin, MLJ.core.Scene);
