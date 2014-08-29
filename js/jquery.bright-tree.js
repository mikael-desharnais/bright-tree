(function ($) {
	$.BrightTree = BrightTree;
    $.fn.brightTree = function (method) {
		var argumentsToPass = Array.prototype.slice.call(arguments);
		if (typeof method == "object"){
			method = "init";
		}else {
			argumentsToPass.shift();
		}
		/**
		* Attach to each DOM element a BrightTree Object and call the init method if there is no object attached
		* if the object already exists, call the given method with the given parameters
		*/
		var toReturn;
        this.each(function (key,element) {
			if (typeof jQuery(element).data('bright-tree') == "undefined"){
				jQuery(element).data('bright-tree', new BrightTree(jQuery(element)));
				method = "init";
			}
			jQuery(element).data('bright-tree')[method].apply(jQuery(element).data('bright-tree'),argumentsToPass);
			toReturn = jQuery(element).data('bright-tree');
		});
		if (this.length==1){
			return toReturn;
		}
    };

	function BrightTreeElement(tree,data){
		BrightTreeElement.instanceList.push(this);
		this.tree = tree;
		this.htmlElement = jQuery('<li></li>');
		this.labelContainer = jQuery('<div></div>');
		this.actionner = jQuery('<a href="#"><i class="icon-ok-sign"></i></a>');
		this.label = jQuery('<a href="#" class="bright-tree-label"></a>');
		this.childrenContainer = jQuery('<ul style="display : none;"></ul>');
		this.data = data;
		this.children = [];
		this.isOpen = false;
		this.isSelected = false;
		this.isSelectable = true;

		this.htmlElement.append(this.labelContainer);
		this.labelContainer.append(this.actionner);
		this.labelContainer.append(this.label);
		this.htmlElement.append(this.childrenContainer);

		var parent = this;
		this.getTree = function(){
			return this.tree;
		};
		this.initHTML = function(){
			this.childrenContainer.children().detach();
			for(var i in this.children){
				this.childrenContainer.append(this.children[i].getHtmlElement());
			}
		}
		this.actionner.click(function(event){
			event.preventDefault();
			parent.toogleStatus();
		});
		this.label.click(function(event){
			event.preventDefault();
			if (!parent.isSelectable){
				return;
			}
			parent.tree.selectElement(parent);
		});
		this.setSelectable = function(isSelectable){
			this.isSelectable = isSelectable;
			if (this.isSelectable){
				this.htmlElement.removeClass('unselectable');
			}else {
				this.htmlElement.addClass('unselectable');
			}
		}
		this.select = function(){
			this.isSelected = true;
			this.htmlElement.addClass('selected');
		}
		this.unselect = function(){
			this.isSelected = false;
			this.htmlElement.removeClass('selected');
		}

		this.toogleStatus = function(){
			this.setStatus(!this.isOpen);
		}
		this.getChildren = function(){
			return this.children;
		}
		this.setStatus = function(status){
			if (this.getChildren().length==0){
				return;
			}
			this.isOpen = status;
			if (status){
				this.open();
			}else{
				this.close();
			}
		}
		this.getStatus = function(){
			return this.isOpen;
		}
		this.open = function(){
			this.actionner.find('i').attr('class','icon-minus-sign');
			this.childrenContainer.fadeIn(this.getTree().isRedrawing()?0:500);
		}
		this.close = function(){
			this.actionner.find('i').attr('class','icon-plus-sign');
			this.childrenContainer.fadeOut(this.getTree().isRedrawing()?0:500);
		}
		this.getHtmlElement = function(){
			this.label.html(this.tree.settings['label-manager'](this));
			return this.htmlElement;
		}
		this.getData = function(){
			return this.data;
		}
		this.reset = function(){
			this.children.length = 0;
		}
		this.appendChild = function(child){
			this.children.push(child);
			var children = this.tree.settings['tree-manager'](child);
			if (typeof children != "undefined" && children.length>0){
				for(var i = 0; i < children.length;i++){
					var childTreeElement = this.tree.createTreeElementFromData(children[i]);
					child.appendChild(childTreeElement);
				}
			}
			this.setStatus(this.isOpen);
		}
		this.walk = function(walkFunction){
			for(var i in this.children){
				walkFunction(this.children[i]);
				this.children[i].walk(walkFunction);
			}
		};
	}

	BrightTreeElement.instanceList = [];
	function BrightTree(htmlContainer){
		var defaultSettings = $.extend($.fn.brightTree.settings,{
				"tree-manager" : BrightTree.treeManagers.simple,
				"label-manager" : BrightTree.labelManagers.simple,
				"select-manager" : new BrightTree.selectManagers.simple(),
				"init-select-manager" : BrightTree.initSelectManagers.none,
				"init-status-manager" : BrightTree.initStatusManagers.allClosed,
				"root-elements" : []
		    });
		this.children = [];
		this.isRedrawingB =false;
		this.selectElement = function(element){
			this.getSelectManager().select(element);
		}
		this.getSelectManager = function(){
			return this.settings['select-manager'];
		}
		this.getRootElements = function(){
			return this.settings['root-elements'];
		}
		this.init = function(options){
			this.settings = $.extend(defaultSettings);
			for(var i in options){
				if (typeof this.settings[i] != "undefined"){
					this.settings[i] = options[i];
				}
			}
			this.redraw();
			this.walk(function(element){
				if (element.getTree().settings['init-select-manager'](element)){
					element.getTree().selectElement(element);
				}
				if (element.getTree().settings['init-status-manager'](element)){
					element.setStatus(true);
				}
			})
		}
		this.getOpenElementData = function(){
			var toReturn = [];
			this.walk(function(element){
				if (element.getStatus()){
					toReturn.push(element.getData());
				}
			});
			return toReturn;
		}
		this.redraw = function(){
			this.isRedrawingB = true;
			var openElements = this.getOpenElementData();
			var rootHtmlElement = jQuery('<ul class="bright-tree"></ul>');
			htmlContainer.children().detach();
			this.children.length = 0;
			htmlContainer.append(rootHtmlElement);
			for(var i in this.settings['root-elements']){
				var treeElement = this.createTreeElementFromData(this.settings['root-elements'][i]);
				treeElement.reset();
				this.appendChild(treeElement);
				this.children.push(treeElement);
			}
			this.initHTML(rootHtmlElement);
			this.isRedrawingB = false;
		}
		this.isRedrawing = function(){
			return this.isRedrawing;
		}
		this.initHTML = function(rootHtmlElement){
			this.walk(function(element){
				element.initHTML();
			});
			for(var i in this.children){
				rootHtmlElement.append(this.children[i].getHtmlElement());
			}
		}
		this.createTreeElementFromData = function(data){
			for(var i in BrightTreeElement.instanceList){
				if (BrightTreeElement.instanceList[i].getData()==data){
					return BrightTreeElement.instanceList[i];
				}
			}
			return new BrightTreeElement(this,data);
		}
		this.appendChild = function(treeElement){
			var children = this.settings['tree-manager'](treeElement);
			if (typeof children != "undefined" && children.length>0){
				for(var i = 0; i < children.length;i++){
					var childTreeElement = this.createTreeElementFromData(children[i]);
					childTreeElement.reset();
					if (this.settings['init-select-manager'](childTreeElement)){
						this.selectElement(childTreeElement);
					}
					treeElement.appendChild(childTreeElement);
					if (this.settings['init-status-manager'](childTreeElement)){
						childTreeElement.setStatus(true);
					}
				}
			}
		}
		this.getHtmlContainer = function(){
			return htmlContainer;
		};
		this.walk = function(walkFunction){
			for(var i in this.children){
				walkFunction(this.children[i]);
				this.children[i].walk(walkFunction);
			}
		};
	}
	BrightTree.treeManagers = {
		simple : function(element){
			return element.getData().children;
		}
	};

	BrightTree.labelManagers = {
		simple : function(element){
			return element.getData().name;
		}
	};
	BrightTree.initSelectManagers = {
		none : function (element){
			return false;
		},
		all : function (element){
			return true;
		}
	};
	BrightTree.initStatusManagers = {
		allClosed : function(element){
			return false;
		},
		allOpened : function(element){
			return true;
		}
	};
	BrightTree.selectManagers = { simple : function (){
			this.selectedElement;
			this.elementSelectedListener = [];
			this.elementUnselectedListener = [];
			this.select = function(element){
				if (this.selectedElement==element){
					return;
				}
				if (typeof this.selectedElement != "undefined"){
					this.selectedElement.unselect();
					this.propagateElementUnselected(this.selectedElement);
				}
				element.select();
				this.selectedElement = element;
				this.propagateElementSelected(element);
			}
			this.getSelectedElement = function(){
				return this.selectedElement;
			}
			this.propagateElementSelected = function(element){
				for(var i in this.elementSelectedListener){
					this.elementSelectedListener[i](element);
				}
			}
			this.propagateElementUnselected = function(element){
				for(var i in this.elementUnselectedListener){
					this.elementUnselectedListener[i](element);
				}
			}
			this.addElementSelectedListener = function(listener){
				this.elementSelectedListener.push(listener);
			}
			this.addElementUnselectedListener = function(listener){
				this.elementUnselectedListener.push(listener);
			}
		},
		multiple : function(){
			this.selectedElementList = [];
			this.elementSelectedListener = [];
			this.elementUnselectedListener = [];
			this.select = function(element){
				if (this.selectedElementList.indexOf(element)>=0){
					this.selectedElementList.splice(this.selectedElementList.indexOf(element),1);
					element.unselect();
					this.propagateElementUnselected(element);
					return;
				}
				element.select();
				this.selectedElementList.push(element);
				this.propagateElementSelected(element);
			}
			this.getSelectedElementList = function(){
				return this.selectedElementList;
			}
			this.propagateElementSelected = function(element){
				for(var i in this.elementSelectedListener){
					this.elementSelectedListener[i](element);
				}
			}
			this.propagateElementUnselected = function(element){
				for(var i in this.elementUnselectedListener){
					this.elementUnselectedListener[i](element);
				}
			}
			this.addElementSelectedListener = function(listener){
				this.elementSelectedListener.push(listener);
			}
			this.addElementUnselectedListener = function(listener){
				this.elementUnselectedListener.push(listener);
			}
		}
	};

}(jQuery));
