var reUsableChart = function(_myData) {
  "use strict";
  var file; // reference to data (embedded or in file)

  ///////////////////////////////////////////////////
  // 1.0 add visualization specific variables here //
  ///////////////////////////////////////////////////
  var g;
  var radiusValue = 5;
  var fillColor = '#326ada';
  var voronoi;
  var t = d3.transition(150);
  var timeParse = d3.isoParse();
  var tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden");

  // 1.1 All options that should be accessible to caller
  var margin = {top: 20, right: 20, bottom: 50, left: 50};
  var width = 960;
  var height = 600;
  var x_scale = d3.scaleTime();
  var y_scale = d3.scaleSqrt();
  var x_axis = d3.axisBottom().scale(x_scale);
  var y_axis = d3.axisLeft().scale(y_scale);
  var xValue = function(d) { return x_scale(d.min); };
  var yValue = function(d) { return y_scale(d.count); };
  var opacity = {dehighlight: 0.3, normal: 0.3, highlight: 1};
  var color = d3.scaleOrdinal()
    .domain(["", "academic", "activist", "celebrity", "journalist", "politician", "troll"])
    .range(['#d9d9d9', '#bebada', '#b3de69', '#8dd3c7', '#80b1d3', '#fb8072', '#fdb462']);
  var data = [];
  var debugOn = false;

  // 1.2 all updatable functions to be called by getter-setter methods
  var updateWidth;
  var updateHeight;
  var updateFillColor;

  ////////////////////////////////////////////////////
  // 2.0 API for external access                    //
  ////////////////////////////////////////////////////

  // standard API for selection.call()
  function chartAPI(selection) {
    selection.each( function (d) {
      console.log(d);
      console.log("_myData "+ _myData);
      if (typeof d !== 'undefined') { // data processing from outside
        createChart(selection, d);
      }
      else { // data processing here
        if (typeof _myData !== 'undefined') {
          readData(_myData, selection);
        }
      }
    });
  }

  // API - example for getter-setter method
  // 2.1 add getter-setter  methods here
  chartAPI.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    if (typeof updateWidth === 'function') updateWidth();
    return chartAPI;
  };
  chartAPI.color = function(_) {
    if (!arguments.length) return color;
    color = _;
    return chartAPI;
  }
  chartAPI.data = function(_) {
    if (!arguments.length) return data;
    data = _;
    return chartAPI;
  };
  chartAPI.debugOn = function(_) {
    if (!arguments.length) return debug;
    debugOn = _;
    return chartAPI;
  };

  ////////////////////////////////////
  // 3.0 add private functions here //
  ////////////////////////////////////
  function mousemove() {
    var [mx, my] = d3.mouse(this);
    var site = voronoi.find(mx, my);
    mouseoverTooltip(site);
  }
  function mouseoverTooltip(site) {
    // specific site
    var tweet = site.data,
        val = tweet.count,
        mess = tweet.message,
        cat = tweet.category,
        id = '#tweetID-' + tweet.id,
        user = tweet.user;

    tooltip.style("top", (site[1] + "px")).style("left", (site[0] + "px"));
    tooltip.html("");
    tooltip.style("visibility", "visible")
      .style('opacity', opacity.highlight)
      .style("border", "3px solid " + category_mapping[cat]);

    tooltip.append("h3").text('Username: @' + user);
    tooltip.append("div").text("Retweets: " + val);
    tooltip.append("div").text("Text: " + mess);

    g.selectAll(".tweet")
      .attr('r', radiusValue)
      .style("opacity", opacity.dehighlight);

    var selector = d3.select(id);
    selector
      .attr('r', 10)
      .style("opacity", opacity.highlight)
      .style('stroke', '#eee')
      .style('stroke-width', '0.5px')
      .raise();
  }
  function mouseout() {
    tooltip.style("visibility", "hidden")
    d3.selectAll(".tweet")
      .attr('r', radiusValue)
      .style('stroke', null)
      .style("opacity", opacity.normal);
  }
  function fillDropdown(data) {
    var users = d3.nest()
      .key(function(d) { return d.user; })
      .rollup(function(leaves) { return leaves.length;})
      .entries(data)
      .sort(function(a, b) { return b.value - a.value; });
    var user_tweets = d3.nest()
      .key(function(d) { return d.user; })
      .map(data);

    var drop = d3.select('#userDropdown');
    drop.selectAll('option')
      .data(users)
      .enter().append('option')
      .attr('value', function(d) { return d.key; })
      .text(function(d) { return d.key + ' (' + d.value + ')'; });
    drop.on('change', function(d) {
      var value = d3.select(this).property("value"),
          classVal = '.user-' + value,
          mapVal = '$' + value;
      var tweets = user_tweets[mapVal];
      drawChart(tweets);
    });
  }
  function addLegend() {
    // add g first
    var g_legend = g.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate('+ (width*.85) +','+ (height*0.05) +')');
    var legend = d3.legendColor()
        .title('Category of User')
        .shapePadding(10)
        .labelAlign('end')
        //.labelOffset(100)
        .orient('vertical')
        .scale(color);
    d3.select('.legend').call(legend);
  }

  ////////////////////////////////////////////////////
  // 4.0 add visualization specific processing here //
  ////////////////////////////////////////////////////
  function createChart(selection, _file) {
    var data = _file;
	   if (debugOn) { console.log(data);}
    selection.each(function () {
      // 4.1 insert code here
      var dom = d3.select(this);
      var svg = dom.append('svg')
        .attr('height', height)
        .attr('width', width);
      g = svg.append('g')
        .attr('class', 'scatterChart')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      g.append('g').attr('class', 'tweets');

      drawChart(data);
      fillDropdown(data);
      addLegend()
      drawMarkings('all');
      drawVoronoi(data);
    });
  }

  // 4.2 update functions
  function drawChart(data) {

    x_scale
      .domain(d3.extent(data, function(d) { return d.min; }))
      .range([0, width - margin.left - margin.right]);
    y_scale
      .domain([0, d3.max(data, function(d) { return +d.count; })])
      .range([height - margin.top - margin.bottom, 0]);
    color
      .domain(data.map(function(d) { return d.category; }));

    // Enter, update, exit
    var tweets = g.select('.tweets').selectAll('.tweet').data(data);
    tweets.exit().transition(t).style('opacity', 0).remove();
    tweets.enter().append('circle')
      .attr('class', function(d) { return 'tweet user-' + d.user; })
      .attr('id', function(d) { return 'tweetID-' + d.id; })
      .transition(t)
      .attr('cx', xValue)
      .attr('cy', yValue)
      .attr('r', radiusValue)
      .style('opacity', opacity.normal)
      //.style('fill', fillColor);
      .style('fill', function(d) { return category_mapping[d.category]; });

    drawVoronoi(data);
  }
  function drawVoronoi(data) {
    voronoi = d3.voronoi()
      .x(xValue)
      .y(yValue)
      .size([width, height])(data);
    g.selectAll('.overlay').remove();
    var overlay = g.append('rect')
      .attr('class', 'overlay')
      //.attr('width', width - margin.left - margin.right)
      //.attr('height', height - margin.top - margin.bottom)
      .attr('width', width)
      .attr('height', height)
      .attr('transform', 'translate(' + -margin.left + ',' + -margin.top + ')')
      .style('opacity', 0)
      .on('mousemove', mousemove)
      .on('mouseout', mouseout);
  }
  function drawMarkings(title) {
    g.selectAll('.axis').remove();
    // Axes
   g.append('g')
       .attr("transform", "translate(0," + (y_scale.range()[0] + margin.bottom/3) + ")")
       .attr('class', 'axis')
       .call(x_axis)
        .select(".tick:last-of-type text")
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
        .attr("y", 30)
        .attr("dy", null)
        .attr("font-weight", "bold")
        .text('Date of 1st RT');
   g.append('g')
       .attr("transform", "translate("+  -(margin.left/3) +"," + (x_scale.range()[0]) + ")")
       .attr('class', 'axis')
       .call(y_axis.tickFormat(d3.format(".0s")))
        .select(".tick:last-of-type text")
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
        .attr("x", 10)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("# RT's");
  }
  ////////////////////////////////////////////////////
  // 5.0 Processing data begins here                //
  ////////////////////////////////////////////////////

  // 5.1 adjust for visualization specific data processing
  // XHR to load data
  function readData(csvFile, selection) {
    d3.csv(csvFile, function(error, f) {

      // formatting
      data = f.map(function(d, i) {
        d.id = i;
    		d.min = d3.isoParse(d.date);
    		d.count = +d.count;
    		return d;
    	});
      //data = data.map(function(d) { var split = d.tweet.split('@'); d.user = split[1].replace(' ',''); return d; });
      console.table(data);
      createChart(selection, data);
    });
  }

  return chartAPI;
};
