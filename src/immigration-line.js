var reuseableLine = function(_myData) {
  "use strict";
  var file; // reference to data (embedded or in file)

  ///////////////////////////////////////////////////
  // 1.0 add visualization specific variables here //
  ///////////////////////////////////////////////////
  var g;
  var keys = ['immigrant', 'immigration'];//, 'total', 'nonimmigrant'];
  var focus;
  var date_ticks = ["Dec 30th", "Jan 6th, 2017", "Jan 13th",
                  "Jan 20th", "Feb 4th", "Feb 11th", "Feb 18th", "Feb 25th"];

  // 1.1 All options that should be accessible to caller
  var margin = {top: 20, right: 20, bottom: 20, left: 40};
  var width = 960 - margin.left - margin.right;
  var height = 600 - margin.top - margin.bottom;
  var format_ticks = d3.format(".2s");
  var parse_date = d3.timeParse('%Y-%m-%d');
  var data = [];
  var debugOn = false;

  // SCALES
  var x_0 = d3.scaleTime().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);
  var color = d3.scaleOrdinal(['#addd8e', '#238443', '#fec44f', '#d95f0e']);


  var line = d3.line()
      .curve(d3.curveMonotoneX)//.curve(d3.curveBasis)
      .x(function(d) { return x_0(d.date); })
      .y(function(d) { return y(d.value); });

  ////////////////////////////////////////////////////
  // 2.0 API for external access                    //
  ////////////////////////////////////////////////////

  // standard API for selection.call()
  function chartAPI(selection) {
    selection.each( function (d) {

      //console.log("_myData "+ _myData);
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

  chartAPI.keys = function(value) {
    if (!arguments.length) return keys;
    keys = value;

    var nested = get_lines(data, keys);
    set_scale(nested);
    draw_lines(nested);
    draw_axes();
    draw_legend();
  };

  ////////////////////////////////////
  // 3.0 add private functions here //
  ////////////////////////////////////

  function get_lines(data, keys) {
    var lines = [];
    var test = keys.map(function(key) {
      var temp = {key: key, values: []};
      data.forEach(function(d) {
        temp.values.push({'date': d.date, 'value': d[key]});
      });
      return temp;
    });
    return test;
  }

  // 4.0 add visualization specific processing here //

  function createChart(selection, _file) {
    data = _file;
    console.log(data);

    selection.each(function () {
      // 4.1 insert code here
      var dom = d3.select(this);
      var domDimensions = dom.node().getBoundingClientRect();

      width = domDimensions.width - margin.left - margin.right;
      height = (domDimensions.width * 0.625) - margin.top - margin.bottom;
      x_0.range([0, width]);
      y.range([height, 0]);

      var svg = dom.append('svg')
        .attr('height', height + margin.bottom + margin.top)
        .attr('width', width + margin.left + margin.right);
      g = svg.append('g')
        .attr('class', 'barChart')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Group Data
      var lines = get_lines(data, keys);

      // SCALE SETTING
      set_scale(lines);
      x_0.domain(d3.extent(data, function(d) { return d.date; }));

      // CHART MARKS
      draw_lines(lines);

      // Axes
      draw_axes();

      // legend
      draw_legend();

    });
  }

  function set_scale(nest) {
    // SCALE SETTING
    y.domain([0, d3.max(nest.map(function(d) { return d.values; }),
      function(d) {
        return d3.max(d, function(d) { return d.value; });
      })
    ]);

    var reduced = nest.map(function(d) { return d.values; });

    x_0.domain([
      d3.min(nest.map(function(d) { return d.values; }), function(d) { return d.date; }),
      d3.max(nest.map(function(d) { return d.values; }), function(d) { return d.date; })
    ]);

    color.domain(keys);

  }

  function draw_lines(nest) {

    var term = g.append('g').attr('class', 'terms').selectAll('.term')
        .data(nest)
          .enter().append('g')
        .attr('class', 'term');

    // lines
    term.append('path')
      .attr('class', 'line')
      .attr('d', function(d) { console.log(d);return line(d.values); })
      .style('stroke', function(d) { return color(d.key); });

  }

  function draw_axes() {
    g.select('.axes').remove();
    var axes = g.append('g').attr('class', 'axes');
    axes.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x_0));
    axes.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).tickFormat(format_ticks))
      .append("text")
        .attr('x', 5)
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("fill", "#333")
        .attr('font-weight', 'bold')
        .style('text-anchor', 'start')
        .text("Count per Day");

    // add the travel ban line
    var ban_x = x_0(new Date(2017, 0, 26, 10));

    g.append('g').attr('id', 'travelBanAnot').append('line')
      .attr('x1', ban_x)
      .attr('x2', ban_x)
      .attr('y1', y.range()[0])
      .attr('y2', y.range()[1])
      .style('stroke', '#333')
      .style('stroke-width', '1px')
      .style("stroke-dasharray", "4,4");

    // LEGEND
    var notes = [  {
        "x": ban_x,
        "y": 85,
        "dx": -75,
        "dy": -49,
        "className": "legendLineAnot",
        "note": {
          "title": "Travel Ban",
          "label": "Jan 27th",
          "wrap": 75.40540540540542,
          "align": "right"
        },
        "data": {}
      }
    ];
    window.anot = d3.annotation()
      //.editMode(true)
      .type(d3.annotationLabel)
      .accessors({
        x: function(d){ return x_scale(d.x); },
        y: function(d){ return y_scale(d.y); }
      })
      .annotations(notes);
    g.append('g')
      .attr('class', 'annotation-group')
      .attr('text-align', 'start')
      .call(window.anot);

  }

  function draw_legend() {
    g.select('#lineLegend').remove();
    var legend = d3.legendColor()
        .orient('vertical')
        .title('Keyword')
        .labels(keys)
        .shapeWidth(width/20)
        .shapeHeight(30)
        .scale(color);
    g.append('g').attr('class', 'legend').attr('id', 'lineLegend')
      .attr('transform', 'translate(' + (width - margin.right*6) +','+ margin.top +')');
    g.select('#barLegend').call(legend);

    // pull legend back
    var leg = g.select('#lineLegend').node();
    var leg_rect = leg.getClientRects()[0];
    var leg_w = leg_rect.width;
    var leg_x = width - leg_w;
    d3.select('#barLegend').attr('transform', 'translate('+leg_x +',' + margin.top + ')');
  }

  ////////////////////////////////////////////////////
  // 5.0 Processing data begins here                //
  ////////////////////////////////////////////////////

  // 5.1 adjust for visualization specific data processing
  // XHR to load data
  function readData(csvFile, selection) {
      d3.csv(csvFile, convertToNumber, function(error, f) {

        var filt5 = f.filter(function(d) { return (d.week > -5 && d.week < 5); });
        var filt0 = filt5.filter(function(d) { return d.week != 0; });

        createChart(selection, filt0);
      });
    }

  // helper for XHR
  function convertToNumber(d) {
    var week_to_str = {
      '-4.0': date_ticks[0],
      '-3.0': date_ticks[1],
      '-2.0': date_ticks[2],
      '-1.0': date_ticks[3],
      '0': null,
      '1.0': date_ticks[4],
      '2.0': date_ticks[5],
      '3.0': date_ticks[6],
      '4.0': date_ticks[7],
    };
    d.weekStr = week_to_str[d.week];
    d.week = +d.week;
    d.date = parse_date(d.date);

    d.total = +d.total;
    d.immigration = +d.immigration;
    d.immigrant = +d.immigrant;
    d.nonimmigrant = d.total - d.immigration - d.immigrant;
    return d;
  }

  return chartAPI;
};
