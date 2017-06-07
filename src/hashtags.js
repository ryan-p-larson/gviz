var reUsableChart = function(_myData) {
  "use strict";
  var file; // reference to data (embedded or in file)

  ///////////////////////////////////////////////////
  // 1.0 add visualization specific variables here //
  ///////////////////////////////////////////////////
  var g;

  // 1.1 All options that should be accessible to caller
  var margin = {top: 20, right: 80, bottom: 30, left: 50};
  var width = 960 - margin.left - margin.right;
  var height = 600 - margin.top - margin.bottom;
  var data = [];
  var debugOn = false;


  var x_value = function(d) { return d.date; };
  var x_scale = d3.scaleTime().range([0, width]);
  var x_axis = d3.axisBottom(x_scale);
  var y_value = function(d) { return d.count; };
  var y_scale = d3.scaleLinear().range([height, 0]);
  var y_axis = d3.axisLeft(y_scale);

  var parse_date = d3.timeParse('%Y-%m-%d');
  var line = d3.line()
      //.curve(d3.curveBasis)
      .curve(d3.curveMonotoneX)
      .x(function(d) { return x_scale(x_value(d)); })
      .y(function(d) { return y_scale(y_value(d)); });


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
  chartAPI.debugOn = function(_) {
    if (!arguments.length) return debug;
    debugOn = _;
    return chartAPI;
  };

  ////////////////////////////////////
  // 3.0 add private functions here //
  ////////////////////////////////////
  function get_highest_day(days) {
    var highest_so_far = 0;
    var highest_day;

    days.forEach(function(d) {
      var val = y_value(d);
      if (val > highest_so_far) {
        highest_so_far = val;
        highest_day = d;
      }
    });
    return highest_day;
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
        .attr('height', height + margin.bottom + margin.top)
        .attr('width', width + margin.left + margin.right);
      g = svg.append('g')
        .attr('class', 'lineChart')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      x_scale.domain(d3.extent(data, x_value));
      y_scale.domain([0, d3.max(data, y_value)]);

      var tags = d3.nest()
        .key(function(d) { return d.tag; })
        .sortValues(function(a, b) { return a.date - b.date; })
        .entries(data);
      tags = tags.slice(0, 15);

      var tag_g = g.selectAll('.hashtag')
        .data(tags)
        .enter().append('g')
        .attr('class', 'hashtag')
        .attr('id', function(d) { return 'tag-' + d.key; });
      tag_g.append('path')
        .attr('class', 'line')
        .attr('d', function(d) { return line(d.values); });
      tag_g.append('text')
        .attr('x', function(d) {
          //var last = d.values[d.values.length-1];
          var best = get_highest_day(d.values);
          return x_scale(x_value(best));
        })
        .attr('y', function(d) {
          //var last = d.values[d.values.length-1];
          var best = get_highest_day(d.values);
          return y_scale(y_value(best));
        })
        .text(function(d) { console.log(get_highest_day(d.values));
          return d.key; });

      // Axes
      g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(x_axis);
      g.append("g")
          .attr("class", "axis axis--y")
          .call(y_axis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("fill", "#000")
          .text("Count per Day");
    });
  }

  ////////////////////////////////////////////////////
  // 5.0 Processing data begins here                //
  ////////////////////////////////////////////////////

  // 5.1 adjust for visualization specific data processing
  // XHR to load data
  function readData(csvFile, selection) {
      d3.csv(csvFile, convertToNumber, function(error, f) {
        //console.log(f);
        createChart(selection, f);
      });
    }


  // helper for XHR
  function convertToNumber(d) {
    d.count = +d.count;
    d.week = +d.week;
    d.date = parse_date(d.date);
    return d;
  }

  return chartAPI;
};
