/**
 * MLJLib
 * MeshLabJS Library
 * 
 * Copyright(C) 2015
 * Paolo Cignoni 
 * Visual Computing Lab
 * ISTI - CNR
 * 
 * All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify it under 
 * the terms of the GNU General Public License as published by the Free Software 
 * Foundation; either version 2 of the License, or (at your option) any later 
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT 
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS 
 * FOR A PARTICULAR PURPOSE. See theGNU General Public License 
 * (http://www.gnu.org/licenses/gpl.txt) for more details.
 * 
 */

/**
 * @file Creates and manages MeshLabJS GUI.
 * @author Stefano Gabriele / stefano_gabriele@yahoo.it  
 */


(function (widget) {

    if (typeof widget === 'undefined') {
        console.error("MLJ.gui.widget module needed.");
    }

    var _$wrapper = $('<div></div>')
            .css({
                // width: "80%",
                width: "65%",
                height: "100%"
            });

    var _$border = $('<div id="mlj-tools-pane-border"></div>')
            .css({
                width: "100%",
                background: "none",
                verticalAlign: "middle"
            });

    var _$hideBtn = $('<span class="ui-icon ui-icon-arrowthick-1-w"></span>');

    var _$pane = $('<div id="mlj-tools-pane"></div>')
            .css({
                width: "100%"
                // height: "10%"
            })
            .data("visible", true);

    var _$3D = $('<div id="_3D"></div>');

    function makeTitle(title) {
        var _PiP = new MLJ.gui.component.PiP();

        var $title = $('<div id="mlj-title">' + title + '</div>');
        var insets = 10;
        _PiP.appendContent($title);

        $(window).ready(function () {
            var x = _$pane.outerWidth() + insets;
            var y = insets;
            _PiP.setX(x);
            _PiP.setY(y);
        });

        $(window).resize(function () {
            var newX = _$pane.outerWidth() + _$pane.offset().left + insets;
            _PiP.setX(newX);
        });

        return _PiP.$;
    }

    ////////////////////////////////////////////////////
    // BEG drag drop file
    ////////////////////////////////////////////////////

    // https://opensourcehacker.com/2011/11/11/cancelling-html5-drag-and-drop-events-in-web-browsers/    
    // prevent from dropping anything outside the drop zone
    function prepareDontMissDND() {

        $(document.body).bind("dragover", function(e) {
            e.preventDefault();
            console.log('foo1');
            return false;
        });

        $(document.body).bind("drop", function(e){
            e.preventDefault();
            console.log('foo2');
            return false;
        });

    }

    ////////////////////////////////////////////////////
    // END drag drop file
    ////////////////////////////////////////////////////

    
    this.makeGUI = function (title) {
        _$border.append(_$hideBtn);
        _$wrapper.append(_$pane, _$border);

        _$pane.resizable({
            handles: "e"
        });

        $('body').append(_$3D, _$wrapper, makeTitle(title));
        prepareDontMissDND();
        
        _$pane.append(MLJ.gui.getWidget("SceneBar")._make());

        var $wrap = $("<div/>").attr("id", "mlj-split-pane");
        var $pos1 = $("<div/>").css({height: "100%"});
        $wrap.append($pos1);

        _$pane.append($wrap);

        //Init split pane height on window ready        
        $(window).ready(function () {
            $wrap.height($(window).height() - $wrap.offset().top);
        });

        $pos1.append(MLJ.gui.getWidget("TabbedPane")._make());
        
        _$3D.css({
            position: "absolute",
            width: $(window).width() - (_$pane.outerWidth() + _$pane.offset().left),
            left: _$pane.outerWidth() + _$pane.offset().left,
            height: "100%",
            top: 0
        });

        $(document).keydown(function (event) {
            if ((event.ctrlKey || event.metaKey) && event.which === 70) {
                event.preventDefault();
                MLJ.widget.TabbedPane.selectTab(0);
            }
        });

    };

    $(window).resize(function (event) {
        MLJ.gui.getWidget("TabbedPane")._refresh();

        _$3D.css({
            width: $(window).width() - (_$pane.outerWidth() + _$pane.offset().left),
            left: _$pane.outerWidth() + _$pane.offset().left
        });
    });

    _$hideBtn.click(function () {

        if (_$pane.data("visible")) {
            _$wrapper.animate({left: -_$pane.outerWidth()}, {
                duration: 500,
                start: function () {
                },
                step: function () {
                    $(window).trigger('resize');
                },
                complete: function () {
                    $(window).trigger('resize');

                    //Hide button animation
                    $({deg: 0}).animate({deg: 180}, {
                        duration: 500,
                        step: function (now) {
                            _$hideBtn.css({
                                transform: 'rotate(' + now + 'deg)'
                            });
                        }
                    });

                }
            });

            _$pane.data("visible", false);

        } else {
            _$wrapper.animate({left: 0}, {
                duration: 500,
                start: function () {
                },
                step: function () {
                    $(window).trigger('resize');
                },
                complete: function () {
                    $(window).trigger('resize');

                    //Hide button animation
                    $({deg: 180}).animate({deg: 360}, {
                        duration: 500,
                        step: function (now) {
                            _$hideBtn.css({
                                transform: 'rotate(' + now + 'deg)'
                            });
                        }
                    });

                }
            });

            _$pane.data("visible", true);
        }
    });

}).call(MLJ.gui, MLJ.gui.widget);
