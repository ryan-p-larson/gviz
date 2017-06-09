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
  var margin_grid = {top: 10, right: 10, bottom: 20, left:20};
  var width_grid = 960 - margin_grid.left - margin_grid.right;
  var height_grid = 600 - margin_grid.top - margin_grid.bottom;
  var padding_grid = 0.1;
  var x_scale_grid = d3.scaleBand();
  var y_scale_grid = d3.scaleBand();

  var margin_st = {top: 12, right: 4, bottom: 15, left:10};
  var tile_width;
  var tile_height;
  var axis_format = d3.format(".2f");//".0%"
  var x_scale_st = d3.scaleBand()
      .paddingOuter(0.3)
      .paddingInner(0.2);
      //.padding();
  var y_scale_st = d3.scalePow().exponent(0.5);
  var x_axis_st = d3.axisBottom()
      .scale(x_scale_st)
      .tickValues([-2, 2])
      .tickSize(1.5)
      .tickSizeInner(0);
  var y_axis_st = d3.axisLeft()
      .scale(y_scale_st)
      .tickValues([0.00, 0.05, 0.15, 0.25])
      .tickFormat(format_tick)
      .tickPadding(1)
      .tickSizeOuter(0)
      .tickSizeInner(2);
  var xValue = function(d) { return d.week; };
  var yValue = function(d) { return d.rate; };

  var color = d3.scaleThreshold()
      .domain([0, 1])
      .range(['#2166ac', '#dddddd', '#b2182b']);

  var data = [];
  var states = [];
  var state_lookup;
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

  chartAPI.axis_format = function(_) {
    if (!arguments.length) return axis_format;
    axis_format = _;
    y_scale_st = y_scale_st.tickFormat(axis_format);
    return chartAPI;
  }

  chartAPI.x_scale_grid = function(_) {
    if (!arguments.length) return x_scale_grid;
    x_scale_grid = _;
    return chartAPI;
  }
  chartAPI.y_scale_grid = function(_) {
    if (!arguments.length) return y_scale_grid;
    y_scale_grid = _;
    return chartAPI;
  }
  chartAPI.y_scale_st = function(_) {
    if (!arguments.length) return y_scale_st;
    y_scale_st = _;
    return chartAPI;
  }
  chartAPI.yValue = function(_) {
    if (!arguments.length) return yValue;
    yValue = _;
    y_scale_st.domain([0, d3.max(data, function(d) { return yValue(d); })]);
    g_states.selectAll('.bar').transition(200)
      .attr('y', function(d) { return y_scale_st(yValue(d)); })
      .attr('height', function(d) { return tile_height - y_scale_st(yValue(d)); });
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
  function wrap(text, width) {
    text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        //y = text.attr("y"),
        y = y_scale_grid(4),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + 0 + "rem").text(word);
      }
    }
    });
  }
  function get_state_tile_pos(st) {
    var pos = state_mapping[st];
    var x = x_scale_grid(pos[0] + 1);
    var y = y_scale_grid(pos[1]);
    return 'translate(' + x + ',' + y + ')';
  }
  function format_tick(tick) {
    var percent = axis_format(tick);
    return percent.slice(1);
  }
  function clone(sel_node) {
    var node = d3.select(sel_node).node();
    return d3.select(node.parentNode.insertBefore(node.cloneNode(true), node.nextSibling));
  }

  var width_factor = 2.25, height_factor = 1.61;
  function add_legend(sel_st) {
    var height_legend = height_factor * tile_height;
    var width_legend = (width_factor * tile_width) +
              (width_factor * x_scale_grid.padding() * x_scale_grid.bandwidth());

    ////// math to calculate where the legend should go
    var bottom = y_scale_grid(7) +  + tile_height;
    var legend_y = bottom - height_legend;

    // Create the legend from existing chart
    var copy = clone(sel_st).attr('id', 'legend')
        .attr("transform", 'translate('+ (x_scale_grid(0)) +','+ (legend_y) +')');

    // Move st abbreviation
    var leg_abbrv = d3.select('#legend').select('.st-title');
    leg_abbrv
        .attr('dx', width_legend - width_factor * margin_st.right)
        .attr('dy', height_factor * margin_st.top)
        .attr('id', 'legAbbrv')
        .style('font-size', '14px');


    // resize that ish
    x_scale_st.range([0, width_legend]).padding(0.45);
    y_scale_st.range([height_legend, 0]);

    var ca = states.filter(function(d) { return d.key === 'CA'; })[0].values;
    var bars = d3.select('#legend').selectAll('rect.bar').data(ca);
    bars.attr('x', function(d) { return x_scale_st(xValue(d)); })
      .attr('width', x_scale_st.bandwidth())
      .attr('y', function(d) { return y_scale_st(yValue(d)); })
      .attr('height', function(d) { return height_legend - y_scale_st(yValue(d)); })


    // Add full X axis
    var x_ticks = [-4, -3, -2, -1, 1, 2, 3, 4];
    var date_ticks = function(d) {
      var mapping = {
      '-4.0': 'Fri, Dec 30th 2017',
      '-3.0': 'Jan 6th, 2017',
      '-2.0': 'Jan 13th',
      '-1.0': 'Jan 20th',
      '1.0': 'Sat, Feb 4th',
      '2.0': 'Feb 11th',
      '3.0': 'Feb 18th',
      '4.0': 'Feb 25th'
      };
      return mapping[d];
    };
    x_axis_st.tickValues(date_ticks);
    copy.append('g')
      .attr('class', 'x axis')
      .attr("transform", "translate(0," + y_scale_st.range()[0] + ")")
      .call(d3.axisBottom(x_scale_st).tickFormat(function(d) {
        var str_tick = d.toString();
        return date_ticks(str_tick);
      }));
    // Y axis
    copy.append('g')
      .attr("transform", "translate("+  0 +"," + x_scale_st.range()[0] + ")")
      .attr('class', 'y axis')
      .call(y_axis_st.tickFormat(d3.format(".0%")))
        .select("g:nth-child(2)")
        .remove();

    /* Add title
    copy.append('text')
      .attr('id', 'legendTitle')
      .attr('dy', -margin_st.top)
      .text('How to read this chart:')*/
    //d3.select('#legendTitle').call(wrap, tile_width);

    // update background rect
    d3.select('#legend').select('.background')
      .attr('width', width_legend)
      .attr('height', height_legend);
  }

  function add_annotations() {

    // Code to get the subtitle positioning
    var title_x = d3.select('#chartTitle').attr('x');
    var title_y = d3.select('#chartTitle').attr('y'); console.log(title_y, title_x);

    // math to find out where to put the how to note
    var bottom_how = (y_scale_grid(5) + tile_height) - 25;

    // legend abbreviation pos
    var st_h = y_scale_grid(6) + tile_height - (1.61 * margin_st.top);
    var st_w = (tile_width * 2.5) +
        (2.5 * x_scale_grid.padding() * x_scale_grid.bandwidth());

    var annotations = [
      { // Subtitle
        "x": 7.685950413223111,
        "y": 100,
        "dx": 59,
        "dy": 4,
        "data": {},
        "note": {
          "title": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries.",
          "wrap": 225
        }
      },
      {
        "y": bottom_how,
        "dx":59,
        "data":{"x": 0},
        "disable": ['connector', 'subject'],
        "note":{
          "title":"How to read this chart:",
          "wrap":75.40540540540542
      }},
      {
        /*
          "y": st_h,
          "x": st_w,
          "note":{"title":"State Name", "wrap":75.40540540540542},
          "data":{},
          "type": d3.annotationCallout
        */
        "x": 198.22727272727275,
        "y": 484.27259259259256,
        "dx": 55,
        "dy": -12,
        "note": {
          "title": "State Name",
          "wrap": 75.40540540540542
        },
        "data": {},
        "type": d3.annotationCallout
      },
      {
        /*
          "y": y_scale_grid(7) + tile_height + margin_grid.bottom,
          "dy": -tile_height / 2,
          "note":{"title":"Week Before & After Ban", "wrap":75.40540540540542},
          //"subject": { }
          "data":{"x": 3},
          "type": d3.annotationCallout
        */
        "x": 198.26446280991735,
        "y": 584.9629629629629,
        "dx": 56,
        "dy": -15.666666666666664,
        "data": {},
        "note": {
          "title": "Week Before & After Ban",
          "wrap": 75.40540540540542
        },
        "type": d3.annotationCallout
      }
    ];

    window.anot = d3.annotation()
      .editMode(true)
      .type(d3.annotationLabel)
      .accessors({
        x: function(d){ return x_scale_grid(d.x); },
        y: function(d){ return y_scale_grid(d.y); }
      })
      .annotations(annotations);

    d3.select('svg').append('g')
      .attr('class', 'annotation-group')
      .attr('text-align', 'start')
      .call(window.anot);
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
        .domain(_.range(0, 12))
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
        .domain([-4, -3, -2, -1, 1, 2, 3, 4])
        .range([0, tile_width]);
      y_scale_st
        // .domain([0, d3.max(data, function(d) { return yValue(d); })])//.nice()
        .domain([0, 0.32])
        .range([tile_height, 0]);

      states = d3.nest()
        .key(function(d) { return d.st; })
        .sortValues(function(a, b) { return a.week < b.week; })
        .entries(data);
      state_lookup = d3.nest()
        .key(function(d) { return d.st; })
        .key(function(d) { return d.week; })
        .sortValues(function(a, b) { return a.week < b.week; })
        .object(data);

      // Charting
      var dom = d3.select(this);
      var svg = dom.append('svg')
        .attr('height', height_grid + margin_grid.bottom + margin_grid.top)
        .attr('width', width_grid + margin_grid.left + margin_grid.right);
      g = svg.append('g')
        .attr('class', 'cartoChart')
        .attr("transform", "translate(" + margin_grid.left + "," + margin_grid.top + ")");

      // States groups
      g_states = g.append('g').attr('class', 'states').selectAll('g')
        .data(states)
          .enter().append('g')
        .attr('id', function(d) { return 'st-' + d.key; })
        .attr('transform', function(d) { return get_state_tile_pos(d.key); });

      // States bars
      g_states.selectAll('rect')
        .data(function(d) { return d.values; })
          .enter().append('rect')
        .attr('class', function(d) { return 'bar wk-' + d.week; })
        .attr('x', function(d) { return x_scale_st(xValue(d)); })
        .attr('width', x_scale_st.bandwidth())
        .attr('y', function(d) { return y_scale_st(yValue(d)); })
        .attr('height', function(d) { return tile_height - y_scale_st(yValue(d)); })
        .style('fill', function(d) { return color(d.week); });

      // State text abbreviations
      g_states.append('text')
        .attr('class', 'st-title')
        .attr('dx', tile_width - margin_st.right)
        .attr('dy', margin_st.top)
        .text(function(d) { return d.key; });

      // Outline rectangles
      g_states.append('rect')
        .attr('width', tile_width)
        .attr('height', tile_height)
        .attr('class', 'state background');

      // Add LEGEND
      add_legend('#st-CA');

      // Add Chart title
      g.append('text')
        .attr('id', 'chartTitle')
        .attr('y', y_scale_grid(0) - margin_st.bottom)
        .attr('dy', '1.5em')
        .text('Immigration Tweets Normalized by State Population')

      // Add annotations
      add_annotations();






    });
  }

  ////////////////////////////////////////////////////
  // 5.0 Processing data begins here                //
  ////////////////////////////////////////////////////

  // 5.1 adjust for visualization specific data processing
  // XHR to load data
  function readData(csvFile, selection) {

    var week_to_date = {
      '-4.0': '2016-12-30',
      '-3.0': '2017-01-06',
      '-2.0': '2017-01-13',
      '-1.0': '2017-01-20',
      '1.0': '2017-02-04',
      '2.0': '2017-02-11',
      '3.0': '2017-02-18',
      '4.0': '2017-02-25'
    };

    d3.csv(csvFile, function(error, f) {
      f = f.map(function(d) {
        d.cnt = +d.cnt;
        d.rate = +d.rate;
        d.date = week_to_date[d.week];
        d.week = +d.week;

        return d;
      });

      var filt5 = f.filter(function(d) { return (d.week > -5 && d.week < 5); });
      var filt0 = filt5.filter(function(d) { return d.week != 0; });

      createChart(selection, filt0);
    });
  }
  return chartAPI;
};
