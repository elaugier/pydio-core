/**
 * @package info.ajaxplorer.plugins
 * 
 * Copyright 2007-2009 Charles du Jeu
 * This file is part of AjaXplorer.
 * The latest code can be found at http://www.ajaxplorer.info/
 * 
 * This program is published under the LGPL Gnu Lesser General Public License.
 * You should have received a copy of the license along with AjaXplorer.
 * 
 * The main conditions are as follow : 
 * You must conspicuously and appropriately publish on each copy distributed 
 * an appropriate copyright notice and disclaimer of warranty and keep intact 
 * all the notices that refer to this License and to the absence of any warranty; 
 * and give any other recipients of the Program a copy of the GNU Lesser General 
 * Public License along with the Program. 
 * 
 * If you modify your copy or copies of the library or any portion of it, you may 
 * distribute the resulting library provided you do so under the GNU Lesser 
 * General Public License. However, programs that link to the library may be 
 * licensed under terms of your choice, so long as the library itself can be changed. 
 * Any translation of the GNU Lesser General Public License must be accompanied by the 
 * GNU Lesser General Public License.
 * 
 * If you copy or distribute the program, you must accompany it with the complete 
 * corresponding machine-readable source code or with a written offer, valid for at 
 * least three years, to furnish the complete corresponding machine-readable source code. 
 * 
 * Any of the above conditions can be waived if you get permission from the copyright holder.
 * AjaXplorer is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * 
 * Description : Simple Boot Loader.
 * Defaults params for constructor should be {} and content.php?get_action=get_boot_conf
 */
