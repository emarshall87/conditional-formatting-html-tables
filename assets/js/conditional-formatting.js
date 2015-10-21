;function compareTableData(options){

	"use strict";


	/* 
		Default settings and variables, can be overriden by user
	*/
	var defaults = {
		attribute : 'data-compare-group', // The HTML5 data attribute which groups the elements
		cellIndex : [0], // The default cell indexes for which to compare, 0 is the first cell
		colors : {
			low : 'rgb(255, 0, 0, 0.5)', // Any RGBA or HEX color
			high : 'rgb(0, 128, 0, 0.5)' // Any RGBA or HEX color
		},
		comparedClass : 'compared', // A class added to each cell for easy removal of css styles
		parser : function(data) { // The default parser uses numeric
			var arr = [];
			for (var i = 0; i < data.length; i++) {
				if (Number(data[i])) {
					arr.push(data[i])
				}
			};
			function sorter(a,b) {
			    return Number(a) > Number(b) ? true : false;
			}
			return arr.sort(sorter);
		},
		debug : false
	}


	/* 
		Commonly used functions
	*/ 
	var utilities = {
		getGroupRows : function(group){
			if (!group) return document.querySelectorAll('table tbody tr[' + settings.attribute + ']')
			else return document.querySelectorAll('table tbody tr[' + settings.attribute + '=' + group + ']')	
		},
		getGroups : function(){
			var arr = [],
				tableRows = this.getGroupRows();
			for (var i = 0; i < tableRows.length; i++) {
				if (arr.indexOf(tableRows[i].getAttribute(settings.attribute)) == -1 ) {
					arr.push(tableRows[i].getAttribute(settings.attribute))
				}
			};
			return arr;
		},
		colorStyles : function(percentage){
			var colorLow = settings.colors.low,
				colorHigh = settings.colors.high;
			/*
				All credits for the below function go to Pimp Trizkit of Stack Overflow for spending years writing a function to mathematically blend HEX and RGBA colors
				http://stackoverflow.com/users/693927/pimp-trizkit
			*/
			function shadeBlendConvert(p, from, to) {
			    if(typeof(p)!="number"||p<-1||p>1||typeof(from)!="string"||(from[0]!='r'&&from[0]!='#')||(typeof(to)!="string"&&typeof(to)!="undefined"))return null; //ErrorCheck
			    var sbcRip=function(d){
				        var l=d.length,RGB=new Object();
				        if(l>9){
				            d=d.split(",");
				            if(d.length<3||d.length>4)return null;//ErrorCheck
				            RGB[0]=i(d[0].slice(4)),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
				        }else{
				            switch(l){case 8:case 6:case 3:case 2:case 1:return null;} //ErrorCheck
				            if(l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:""); //3 digit
				            d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=l==9||l==5?r(((d>>24&255)/255)*10000)/10000:-1;
				        }
				        return RGB;
				    },
				    i=parseInt,r=Math.round,h=from.length>9,h=typeof(to)=="string"?to.length>9?true:to=="c"?!h:false:h,b=p<0,p=b?p*-1:p,to=to&&to!="c"?to:b?"#000000":"#FFFFFF",f=sbcRip(from),t=sbcRip(to);
			    if(!f||!t)return null; //ErrorCheck
			    if(h)return "rgba("+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0&&t[3]<0?")":","+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
			    else return "#"+(0x100000000+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)*0x1000000+r((t[0]-f[0])*p+f[0])*0x10000+r((t[1]-f[1])*p+f[1])*0x100+r((t[2]-f[2])*p+f[2])).toString(16).slice(f[3]>-1||t[3]>-1?1:3);
			};

			return shadeBlendConvert(percentage, colorLow, colorHigh)
		},
		removeDuplicates : function(arr) {
			var temp = {};
		    for (var i = 0; i < arr.length; i++) {
		    	temp[arr[i]] = true;
		    }
		    var r = [];
		    for (var k in temp) {
		    	r.push(k);
		    }
		    return r;
		}
	}


	/* 
		Merges the defaults object with the options object given by the user
	*/ 
	var extend = function(out) {
		out = out || {};
		for (var i = 1; i < arguments.length; i++) {
			var obj = arguments[i];

			if (!obj) continue;

			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (typeof obj[key] === 'object') extend(out[key], obj[key]);
					else out[key] = obj[key];
				}
			}
		}

		return out;
	};


	/* 
		Declares the settings which should be used by the program
	*/ 
	var settings = extend(defaults, options)


	/*
		Object used to compare each set of data
	*/ 
	var compareDataSet = {
		// Defined with each new object creation
		group : undefined, 
		// Defined with each new object creation
		cell : undefined, 
		// Returns the rows within the defined group
		groupRows : function(){
			return utilities.getGroupRows(this.group)
		},
		// Returns the original cell data for the set to compare
		cellData : function(){
			var arr = [];
			var rows = this.groupRows();
			for (var i = 0; i < rows.length; i++) {
				arr.push(rows[i].children[this.cell].innerHTML)
			};
			return arr;
		},
		// Returns the cleaned cell data for the set to compare and makes sure it only has unique values
		cellDataCleaned : function() {
			return utilities.removeDuplicates(settings.parser(this.cellData()))
		},
		// Compares the original data to the sorted data to determine the sort order of the original data
		compare : function(){
			var origData = this.cellData(),
				cleanData = this.cellDataCleaned(),
				arr = [];

			for (var i = 0; i < origData.length; i++) {

				for (var j = 0; j < cleanData.length; j++) {
					// The original data matches an instance in the new data
					if (origData[i] == cleanData[j]) {
						arr.push(j)
						break;
					}
					// The original data does not match an instance in the new data because it was stripped out
					else if (j+1 == cleanData.length){
						arr.push(undefined)
					}
				};
			};
			return arr;
		},
		// Sets the corresponding color for each cell
		getColor : function() {
			var comparedData = this.compare(),
				comparedLength = this.cellDataCleaned(),
				arr = [];
			for (var i = 0; i < comparedData.length; i++) {
				var percentage;

				if (!isNaN(comparedData[i])){
					if (comparedLength.length > 1) {
						percentage = comparedData[i]/(comparedLength.length-1)
					}
					else {
						percentage = undefined;
					}
				}
				else {
					percentage = undefined;
				}
				arr.push(utilities.colorStyles(percentage))
			};
			return arr;
		},
		// Applies the color and classname to each cell
		updateHTML : function(){
			var coloredCells = this.getColor();
			var rows = this.groupRows();
			for (var i = 0; i < rows.length; i++) {
				var cell = rows[i].children[this.cell]
					cell.style.backgroundColor = coloredCells[i]
					cell.className += " " + settings.comparedClass
				
			};
		}
	}


	/*
		Base function that iterates through each of the compare sets
	*/ 
	function compare(){
		var groups = utilities.getGroups(),
			cells = settings.cellIndex;
		if (settings.debug) console.log(settings); console.log(utilities); console.log(compareDataSet)
		for (var i = 0; i < groups.length; i++) {
			loopThroughGroup(cells)
		};

		function loopThroughGroup(cells){

			for (var j = 0; j < cells.length; j++) {
				var compareSet = Object.create(compareDataSet);
				compareSet.group = groups[i];
				compareSet.cell = cells[j];
				compareSet.updateHTML();

				if(settings.debug) {
					console.log('Group = '+ groups[i] + '\n' +
								'Cell Index = '+ cells[j] + '\n' +
								'Group Cell Data = '+ compareSet.cellData() + '\n' +
								'Group Cell Data Cleaned = '+ compareSet.cellDataCleaned() + '\n' +
								'Group Cell Data Compare = '+ compareSet.compare() + '\n' +
								'Group Cell Data Colors = '+ compareSet.getColor() + '\n'
					);
				}
			};
		}
	}


	/*
		Initializes the module
	*/ 
	compare();
	
}


/* 
	Initializes the component
*/
compareTableData({
	cellIndex : [1,2,3],
	debug : true
});