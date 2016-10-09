/**
    one.js
    version: 0.0.1
    author: CYF
    email: md-111111@163.com
**/
(function (window, document) {
    var O = window.$O = {};

    HTMLElement.prototype.get = HTMLElement.prototype.querySelector;
    HTMLElement.prototype.getAll = HTMLElement.prototype.querySelectorAll;

    HTMLElement.prototype.html = function (inhtml) {
        if (inhtml == undefined) {
            return this.innerHTML;
        } else {
            this.innerHTML = inhtml;
            return this;
        }
    };

    O.get = function (selector) {
        return document.querySelector(selector);
    };

    O.getAll = function (selector) {
        return document.querySelectorAll(selector);
    };

    O.on = function (ele, eventName, handler, useCapture) {
        if (eventName == 'tap' && 'ontouchstart' in document) {
            if (!ele.dataset['taptouchstart']) {
                ele.dataset['taptouchstart'] = true;
                ele.addEventListener('touchstart', function () {
                    delete ele.dataset.touchmove;
                    this.dataset['touchstart'] = true;
                }, false);
                ele.addEventListener('touchmove', function (e) {
                    this.dataset['touchmove'] = true;
                }, false);
            }
            var tapTouchEndList = ele.tapTouchEndList;
            if (!tapTouchEndList) {
                tapTouchEndList = ele.tapTouchEndList = [];
            }
            var tapObj = {
                shandler: handler,
                handler: function (e) {
                    if (this.dataset['touchstart'] && !this.dataset['touchmove']) {
                        e.type = 'tap';
                        handler.apply(this, [e]);
                    }
                }
            };
            tapTouchEndList.push(tapObj);
            ele.addEventListener('touchend', tapObj.handler, false);
        } else {
            if (eventName == 'tap') {
                eventName = 'click';
            }
            ele.addEventListener(eventName, handler, useCapture);
        }
    };

    O.off = function (ele, eventName, handler) {
        if (eventName == 'tap') {
            var tapTouchEndList = ele.tapTouchEndList;
            if (tapPouchEndList) {
                var tapObj = null;
                for (var i = 0; i < tapTouchEndList.length; i++) {
                    var item = tapTouchEndList[i];
                    if (item.shandler == handler) {
                        tapObj = item;
                        break;
                    }
                }
                if (tapObj) {
                    ele.removeEventListener('touchend', tapObj.handler);
                }
            }
        } else {
            ele.removeEventListener(eventName, handler);
        }
    };


    var http = O.http = {};

    http.get = function (url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    callback(xhr.response);
                }
            }
        };
        xhr.open('GET', url, true);
        xhr.send();
    };

    http.getJSON = function (url, callback) {
        http.get(url, function (resp) {
            if (typeof (resp) == 'string') {
                resp = JSON.parse(resp);
            }
            callback(resp);
        });
    };

    http.post = function (url, params, callback) {
        var _ps = "";
        if (params) {
            var _i = 0;
            for (var _k in params) {
                if (_i > 0) {
                    _ps += "&";
                }
                _ps += _k + "=" + encodeURI(params[_k]);
                _i++;
            }
        }
        var xhr = new XMLHttpRequest();
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    callback(xhr.response);
                }
            }
        };
        xhr.open('POST', url, true);
        xhr.send(_ps);
    }

    http.postJSON = function (url, params, callback) {
        http.post(url, params, function (resp) {
            if (typeof (resp) == 'string') {
                resp = JSON.parse(resp);
            }
            callback(resp);
        });
    };

    var objects = O.objects = {};

    objects.extend = function (subClass, superClass) {
        if (subClass && superClass) {
            var f = new Function();
            f.prototype = superClass.prototype;

            subClass.prototype = new f();
            subClass.prototype.constructor = subClass;
            subClass.superClass = superClass.prototype;
            subClass.superConstructor = superClass;
        }
        return;
    };

    // options:
    //      template
    var Control = O.Control = function (urlOrCnf, options) {
        options = options || {};
        this.options = options;
        if (urlOrCnf instanceof HTMLElement) {
            this.ele = urlOrCnf;
        }else if (typeof (urlOrCnf) === 'string') {
            this.url = urlOrCnf;
        } else {
            this.cnf = urlOrCnf;
        }
        this.template = options.template || (this.cnf && this.cnf.template);
        return this;
    };

    Control.prototype._initCnf = function (callbackFun) {
        var _this = this;
        var onInitCnf = function () {
            if (_this.cnf) {
                for (var k in _this.cnf) {
                    _this[k] = _this.cnf[k];
                }
            }
            if (_this.options.onInitCnf) {
                _this.options.onInitCnf.apply(_this, []);
            }
        };
        if (this.cnf || this.ele) {
            onInitCnf();
            callbackFun.apply(this, []);
        } else {
            require([this.url], function (cnf) {
                _this.cnf = cnf;
                onInitCnf();
                callbackFun.apply(_this, []);
            });
        }
    };

    Control.prototype._init = function (callbackFun) {
        var _this = this;
        //this._initCnf(function () {
            var _readyTemplate = function () {
                if (_this.template) {
                    var div = document.createElement('div');
                    div.innerHTML = _this.template;
                    //_this.eles = [];
                    //for (var i = 0; i < div.childNodes.length; i++) {
                    //    _this.eles.push(div.childNodes[i]);
                    //}
                    _this.ele = div;
                    if (_this.cnf) {
                        if (_this.cnf.init) {
                            _this.cnf.init.apply(_this, [_this.options.params]);
                        }
                    }
                }

                if (_this.cnf && _this.cnf.extend) {
                    //var masterUrl = 'root/' + _this.cnf.extend + '/' + _this.cnf.extend;
                    var ary = _this.cnf.extend.split('/'), extendName = ary[ary.length - 1];
                    var masterUrl = _this.cnf.extend + '/' + extendName;
                    var master = new Control(masterUrl);
                    _this.master = master;
                    master.templateUrl = masterUrl + O.cnf.templateExtension;
                    master._init(function () {
                        var places = this.ele.querySelectorAll('place');
                        for (var i = 0; i < places.length; i++) {
                            var place = places[i],
                                name = place.getAttribute('name');
                            if (name) {
                                var child = _this.ele.querySelector(':scope>place[name=' + name + ']');
                                if (child) {
                                    while (child.children.length > 0) {
                                        place.parentElement.insertBefore(child.children[0], place);
                                    }
                                }
                            }
                            place.remove();
                        }
                        _this.ele = this.ele;
                        if (callbackFun) {
                            callbackFun.apply(_this, []);
                        }
                    });
                } else {
                    if (callbackFun) {
                        callbackFun.apply(_this, []);
                    }
                }
            };
            if (_this.template || _this.ele) {
                _readyTemplate();
            } else {
                _this.templateUrl = (_this.cnf && _this.cnf.templateUrl) || _this.templateUrl;
                if (_this.templateUrl) {
                    require(['text!' + _this.templateUrl], function (template) {
                        _this.template = template;
                        _readyTemplate();
                    });
                } else {
                    _readyTemplate();
                }
            }
        //});

        return this;
    };

    Control.prototype._render = function (target) {
        this.parentEle = target;
        if (this.ele) {
            this.eles = [];
            if (this.template) {
                while (this.ele.children.length > 0) {
                    var item = this.ele.children[0];
                    this.eles.push(item);
                    target.appendChild(item);
                }
            } else {
                this.eles.push(this.ele);
                target.appendChild(this.ele);
            }
        }
        if (this.cnf && this.cnf.onRender) {
            this.cnf.onRender.apply(this, [this.options.params]);
        }
    };

    Control.prototype.render = function (target, callbackFun) {
        this._initCnf(function () {
            this._init(function () {
                this._render(target);
                if (callbackFun) {
                    callbackFun.apply(this, []);
                }
            });
        });
        return this;
    };

    Control.prototype.get = function (selector) {
        if (this.parentEle) {
            return this.parentEle.querySelector(selector);
        } else if (this.eles) {
            for (var i = 0; i < this.eles.length; i++) {
                var ele = this.eles[i].get(selector);
                if (ele) {
                    return ele;
                }
            }
        } else if (this.ele) {
            return this.ele.get(selector);
        }
        return undefined;
    };

    Control.prototype.getAll = function (selector) {
        if (this.parentEle) {
            return this.parentEle.getAll(selector);
        } else if (this.eles) {
            var ary = [];
            for (var i = 0; i < this.eles.length; i++) {
                var _ary = this.eles[i].getAll(selector);
                for (var j = 0; j < _ary.length; j++) {
                    ary.push(_ary[j]);
                }
            }
            return ary;
        } else if (this.ele) {
            return this.ele.querySelectorAll(selector);
        }
        return [];
    };


    var Header = O.Header = function (urlOrEle) {
        if (typeof urlOrEle == 'string') {
            this.templateUrl = urlOrEle + O.cnf.templateExtension;
        }
        Header.superConstructor.apply(this, [urlOrEle]);
        return this;
    };
    objects.extend(Header, Control);

    Header.prototype.getBackElement = function () {
        return this.eleBack || (this.eleBack = this.get('.o-header [name=back]'));
    };

    Header.prototype.getTitleElement = function () {
        return this.eleTitle || (this.eleTitle = this.get('.o-header [name=title]'));
    };

    Header.prototype.getLeftElements = function () {
        var ary = this.leftElements;
        if (!ary) {
            this.leftElements = ary = [],
            eles = this.ele.querySelectorAll(':scope>*');
            for (var i = 0; i < eles.length; i++) {
                var ele = eles[i];
                if (ele.getAttribute('name') == 'title') {
                    break;
                }
                ary.push(ele);
            }
        }
        return ary;
    };

    Header.prototype.getRightElements = function () {
        return this.rightElements || (this.rightElements = this.getAll('.o-header [name=title]~*'));
    };

    Header.prototype.setTitle = function (title) {
        var eleTitle = this.getTitleElement();
        if (eleTitle) {
            eleTitle.innerHTML = title;
        }
        return this;
    };

    Header.prototype.getTitle = function () {
        var eleTitle = this.getTitleElement();
        if (eleTitle) {
            return eleTitle.innerHTML;
        }
        return undefined;
    };

    Header.prototype.setTitleAlign = function (textAlign) {
        var eleTitle = this.getTitleElement();
        if (eleTitle) {
            eleTitle.style.textAlign = textAlign;
        }
        return this;
    };

    Header.prototype.setBackEventHandler = function (eventHandler) {
        var eleBack = this.getBackElement();
        if (eleBack) {
            if (this._backEventHandler) {
                O.off(eleBack, 'tap', this._backEventHandler);
            }
            this._backEventHandler = eventHandler;
            if (eventHandler) {
                O.on(eleBack, 'tap', eventHandler);
            }
        }
        return this;
    };

    Header.prototype.setBackVisibility = function (canVisible, canDisplay) {
        var eleBack = this.getBackElement();
        if (eleBack) {
            eleBack.style.visibility = canVisible ? 'visible' : 'hidden';
            if (canDisplay != undefined) {
                eleBack.style.display = canDisplay ? 'none' : 'inline-block';
            }
        }
        return this;
    };

    Header.prototype.setBackDisplay = function (canDisplay, canVisible) {
        var eleBack = this.getBackElement();
        if (eleBack) {
            eleBack.style.display = canDisplay ? 'inline-block' : 'none';
            if (canVisible != undefined) {
                eleBack.style.visibility = canVisible ? 'visible' : 'hidden';
            }
        }
        return this;
    };

    Header.prototype.showBack = function () {
        this.setBackDisplay(true, true);
    };

    Header.prototype.hideBack = function () {
        this.setBackDisplay(false, false);
    };

    Header.prototype.setLeftVisibility = function (canVisible) {
        var eles = this.getLeftElements(),
            visibility = canVisible ? 'visible' : 'hidden';
        for (var i = 0; i < eles.length; i++) {
            eles[i].style.visibility = visibility;
        }
        return this;
    };

    Header.prototype.setLeftDisplay = function (canDisplay) {
        var eles = this.getLeftElements(),
            display = canDisplay ? 'none' : 'inline-block';
        for (var i = 0; i < eles.length; i++) {
            eles[i].style.display = display;
        }
        return this;
    };

    Header.prototype.setRightVisibility = function (canVisible) {
        var eles = this.getRightElements(),
            visibility = canVisible ? 'visible' : 'hidden';
        for (var i = 0; i < eles.length; i++) {
            eles[i].style.visibility = visibility;
        }
        return this;
    };

    Header.prototype.setRightDisplay = function (canDisplay) {
        var eles = this.getRightElements(),
            display = canDisplay ? 'none' : 'inline-block';
        for (var i = 0; i < eles.length; i++) {
            eles[i].style.display = display;
        }
        return this;
    };


    // menus: [{tit:'aaa', target:'index'}]
    var Footer = O.Footer = function (menus, options) {
        options = options || {};
        var cnf = {
            init: function () {
                var bindEvent = function (ele, target) {
                    ele.addEventListener('click', function () {
                        Form.change(target, { notNewForm: true });
                    }, false);
                };
                var eles = this.ele.querySelectorAll('[data-o_target]');
                for (var i = 0; i < eles.length; i++) {
                    bindEvent(eles[i], eles[i].dataset['o_target']);
                }
            }
        };
        if (!options.template && !options.templateUrl) {
            var div = document.createElement('div');
            div.className = 'o-footer o-footer-grid';
            for (var i = 0; i < menus.length; i++) {
                var menu = menus[i],
                    menuEle = document.createElement('div');
                menuEle.innerHTML = menu.tit;
                menuEle.dataset['o_target'] = menu.target;
                div.appendChild(menuEle);
            }
            cnf.template = div.outerHTML;
        }
        Footer.superConstructor.apply(this, [cnf, options]);
        return this;
    };
    objects.extend(Footer, Control);


    //      effect: 'slide' | 'fade' | 'cube' | 'coverflow' | 'flip'
    //      speed: number
    //      tabs:[
    //          {label:'', icon:'', iconActive:'', target:''}
    //      ]
    var Tabs = O.Tabs = function (ele, options) {
        options = options || {};
        this.eleContent = ele.querySelector('.o-content');
        this.eleHead = ele.querySelector('.o-tabs-head');
        this.eleTabs = [];
        this.activeIndex = -1;

        this.onBeforeSlideTo = options.onBeforeSlideTo;
        this.onAfterSlideTo = options.onAfterSlideTo;
        this.onCreatedForm = options.onCreatedForm;

        var _this = this;

        var slides = this.eleContent.children,
            slideHtmls = [];
        for (var i = 0; i < slides.length; i++) {
            slideHtmls.push(slides[i].innerHTML);
        }

        this.eleContent.classList.add('swiper-container');
        this.eleContent.innerHTML = '';

        var wrapper = document.createElement('div');
        wrapper.className = 'swiper-wrapper';
        this.eleContent.appendChild(wrapper);

        for (var i = 0; i < slideHtmls.length; i++) {
            var slide = document.createElement('div');
            slide.className = 'swiper-slide o-form';
            slide.innerHTML = slideHtmls[i];
            wrapper.appendChild(slide);
        }

        //var _heads = this.eleHead.children,
        //    heads = [];
        //for (var i = 0; i < _heads.length; i++) {
        //    heads.push(_heads[i]);
        //}
        //this.eleHead.innerHTML = '';
        //var div = document.createElement('div');
        //this.eleHead.appendChild(div);
        //div = document.createElement('div');
        //this.eleHead.appendChild(div);
        for (var i = 0; i < this.eleHead.children.length; i++) {
            var head = this.eleHead.children[i];
            //div.appendChild(head);
            var icon = head.dataset['icon'];
            if (icon) {
                var iicon = document.createElement('i');
                iicon.className = icon;
                head.appendChild(iicon);
            }
            var label = head.dataset['label'];
            if (label) {
                //if (icon) {
                //    var br = document.createElement('br');
                //    head.appendChild(br);
                //}
                var divLabel = document.createElement('div');
                divLabel.innerHTML = label;
                divLabel.className = 'label';
                head.appendChild(divLabel);
            }
            this.eleTabs.push(head);
            O.on(head, 'tap', function (e) {
                var idx = 0;
                for (var i = 0; i < _this.eleTabs.length; i++) {
                    var tab = _this.eleTabs[i];
                    if (tab == this) {
                        idx = i;
                        break;
                    }
                }
                _this.slideTo(idx);
            });
        }
        //var div = document.createElement('div');
        //this.eleHead.appendChild(div);
        var effect = options.effect || 'fade',
            speed = effect == 'fade' ? 0 : (options.speed || 300),
            allowDrag = effect == 'fade' ? false : !!options.allowDrag;
        this.swiper = new O.Swiper(this.eleContent, {
            effect: effect == 'fade' ? 'slide' : effect,
            speed: speed,
            onlyExternal: !allowDrag,
            onSlideChangeStart: function () {
                _this._setActiveClass(_this.swiper.activeIndex);
                _this.activeIndex = _this.swiper.activeIndex;
            },
            onSliderMove: function () {
                var idx = _this.swiper.activeIndex + (_this.swiper.touches.currentX < _this.swiper.touches.startX ? 1 : -1);
                _this.load(idx);
            }
        });

        this.slideTo(0);
        this._setActiveClass(0);
    };

    Tabs.prototype._setActiveClass = function (idx) {
        for (var i = 0; i < this.eleTabs.length; i++) {
            var tab = this.eleTabs[i], iconEle = tab.get('i'), icon = tab.dataset['icon'], iconActive = tab.dataset['iconactive'];
            if (i == idx) {
                if (iconEle && iconActive) {
                    iconEle.classList.remove(icon);
                    iconEle.classList.add(iconActive);
                }
                tab.classList.add('active');
            } else {
                if (iconEle && iconActive) {
                    iconEle.classList.remove(iconActive);
                    iconEle.classList.add(icon);
                }
                tab.classList.remove('active');
            }
        }
    };

    Tabs.prototype.load = function (idx, isReload) {
        var tab = this.eleTabs[idx];
        if (tab) {
            var target = tab.dataset['target'];
            if (target) {
                var form = null;
                if (isReload || !tab.dataset['loading']) {
                    tab.dataset['loading'] = true;
                    var slide = this.swiper.slides[idx];
                    slide.innerHTML = '';
                    if (!this.forms) {
                        this.forms = {};
                    }
                    var _this = this;
                    form = this.forms[target] = new Form(target, {
                        onInitCnf: function () {
                            if (_this.onAfterSlideTo) {
                                _this.onAfterSlideTo.apply(_this, [form]);
                            }
                        }
                    });
                    if (this.onCreatedForm) {
                        this.onCreatedForm.apply(this, [form]);
                    }
                    form.render(slide, function () {
                        tab.dataset['loaded'] = true;
                    });
                } else {
                    form = this.forms[target];
                    if (form && this.onAfterSlideTo) {
                        this.onAfterSlideTo.apply(this, [form]);
                    }
                }
            }
        }
    };

    Tabs.prototype.slideTo = function (idx) {
        if (idx != this.activeIndex) {
            if (this.onBeforeSlideTo) {
                this.onBeforeSlideTo.apply(this, [idx, this.activeIndex]);
            }
            this.swiper.slideTo(idx);
            this.load(idx);
        }
    };


    // tabs:{
    //      tabsPosition: 'top' | 'bottom'
    //      effect: 'slide' | 'fade' | 'cube' | 'coverflow' | 'flip'
    //      allowDrag: false | true
    //      tabs:[
    //          {label:'', icon:'', iconActive:'', target:''}
    //      ]
    //  }
    // 
    // header: url
    var Form = O.Form = function (name, options) {
        options = options || {};
        this.name = name;
        //this.templateUrl = 'root/' + name + '/' + name + O.cnf.templateExtension;
        Form.superConstructor.apply(this, ['root/' + name + '/' + name, options]);
        return this;
    };
    objects.extend(Form, Control);

    //Form.prototype.init = function () {

    //};

    Form.prototype.render = function (target, callbackFun) {
        var _this = this,
            _render = function () {
                if (_this.cnf && _this.cnf.tabs) {
                    var eleTabs = document.createElement('div');
                    target.appendChild(eleTabs);
                    eleTabs.className = 'o-tabs o-tabs-' + (_this.cnf.tabs.theme || 'fresh');
                    var eleTabsContent = document.createElement('div');
                    eleTabsContent.className = 'o-content';
                    eleTabs.appendChild(eleTabsContent);
                    var tabN = 0;
                    if (_this.cnf.tabs.tabs) {
                        tabN = _this.cnf.tabs.tabs.length;
                    }
                    for (var i = 0; i < tabN; i++) {
                        var div = document.createElement('div');
                        eleTabsContent.appendChild(div);
                    }
                    var eleTabsHeader = document.createElement('div');
                    eleTabsHeader.className = 'o-tabs-head';
                    eleTabs.appendChild(eleTabsHeader);
                    for (var i = 0; i < tabN; i++) {
                        var item = _this.cnf.tabs.tabs[i],
                            div = document.createElement('div');
                        eleTabsHeader.appendChild(div);
                        if (item.label) {
                            div.dataset['label'] = item.label;
                        }
                        if (item.icon) {
                            div.dataset['icon'] = item.icon;
                        }
                        if (item.iconActive) {
                            div.dataset['iconactive'] = item.iconActive;
                        }
                        if (item.target) {
                            div.dataset['target'] = item.target;
                        }
                    }
                    _this.tabs = new Tabs(eleTabs, {
                        effect: _this.cnf.tabs.effect,
                        allowDrag: _this.cnf.tabs.allowDrag,
                        onCreatedForm: function (fm) {
                            fm.mainForm = _this;
                            fm.header = _this.header;
                        },
                        onAfterSlideTo: function (fm) {
                            if (fm.onActive) {
                                fm.onActive.apply(fm, []);
                            }
                        }
                    });
                    if (callbackFun) {
                        callbackFun.apply(_this, []);
                    }
                } else {
                    var eleContent = document.createElement('div');
                    eleContent.className = 'o-content';
                    target.appendChild(eleContent);
                    _this.__proto__.__proto__._render.apply(_this, [eleContent]);
                    if (callbackFun) {
                        callbackFun.apply(_this, []);
                    }
                }
            };

        this._initCnf(function () {
            if (_this.cnf && !_this.cnf.tabs) {
                _this.templateUrl = 'root/' + _this.name + '/' + _this.name + O.cnf.templateExtension;
            }
            this._init(function () {
                if (_this.cnf && _this.cnf.header) {
                    var ary = _this.cnf.header.split('/'),
                        name = ary[ary.length - 1],
                        url = _this.cnf.header + '/' + name;
                    //_this.header = new Control(url);
                    //_this.header.templateUrl = url + '.html';
                    //_this.header.render(target, function () {
                    //    _render();
                    //});
                    _this.header = new Header(url);
                    _this.header.render(target, function () {
                        if (O.wrapper.activeIndex > 0) {
                            this.showBack();
                            this.setBackEventHandler(function () {
                                Form.back(1);
                            });
                        }
                        _render();
                    });
                } else {
                    _render();
                }
            });
        });

        return this;
    };

    Form.change = function (name, options) {
        options = options || {};
        if (options.params == undefined) {
            options.params = {};
        }
        var idx = O.wrapper.activeIndex || 0;
        if (!options.notNewForm) {
            idx++;
        }
        if (idx >= O.wrapper.slides.length) {
            O.wrapper.appendSlide('<div class="swiper-slide o-form"></div>');
        }
        O.wrapper.slideTo(idx);
        var slide = O.wrapper.slides[idx];
        slide.innerHTML = '';
        var form = new Form(name, options);
        form.render(slide);
        //form.init(function () {
        //    for (var i = 0; i < form.eles.length; i++) {
        //        slide.appendChild(form.eles[i]);
        //    }
        //});
    };

    Form.back = function (step) {
        var idx = O.wrapper.activeIndex;
        if (idx > 0) {
            step = step || 1;
            idx -= step;
            if (idx < 0) {
                idx = 0;
            }
            O.wrapper.slideTo(idx);
        }
    }

    Form.backTo = function (idx) {
        var curIdx = O.wrapper.activeIndex;
        if (idx < curIdx) {
            var startIdx = idx + 1;
            for (var i = startIdx; i < curIdx; i++) {
                O.wrapper.removeSlide(startIdx);
            }
            O.wrapper.slideTo(idx);
        }
    };


    O.Swiper = Swiper;


    // target
    // start
    O.init = function (cnf) {
        O.cnf = cnf || {};

        require.config({
            baseUrl: 'js',
            paths: {
                root: '..'
            },
            urlArgs: 't=' + Date.now()
        });

        O.cnf.templateExtension = O.cnf.templateExtension || '.htm';

        var ele = document.createElement('div');
        ele.className = 'swiper-container';
        ele.style.height = '100%';
        O.target = O.cnf.target ? document.querySelector(O.cnf.target) : document.body;
        var initContainerStyle = function (element) {
            element.style.margin = '0px';
            element.style.padding = '0px';
            element.style.height = '100%';
            element.style.width = '100%';
            element.style.overflow = 'hidden';
            element.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
            element.style.color = '#394263';
            element.style.fontSize = '13px';
            element.style.backgroundColor = '#e4e4e4';
        };
        var parent = document.body.parentElement;
        if (parent instanceof HTMLHtmlElement) {
            initContainerStyle(parent);
        }
        initContainerStyle(O.target);

        O.target.appendChild(ele);
        var div = document.createElement('div');
        div.className = 'swiper-wrapper';
        ele.appendChild(div);
        O.wrapper = new O.Swiper(ele, {
            onlyExternal: true
        });

        var start = O.cnf.start || 'index';
        Form.change(start, { notNewForm: true });
    };
})(window, document);