window.tweetScatter = (function() {

  // All variables accessible to the user
  var margin = {top: 20, right: 20, bottom: 40, left: 40},
      width = 960,
      height = 500,
      x_scale = d3.scaleTime(),
      y_scale = d3.scaleSqrt(),
      r_scale = d3.scaleLog()
      x_axis = d3.axisBottom().scale(x_scale),
      y_axis = d3.axisLeft().scale(y_scale),
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        //.style("z-index", "10")
        .style("visibility", "hidden"),
      voronoi = d3.voronoi()
        .x(function(d) { return x_scale(d.min); })
        .y(function(d) { return y_scale(+d.count); })
        .size([width, height]);

  function chart(selection) {
    selection.each(function(data) {

      // set scales + voronoi
      x_scale
        .domain(d3.extent(data, function(d) { return d.min; }))
        .range([0, width - margin.left - margin.right]);
      y_scale
        .domain([0, d3.max(data, function(d) { return +d.count; })])
        .range([height - margin.top - margin.bottom, 0]);

      var svg = d3.select(this).append('svg')
            .attr('width', width)
            .attr('height', height),
          g = svg.append('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // bubbles
      var tweets = g.append('g').attr('class', 'tweets').selectAll('.circle')
        .data(data)
        .enter().append('circle')
        .attr('class', function(d) { return 'tweet user-' + d.user; })
        .attr('cx', function(d) { return x_scale(d.min); })
        .attr('cy', function(d) { return y_scale(d.count); })
        .attr('r', 5)
        .style('fill', '#326ada');

      // voronoi
      voronoiDiag = voronoi(data);
      var overlay = g.append('rect')
        .attr('class', 'overlay')
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .style('opacity', 0)
        .on('mousemove', function() {
          var [mx, my] = d3.mouse(this);
          var site = voronoiDiag.find(mx, my);
          chart.mouseover(site);
        })
        .on('mouseout', chart.mouseout);

        // Axes
       g.append('g')
           .attr("transform", "translate(0," + y_scale.range()[0] + ")")
           .attr('class', 'x-axis')
           .call(x_axis)
            .select(".tick:last-of-type text")
            .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
            .attr("y", -10)
            .attr("dy", null)
            .attr("font-weight", "bold")
            .text('Date of 1st RT');
       g.append('g')
           .attr("transform", "translate(0," + x_scale.range()[0] + ")")
           .attr('class', 'y-axis')
           .call(y_axis.tickFormat(d3.format(".0s")))
            .select(".tick:last-of-type text")
            .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
            .attr("x", 10)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("# RT's");

      chart.fillDropdown('#userDropdown', 'user', data);
    });
  }


  // Getters + setters
  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };
  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };
  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };
  chart.data = function(_) {
    if (!arguments.length) return data;
    data = _;
    return chart;
  };

  // Interaction
  chart.mouseover = function(site) {
    var tweet = site.data,
        val = tweet.count,
        mess = tweet.tweet,
        user = tweet.user;

    tooltip.style("top", (site[1] + "px")).style("left", (site[0] + "px"));
    tooltip.html("");
    tooltip.style("visibility", "visible")
      .style('opacity', 1)
      .style("border", "3px solid " + '#326ada');

    tooltip.append("h3").text('Username: @' + user);
    tooltip.append("div").text("Retweets: " + val);
    tooltip.append("div").text("Text: " + mess);

    d3.selectAll(".tweet")
      .attr('r', 5)
      .style("opacity", 0.3);
    var sel = d3.selectAll('.tweet').filter(function(d) { return d.tweet === mess; });
    sel.attr('r', 10).style("opacity", 1);
    sel.raise();
  }
  chart.mouseout = function() {
    tooltip.style("visibility", "hidden")
    d3.selectAll(".tweet")
      .attr('r', 5)
      .style("opacity", 1);
  }

  chart.fillDropdown = function(divID, attr, data) {
    var users = d3.nest()
      .key(function(d) { return d[attr]; })
      .rollup(function(leaves) { return leaves.length;})
      .entries(data)
      .sort(function(a, b) { return b.value - a.value; });

    var drop = d3.select(divID);
    drop.selectAll('option')
      .data(users)
      .enter().append('option')
      .attr('value', function(d) { return d.key; })
      .text(function(d) { return d.key + ' (' + d.value + ')'; });

    drop.on('change', function(d) {
      var value = '.user-' + d3.select(this).property("value");
      d3.selectAll('.tweet').style('fill', '#326ada');
      d3.selectAll(value).style('fill', '#ff00ff').raise();
    });
  }

  return chart;
});
