////////////////////////////////////////////////////////////////////////////////
// Functions
////////////////////////////////////////////////////////////////////////////////

function draw_world_tweets(data, start=false, stop=false) {

	var canvas0 = d3.selectAll('canvas');
	var canvas1 = d3.select("#chart-world").insert("canvas", "input")
			.attr("width", width_world_map)
			.attr("height", height_world_map)
			.style('z-index', 2)
			.style("opacity", 0)
			.style('display', 'absolute');

	// Grab the context so we can start putting things down
	var context = canvas1.node().getContext("2d");

	// Draw countries
	context.globalAlpha = 0.4;
	path_world.context(context);

	context.beginPath();
	path_world(this.countries);
	context.stroke();

	context.fillStyle = "#fff";
	context.fillRect(0, 0, width_world_map, height_world_map);

	// Render the active tweets.
	context.globalAlpha = 1;
	context.fillStyle = "#43a2ca";

	if (start !== false) {
		data.filter(function(d) { return (d.date > start) && (d.date < stop); })
				.filter(function(d) { return (d.x) && (d.y); })
				.forEach(function(d) { context.fillRect(d.x, d.y, 1, 1); });
	} else {
		data.filter(function(d) { return (d.x) && (d.y); })
				.forEach(function(d) { context.fillRect(d.x, d.y, 1, 1); });
	};

	canvas1.transition()			// Instantiate new map
		.duration(100)
		.style("opacity", 1)
		.on("end", function() { canvas0.remove(); });
}
function draw_bars(data, x, y) {
	// set domains
	x_county_bar.domain([0, d3.max(data, function(d) { return d.properties[x]; })]);
	y_county_bar.domain(data.map(function(d) { return d.properties[y]; }));

	// change axes
	context_user.select('#bar-x').transition(100).call(x_county_bar);
	context_user.select('#bar-y').transition(100).call(y_county_bar);

	var county_bars = context_user.selectAll('.bar')
			.remove()
			.exit()
			.data(data);

	county_bars.enter().append('rect')
		.attr("class", "bar")
		.attr("x", function(d) { return x_county_bar(0); })
		.attr("width", function(d) { return  x_county_bar(d.properties[x]); })
		.attr("y", function(d) { return y_county_bar(d.properties[y]); })
		.attr("height", y_county_bar.bandwidth());
}
function draw_scatter(data, x, y) {

	var t = d3.transition().duration(100);

	color_county.domain(d3.map(data, function(d) { return d.properties['Tweets']; }));
	x_scatter.domain([0, d3.max(data, function(d) { return d.properties[x]; })]);
	y_scatter.domain([0, d3.max(data, function(d) { return d.properties[y]; })]);

	// change axes
	context_scatter.select('#scatter-x').call(x_scatter);
	context_scatter.select('#scatter-y').call(y_scatter);

	var join = context_scatter.selectAll('.county-pt')
			.data(data.filter(function(d) {
				return (d.properties[x]) && (d.properties[y]);
			}), function(d) { return d; });

	join.exit()
		.attr("class", "exit")
  .transition(t)
    .style("fill-opacity", 0)
    .remove();
	join.attr('class', 'update')
		.attr("cx", function(d) { return x_scatter(d.properties[x]); })
		.attr("cy", function(d) { return y_scatter(d.properties[y]); });
	join.enter().append('circle')
		.attr('class', function(d) { return 'county-pt FIPS-' + d.properties.FIPS; })
		.attr("cx", function(d) { return x_scatter(d.properties[x]); })
		.attr("cy", function(d) { return y_scatter(d.properties[y]); })
		.attr("r", 3)
		.on('mouseover', highlight_county)
		.on('mouseout', unhighlight_county);

}