Class.create("AjxpBootstrap", {
	parameters : $H({}),
	initialize : function(startParameters){
		this.parameters = $H(startParameters);
		this.detectBaseParameters();
		if(this.parameters.get("ALERT")){
			window.setTimeout(function(){alert(this.parameters.get("ALERT"));}.bind(this),0);
		}		
		Event.observe(window, 'load', function(){
			this.loadBootConfig();		
		}.bind(this));		
		document.observe("ajaxplorer:before_gui_load", function(e){
			var marginBottom = 0;
			if($('optional_bottom_div') && $('optional_bottom_div').getHeight()>15 ){
				marginBottom = $('optional_bottom_div').getHeight();
			}
			fitHeightToBottom($("ajxp_desktop"), window, marginBottom, true);
		});
		document.observe("ajaxplorer:loaded", function(e){
			this.insertAnalytics();
			if(this.parameters.get("SELECTOR_DATA")){
	    		ajaxplorer.actionBar.defaultActions.set("select", "ext_select");
	    		ajaxplorer.actionBar.selectorData = new Hash(this.parameters.get("SELECTOR_DATA"));
			}
		}.bind(this));
	},
	loadBootConfig : function(){
		var connexion = new Connexion(this.parameters.get('BOOTER_URL')+(this.parameters.get("debugMode")?'&debug=true':''));
		connexion.onComplete = function(transport){
			if(transport.responseXML && transport.responseXML.documentElement && transport.responseXML.documentElement.nodeName == "tree"){
				var alert = XPathSelectSingleNode(transport.responseXML.documentElement, "message");
				window.alert(alert.firstChild.nodeValue);
				return;
			}
			var data = transport.responseText.evalJSON();
			this.parameters.update(data);
			var cssRes = this.parameters.get("cssResources");
			if(cssRes) cssRes.each(this.loadCSSResource.bind(this));
			if(this.parameters.get('ajxpResourcesFolder')){
				window.ajxpResourcesFolder = this.parameters.get('ajxpResourcesFolder');
			}
			this.insertLoaderProgress();
			if(!this.parameters.get("debugMode")){
				connexion.loadLibrary("ajaxplorer.js");
			}
			window.MessageHash = this.parameters.get("i18nMessages");
			window.zipEnabled = this.parameters.get("zipEnabled");
			window.multipleFilesDownloadEnabled = this.parameters.get("multipleFilesDownloadEnabled");
			window.flashUploaderEnabled = this.parameters.get("flashUploaderEnabled");			
			document.fire("ajaxplorer:boot_loaded");
			window.ajaxplorer = new Ajaxplorer(this.parameters.get("EXT_REP")||"", this.parameters.get("usersEnabled"), this.parameters.get("loggedUser"));
			if(this.parameters.get("currentLanguage")){
				window.ajaxplorer.currentLanguage = this.parameters.get("currentLanguage");
			}
			if(this.parameters.get("htmlMultiUploaderOptions")){
				window.htmlMultiUploaderOptions = this.parameters.get("htmlMultiUploaderOptions");
			}
			$('version_span').update(' - Version '+this.parameters.get("ajxpVersion") + ' - '+ this.parameters.get("ajxpVersionDate"));
			window.ajaxplorer.init();
		}.bind(this);
		connexion.sendSync();
		
	},
	detectBaseParameters : function(){
		$$('script').each(function(scriptTag){
			if(scriptTag.src.match("/js/ajaxplorer_boot.js") || scriptTag.src.match("/js/ajaxplorer/class.AjxpBootstrap.js")){
				if(scriptTag.src.match("/js/ajaxplorer_boot.js")){
					this.parameters.set("debugMode", false);
				}else{
					this.parameters.set("debugMode", true);
				}
				this.parameters.set("ajxpResourcesFolder", scriptTag.src.replace('/js/ajaxplorer/class.AjxpBootstrap.js','').replace('/js/ajaxplorer_boot.js', ''));
				return;
			}
		}.bind(this) );
		if(this.parameters.get("ajxpResourcesFolder")){
			window.ajxpResourcesFolder = this.parameters.get("ajxpResourcesFolder");		
		}else{
			alert("Cannot find resource folder");
		}
		var booterUrl = this.parameters.get("BOOTER_URL");
		if(booterUrl.indexOf("?") > -1){
			booterUrl = booterUrl.substring(0, booterUrl.indexOf("?"));
		}
		this.parameters.set('ajxpServerAccessPath', booterUrl);
		window.ajxpServerAccessPath = booterUrl;
	},
	insertLoaderProgress : function(){
		var html = '<div id="loading_overlay" style="background-color:#555555;"></div>';
		html+='	<div id="progressBox" style="background-color:#fff;border:2px solid #676965;width:305px;padding:1px;display:block;top:30%;z-index:2002;left:20%;position:absolute;">';
		html+='	<div align="left" style="background-color:#fff;border:1px solid #676965;color:#676965;font-family:Trebuchet MS,sans-serif;font-size:11px;font-weight:normal;left:10px;padding:3px;">';
		html+=' <div style="margin-bottom:4px; font-size:35px;font-weight:bold; background-image:url(\''+ajxpResourcesFolder+'/images/ICON.png\');background-position:left center;background-repeat:no-repeat;padding-left:35px;color:#0077b3;">AjaXplorer</div>';
		html+='	<div style="padding:4 7;"><div>The web data-browser<span id="version_span"></span></div>';
		html+='	Written by Charles du Jeu - LGPL License. <br>';
		if(this.parameters.get('customWelcomeMessage')){
			html+= this.parameters.get('customWelcomeMessage') + '<br>';
		}
		html+='	<div style="padding:4px;float:right;"><span id="loaderProgress">0%</span></div><div id="progressState">Booting...</div>';
		html+='	</div></div>';
		$$('body')[0].insert({top:html});
		viewPort = document.viewport.getDimensions();
		$('progressBox').setStyle({left:Math.max((viewPort.width-305)/2,0)});
		var options = {
			animate		: true,										// Animate the progress? - default: true
			showText	: false,									// show text with percentage in next to the progressbar? - default : true
			width		: 154,										// Width of the progressbar - don't forget to adjust your image too!!!
			boxImage	: this.parameters.get("ajxpResourcesFolder")+'/images/progress_box.gif',			// boxImage : image around the progress bar
			barImage	: this.parameters.get("ajxpResourcesFolder")+'/images/progress_bar.gif',	// Image to use in the progressbar. Can be an array of images too.
			height		: 11,										// Height of the progressbar - don't forget to adjust your image too!!!
			onTick		: function(pbObj) { 
				if(pbObj.getPercentage() == 100){
					new Effect.Opacity('loading_overlay', {
						from:0.1,
						to:0,
						duration:0.5,
						afterFinish:function(effect){
							$('loading_overlay').remove();
							$('progressBox').remove();
						}
					});					
					return false;
				}
				return true ;
			}
		};
		window.loaderProgress = new JS_BRAMUS.jsProgressBar($('loaderProgress'), 0, options); 
	},
	insertAnalytics : function(){	
		if(!this.parameters.get("googleAnalyticsData")) return;
		var data = this.parameters.get("googleAnalyticsData");
		window._gaq = window._gaq || [];
		window._gaq.push(['_setAccount', data.id]);		
		if(data.domain) window._gaq.push(['_setDomainName', data.domain]);
		window._gaq.push(['_trackPageview']);
		window._gaTrackEvents = data.event;
		window.setTimeout(function(){
			var src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
			var ga = new Element("script", {type:'text/javascript', async:'true',src:src});
			($$('head')[0] || $$('body')[0]).insert(ga);
		}, 200);
	},
	loadCSSResource : function(fileName){
		var head = $$('head')[0];
		var cssNode = new Element('link', {
			type : 'text/css',
			rel  : 'stylesheet',
			href : this.parameters.get("ajxpResourcesFolder") + '/' + fileName,
			media : 'screen'
		});
		head.insert(cssNode);
	}	
});