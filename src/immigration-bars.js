var reuseableBar = function(_myData) {
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
  var data = [];
  var debugOn = false;

  // SCALES
  var x_0 = d3.scaleBand()  // WEEKS
      .rangeRound([0, width]).paddingInner(0.1);
  var x_1 = d3.scaleBand().padding(0.1);
  var y = d3.scaleLinear().rangeRound([height, 0]);
  var color = d3.scaleOrdinal(['#addd8e', '#238443', '#fec44f', '#d95f0e']);

  var parse_date = d3.timeParse('%Y-%m-%d');

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

    var nested = get_nest(data, 'date');
    set_scale(nested);
    draw_bars(nested);
    draw_axes();
    draw_legend();
  };

  ////////////////////////////////////
  // 3.0 add private functions here //
  ////////////////////////////////////
  function get_nest(data, key) {
    var nested = d3.nest()
        .key(function(d) { return d[key]; })
        .rollup(function(v) {
          var vals = {};
          keys.forEach(function(k) {
            vals[k] = d3.sum(v, function(v){ return v[k]; });
          });
          return vals;
        })
        .entries(data);
    return nested;
  }

  ////////////////////////////////////////////////////
  // 4.0 add visualization specific processing here //
  ////////////////////////////////////////////////////

  function createChart(selection, _file) {
    data = _file;

    selection.each(function () {
      // 4.1 insert code here
      var dom = d3.select(this);
      var domDimensions = dom.node().getBoundingClientRect();

      width = domDimensions.width - margin.left - margin.right;
      height = (domDimensions.width * 0.625) - margin.top - margin.bottom;
      x_0.rangeRound([0, width]);
      y.rangeRound([height, 0]);

      var svg = dom.append('svg')
        .attr('height', height + margin.bottom + margin.top)
        .attr('width', width + margin.left + margin.right);
      g = svg.append('g')
        .attr('class', 'barChart')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Group Data
      var nested = get_nest(data, 'date');

      // SCALE SETTING
      set_scale(nested);

      // CHART MARKS
      draw_bars(nested);

      // Axes
      draw_axes();

      // legend
      draw_legend();

    });
  }

  function set_scale(nest) {
    // SCALE SETTING
    y.domain([0, d3.max(nest.map(function(d) { return d.value; }),
      function(d) {
        return d3.max(keys, function(key) { return d[key]; });
      })
    ]);

    x_0.domain(date_ticks);
    x_1.domain(keys).rangeRound([0, x_0.bandwidth()]);
    color.domain(keys);
  }

  function draw_bars(nest) {
    //console.log(g);
    //if (g.select('#weeks').empty() === false) {
      //g.select('#weeks').remove();
    //}

    var week = g.append('g').attr('class', 'weeks').selectAll('.week')
        .data(nest)
          .enter().append('g')
        .attr('class', 'week')
        .attr('transform', function(d) {
          return 'translate('+ x_0(d.key) + ',0)'; });

    // RECTS
    week.selectAll('rect')
      .data(function(d) { return keys.map(function(key) { return {key: key, value: d.value[key]}; }); })
        .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', function(d) { return x_1(d.key); })
      .attr('y', function(d) { return y(d.value); })
      .attr('width', function(d) { return x_1.bandwidth(); })
      .attr('height', function(d) { return height - y(d.value); })
      .style('fill', function(d) { return color(d.key); });
    // BAR LABELS
    week.selectAll('text')
      .data(function(d) { return keys.map(function(key) { return {key: key, value: d.value[key]}; }); })
        .enter().append('text')
      .attr('class', 'barLabel')
      .attr('x', function(d) { return x_1(d.key) + x_1.bandwidth()/2; })
      .attr('y', function(d) { return y(d.value); })
      .attr('dy', function(d) { return (d.value > 15000) ? 15 : -10; })
      .style('fill', function(d) { return (d.value > 15000) ? '#fff' : '#333'; })
      .text(function(d) { return format_ticks(d.value); });
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
        .text("Occurences per Week");

    // add the travel ban line
    var ban_x = ((x_0(date_ticks[3]) + x_0(date_ticks[4])) /2 )
        + x_0.bandwidth() / 2;

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
    g.select('#barLegend').remove();
    var legend = d3.legendColor()
        .orient('vertical')
        .title('Keyword')
        .labels(keys)
        .shapeWidth(width/20)
        .shapeHeight(30)
        .scale(color);
    g.append('g').attr('class', 'legend').attr('id', 'barLegend')
      .attr('transform', 'translate(' + (width - 150) +','+ margin.top +')');
    g.select('#barLegend').call(legend);

    // pull legend back
    var leg = g.select('#barLegend').node();
    var leg_rect = leg.getClientRects()[0];
    var leg_w = leg_rect.width;
    var leg_x = width - leg_w;

    console.log(leg, leg_rect, leg_w, leg_x);

    //g.select('#barLegend').attr('transform', 'translate('+ leg_x +',' + margin.top + ')');
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
    d.date = week_to_str[d.week];
    d.week = +d.week;

    d.total = +d.total;
    d.immigration = +d.immigration;
    d.immigrant = +d.immigrant;
    d.nonimmigrant = d.total - d.immigration - d.immigrant;
    return d;
  }

  return chartAPI;
};