// set charts functions
function set_world() {
	d3.json('data/external/maps/110m.json', function(err, map_file) {
		this.countries = topojson.feature(map_file, map_file.objects.countries);
	});
	d3.csv('data/processed/finals/5-7/combined.csv', format_world_tweets, function(err, tweets) {
			this.tweets = tweets;

			draw_world_tweets(tweets);			/* ~MAP~ */
			set_chart_timeline();						/* ~TIMELINE~ */
	});
}
function set_chart_timeline() {
	// Read in timeline tweets
	d3.csv('data/processed/scrape/4-4/day-agg.csv', format_timeline, function(err, days) {
		if (err) throw err;
		this.day_counts = days;

		// set domains
		x_timeline.domain(d3.extent(days, function(d) { return d.day; }));
		y_timeline.domain([0, d3.max(days, function(d) { return d.count; })]);

		// Add bars
		context_timeline.selectAll('.timeline-day')
			.data(days)
			.enter().append('rect')
			.attr('class', 'bar timeline-day')
			.attr('x', function(d) { return x_timeline(d.day); })
			.attr('y', function(d) { return y_timeline(d.count); })
			.attr('width', width_timeline / (days.length + 40))
			.attr('height', function(d) { return (height_timeline) - y_timeline(d.count); });

		// add axes
		context_timeline.append('g')
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + (height_timeline) + ")")
			.call(x_axis_timeline);
		context_timeline.append('g')
			.attr('class', 'axis axis--y')
			.call(y_axis_timeline)
			.append('text')					// Add y label
				.attr("x", 4)
				.attr("y", y_timeline(y_timeline.ticks().pop()) + 0.5)
				.attr("dy", "0.32em")
				.attr("fill", "#000")
				.attr("font-weight", "bold")
				.attr("text-anchor", "start")
				.text("Tweets per Day");

		// Interactivity elements
		var brush_timeline = d3.brushX()
				.extent([[0, 0], [width_timeline, height_timeline]])
				.on("end", brushed_timeline);

		// Interactivity functions
		function brushed_timeline() {
			if (!d3.event.sourceEvent) return; // Only transition after input.
			if (!d3.event.selection) { return draw_world_tweets(this.tweets); }; // reset empty selections.

			var d0 = d3.event.selection.map(x_timeline.invert),
					d1 = d0.map(d3.timeDay.round);
			if (d1[0] >= d1[1]) { // If empty when rounded, use floor & ceil instead.
				d1[0] = d3.timeDay.floor(d0[0]);
				d1[1] = d3.timeDay.offset(d1[0]);
			}
			// move the slider
			d3.select(this).transition().call(d3.event.target.move, d0.map(x_timeline));

			// Select the points on the map here
			draw_world_tweets(window.tweets, d1[0], d1[1]);
		}

		// add brush
		context_timeline.append('g')
			.attr('class', 'brush')
			.call(brush_timeline);
	});
}
function set_bar() {
	var top_counties = get_top_x_by_y(this.counties, 'FIPS');
  // set domains
  x_county_bar.domain([0, d3.max(users, function(d) { return d.value; })]);
  y_county_bar.domain(users.map(function(d) { return d.key; }));

  var user_bars = context_user.selectAll('.bar')
    .data(users)
	  	.enter().append('rect')
    .attr("class", "bar")
    .attr("x", function(d) { return x_county_bar(0); })
    .attr("width", function(d) { return  x_county_bar(d.value); })
    .attr("y", function(d) { return y_county_bar(d.key); })
    .attr("height", y_county_bar.bandwidth());

	/* interactivity
	user_bars.on('mouseover', function(d) { map_user_tweets(d, brush_start, brush_stop); })
				.on('mouseout', function() { map_tweets_extent(brush_start, brush_stop)});*/

	context_bar.append('g')
    .attr("class", "axis axis--x")
		.attr('id', 'bar-x')
    .attr("transform", "translate(0," + 0 + ")")
    .call(x_axis_county_bar);
  context_bar.append('g')
    .attr('class', 'axis axis--y')
		.attr('id', 'bar-y')
    .call(y_axis_county_bar);
}
function set_county() {
	d3.json('data/external/maps/attributes.json', function(map_file) {

		// Filter out the counties without tweets, and AK/HI
		map_file.features = map_file.features.filter(function(d) {
			return (d.properties.Tweets) &&
		 					(d.properties.FIPS !== 2090) &&
							(d.properties.FIPS !== 2020) &&
							(d.properties.FIPS !== 15009) &&
							(d.properties.FIPS !== 15003);
		});
		this.counties = map_file;

		// Scales
		color_county.domain(d3.map(map_file.features, function(d) { return d.properties['Tweets']; }));


		// SCATTER
		x_scatter.domain([0, d3.max(map_file.features, function(d) { return d.properties['Population']; })]);
		y_scatter.domain([0, d3.max(map_file.features, function(d) { return d.properties['Tweets']; })]);

		context_scatter.append('g')		// scatter axes
	    .attr("class", "axis axis--x")
			.attr('id', 'scatter-x')
	    .attr("transform", "translate(0," + height_scatter + ")")
	   	.call(x_axis_scatter);
	  context_scatter.append('g')
	    .attr('class', 'axis axis--y')
			.attr('id', 'scatter-y')
	    .call(y_axis_scatter);
		draw_scatter(map_file.features, 'Population', 'Tweets');	// draw the scatter points


		// BAR
		var top_counties = get_top_x_by_y(map_file.features, 'Tweets', 10);
	  // set domains
	  x_county_bar.domain([0, d3.max(top_counties, function(d) { return d.properties.Population; })]);
	  y_county_bar.domain(top_counties.map(function(d) { return d.properties.FIPS; }));







		// MAP
		projection_county.fitSize([width_county_map, height_county_map], map_file);
		path_county.projection(projection_county);

		var county_blocks = context_county.selectAll('path')
				.data(map_file.features)
      		.enter().append('path')
				.attr('class', function(d) { return 'county-pt FIPS-' + d.properties.FIPS; })
	      .attr('d', path_county)
	      .style('fill', function(d) { return color_county(d.properties.Tweets); })
	      .style('stroke', '#222')
				.on('mouseover', highlight_county)
				.on('mouseout', unhighlight_county);




		// set the dropdown to change the scatter
		d3.select('#county-attributes').on('change', function() {
			var sel = document.getElementById("county-attributes").value;

			draw_scatter(tweeted_counties, sel, 'Tweets');


		});
	}); // counties*/
}



