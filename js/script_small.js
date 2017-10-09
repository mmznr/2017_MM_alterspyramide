(function () {

	window.onload = function () {
		console.log('Fenster ist geladen.');
		var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
		// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
		var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
		var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
		// At least Safari 3+: "[object HTMLElementConstructor]"
		var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
		var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

		if (!Array.prototype.filter) {
		  Array.prototype.filter = function(fun /*, thisp*/) {
			var len = this.length >>> 0;
			if (typeof fun != "function")
			throw new TypeError();

			var res = [];
			var thisp = arguments[1];
			for (var i = 0; i < len; i++) {
			  if (i in this) {
				var val = this[i]; // in case fun mutates this
				if (fun.call(thisp, val, i, this))
				res.push(val);
			  }
			}
			return res;
		  };
		}

		///////////////////////
		// DEFS
		//
		var margin = {top: 20, right: 20, bottom: 25, left: 20},
			gRatio = (1+Math.sqrt(5))/2,
			ch1903 = {'x1':669625, 'x2':716125, 'y1':224725, 'y2': 283325},
			pi = Math.PI,
			legendeLeft = 15,
			legendeTop = 0,
			//w = 532,
			w = 570 - margin.left - margin.right,
			h = 555 - margin.top - margin.bottom,
			wPyr = 470,
			hPyr=410,
			hPyrPer = hPyr/111,
			scaleF = 0.37,
			renderAusl = 1,
			spiegel = 1;


		//add svg-container for vis+legende
		var svg = d3.select('#visDiv')
			.append('svg')
				.attr('id', 'all')
				.attr('id', 'svg')
				.attr('width', w + margin.left + margin.right)
				.attr('height', h + margin.top + margin.bottom)
				.attr('aria-labelledby','title')
				.attr('ariadescribedby', 'desc')
				.attr('role', 'img');
		// svg.append('title')
		// 	.text('Alterspyramide des Kantons Zürich')
		// 	.attr('id', 'title')
		// 	.attr('pointer-events', 'none');
		svg.append('desc')
				.attr('desc', 'Eine interaktive Grafik zu den Unterschiedlichen Alterspyramiden der Regionen des Kantons Zürich.')
				.attr('id', 'desc');

		var svgGr = svg.append('g')
				.attr("transform", "translate(" + (margin.left) + "," + margin.top + ")");



    var pyrGrBack = d3.select('#svg').append('g').attr('id','pyrGrBack').attr('transform', 'translate(' + (60) + ',' + (50) + ')');
    var pyrGr = d3.select('#svg').append('g').attr('id','pyrGr').attr('transform', 'translate(' + (60+wPyr/2) + ',' + (50) + ')');

		var mapPfade = d3.select('#svg').append('g').attr('id', 'mapPfade').attr('transform', 'translate(' + (wPyr+15) + ',' + (40) + ')scale('+scaleF+')');
		var karte = mapPfade.append('g').attr("id", "chart").append("g").attr('id', 'karte');

    var defs = d3.select('#svg').append("defs")
    var pattern = defs
        .append("pattern")
        //.attr({ id:"hash4_4", width:"3", height:"3", patternUnits:"userSpaceOnUse", patternTransform:"rotate(60)"})
	        .attr('id', 'hash4_4')
	        .attr('width','4')
	        .attr('height','4')
	        .attr('patternUnits',"userSpaceOnUse")
	        .attr('patternTransform',"rotate(60)")
	     .append("rect")
	        .attr('width','2')
	        .attr('height','4')
	        .attr('transform',"translate(0,0)")
	        .attr('fill',"grey" );
		
		var slider = svgGr.append('g')
			.attr('class', 'slider')
			.attr('transform', 'translate('+(60)+','+(h)+')');
	
		var clip = defs.append('clipPath')
			.attr('id', 'edge')
			.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('height', h)
			.attr('width', w);

		///////////////////////////
		//
		// Parameter
		//	
		var path = d3.geoPath()
 			.projection(null);

 		// var colorBez = d3.scaleOrdinal()
 		// 	.domain(['Affoltern', 'Andelfingen', 'Bülach', 'Dielsdorf', 'Dietikon', 'Hinwil', 'Horgen', 'Meilen', 'Pfäffikon', 'Uster', 'Winterthur', 'Zürich'])
 		// 	.range(statColorLibrary.zhPaired[12]);
	    
  		parseYear = d3.timeParse("%Y");
	    formatYear = d3.timeFormat("%Y");

		var ch_DE = {
		    "decimal": ".",
	        "thousands": "'",
	        "grouping": [3],
	        "currency": ["CHF", " "],
	        "dateTime": "%a %b %e %X %Y",
	        "date": "%d.%m.%Y",
	        "time": "%H:%M:%S",
	        "periods": ["AM", "PM"],
	        "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
	        "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
	        "months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
	        "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
		};
		var chFormat = d3.formatLocale(ch_DE);

		
		///////////////////////////
		//
		// Data
		//
		var file1 = 'STAT_ZH2017_bevoelkerung_regionen_prognose.csv',
			file2 = 'RegionenZH_Topo.json';

		d3_queue.queue()
			.defer(d3.csv, 'data/'+file1,  function(d) {
				return {
					bfsnr: +d.id,
					gemeinde: d.region,
					jahr: parseYear(d.JAHR),
					alter: +d.alter,
					fCH: +d.fCH,
					mCH: +d.mCH,
					fAusl: +d.fAusl,
					mAusl: +d.mAusl,
					mTot: +d.mCH+(+d.mAusl),
					fTot: +d.fCH+(+d.fAusl)
				}
			})
			.defer(d3.json,'data/'+file2)
			.await(main);
		
		function dataFilter(data,obj,val) {
		  return data.filter(function(itm) {
		      return itm[obj] == val;
		  });
		}
		function objAcc(datum, datumObj) {
			return datum.values[0][datumObj];
		}
		function sortByName(a,b) {
			if (a.properties.NAME < b.properties.NAME)
				return -1;
			if (a.properties.NAME > b.properties.NAME)
				return 1;
				return 0;
		}
		var jahrSel = parseYear('2016'),
			dataSel,
			minValues = {},
			maxValues = {},
			arbProzMax = {},
			arbProzMin = {},
			colorScale,
			xScale,
			xScaleM,
			xAxisM,
			xAxisF,
			years = [],
			handle;

		svgGr.append('text')
			.attr('id', 'loader')
			.attr('x', w/2)
			.attr('y', h/2)
			.attr('text-anchor', 'middle')
			.text('Daten werden geladen')
			.style('font-family', 'Helvetica');

		var yScalePyr = d3.scaleLinear()
			.domain([0,110])
			.range([hPyr,0])
      
    var yAxis = d3.axisLeft()
      .scale(yScalePyr)
      .tickSize(wPyr+5)
      .tickValues([0,20,65,100])
      ;

    var yAxisGroup = d3.select('#pyrGrBack').append('g')
      .attr('id', 'yAxis')
      .attr('class', 'grid')
      .attr('transform', 'translate('+(wPyr+5)+','+0+')');

    yAxisGroup.call(yAxis);
		
		var jahreScale = d3.scaleLinear()
			.domain([0, 110])
			.range([0, w-40])
			.clamp(true);

		
		var slideScale = d3.scaleLinear()
			.domain([1995, 2040])
			.range([-20, wPyr-10])
			.clamp(true);

		var colorScale;


		var button1 = d3.select('#controlUL').append('li')
		  .attr('id', 'ausl');
		button1.text('nur Schweizer/innen');
		
		var button2 = d3.select('#controlUL').append('li')
		  .attr('id', 'spiegel');
		button2
		  .html('Männer und Frauen überlagern');


		var export1 = d3.select('#exportUL').append('li')
		  .attr('id', 'expBild');
		export1.text('Bild speichern');
		
		var export2 = d3.select('#exportUL').append('li')
		  .attr('id', 'expData');
		export2
		  .html('Daten speichern');

	  d3.select('#ausl')
	    .attr('cursor', 'pointer')
	    .on('click', function() {
	      if (this.className == 'selected') {
	        this.className = '';
	        // alle
	        renderAusl=1;
	      } else {
	        this.className = 'selected';
	        //nur Schweizer
	        renderAusl=0;
	      }

	      pyramide(dataSel,jahrSel,renderAusl,spiegel);
	    });


	  d3.select('#spiegel')
	    .attr('cursor', 'pointer')
	    .on('click', function() {
	      if (this.className == 'selected') {
	        this.className = '';
	        // alle
	        spiegel=1;
	      } else {
	        this.className = 'selected';
	        //nur Schweizer
	        spiegel=-1;
	      }

	      pyramide(dataSel,jahrSel,renderAusl,spiegel);
	    });

		function main(error, data, mapData) {

			////////
			//DATA
  		if (error) throw error;
			var nested_data = d3.nest()
				.key(function(d) { return d.bfsnr; }).sortKeys(d3.ascending)
				.key(function(d) { return d.jahr; })
				.key(function(d) { return d.alter; })
				.entries(data);
			
			var sum_data = d3.nest()
				.key(function(d) { return d.bfsnr; }).sortKeys(d3.ascending)
				.key(function(d) { return d.jahr; })
				.rollup(function(leaves) { 
					return {
						"totJahr": d3.sum(leaves, function(d) {return d.fCH+d.mCH+d.fAusl+d.mAusl;}),
						"arbJahr": d3.sum(leaves, function(d) {
							if(d.alter>=20&&d.alter<65) {
								return d.fCH+d.mCH+d.fAusl+d.mAusl;
							} else{
								return 0;
							}
						})
					} 
				})
				.entries(data);
						
			for (i=0;i<sum_data[0].values.length;i++) {
				years.push(sum_data[0].values[i].key)
			}

			for (i=0;i<mapData.objects.regionenZH_geo.geometries.length;i++) {
				var thisGeom = mapData.objects.regionenZH_geo.geometries[i];
				var bfsMap = thisGeom.properties.ObWin;
				if(bfsMap>0) {
					var thisGem = dataFilter(nested_data, 'key', bfsMap)[0].values;
					var thisGemSum = dataFilter(sum_data, 'key', bfsMap)[0].values;
				}
				thisGeom.properties.daten = thisGem;
				thisGeom.properties.summen = thisGemSum;
			}
			var arbProzMaxAll = [];
			var arbProzMinAll = [];
			for(y=0;y<years.length;y++) {
				arbProzMax[years[y]] = d3.max(sum_data, function(d) {
					if(dataFilter(d.values, 'key', years[y])[0]) {
						var datum = dataFilter(d.values, 'key', years[y])[0].value;
						return datum.arbJahr/datum.totJahr;
					}
				})
				arbProzMaxAll.push(arbProzMax[years[y]]);
				arbProzMin[years[y]] = d3.min(sum_data, function(d) {
					if(dataFilter(d.values, 'key', years[y])[0]) {
						var datum = dataFilter(d.values, 'key', years[y])[0].value;
						return datum.arbJahr/datum.totJahr;
					}
				})
				arbProzMinAll.push(arbProzMin[years[y]]);
			}
			var arbProzMaxAll = d3.max(arbProzMaxAll);
			var arbProzMinAll = d3.min(arbProzMinAll);
	    colorScale = d3.scaleLinear()
        .domain([arbProzMinAll,arbProzMaxAll])
        //.range(['#e2001a', '#0076BD'])
        .range(['#dce8ef', '#0076BD'])
        .interpolate(d3.interpolateLab);

/*
			var anzRect = 30,
				padding = 20
				legW = w-wPyr-padding,
				rectW = legW/anzRect;
		    
	    colorLegScale = d3.scaleLinear()
	      .domain([0,anzRect-1])
	      //.range(['#e2001a', '#0076BD'])
	      .range([arbProzMinAll, arbProzMaxAll]);
	  	
	  	var legGr = pyrGrBack.append('g')
	  		.attr('id', 'legGr')
	  		.attr('transform', 'translate('+(wPyr+padding)+','+(320)+')');
	    legGr.append('text')
	    	.attr('x', -rectW-7)
	    	.attr('y', -8)
	    	.text('Anteil der 20- bis 64-Jährigen')
					.style('font-family', 'Helvetica');

	    for(i=0;i<anzRect;i++) {
	    	legGr.append('rect')
	    		.attr('x', rectW*i-rectW/2)
	    		.attr('y', 0)
	    		.attr('width', rectW)
	    		.attr('height', 15)
	    		.style('stroke', 'none')
	    		.style('fill', colorScale(colorLegScale(i)));

	    	if(i%10==0||i==29) {
	    		legGr.append('text')
	 		   		.attr('x', rectW*i)
	 		   		.attr('y', 28)
	 		   		.style('text-anchor', 'middle')
	 		   		.text(Math.round(colorLegScale(i)*100)+'%')
						.style('font-family', 'Helvetica');
	    	}
	    }
*/
      d3.select('#loader').remove();
			
			renderSlide();
			renderPyramideBack();

			var geom = mapData.objects.regionenZH_geo.geometries;
			dataSel = topojson.feature(mapData, mapData.objects.regionenZH_geo).features[4];

			//////////////
			//RENDER
			//renderMap(mapData);
			handle.attr('cx', slideScale(formatYear(jahrSel)));
			pyramide(dataSel, jahrSel, renderAusl,spiegel)
		}

		function renderMap(data) {
			karte.append('g').attr('class', 'Gemeinde').selectAll(".municipalities")
				.data(topojson.feature(data, data.objects.regionenZH_geo).features)
				.enter()
				.append("path")
				.attr("id", function(d) { return 'map_'+d.properties.ObWin; })
				.attr("class", 'regionen')
				.attr("name", function(d) { return d.properties.region__16; })
				.attr("d", path)
				.style("cursor", "pointer")
				.attr('pointer-events', function(d) { 
					if (d.properties.ObWin == 0) {
						return 'none';
					} 
				})
				.style('fill-opacity', function(d) { 
					if (d.properties.ObWin == 0) {
						return 1;
					} else {
						return 1;
					}
				})
				.style('fill', function(d) {
					if (d.properties.ObWin == 0) {
						return 'url(#hash4_4)';
					} else {
						var dataYearGem = dataFilter(d.properties.summen, 'key', jahrSel)[0];

						if (dataYearGem) {
							var arbBev = dataYearGem.value.arbJahr/dataYearGem.value.totJahr;
							return colorScale(arbBev);
						} else {
							return 'none';
						}
					}
				})
				.on("mouseover", function (d) {
					// //d3.select(this).style('fill', 'steelblue');
					var gemMap = d3.select('#map_'+d.properties.ObWin);
					var dMap = gemMap.datum();
					mouseOver(dMap, gemMap, gemMap._groups[0][0].getBBox(), 'map');
				})
				.on('mouseout', function(d, i) {
					//d3.select(this).style('fill', 'lightgrey');
					mouseOut();
				})
				.on("click", function (d) {
					dataSel = d;
					pyramide(d, jahrSel,renderAusl,spiegel)
				});
		}


		function renderSlide() {
			slider.append('line')
		    .attr('class', 'track')
		    .attr('x1', slideScale.range()[0])
		    .attr('x2', slideScale.range()[1])
		  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		    .attr('class', 'track-inset')
		  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		    .attr('class', 'track-overlay')
		    .call(d3.drag()
	        .on('start.interrupt', function() { slider.interrupt(); })
	        .on('start drag', function() {
	        	var x = Math.round(slideScale.invert(d3.event.x));
	        	if(formatYear(jahrSel)!=x) {
	        		jahrSel = parseYear(x);
	        		slide(x); 
	        	}

	        })
	       );
			slider.insert('g', '.track-overlay')
		    .attr('class', 'ticks')
		    .attr('transform', 'translate(0,' + 18 + ')')
			.selectAll('text')
			  .data(slideScale.ticks(10))
			  .enter().append('text')
			    .attr('x', slideScale)
			    .attr('text-anchor', 'middle')
			    .text(function(d) { return d; })
				.style('font-family', 'Helvetica');

			handle = slider.insert('circle', '.track-overlay')
		    .attr('class', 'handle')
		    .attr('r', 9);
		}

		function slide(jahrS) {
			handle
				.transition()
				.duration(0)
				.attr('cx', slideScale(jahrS));

			pyramide(dataSel,jahrSel,renderAusl,spiegel);
			
			//Jahreszahl beim Slider nicht über Rand hinaus:
			var jx;
			if(jahrS<=1998) {
				jx = 1998;
			} else if (jahrS>=2037) {
				jx = 2037;
			} else {
				jx = jahrS;
			}

			d3.select('#jahrText')
				.text(jahrS)
				.transition()
				.duration(0)
				.attr('x', 19+slideScale(jx));

			d3.selectAll('.regionen')
				.style('fill', function(d) {
					if (d.properties.ObWin == 0) {
						return 'url(#hash4_4)';
					} else {
						var dataYearGem = dataFilter(d.properties.summen, 'key', jahrSel)[0];

						if (dataYearGem) {
							var arbBev = dataYearGem.value.arbJahr/dataYearGem.value.totJahr;
							return colorScale(arbBev);
						} else {
							return 'none';
						}
					}
				});
		}

		function renderPyramideBack() {
			pyrGrBack.append('text')
				.attr('id', 'gemeindeText')
				.attr('class', 'title')
				.attr('x', wPyr/2)
				.attr('y', -10)
				.style('font-size', '28px')
				.text('Klicken Sie auf eine Gemeinde')
				.style('font-family', 'Helvetica')
				.style('text-anchor', 'middle');
			
			pyrGrBack.append('text')
				.attr('id', 'jahrText')
				.attr('class', 'title')
				.style('text-anchor', 'middle')
				.attr('x', 19+slideScale(formatYear(jahrSel)))
				.attr('y', hPyr+52)
				.style('font-size', '28px')
				.text(formatYear(jahrSel))
				.style('font-family', 'Helvetica');
	
					
			pyrGrBack.append('text')
				.attr('x', -h+227)
				.attr('y', -14)
				.style('fill', 'dimgrey')
				.style('opacity', 1)
				.text('Altersklassen')
				.attr('text-anchor', 'start')
				.attr('transform', 'rotate(-90)')
				.style('font-family', 'Helvetica');


			pyrGrBack.append('text')
				.attr('class', 'title')
				.attr('x', 0)
				.attr('y', 10)
				.style('fill', '#407B9F')
				.style('opacity', 1)
				.text('Männer')
				.style('font-family', 'Helvetica');    
			
			pyrGrBack.append('text')
				.attr('class', 'title maennerCH')
				.attr('x', 0)
				.attr('y', 26)
				.style('stroke', 'none')
				.text('Schweiz')
				.style('font-family', 'Helvetica');  
			
			pyrGrBack.append('text')
				.attr('class', 'title')
				.attr('x', 70)
				.attr('y', 26)
				.style('fill', '#3F98CC')
				.style('opacity',1)
				.text('Ausland')
				.style('font-family', 'Helvetica');

			pyrGrBack.append('text')
				.attr('class', 'title')
				.attr('x', wPyr)
				.attr('y', 10)
				.attr('text-anchor', 'end')
				.style('fill', '#857091')
				.style('opacity',1)
				.text('Frauen')
				.style('font-family', 'Helvetica');         
   
			pyrGrBack.append('text')
				.attr('class', 'title')
				.attr('x', wPyr)
				.attr('y', 26)
				.attr('text-anchor', 'end')
				.style('fill', '#857091')
				.style('opacity',1)
				.text('Schweiz')
				.style('font-family', 'Helvetica');    
			
			pyrGrBack.append('text')
				.attr('class', 'title')
				.attr('x', wPyr-70)
				.attr('y', 26)
				.attr('text-anchor', 'end')
				.style('fill', '#A585B7')
				.style('opacity',1)
				.text('Ausland')
				.style('font-family', 'Helvetica'); 

		  var xAxisGroupF = d3.select('#pyrGrBack').append('g')
				.attr('id', 'xAxisF')
				.attr('class', 'gridL')
				.attr('transform', 'translate('+(wPyr/2)+','+(10*hPyrPer)+')');
    
		  var xAxisGroupM = d3.select('#pyrGrBack').append('g')
				.attr('id', 'xAxisM')
				.attr('class', 'gridL')
				.attr('transform', 'translate('+(0)+','+(10*hPyrPer)+')');
		}

		function pyramide(d, jahr, renderAusl,spiegel) {

			var m = [],
				f = [];
			for (i=0;i<d.properties.daten.length;i++) {
				var data = d.properties.daten[i].values
				m.push(d3.max(data, function(d) { return objAcc(d, 'mTot'); }));
				f.push(d3.max(data, function(d) { return objAcc(d, 'fTot'); }));
			}
			mMax = d3.max(m);
			fMax = d3.max(f);

			var pyrData = dataFilter(d.properties.daten, 'key', jahr)[0].values;
			// var mMax = d3.max(pyrData, function(d) { return objAcc(d, 'mTot'); });
			// var fMax = d3.max(pyrData, function(d) { return objAcc(d, 'fTot'); });

			var max = d3.max([mMax,fMax]);
			
			d3.select('#gemeindeText')
				.text(d.properties.region__16);

			xScale = d3.scaleLinear()
				.domain([0,max])
				.range([0,wPyr/2]);
	        
	    var xAxisF = d3.axisBottom()
				.scale(xScale)
				.ticks(4)
        .tickSize(hPyr-10*hPyrPer+8)
        .tickFormat(chFormat.format(','));

			xScaleM = d3.scaleLinear()
				.domain([max,0])
				.range([0,wPyr/2]);
	        
	    var xAxisM = d3.axisBottom()
				.scale(xScaleM)
				.ticks(4)
        .tickFormat(chFormat.format(','))
        .tickSize(hPyr-10*hPyrPer+8);

		  d3.select('#xAxisF')
				.transition()
				.duration(200)
				.ease(d3.easeQuad)
		    	.call(xAxisF);
		  d3.select('#xAxisM')
				.transition()
				.duration(200)
				.ease(d3.easeQuad)
		    	.call(xAxisM);

			
			var auslM;
			var auslF;

			if(renderAusl == 0) {
				auslM = function(data) { return 0; };
				auslF = function(data) { return 0; };
			} else {
				auslM = function(data) { return objAcc(data, 'mAusl'); };
				auslF = function(data) { return objAcc(data, 'fAusl'); };
			}
			if (spiegel==-1) {
				var trans = 0.6;
			} else {
				trans = 0.9;
			}

			var rectFAusl = pyrGr.selectAll('rect.frauenAusl')
				.data(pyrData);
			rectFAusl.enter()
				.append('rect')
				.attr('class', 'frauenAusl')
				.attr('x', function(d) { return 0;})//objAcc(d, 'mAusl') ;})
				.attr('y', function(d) { return yScalePyr(objAcc(d, 'alter'))-hPyrPer/2 ;})
				.attr('width', function(d) { return xScale(auslF(d)) ;})
				.style('fill-opacity', trans)
				.attr('height', hPyrPer);
			rectFAusl
				.transition()
				.duration(200)
				.ease(d3.easeQuad)
				.attr('width', function(d) { return xScale(auslF(d)) ;})
				.style('fill-opacity', trans)
			rectFAusl.exit().remove()
			
			var rectFCH = pyrGr.selectAll('rect.frauenCH')
				.data(pyrData);
			rectFCH.enter()
				.append('rect')
				.attr('class', 'frauenCH')
				.attr('x', function(d) { return xScale(auslF(d));})//objAcc(d, 'mAusl') ;})
				.attr('y', function(d) { return yScalePyr(objAcc(d, 'alter'))-hPyrPer/2 ;})
				.attr('width', function(d) { return xScale(objAcc(d, 'fCH')) ;})
				.style('fill-opacity', trans)
				.attr('height', hPyrPer);
			rectFCH
				.transition()
				.duration(200)
				.ease(d3.easeQuad)
				.attr('x', function(d) { return xScale(auslF(d));})//objAcc(d, 'mAusl') ;})
				.attr('width', function(d) { return xScale(objAcc(d, 'fCH')) ;})
				.style('fill-opacity', trans);
			rectFCH.exit().remove()

			var rectMAusl = pyrGr.selectAll('rect.maennerAusl')
				.data(pyrData);			
			rectMAusl.enter()
				.append('rect')
				.attr('class', 'maennerAusl')
				.attr('x', function(d) { return -xScale(auslM(d));})//objAcc(d, 'mAusl') ;})
				.attr('y', function(d) { return yScalePyr(objAcc(d, 'alter'))-hPyrPer/2 ;})
				.attr('width', function(d) { return xScale(auslM(d)) ;})
				.attr('height', hPyrPer)
				.style('fill-opacity', trans)
				.attr('transform', 'scale('+spiegel+',1)');
			rectMAusl
				.transition()
				.duration(200)
				.ease(d3.easeQuad)
				.attr('x', function(d) { return -xScale(auslM(d));})//objAcc(d, 'mAusl') ;})
				.attr('y', function(d) { return yScalePyr(objAcc(d, 'alter'))-hPyrPer/2 ;})
				.attr('width', function(d) { return xScale(auslM(d)) ;})
				.style('fill-opacity', trans)
				.attr('transform', 'scale('+spiegel+',1)');
			rectMAusl.exit().remove()
		
			var rectMCH = pyrGr.selectAll('rect.maennerCH')
				.data(pyrData);
			rectMCH.enter()
				.append('rect')
				.attr('class', 'maennerCH')
				.attr('x', function(d) { return -xScale(auslM(d))-xScale(objAcc(d, 'mCH'));})//objAcc(d, 'm') ;})
				.attr('y', function(d) { return yScalePyr(objAcc(d, 'alter'))-hPyrPer/2 ;})
				.attr('width', function(d) { return xScale(objAcc(d, 'mCH')) ;})
				.attr('height', hPyrPer)
				.style('fill-opacity', trans)
				.attr('transform', 'scale('+spiegel+',1)');
			rectMCH
				.transition()
				.duration(200)
				.ease(d3.easeQuad)
				.attr('x', function(d) { return -xScale(auslM(d))-xScale(objAcc(d, 'mCH'));})//objAcc(d, 'm') ;})
				.attr('y', function(d) { return yScalePyr(objAcc(d, 'alter'))-hPyrPer/2 ;})
				.attr('width', function(d) { return xScale(objAcc(d, 'mCH')) ;})
				.style('fill-opacity', trans)
				.attr('transform', 'scale('+spiegel+',1)');
			rectMCH.exit().remove()
		}

		function mouseOver(thisData, that, bbox, flag) {
			var thisBfs = thisData.properties.ObWin;


			d3.select('#karte').selectAll('path.gemeinden')
				.style('fill-opacity', 0.3)
				.style('stroke-opacity', 0.3);

			var dataJahr = dataFilter(thisData.properties.summen, 'key', jahrSel)[0];

			//Rechteck Auswählen, welches zur Gemeinde passt:
			d3.select('#legGr').selectAll('rect')

			var mouseOverRW = 180/scaleF,
				mouseOverRH = 108;
			//Position Tooltip
			var xPos = bbox.x+bbox.width/2,
				yPos = bbox.y+bbox.height/2;
			//Korrektur, damit tooltip nicht über den Rand hinaus geht:
			if (xPos>0) {
				xPos = bbox.x+bbox.width/2-mouseOverRW
			}
			if (yPos>80) {
				yPos = bbox.y+bbox.height/2-mouseOverRH
			}
			var mouseOverL = mapPfade.append('g').attr('id', 'mouseOverL')
				.attr('pointer-events', 'none');

			var mouseOverP = mouseOverL.append('g')
				.attr('id','mouseOverP');
			var mouseOverT = mouseOverL.append('g')
				.attr('id','mouseOverT')
				.attr('transform', 'translate('+(xPos)+','+(yPos)+')');
			mouseOverP.append('path')
				.attr("class", 'mouse')
				.attr("d", that.attr('d'))
				.style('fill', 'none')
				.style('stroke', 'dimgrey')
				.style('stroke-width', 2);

			mouseOverT.append('rect')
				.attr('x', -5)
				.attr('y', 0)
				.attr('width', mouseOverRW)
				.attr('height', mouseOverRH)
				.style('fill', 'white')
				.attr('fill-opacity', 0.8)
				.style('stroke', 'dimgrey');

			mouseOverT.append('path')
				.attr("class", 'mouse')
				.attr("d", that.attr('d'))
				.style('fill', 'white')
				.attr('transform', 'translate('+(-xPos)+','+(-yPos)+')');

			mouseOverT.append('text')
				.attr('x', 2/scaleF)
				.attr('y', 16/scaleF)
				.style('font-size', 12/scaleF+'px')
				.style('font-weight', 'bold')
				.text(thisData.properties.region__16)
				.style('font-family', 'Helvetica');

			mouseOverT.append('text')
				.attr('x', 2/scaleF)
				.attr('y', 16/scaleF)
				.attr('dy', '1.4em')
				.style('font-size', 12/scaleF+'px')
				.text('Anteil 20- bis 64-Jährige: ' +Math.round(dataJahr.value.arbJahr/dataJahr.value.totJahr*100)+'%')
				.style('font-family', 'Helvetica');
		}	

		function mouseOut() {
			d3.select('#mouseOverL').remove();
			d3.select('#mouseOverC').remove();

			d3.select('.Gemeinde').selectAll('path')
				.style('stroke-width', 0.5)
				.style('fill-opacity', 0.8)
				.style('stroke-opacity', 1);
		}

		//////////////////////////////
		//
		//	Export 
		//
		d3.select('#expData').on('click', function(){ 
			// var jsonBlob = new Blob([d3.select], { type : "text/plain", endings: "transparent"});
			// saveAs(oMyBlob, "text.txt");
			window.open('http://www.web.statistik.zh.ch/cms_vis/2017_MM_alterspyramide/data/STAT_ZH2017_bevoelkerung_regionen_prognose.csv')

		})

		d3.select('#expBild').on('click', function(){
			var svgString = getSVGString(svg.node());
			svgString2Image( svgString, 2*w, 2*h, 'png', save ); // passes Blob and filesize String to the callback

			function save( dataBlob, filesize ){
				saveAs( dataBlob, 'StatistischesAmtKtZuerich_Alterspyramide.png' ); // FileSaver.js function
			}
		});

		function getSVGString( svgNode ) {
			svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
			var cssStyleText = getCSSStyles( svgNode );
			appendCSS( cssStyleText, svgNode );

			var serializer = new XMLSerializer();
			var svgString = serializer.serializeToString(svgNode);
			svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
			svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

			return svgString;

			function getCSSStyles( parentElement ) {
				var selectorTextArr = [];

				// Add Parent element Id and Classes to the list
				selectorTextArr.push( '#'+parentElement.id );
				for (var c = 0; c < parentElement.classList.length; c++)
						if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
							selectorTextArr.push( '.'+parentElement.classList[c] );

				// Add Children element Ids and Classes to the list
				var nodes = parentElement.getElementsByTagName("*");
				for (var i = 0; i < nodes.length; i++) {
					var id = nodes[i].id;
					if ( !contains('#'+id, selectorTextArr) )
						selectorTextArr.push( '#'+id );

					var classes = nodes[i].classList;
					for (var c = 0; c < classes.length; c++)
						if ( !contains('.'+classes[c], selectorTextArr) )
							selectorTextArr.push( '.'+classes[c] );
				}

				// Extract CSS Rules
				var extractedCSSText = "";
				for (var i = 0; i < document.styleSheets.length; i++) {
					var s = document.styleSheets[i];
					
					try {
					    if(!s.cssRules) continue;
					} catch( e ) {
				    		if(e.name !== 'SecurityError') throw e; // for Firefox
				    		continue;
				    	}

					var cssRules = s.cssRules;
					for (var r = 0; r < cssRules.length; r++) {
						if ( contains( cssRules[r].selectorText, selectorTextArr ) )
							extractedCSSText += cssRules[r].cssText;
					}
				}
				

				return extractedCSSText;

				function contains(str,arr) {
					return arr.indexOf( str ) === -1 ? false : true;
				}

			}

			function appendCSS( cssText, element ) {
				var styleElement = document.createElement("style");
				styleElement.setAttribute("type","text/css"); 
				styleElement.innerHTML = cssText;
				var refNode = element.hasChildNodes() ? element.children[0] : null;
				element.insertBefore( styleElement, refNode );
			}
		}	
		function svgString2Image(svgString, width, height, format, callback ) {
			console.log(svgString);
			var format = format ? format : 'png';

			var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

			var canvas = document.createElement("canvas");
			var context = canvas.getContext("2d");

			canvas.width = width;
			canvas.height = height;

			var image = new Image();
			image.onload = function() {
				context.clearRect ( 0, 0, width, height );
				context.drawImage(image, 0, 0, width, height);

				canvas.toBlob( function(blob) {
					var filesize = Math.round( blob.length/1024 ) + ' KB';
					if ( callback ) callback( blob, filesize );
				});

				
			};

			image.src = imgsrc;
		}

		function getKey(e) {
			if (e.keyCode==80) {
				var svgString = getSVGString(svg.node());
				svgString2Image( svgString, 2*w, 2*h, 'png', save ); // passes Blob and filesize String to the callback

				function save( dataBlob, filesize ){
					saveAs( dataBlob, 'StatistischesAmtKtZuerich_Alterspyramide.png' ); // FileSaver.js function
				}
			}
		}

		document.onkeyup = getKey;

	};
}());
