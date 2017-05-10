// margins
var margin_map = {top: 20, right: 20, bottom: 20, left: 20},
    margin_timeline = {top: 20, right: 20, bottom: 20, left: 50},
    margin_county_bar = {top:60, right:10, bottom: 10, left:120},
    margin_scatter = {top: 40, right: 20, bottom: 40, left: 40};

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
	  color_gop = d3.scaleQuantile().range(['#f7f7f7', '#fddbc7', '#ef8a62', '#b2182b']),
	  color_dem = d3.scaleQuantile().range(['#f7f7f7','#d1e5f0', '#67a9cf','#2166ac']),
    color_county = d3.scaleQuantile().range(['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d']),
    color_politics = d3.scaleQuantile().range(['#b2182b','#ef8a62','#fddbc7','#d1e5f0','#67a9cf','#2166ac']),
    scale_tweets = d3.scaleThreshold().range([0.5, 0.66, 0.75, 0.83, 1]);

// Projections (geographic scales)
var projection_world = d3.geoMercator().center([20, -15]).scale(175),
    projection_county = d3.geoAlbers();

// paths
var path_world = d3.geoPath().pointRadius(2).projection(projection_world),
    path_county = d3.geoPath().pointRadius(2).projection(projection_county);

// Parsers and formatters
var parse_tweet_time = d3.isoParse,
    parse_timeline_date = d3.timeParse("%Y-%m-%d"),
	  parse_timeline_count = d3.format(".0s"),
    parse_commas = d3.format(","),
    parse_thousands = d3.format('s'),
    parse_mil = d3.format('.0s')
    format_commas = function(d) { return parseInt(d.replace(',', ''))},
    format_pct = function(d) { return parseFloat(d.replace('%', ''))},
    format_none = function(d) { return d; },
    format_round = d3.format('r');

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

  return d;
}
function format_state(st) {
	var props = st.properties,
		dem_rate = +format_round(props.Votes_Demo / props.Population),
		gop_rate = +format_round(props.Votes_Gop / props.Population);
  st.properties.dem_rate = dem_rate;
  st.properties.gop_rate = gop_rate;
	return st;
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
      .style("visibility", "hidden"),
    tooltip_votes =  d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden"),
    t = d3.transition(100).ease(d3.easePolyIn);

// Attributes!
var attrs = {
  "State":        {'human': 'St',
                  'form': format_none},
  "County_Nam":   {'human': 'Name',
                    'form': format_none},
  "Population":   {'human': 'Population',
                    'form': parse_mil},
  "White":        {'human': '# Caucasian',
                    'form': format_none},
  "Black":        {'human': '# African American',
                    'form': format_none},
  "American_I":   {'human': '# American Indian',
                    'form': format_none},
  "Asian":        {'human': '# Asian',
                    'form': format_none},
  "Pacific_Is":   {'human': '# Pacific Islanders',
                    'form': format_none},
  "Multi_Race":   {'human': '# Mixed Ethnicity',
                    'form': format_none},
  "Labor_Forc":   {'human': '# People in Labor Force',
                      'form': format_commas},
  "Employed":     {'human': '# Employed',
                    'form': format_commas},
  "Unemployed":   {'human': '# Unemployed',
                    'form': format_none},
  "Unemployme":   {'human': 'Unemployment Rate',
                    'form': format_none},
  "Median_Hou":   {'human': 'Median Housing Price',
                    'form': format_none},
  "Percent_Le":   {'human': '% Less than High School Education',
                    'form': format_none},
  "Percent_On":   {'human': '% Only High School Education',
                    'form': format_none},
  "Percent_So":   {'human': '% Some College Education',
                    'form': format_none},
  "Percent_Ba":   {'human': '% Bachelors Degree',
                    'form': format_none},
  "Votes_Demo":   {'human': '# Democratic Votes',
                    'form': format_none},
  "Votes_Gop":    {'human': '# Republican Votes',
                    'form': format_none},
  "Total_Vote":   {'human': '# Total Votes',
                    'form': parse_mil},
  "Percent_De":   {'human': '% Voted Democrat',
                    'form': format_none},
  "Percent_Go":   {'human': '% Voted Republican',
                    'form': format_none},
  "Vote_Diffe":   {'human': '# Difference in Party Vote Counts',
                    'form': format_commas},
  "Percent_Po":   {'human': '% Difference in Party Vote Counts',
                    'form': format_commas},
  "Tweets":       {'human': '# Tweets',
                    'form': parse_mil},
  "Tweet_Rate":   {'human': 'Tweet Rate',
                    'form': format_none},
  "Votes_Demo":   {'human': '# of Voters who voted Dem.',
                    'form': parse_mil},
  "Votes_Gop":   {'human': '# of Voters who voted Rep.',
                    'form': parse_mil}
};

var drop_keys = ['Tweets', 'Tweet_Rate', "Population",
    "White", "Black", "American_I", "Asian", "Pacific_Is", "Multi_Race",
    "Labor_Forc", "Employed", "Unemployed", "Unemployme", "Median_Hou",
    "Percent_Le", "Percent_On", "Percent_So", "Percent_Ba",
    "Votes_Demo", "Votes_Gop", "Total_Vote", "Percent_De", "Percent_Go", "Vote_Diffe", "Percent_Po"];
