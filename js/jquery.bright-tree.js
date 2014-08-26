(function ($) {
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
        return this.each(function (key,element) {
			if (typeof jQuery(element).data('bright-tree') == "undefined"){
				jQuery(element).data('bright-tree', new BrightTree(jQuery(element)));
				method = "init";
			}
			jQuery(element).data('bright-tree')[method].apply(jQuery(element).data('bright-tree'),argumentsToPass);
		});
    };

	function BrightTreeManager(element){
		return element.getData().children;		
	}
	function BrightLabelManager(element){
		return element.getData().labelOfPipo+" - "+(new Date());
	}
	function BrightSelectManager(){
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
	function BrightTreeElement(tree,data){
		this.tree = tree;
		this.htmlElement = jQuery('<li></li>');
		this.actionner = jQuery('<a href="#"><i class="icon-ok-sign"></i></a>');
		this.label = jQuery('<a href="#"></a>');
		this.childrenContainer = jQuery('<ul style="display : none;"></ul>');
		this.data = data;
		this.children = [];
		this.isOpen = false;
		this.isSelected = false;
		
		this.htmlElement.append(this.actionner);
		this.htmlElement.append(this.label);
		this.htmlElement.append(this.childrenContainer);
		
		var parent = this;
		
		this.actionner.click(function(event){
			event.preventDefault();
			parent.toogleStatus();
		});
		this.label.click(function(event){
			event.preventDefault();
			parent.tree.selectElement(parent);
		});
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
	}
	function BrightTree(htmlContainer){
		var defaultSettings = $.extend($.fn.brightTree.settings,{
				"tree-manager" : BrightTreeManager,
				"label-manager" : BrightLabelManager,
				"select-manager" : new BrightSelectManager(),
				"root-elements" : []
		    });
		this.selectElement = function(element){
			this.getSelectManager().select(element);
		}
		this.getSelectManager = function(){
			return this.settings['select-manager'];
		}
		this.init = function(options){
			this.settings = $.extend(defaultSettings);
			for(var i in options){
				if (typeof this.settings[i] != "undefined"){
					this.settings[i] = options[i];
				}
			}
			var rootHtmlElement = jQuery('<ul></ul>');
			htmlContainer.append(rootHtmlElement);
			for(var i in this.settings['root-elements']){
				var treeElement = new BrightTreeElement(this,this.settings['root-elements'][i]);
				this.appendChild(rootHtmlElement,treeElement);
			}
			
		}
		this.appendChild = function(container,treeElement){
			container.append(treeElement.getHtmlElement());
			var children = this.settings['tree-manager'](treeElement);
			if (typeof children != "undefined" && children.length>0){
				for(var i = 0; i < children.length;i++){
					var childrenTreeElement = new BrightTreeElement(this,children[i]);
					treeElement.appendChild(childrenTreeElement);
				}
			}
		}
		this.getHtmlContainer = function(){
			return htmlContainer;
		};
	}
	
}(jQuery));

