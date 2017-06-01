var reUsableChart = function(_myData) {
  "use strict";
  var file; // reference to data (embedded or in file)

  ///////////////////////////////////////////////////
  // 1.0 add visualization specific variables here //
  ///////////////////////////////////////////////////
  var tiles = [[0,0,"AK"],[10,0,"ME"],[5,1,"WI"],[9,1,"VT"],[10,1,"NH"],
                [0,2,"WA"],[1,2,"ID"],[2,2,"MT"],[3,2,"ND"],[4,2,"MN"],
                [5,2,"IL"],[6,2,"MI"],[8,2,"NY"],[9,2,"MA"],[0,3,"OR"],
                [1,3,"NV"],[2,3,"WY"],[3,3,"SD"],[4,3,"IA"],[5,3,"IN"],
                [6,3,"OH"],[7,3,"PA"],[8,3,"NJ"],[9,3,"CT"],[10,3,"RI"],
                [0,4,"CA"],[1,4,"UT"],[2,4,"CO"],[3,4,"NE"],[4,4,"MO"],
                [5,4,"KY"],[6,4,"WV"],[7,4,"VA"],[8,4,"MD"],[9,4,"DE"],
                [1,5,"AZ"],[2,5,"NM"],[3,5,"KS"],[4,5,"AR"],[5,5,"TN"],
                [6,5,"NC"],[7,5,"SC"],[8,5,"DC"],[3,6,"OK"],[4,6,"LA"],
                [5,6,"MS"],[6,6,"AL"],[7,6,"GA"],[0,7,"HI"],[3,7,"TX"],
                [8,7,"FL"]];
  var state_mapping = {
    "AK":[0,0],"ME":[10,0],"WI":[5,1],"VT":[9,1],
    "NH":[10,1],"WA":[0,2],"ID":[1,2],"MT":[2,2],
    "ND":[3,2],"MN":[4,2],"IL":[5,2],"MI":[6,2],
    "NY":[8,2],"MA":[9,2],"OR":[0,3],"NV":[1,3],
    "WY":[2,3],"SD":[3,3],"IA":[4,3],"IN":[5,3],
    "OH":[6,3],"PA":[7,3],"NJ":[8,3],"CT":[9,3],
    "RI":[10,3],"CA":[0,4],"UT":[1,4],"CO":[2,4],
    "NE":[3,4],"MO":[4,4],"KY":[5,4],"WV":[6,4],
    "VA":[7,4],"MD":[8,4],"DE":[9,4],"AZ":[1,5],
    "NM":[2,5],"KS":[3,5],"AR":[4,5],"TN":[5,5],
    "NC":[6,5],"SC":[7,5],"DC":[8,5],"OK":[3,6],
    "LA":[4,6],"MS":[5,6],"AL":[6,6],"GA":[7,6],
    "HI":[0,7],"TX":[3,7],"FL":[8,7]
  };
  var g, g_states;

  // 1.1 All options that should be accessible to caller
  var margin_grid = {top: 10, right: 10, bottom: 10, left:10};
  var width_grid = 1000 - margin_grid.left - margin_grid.right;
  var height_grid = 500 - margin_grid.top - margin_grid.bottom;
  var padding_grid = 0.1;
  var x_scale_grid = d3.scaleBand();
  var y_scale_grid = d3.scaleBand();

  var margin_st = {top: 20, right: 10, bottom: 15, left:10};
  var tile_width;
  var tile_height;
  var x_scale_st = d3.scaleBand();
  var y_scale_st = d3.scaleLinear();
  var x_axis_st = d3.axisBottom().scale(x_scale_st).tickValues([-4, 0, 4]).tickSize(3).tickSizeInner(0);
  var y_axis_st = d3.axisLeft().scale(y_scale_st).ticks(5).tickFormat(d3.format(".0s")).tickSize(3).tickSizeInner(0);

  var barPadding = 1;
  var fillColor = 'coral';
  var color = d3.scaleThreshold()
      .domain([-1, 0, 1])
      .range(['#2166ac', '#dddddd', '#b2182b']);

  var data = [];
  var states = [];
  var debugOn = false;

  // 1.2 all updatable functions to be called by getter-setter methods
  var updateWidth;
  var updateHeight;
  var updateData;

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
        else {
          readData("<pre>", selection);
        }
      }
    });
  }

  // API - example for getter-setter method
  // 2.1 add getter-setter  methods here
  chartAPI.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    //if (typeof updateWidth === 'function') updateWidth();
    return chartAPI;
  };
  chartAPI.margin_grid = function(_) {
    if (!arguments.length) return margin_grid;
    margin_grid = _;
    return chartAPI;
  }
  chartAPI.width_grid = function(_) {
    if (!arguments.length) return width_grid;
    width_grid = _;
    return chartAPI;
  }
  chartAPI.height_grid = function(_) {
    if (!arguments.length) return height_grid;
    height_grid = _;
    return chartAPI;
  }
  chartAPI.padding_grid = function(_) {
    if (!arguments.length) return padding_grid;
    padding_grid = _;
    return chartAPI;
  }
  chartAPI.tile_width = function(_) {
    if (!arguments.length) return tile_width;
    tile_width = _;
    return chartAPI;
  }
  chartAPI.tile_height = function(_) {
    if (!arguments.length) return tile_height;
    tile_height = _;
    return chartAPI;
  }

  chartAPI.y_scale_st = function(_) {
    if (!arguments.length) return y_scale_st;
    y_scale_st = _;
    return chartAPI;
  }
  chartAPI.state_mapping = function(_) {
    if (!arguments.length) return state_mapping;
    state_mapping = _;
    return chartAPI;
  }
  chartAPI.data = function(_) {
    if (!arguments.length) return data;
    data = _;
    return chartAPI;
  }
  chartAPI.states = function(_) {
    if (!arguments.length) return states;
    states = _;
    return chartAPI;
  }
  chartAPI.debugOn = function(_) {
    if (!arguments.length) return debug;
    debugOn = _;
    return chartAPI;
  };

  ////////////////////////////////////
  // 3.0 add private functions here //
  ////////////////////////////////////
  function get_state_tile_pos(st) {
    var pos = state_mapping[st];
    var x = x_scale_grid(pos[0]),
        y = y_scale_grid(pos[1]);
    return 'translate(' + x + ',' + y + ')';
  }


  ////////////////////////////////////////////////////
  // 4.0 add visualization specific processing here //
  ////////////////////////////////////////////////////

  function createChart(selection, _file) {
    data = _file;
	  if (debugOn) { console.log(data);}

    selection.each(function () {
      // 4.1 insert code here

      // Set grid code here
      x_scale_grid
        .domain(_.range(0, 11))
        .range([0, width_grid])
        .padding(padding_grid);
      y_scale_grid
        .domain(_.range(0, 8))
        .range([0, height_grid])
        .padding(padding_grid);

      tile_width = x_scale_grid.bandwidth();
      tile_height = y_scale_grid.bandwidth();

      // Overall state stuff here
      x_scale_st
        .domain([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5])
        .range([0, tile_width])
        .padding(padding_grid);
      y_scale_st
        .domain([0, d3.max(data, function(d) { return d.rate; })])
        .range([tile_height, 0]);
      states = d3.nest()
        .key(function(d) { return d.st; })
        .sortValues(function(a, b) { return a.week < b.week; })
        .entries(data);

      // Charting
      var dom = d3.select(this);
      var svg = dom.append('svg')
        .attr('height', height_grid + margin_grid.bottom + margin_grid.top)
        .attr('width', width_grid + margin_grid.left + margin_grid.right);
      g = svg.append('g')
        .attr('class', 'cartoChart')
        .attr("transform", "translate(" + margin_grid.left + "," + margin_grid.top + ")");

      g_states = g.append('g').attr('class', 'states').selectAll('g')
        .data(states)
          .enter().append('g')
        .attr('id', function(d) { return 'st-' + d.key; })
        .attr('height', tile_height)
        .attr('width', tile_width)
        .attr('transform', function(d) { return get_state_tile_pos(d.key); });

      g_states.append('rect') //background rects
        .attr('width', tile_width)
        .attr('height', tile_height)
        .attr('class', 'state background');

      g_states.append('text')
        .attr('class', 'st-title')
        //.attr('dx', .5 * tile_width)
        //.attr('dy', tile_height+ margin_st.bottom)
        .attr('dx', tile_width - margin_st.left)
        .attr('dy', margin_st.bottom)
        .text(function(d) { return d.key; });

      g_states.selectAll('rect')
        .data(function(d) { return d.values; })
          .enter().append('rect')
        .attr('class', function(d) { return 'rate wk-' + d.week; })
        .attr('x', function(d) { return x_scale_st(d.week); })
        .attr('width', x_scale_st.bandwidth())
        .attr('y', function(d) { return y_scale_st(d.rate); })
        .attr('height', function(d) { return tile_height - y_scale_st(d.rate); })
        .style('fill', function(d) { return color(d.week); });

      // Axes
      /*
       g_states.append('g')
         .attr("transform", "translate(0," + y_scale_st.range()[0] + ")")
         .attr('class', 'axis')
         .call(x_axis_st)
          .select(".tick:last-of-type text")
          .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
          .attr("y", 10)
          .attr("dy", null)
          .text('Wk');
       g_states.append('g')
         .attr("transform", "translate("+  0 +"," + x_scale_st.range()[0] + ")")
         .attr('class', 'axis')
         .call(y_axis_st)
          .select(".tick:last-of-type text")
          .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
          .attr("x", 5)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text("");
        */
    });
  }

  ////////////////////////////////////////////////////
  // 5.0 Processing data begins here                //
  ////////////////////////////////////////////////////

  // 5.1 adjust for visualization specific data processing
  // XHR to load data
  function readData(csvFile, selection) {

    d3.csv(csvFile, function(error, f) {
      f = f.map(function(d) {
        d.cnt = +d.cnt;
        d.rate = +d.rate;
        d.week = +d.week;
        return d;
      });
      createChart(selection, f);
    });


  }

  return chartAPI;
};
