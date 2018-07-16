/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

(function (component) {

    MLJ.gui.TabbedPane = function () {

        var _tabs = [];
        var _$tabbedPane = $('<div id="mlj-tabbed-pane"></div>');

        var _$texPane = $('<div/>').css({
            position: "relative",
            width: "100%"  
        });

        function Tab(name) {
            this.name = name;
            var _$content = $('<div id="tab-' + name + '"></div>');

            this.$tab = function () {
                return $('<li><a href="#tab-' + name + '"><span>' + name + '</span></a></li>');
            };

            this.$content = function () {
                return _$content;
            };

            this.appendContent = function (content) {
                _$content.append(content);
                return this;
            };
        }

        function resize() {
            _$tabbedPane.outerHeight(_$tabbedPane.parent().height());
            $("#tab-Texture").outerHeight(_$tabbedPane.height());
            _$texPane.outerHeight($("#tab-Texture").height());
        }

        function init() {
            var textureTab = new Tab("Texture");
            textureTab.appendContent(_$texPane);

            _tabs.push(textureTab);

            _$tabbedPane.on('tabsactivate', function (event, ui) {
                resize();
            });
        }

        this._make = function () {//build function                            
            $(window).ready(function () {
                var tab;
                for (var i = 0, m = _tabs.length; i < m; i++) {
                    tab = _tabs[i];
                    _$tabbedPane.append(tab.$content());
                }

                _$tabbedPane.tabs();

                resize();
            });

            $(window).resize(function () {
                resize();
            });

            return _$tabbedPane;
        };

        this._refresh = function () {
            _$tabbedPane.tabs("refresh");
        };

        this.getTexturePane = function () {
            return _$texPane;
        };

        this.selectTab = function(index) {
            _$tabbedPane.tabs("option","active",index);
        };

        init();
    };

    MLJ.extend(MLJ.gui.Widget, MLJ.gui.TabbedPane);

    //Install widget
    MLJ.gui.installWidget("TabbedPane", new MLJ.gui.TabbedPane());

})(MLJ.gui.component);
