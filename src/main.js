// margins
var margin_map = {top: 20, right: 20, bottom: 20, left: 20},
    margin_timeline = {top: 20, right: 20, bottom: 20, left: 50},
    margin_user = {top:20, right:10, bottom: 10, left:100},
    margin_scatter = {top: 20, right: 20, bottom: 40, left: 40};

// widths
var col_xs_width = d3.select('#chart-world').node().getBoundingClientRect().width,
    width_world_map = col_xs_width - margin_map.left - margin_map.right,
    width_timeline = width_world_map - margin_timeline.left - margin_timeline.right,
    width_user = (col_xs_width / 2) - margin_user.left - margin_user.right,
    width_county_map = (col_xs_width * .75) - margin_map.left - margin_map.right,
    width_scatter = (col_xs_width / 3) - margin_scatter.left - margin_scatter.right,
    width_vote_map = width_world_map;

// heights
var height_world_map = (width_world_map / 2.5) - margin_map.top - margin_map.bottom,
    height_timeline = (height_world_map / 3) - margin_timeline.top - margin_timeline.bottom,
    height_user = (width_user / 2) - margin_user.top - margin_user.bottom,
    height_county_map = height_world_map,
    height_scatter = height_county_map,
    height_vote_map = height_world_map;

// Scales
var x_timeline = d3.scaleTime().rangeRound([0, width_timeline]),
	  y_timeline = d3.scaleLinear().range([height_timeline, 0]),
    x_user = d3.scaleLinear().range([0, width_user]),
		y_user = d3.scaleBand().range([0, height_user]).padding(0.4),
    x_scatter = d3.scaleLinear().range([0, width_scatter]),
    y_scatter = d3.scaleLinear().range([height_scatter, 0]),
    color_politics = d3.scaleQuantile()
      .range(['#b2182b','#ef8a62','#fddbc7','#f7f7f7','#d1e5f0','#67a9cf','#2166ac']),
    color_county = d3.scaleQuantize().range(['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d']);

// Projections (geographic scales)
var projection_world = d3.geoMercator().center([20, -15]).scale(150),
    projection_county = d3.geoAlbers();

// paths
var path_world = d3.geoPath().pointRadius(2).projection(projection_world),
    path_county = d3.geoPath().pointRadius(2).projection(projection_county);

// Parsers and formatters
var parse_tweet_time = d3.isoParse,
    parse_timeline_date = d3.timeParse("%Y-%m-%d"),
	  parse_timeline_count = d3.format(".0s");

function format_world_tweets(d) {
	d.date = parse_tweet_time(d.date);                       // Date first
	var p = projection_world([+d.longitude, +d.latitude]);   // Then location
	//if (p) d.x = Math.round(p[0]), d.y = Math.round(p[1]);
	if (p) d.x = p[0], d.y = p[1];
	return d;
}
function format_timeline(d) {
	// format the tweet's date and int
	d.count = +d.count;
	d.day = parse_timeline_date(d.day);
	return d;
}
function format_users(d) {
	d.count = +d.count;
	return d;
}
function format_county(d) {
  console.log(d);
  return d;
}

// Axes
var x_axis_timeline = d3.axisBottom(x_timeline),
    y_axis_timeline = d3.axisLeft(y_timeline).tickFormat(parse_timeline_count).ticks(5),
    x_axis_user = d3.axisTop(x_user).ticks(5),
    y_axis_user = d3.axisLeft(y_user),
    x_axis_scatter = d3.axisBottom(x_scatter).ticks(5),
    y_axis_scatter = d3.axisLeft(y_scatter);

// SVG's
var svg_timeline = d3.select('#chart-timeline').append('svg')
    	.attr('width', width_timeline + margin_timeline.left + margin_timeline.right)
    	.attr('height', height_timeline + margin_timeline.top + margin_timeline.bottom)
    		.append('g')
    	.attr('transform', 'translate(' + margin_timeline.left + ',' + margin_timeline.top + ')'),
    svg_user = d3.select('#chart-users').append('svg')
  		.attr('width', width_user + margin_user.left + margin_user.right)
  		.attr('height', height_user + margin_user.top + margin_user.bottom)
  			.append('g')
  		.attr('transform', 'translate(' + margin_user.left + ',' + margin_user.top + ')'),
    svg_scatter = d3.select('#chart-scatter').append('svg')
      .attr('width', width_scatter + margin_scatter.left + margin_scatter.right)
      .attr('height', height_scatter + margin_scatter.top + margin_scatter.bottom)
        .append('g')
      .attr('transform', 'translate(' + margin_scatter.left + ',' + margin_scatter.top + ')'),
    svg_county = d3.select('#chart-county').append('svg')
    	.attr('width', width_county_map + margin_map.left + margin_map.right)
    	.attr('height', height_county_map + margin_map.top + margin_map.bottom)
    		.append('g')
    	.attr('transform', 'translate(' + margin_map.left + ',' + margin_map.top + ')');

// Contexts (g groups for SVGs)
var context_timeline = svg_timeline.append("g").attr("class", "context"),
    context_user = svg_user.append('g'),
    context_county = svg_county.append('g'),
    context_scatter = svg_scatter.append('g');

// Interactivity
var tooltip_county = svg_county
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden");