// helpers
function get_top_users(messages) {
	// get the user count
	var counts = d3.nest()
		.key(function(d) { return d.username; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(messages)
		.sort(function(a, b) { return d3.descending(a.value, b.value); }) // sort
		.slice(0, 10);
	return counts;
}
function get_top_x_by_y(x, y, n) {
	// get the user count
	var counts = x.sort(function(a, b) { return d3.descending(a.properties[y], b.properties[y]); }) // sort
		.slice(0, n);
	return counts;
}
function get_top_user_messages(username, messages) {
	return messages
		.filter(function(d) { return d.username === username; })
		.slice(0, 10);
}
function tabulate(data, columns) {
    var table = d3.select("#chart-table");

    // create a row for each object in the data
    var rows = table.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return columns.map(function(column) {
                return {column: column, value: row[column]};
            });
        })
        .enter()
        .append("td")
        .attr("style", "font-family: Courier")
            .html(function(d) { return d.value; });
    //return table;
}


function filter_message_range(data, start=false, stop=false) {
	if (start !== false) {
		return data.filter(function(d) { return (d.date > start) && (d.date < end); })
				.filter(function(d) { return (d.x) && (d.y); });
	} else {
		return data.filter(function(d) { return (d.x) && (d.y); });
	};
}


function highlight_county(county) {
	var fips = '.FIPS-' + county.properties.FIPS;
	var mapped = svg_county.select(fips).transition(100).style('fill', '#000'),
			scattered = svg_scatter.select(fips).transition(100)
				.attr('r', 6)
				.style('opacity', 1)
				.style('fill', '#000');
	console.log(fips);
}
function unhighlight_county(county) {
	var fips = '.FIPS-' + county.properties.FIPS;
	var mapped = svg_county.select(fips).transition(50)
				.style('fill', function(d) { return color_county(d.properties.Tweets); }),
			scattered = svg_scatter.select(fips).transition(50)
				.attr('r', 3)
				//.style('z-index', 5)
				.style('opacity', 0.4)
				.style('fill', '#000');
}
