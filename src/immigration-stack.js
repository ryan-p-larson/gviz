var reuseableStack = function(_myData) {
  "use strict";
  var file; // reference to data (embedded or in file)

  ///////////////////////////////////////////////////
  // 1.0 add visualization specific variables here //
  ///////////////////////////////////////////////////
  var g;
  var keys = ['immigrant', 'immigration'];//, 'total', 'nonimmigrant'];
  var focus;

  // 1.1 All options that should be accessible to caller
  var margin = {top: 20, right: 20, bottom: 20, left: 40};
  var width = 960 - margin.left - margin.right;
  var height = 600 - margin.top - margin.bottom;
  var format_ticks = d3.format(".2s");
  var data = [];
  var debugOn = false;

  var x_value = function(d) { return d.date; };
  var x_scale = d3.scaleTime().range([0, width]);
  var x_axis = d3.axisBottom(x_scale);
  var x = function(d) { return x_scale(x_value(d)); };
  var y_value = function(d) { return d.immigration; };
  var y_scale = d3.scaleLinear().range([height, 0]);
  var y_axis = d3.axisLeft(y_scale).tickFormat(format_ticks);
  var y = function(d) { return y_scale(y_value(d)); };

  var color = d3.scaleOrdinal(['#addd8e', '#238443']);

  var parse_date = d3.timeParse('%Y-%m-%d');
  var line = d3.line()
      //.curve(d3.curveBasis)
      .curve(d3.curveMonotoneX)
      .x(function(d) { return x_scale(d.data.date); })
      .y(function(d) { return y_scale(y_value(d)); });
  var area = d3.area()
      .x(function(d) { return x_scale(d.data.date); })
      .y0(function(d) { return y_scale(d[0]); })
      .y1(function(d) { return y_scale(d[1]); })
      .curve(d3.curveCardinal);
  var stack = d3.stack();
  var t = d3.transition().duration(25).ease(d3.easePoly);

  ////////////////////////////////////////////////////
  // 2.0 API for external access                    //
  ////////////////////////////////////////////////////

  // standard API for selection.call()
  function chartAPI(selection) {
    selection.each( function (d) {

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
  function get_highest_day(attr) {
    var highest_so_far = 0;
    var highest_day;

    data.forEach(function(d) {
      var val = d[attr];
      if (val > highest_so_far) {
        highest_so_far = val;
        highest_day = d;
      }
    });
    return highest_so_far;
  }

  var bisectDate = d3.bisector(x_value).left;
  function mousemove() {
    // Data calculations
    var mouse_x = d3.mouse(this)[0],
        x0 = x_scale.invert(mouse_x),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;

    // show focus class
    d3.selectAll('.focus').style("display", null);

    // move line
    d3.select('#mouseLine').interrupt().transition(t)
      .attr('x1', mouse_x)
      .attr('x2', mouse_x)
      .attr('y1', height)
      .attr('y2', 0);;

    d3.select('#dateLabel').interrupt().transition(t)
      .attr('x', x_scale(x0))
      .text(d.date.toDateString());

    focus.selectAll('.label').interrupt().transition(t)
      .attr("transform", function(e) {
        return "translate(" + x_scale(x0) + "," + y_scale(d[e]) + ")";
      })
      .text(function(e) { return e +': '+ format_ticks(d[e]); });
    focus.selectAll('circle').interrupt().transition(t)
      .attr("transform", function(e) {
        return "translate(" + x_scale(x0) + "," + y_scale(d[e]) + ")";
      });

  }
  ////////////////////////////////////////////////////
  // 4.0 add visualization specific processing here //
  ////////////////////////////////////////////////////

  function createChart(selection, _file) {
    data = _file;
	  if (debugOn) { console.log(data);}
    selection.each(function () {
      // 4.1 insert code here
      var dom = d3.select(this);
      var domDimensions = dom.node().getBoundingClientRect();
      width = domDimensions.width - margin.left - margin.right;
      height = (domDimensions.width * 0.625) - margin.top - margin.bottom;

      var svg = dom.append('svg')
        .attr('height', height + margin.bottom + margin.top)
        .attr('width', width + margin.left + margin.right);
      g = svg.append('g')
        .attr('class', 'lineChart')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x_scale.domain(d3.extent(data, x_value)).rangeRound([0, width]);
      y_scale.domain([0, d3.max(data, y_value) * 1.2]).rangeRound([height, 0]);
      color.domain(keys);
      stack.keys(keys);

      var layer = g.append('g').attr('class', 'layers').selectAll('.layer')
          .data(stack(data).reverse())
            .enter().append('g')
          .attr('class', 'layer');

      // Have to rescale twice to deal with the stacked area
      y_scale.domain([0, d3.max(stack(data), function(d) {
        return d3.max(d, function(e) { return e[1]; });
      })]);

      layer.append('path')
        .attr('class', 'area')
        .style('fill', function(d) { return color(d.key); })
        .attr('d', area);

      // Axes
      var axes = g.append('g')
      axes.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(x_axis);
      axes.append("g")
          .attr("class", "axis axis--y")
          .call(y_axis)
        .append("text")
          .attr('x', 5)
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("fill", "#333")
          .attr('font-weight', 'bold')
          .style('text-anchor', 'start')
          .text("Count per Day");

      // legend
      var legend = d3.legendColor()
          .orient('vertical')
          .title('Keyword')
          .labels(keys)
          .shapeWidth(width/20)
          .shapeHeight(30)
          .scale(color);
      g.append('g').attr('class', 'legend').attr('id', 'legendStack')
        .attr('transform', 'translate(' + (width - margin.right*6) +','+ margin.top +')');
      g.select('.legend').call(legend);

      // pull legend back
      var leg = d3.select('#legendStack').node();
      var leg_rect = leg.getClientRects()[0];
      var leg_w = leg_rect.width;
      var leg_x = width - leg_w;
      d3.select('#legendStack').attr('transform', 'translate('+leg_x +',' + margin.top + ')');

      // TRAVEL BAN LINE
      g.append('g').attr('id', 'travelBanAnot').append('line')
        .attr('x1', x_scale(new Date(2017, 0, 26)))
        .attr('x2', x_scale(new Date(2017, 0, 26)))
        .attr('y1', y_scale.range()[0])
        .attr('y2', y_scale.range()[1])
        .style('stroke', '#333')
        .style('stroke-width', '1px')
        .style("stroke-dasharray", "4,4");

      // Mouseover
      var mouseG = g.append('g').attr('class', 'mouseoverG');
      mouseG.append('text')
        .attr('class', 'focus')
        .attr('id', 'dateLabel')
        .attr('dx', 5)
        .attr('y', margin.top);
      mouseG.append('line')
        .attr('class', 'focus')
        .attr('id', 'mouseLine')
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('display', 'none');

      focus = mouseG.append('g').selectAll('.focus')
        .data(keys)
          .enter().append('g')
        .attr('class', 'focus')
        .attr('id', function(d) { return 'focus-' + d; })
        .style('display', 'none');
      focus.append('circle').attr('r', 4.5);
      focus.append("text")
        .attr('x', 10).attr('dy', ".35em")
        .attr('class', 'label')
        .text(function(d) { return d; });

      g.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mousein", function() { d3.selectAll('.focus').style("display", null); })
        .on("mouseover", mousemove)
        .on("mouseout", function() { d3.selectAll('.focus').style("display", "none"); })
        .on("mousemove", mousemove);


      // annotations
      var notes = [  {
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
          "data": {"x": new Date(2017, 0, 26, 5)}
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
        //f = f.filter(function(d) { return d.})

        createChart(selection, f);
      });
    }


  // helper for XHR
  function convertToNumber(d) {
    d.total = +d.total;
    d.immigration = +d.immigration;
    d.immigrant = +d.immigrant;
    d.nonimmigrant = d.total - d.immigration - d.immigrant;

    d.week = +d.week;
    d.date = parse_date(d.date);
    return d;
  }

  return chartAPI;
};
