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
		this.open = function(){
			this.actionner.find('i').attr('class','icon-minus-sign');
			this.childrenContainer.fadeIn(500);
		}
		this.close = function(){
			this.actionner.find('i').attr('class','icon-plus-sign');
			this.childrenContainer.fadeOut(500);
		}
		this.getHtmlElement = function(){
			this.label.html(this.tree.settings['label-manager'](this));
			return this.htmlElement;
		}
		this.getData = function(){
			return this.data;
		}
		this.appendChild = function(child){
			this.childrenContainer.append(child.getHtmlElement());
			this.children.push(child);
			var children = this.tree.settings['tree-manager'](child);
			if (typeof children != "undefined" && children.length>0){
				for(var i = 0; i < children.length;i++){
					var childrenTreeElement = new BrightTreeElement(this.tree,children[i]);
					child.appendChild(childrenTreeElement);
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
		}
		this.redraw = function(){
			var rootHtmlElement = jQuery('<ul class="bright-tree"></ul>');
			htmlContainer.empty();
			this.children.length = 0;
			htmlContainer.append(rootHtmlElement);
			for(var i in this.settings['root-elements']){
				var treeElement = this.createTreeElementFromData(this.settings['root-elements'][i]);
				if (this.settings['init-select-manager'](treeElement)){
					this.selectElement(treeElement);
				}
				this.appendChild(rootHtmlElement,treeElement);
				if (this.settings['init-status-manager'](treeElement)){
					treeElement.setStatus(true);
				}
				this.children.push(treeElement);
			}
		}
		this.createTreeElementFromData = function(data){
			return new BrightTreeElement(this,data);
		}
		this.appendChild = function(container,treeElement){
			container.append(treeElement.getHtmlElement());
			var children = this.settings['tree-manager'](treeElement);
			if (typeof children != "undefined" && children.length>0){
				for(var i = 0; i < children.length;i++){
					var childrenTreeElement = this.createTreeElementFromData(children[i]);
					if (this.settings['init-select-manager'](childrenTreeElement)){
						this.selectElement(childrenTreeElement);
					}
					treeElement.appendChild(childrenTreeElement);
					if (this.settings['init-status-manager'](childrenTreeElement)){
						childrenTreeElement.setStatus(true);
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

