(function () {

	window.onload = function () {
		console.log('Fenster ist geladen.');
		var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
		// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
		var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
		var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
		// At least Safari 3: "[object HTMLElementConstructor]"
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
		var margin = {top: 20, right: 20, bottom: 20, left: 20},
			gRatio = (1+Math.sqrt(5))/2,
			ch1903 = {'x1':669625, 'x2':716125, 'y1':224725, 'y2': 283325},
			pi = Math.PI,
			legendeLeft = 15,
			legendeTop = 0,
			//w = 532,
			w = 570 - margin.left - margin.right,
			h = 550 - margin.top - margin.bottom,
			wPyr = 370,
			hPyr=410,
			hPyrPer = hPyr/111,
			scaleF = 0.3,
			renderAusl = 1,
			spiegel = 1;


		//add svg-container for vis+legende
		var svg = d3.select('#visDiv')
			.append('svg')
				.attr('id', 'all')
				.attr('id', 'svg')
				.attr('width', w + margin.left + margin.right)
				.attr('height', h + margin.top + margin.bottom)
			.append('g')
				.attr("transform", "translate(" + (margin.left) + "," + margin.top + ")");

    var pyrGrBack = d3.select('#svg').append('g').attr('id','pyrGrBack').attr('transform', 'translate(' + (40) + ',' + (0) + ')');
    var pyrGr = d3.select('#svg').append('g').attr('id','pyrGr').attr('transform', 'translate(' + (40+wPyr/2) + ',' + (0) + ')');

		var mapPfade = svg.append('g').attr('id', 'mapPfade').attr('transform', 'translate(' + (wPyr) + ',' + (40) + ')scale('+scaleF+')');
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
		
		var slider = svg.append('g')
			.attr('class', 'slider')
			.attr('transform', 'translate('+(w-wPyr)+','+(h)+')');
	
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
		var file1 = 'aba_reshape.csv',
			file2 = 'RegionenZH_Topo.json';

		d3_queue.queue()
			.defer(d3.csv, 'data/'+file1,  function(d) {
				return {
					bfsnr: +d.id,
					gemeinde: d.region,
					jahr: parseYear(d.JAHR),
					alter: +d.alter,
					fCH: +d["1_2"],
					mCH: +d["1_1"],
					fAusl: +d["2_2"],
					mAusl: +d["2_1"],
					mTot: +d["1_1"]+(+d["2_1"]),
					fTot: +d["1_2"]+(+d["2_2"])
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

		svg.append('text')
			.attr('id', 'loader')
			.attr('x', 185)
			.attr('y', h/2)
			.attr('text-anchor', 'middle')
			.text('Daten werden geladen')

		var yScalePyr = d3.scaleLinear()
			.domain([0,110])
			.range([h-60,30])
      
    var yAxis = d3.axisLeft()
      .scale(yScalePyr)
      .tickSize(wPyr+5)
      .tickValues([0,15,65,100])
      //.ticks(3)
      //.tickFormat(d3.format('.0%'))
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


		d3.select('#controlUL').append('li')
		  .attr('id', 'ausl')
		  .text('nur Schweizer/innen');

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

		d3.select('#controlUL').append('li')
		  .attr('id', 'spiegel')
		  .text('Männer spiegeln');

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
							if(d.alter>=15&&d.alter<65) {
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

//	Legende für Karte
//
//

		var anzRect = 30,
			legW = w-wPyr-80,
			rectW = legW/anzRect;
	    
    colorLegScale = d3.scaleLinear()
      .domain([0,anzRect-1])
      //.range(['#e2001a', '#0076BD'])
      .range([arbProzMinAll, arbProzMaxAll]);
  	
  	var legGr = pyrGrBack.append('g')
  		.attr('id', 'legGr')
  		.attr('transform', 'translate('+(-(w-wPyr)+20)+','+(h-30)+')');
    legGr.append('text')
    	.attr('x', -rectW)
    	.attr('y', -8)
    	.text('Anteil der 15- bis 65-Jährigen');

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
 		   		.text(Math.round(colorLegScale(i)*100)+'%');
    	}
    }


      d3.select('#loader').remove();


			
			renderSlide();
			renderPyramideBack();


			var geom = mapData.objects.regionenZH_geo.geometries;

			dataSel = topojson.feature(mapData, mapData.objects.regionenZH_geo).features[4];

			//////////////
			//RENDER
			renderMap(mapData);
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
						return 0.8;
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
			    .text(function(d) { return d; });

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
				.attr('x', -wPyr)
				.attr('y', 45)
				.style('font-size', '36px')
				.text('Klicken Sie auf eine Gemeinde');
			
			pyrGrBack.append('text')
				.attr('id', 'jahrText')
				.attr('class', 'title')
				.style('text-anchor', 'middle')
				.attr('x', 19+slideScale(formatYear(jahrSel)))
				.attr('y', h)
				.style('font-size', '36px')
				.text(formatYear(jahrSel));
			
			pyrGrBack.append('text')
				.attr('class', 'title')
				.attr('x', 0)
				.attr('y', 53)
				.style('fill', '#407B9F')
				.style('opacity', 0.7)
				.text('Männer');    
 			
			pyrGrBack.append('text')
				.attr('class', 'title')
				.attr('x', wPyr)
				.attr('y', 53)
				.attr('text-anchor', 'end')
				.style('fill', '#857091')
				.style('opacity', 0.7)
				.text('Frauen');         
    
		  var xAxisGroupF = d3.select('#pyrGrBack').append('g')
				.attr('id', 'xAxisF')
				.attr('class', 'gridL')
				.attr('transform', 'translate('+(wPyr/2)+','+(32+10*hPyrPer)+')');
    
		  var xAxisGroupM = d3.select('#pyrGrBack').append('g')
				.attr('id', 'xAxisM')
				.attr('class', 'gridL')
				.attr('transform', 'translate('+(0)+','+(32+10*hPyrPer)+')');
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
        .tickSize(hPyr+13-10*hPyrPer)
        .tickFormat(chFormat.format(','));

			xScaleM = d3.scaleLinear()
				.domain([max,0])
				.range([0,wPyr/2]);
	        
	    var xAxisM = d3.axisBottom()
				.scale(xScaleM)
				.ticks(4)
        .tickFormat(chFormat.format(','))
        .tickSize(hPyr+13-10*hPyrPer);

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

			var mouseOverRW = 100/scaleF,
				mouseOverRH = 40;
			//Position Tooltip
			var xPos = bbox.x+bbox.width/2,
				yPos = bbox.y+bbox.height/2;
			//Korrektur, damit tooltip nicht über den Rand hinaus geht:
			if (xPos>200) {
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
				.text(thisData.properties.region__16);
		}	

		function mouseOut() {
			d3.select('#mouseOverL').remove();
			d3.select('#mouseOverC').remove();

			d3.select('.Gemeinde').selectAll('path')
				.style('stroke-width', 0.5)
				.style('fill-opacity', 0.8)
				.style('stroke-opacity', 1);
		}

	};
}());
