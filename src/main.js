// margins
var margin_map = {top: 20, right: 20, bottom: 20, left: 20},
    margin_timeline = {top: 20, right: 20, bottom: 20, left: 50},
    margin_county_bar = {top:20, right:10, bottom: 10, left:120},
    margin_scatter = {top: 20, right: 20, bottom: 40, left: 40};

// widths
var col_xs_width = d3.select('#width-setter').node().getBoundingClientRect().width,
    width_world_map = col_xs_width - margin_map.left - margin_map.right,
    width_timeline = width_world_map - margin_timeline.left - margin_timeline.right,
    width_county_bar = (col_xs_width / 2)*.9 - margin_county_bar.left - margin_county_bar.right,
    width_county_map = (col_xs_width * .9) - margin_map.left - margin_map.right,
    width_scatter = (col_xs_width / 2)*.9 - margin_scatter.left - margin_scatter.right,
    width_vote_map = (col_xs_width * .9) - margin_map.left - margin_map.right;

// heights
var height_world_map = (width_world_map / 2.5) - margin_map.top - margin_map.bottom,
    height_timeline = (height_world_map / 3) - margin_timeline.top - margin_timeline.bottom,
    height_county_bar = (width_county_bar * .75) - margin_county_bar.top - margin_county_bar.bottom,
    height_county_map = height_world_map,
    height_scatter = (width_scatter * .75) - margin_scatter.top - margin_scatter.bottom,
    height_vote_map = height_world_map;

// Scales
var x_timeline = d3.scaleTime().rangeRound([0, width_timeline]),
	  y_timeline = d3.scaleLinear().range([height_timeline, 0]),
    x_county_bar = d3.scaleLinear().range([0, width_county_bar]),
		y_county_bar = d3.scaleBand().range([0, height_county_bar]).padding(0.4),
    x_scatter = d3.scaleLinear().range([0, width_scatter]),
    y_scatter = d3.scaleLinear().range([height_scatter, 0]),
    color_politics = d3.scaleLinear()
      .range(['#b2182b','#ef8a62','#fddbc7','#f7f7f7','#d1e5f0','#67a9cf','#2166ac']),
    color_county = d3.scaleQuantile().range(['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d']);

// Projections (geographic scales)
var projection_world = d3.geoMercator().center([20, -15]).scale(150),
    projection_county = d3.geoAlbers();

// paths
var path_world = d3.geoPath().pointRadius(2).projection(projection_world),
    path_county = d3.geoPath().pointRadius(2).projection(projection_county);

// Parsers and formatters
var parse_tweet_time = d3.isoParse,
    parse_timeline_date = d3.timeParse("%Y-%m-%d"),
	  parse_timeline_count = d3.format(".0s"),
    parse_commas = d3.format(",");

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
  d.properties.Difference = +d.properties.Difference;
  d.properties.Unemployed = +d.properties.Unemployed;
  d.properties.Polarization = 0.5 - d.properties.Percent_Go;
  return d;
}

// Axes
var x_axis_timeline = d3.axisBottom(x_timeline),
    y_axis_timeline = d3.axisLeft(y_timeline).tickFormat(parse_timeline_count).ticks(5),
    x_axis_county_bar = d3.axisTop(x_county_bar).ticks(5),
    y_axis_county_bar = d3.axisLeft(y_county_bar),
    x_axis_scatter = d3.axisBottom(x_scatter).ticks(5),
    y_axis_scatter = d3.axisLeft(y_scatter);

// SVG's
var svg_timeline = d3.select('#chart-timeline').append('svg')
    	.attr('width', width_timeline + margin_timeline.left + margin_timeline.right)
    	.attr('height', height_timeline + margin_timeline.top + margin_timeline.bottom)
    		.append('g')
    	.attr('transform', 'translate(' + margin_timeline.left + ',' + margin_timeline.top + ')'),
    svg_bar = d3.select('#chart-county-bar').append('svg')
  		.attr('width', width_county_bar + margin_county_bar.left + margin_county_bar.right)
  		.attr('height', height_county_bar + margin_county_bar.top + margin_county_bar.bottom)
  			.append('g')
  		.attr('transform', 'translate(' + margin_county_bar.left + ',' + margin_county_bar.top + ')'),
    svg_scatter = d3.select('#chart-scatter').append('svg')
      .attr('width', width_scatter + margin_scatter.left + margin_scatter.right)
      .attr('height', height_scatter + margin_scatter.top + margin_scatter.bottom)
        .append('g')
      .attr('transform', 'translate(' + margin_scatter.left + ',' + margin_scatter.top + ')'),
    svg_county = d3.select('#chart-county-map').append('svg')
      .attr('id', '#chart-county-map-svg')
    	.attr('width', width_county_map + margin_map.left + margin_map.right)
    	.attr('height', height_county_map + margin_map.top + margin_map.bottom)
    		.append('g')
    	.attr('transform', 'translate(' + margin_map.left + ',' + margin_map.top + ')'),
    svg_vote = d3.select('#chart-votes').append('svg')
      .attr('id', '#chart-vote-map-svg')
    	.attr('width', width_vote_map + margin_map.left + margin_map.right)
    	.attr('height', height_vote_map + margin_map.top + margin_map.bottom)
    		.append('g')
    	.attr('transform', 'translate(' + margin_map.left + ',' + margin_map.top + ')');

// Contexts (g groups for SVGs)
var context_timeline = svg_timeline.append("g").attr("class", "context"),
    context_bar = svg_bar.append('g'),
    context_county = svg_county.append('g'),
    context_scatter = svg_scatter.append('g'),
    context_votes = svg_vote.append('g');


// interactive elements
var tooltip_county =  d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");
