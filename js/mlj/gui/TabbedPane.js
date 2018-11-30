/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var doEnableMultipleTabs = false;
// var doEnableMultipleTabs = true;

(function (component) {

    MLJ.gui.TabbedPane = function () {

        var _tabs = [];
        var _$tabbedPane = $('<div id="mlj-tabbed-pane"></div>');
        if(doEnableMultipleTabs)
        {
            var _$tabsBar = $('<ul id="mlj-tabs-bar"></ui>');
        }

        var _$texPane = $('<div/>').css({
            position: "relative",
            width: "100%"  
        });

        if(doEnableMultipleTabs)
        {
            var _$filterWrapp = $('<div/>').css({
                overflow: "auto",
                width: "100%"
            });

            //Accordion for filters pane
            var _filtersAccord = new component.Accordion({
                heightStyle: 'content',
                collapsible: true,
                active: false
            });
            _filtersAccord.$.attr('id', 'accordion-filters');
        }


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
            if(doEnableMultipleTabs)
            {
                $("#tab-Filters").outerHeight(
                    _$tabbedPane.height() - _$tabsBar.outerHeight());

                _$filterWrapp.outerHeight($("#tab-Filters").height()
                                          - $('#mlj-search-widget').height());
            }

            _$tabbedPane.outerHeight(_$tabbedPane.parent().height());

            $("#tab-Texture").outerHeight(_$tabbedPane.height());

            _$texPane.outerHeight($("#tab-Texture").height());
        }

        function init() {
            if(doEnableMultipleTabs)
            {
                _$tabbedPane.append(_$tabsBar);
                var filterTab = new Tab("Filters");
                filterTab
                    .appendContent(_$filterWrapp);
                _$filterWrapp.append(_filtersAccord.$);
            }

            var textureTab = new Tab("Texture");
            textureTab.appendContent(_$texPane);

            if(doEnableMultipleTabs)
            {
                _tabs.push(textureTab, filterTab);
            }
            else
            {
                _tabs.push(textureTab);
            }

            _$tabbedPane.on('tabsactivate', function (event, ui) {
                resize();
            });
        }

        this._make = function () {//build function                            
            $(window).ready(function () {
                var tab;
                for (var i = 0, m = _tabs.length; i < m; i++) {
                    tab = _tabs[i];
                    if(doEnableMultipleTabs)
                    {
                        _$tabsBar.append(tab.$tab);
                    }
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

        if(doEnableMultipleTabs)
        {
            this.getFiltersAccord = function () {
                return _filtersAccord;
            };
        }

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
