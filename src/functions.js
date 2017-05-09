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
	context_bar.select('#bar-x').transition(100).style('opacity', 0).remove();
	context_bar.select('#bar-y').transition(100).style('opacity', 0).remove();
	context_bar.append('g')		// scatter axes
		.attr("class", "axis axis--x")
		.attr('id', 'bar-x')
		.attr("transform", "translate(0," + 0 + ")")
		.call(x_axis_county_bar);
	context_bar.append('g')
		.attr('class', 'axis axis--y')
		.attr('id', 'bar-y')
		.call(y_axis_county_bar);

	var county_bars = svg_bar.selectAll('.bar')
			.data(data, function(d) { return d.County_Nam; });

	county_bars.exit().transition().duration(100)
			.attr("y", y_county_bar(0))
			.attr('height', 0)
			.style('fill-opacity', 0)
			.remove();

	county_bars.enter().append('rect')
		.attr('class', function(d) { return 'bar FIPS-' + d.properties.FIPS; })
		.attr("x", function(d) { return x_county_bar(0); })
		.attr("width", function(d) { return  x_county_bar(d.properties[x]); })
		.attr("y", function(d) { return y_county_bar(d.properties[y]); })
		.attr("height", y_county_bar.bandwidth())
		.style('fill', function(d) { return color_county(d.properties[x]); })
		.on('mouseover', function(d) { highlight_county(d, x); })
		.on('mousemove', move_county)
		.on('mouseout', unhighlight_county);

	county_bars.transition().duration(100)
			.attr("width", function(d) { return  x_county_bar(d.properties[x]); })
			.attr("y", function(d) { return y_county_bar(d.properties[y]); });
}
function draw_scatter(data, x, y) {
	var t = d3.transition().duration(100);
	x_scatter.domain([0, d3.max(data, function(d) { return d.properties[x]; })]);
	y_scatter.domain([0, d3.max(data, function(d) { return d.properties[y]; })]);

	// change axes
	context_scatter.select('#scatter-x').transition(100).style('opacity', 0).remove();
	context_scatter.select('#scatter-y').transition(100).style('opacity', 0).remove();
	context_scatter.append('g')		// scatter axes
	  .attr("class", "axis axis--x")
	  .attr('id', 'scatter-x')
	  .attr("transform", "translate(0," + height_scatter + ")")
	  .call(x_axis_scatter);
	context_scatter.append('g')
	  .attr('class', 'axis axis--y')
	  .attr('id', 'scatter-y')
	  .call(y_axis_scatter);

	var join = context_scatter.selectAll('.county-pt')
			.data(data.filter(function(d) {
				return (d.properties[x]) && (d.properties[y]);
			}), function(d) { return d.County_Nam; });

	join.exit().transition(t)
		.attr('cx', x_scatter(0)).attr('cy', y_scatter(0)).attr('r', 0)
		.style("opacity", 0).remove();
	join.enter().append('circle')
		.attr('class', function(d) { return 'county-pt FIPS-' + d.properties.FIPS; })
		.attr("cx", function(d) { return x_scatter(d.properties[x]); })
		.attr("cy", function(d) { return y_scatter(d.properties[y]); })
		.attr("r", 3.5)
		.style('fill', '#ccc')
		.style('opacity', 0.7)
		.on('mouseover', function(d) { highlight_county(d, y); })
		.on('mousemove', move_county)
		.on('mouseout', unhighlight_county);
	join.attr('class', 'update')
		.attr("cx", function(d) { return x_scatter(d.properties[x]); })
		.attr("cy", function(d) { return y_scatter(d.properties[y]); });
}


// set charts functions
function set_world() {
	d3.json('data/external/maps/110m.json', function(err, map_file) {
		this.countries = topojson.feature(map_file, map_file.objects.countries);
	});
	d3.csv('data/processed/finals/5-7/combined.csv', format_world_tweets, function(err, tweets) {
			this.tweets = tweets;
			draw_world_tweets(tweets);		/* ~MAP~ */
			set_chart_timeline();					/* ~TIMELINE~ */
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
			.attr('width', width_timeline / (days.length + 20))
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
function set_county() {
	d3.json('data/external/maps/test.json', function(map_file) {
		this.counties = map_file.features.map(format_county);
		// Filter out the counties without tweets, and AK/HI
		map_file.features = map_file.features.filter(function(d) {
			return (d.properties.Tweets) &&
		 					(d.properties.FIPS !== 2090) &&
							(d.properties.FIPS !== 2020) &&
							(d.properties.FIPS !== 15009) &&
							(d.properties.FIPS !== 15003);
		});

		// SCALES
		color_county.domain(map_file.features.map(function(d) { return d.properties['Tweets']; }));
		projection_county.fitSize([width_county_map, height_county_map], map_file);
		path_county.projection(projection_county);


		draw_scatter(map_file.features, 'Tweets', 'Population');	// SCATTER
		var top_counties = get_top_x_by_y(map_file.features, 'Tweets', 15);
		draw_bars(top_counties, 'Tweets', 'County_Nam');			// BAR

		// highlight the top scatter points
		var top_fips = top_counties.map(function(d) { return d.properties.FIPS; });
		context_scatter.selectAll('.county-pt')
			.filter(function(d) { return top_fips.indexOf(d.properties.FIPS) >= 0; })
			.style('fill', function(d) { return color_county(d.properties.Tweets); });

		// MAP
		var county_blocks = context_county.selectAll('path')
				.data(map_file.features)
      		.enter().append('path')
				.attr('class', function(d) { return 'county FIPS-' + d.properties.FIPS; })
	      .attr('d', path_county)
	      .style('fill', function(d) { return color_county(d.properties.Tweets); })
				.on('mouseover', function(d) { highlight_county(d, 'Population')})
				.on('mousemove', move_county)
				.on('mouseout', unhighlight_county);

		// set the dropdown to change the scatter
		d3.select('#county-attributes').on('change', function() {
			var sel = document.getElementById("county-attributes").value;
			// update new color scale
			color_county.domain(map_file.features.map(function(d) { return d.properties[sel]; }));
			// update scatter
			draw_scatter(map_file.features, sel, 'Tweets');
			// update bar
			var top_counties = get_top_x_by_y(map_file.features, sel, 15);
			draw_bars(top_counties, sel, 'County_Nam');
			// highlight scatter
			var top_fips = top_counties.map(function(d) { return d.properties.FIPS; });
			context_scatter.selectAll('.county-pt')
				.filter(function(d) { return top_fips.indexOf(d.properties.FIPS) >= 0; })
				.style('fill', function(d) { return color_county(d.properties[sel]); });
			// Update map

			context_county.selectAll('.county')
				.on('mouseover', function(d) { highlight_county(d, sel)})
				.transition(100)
				.style('fill', function(d) { return color_county(d.properties[sel]); });
		});
	}); // counties*/

}
function set_votes() {
	color_politics.domain(counties.map(function(d) { return d.properties.Polarization; }));

	var county_blocks = context_votes.selectAll('path')
			.data(counties)
				.enter().append('path')
			.attr('class', function(d) { return 'county FIPS-' + d.properties.FIPS; })
			.attr('d', path_county)
			.style('fill', function(d) { return color_politics(d.properties.Polarization); });
}

// helpers
function get_top_x_by_y(x, y, n) {
	var filtered = x.filter(function(d) { return d.properties[y]; }),
			counts = filtered.sort(function(a, b) { return d3.descending(a.properties[y], b.properties[y]); }),
			sliced = counts.slice(0, n);
	return sliced;
}
function filter_message_range(data, start=false, stop=false) {
	if (start !== false) {
		return data.filter(function(d) { return (d.date > start) && (d.date < end); })
				.filter(function(d) { return (d.x) && (d.y); });
	} else {
		return data.filter(function(d) { return (d.x) && (d.y); });
	};
}

function highlight_county(county, attr) {
	var props = county.properties,
	    fips = '.FIPS-' + props.FIPS,
			num_tweets = props.Tweets;
			value = props[attr],
			fill_color = color_county(value);

	tooltip_county.html("");
	tooltip_county.style('visibility', 'visible')
		.style('border', '5px solid' + fill_color)
		.style('opacity', 1);

	tooltip_county.append("h3").text(props.County_Nam +', '+ props.Abbreviati);
	tooltip_county.append('div').text(attr +': ' + props[attr]);
	tooltip_county.append('div').text('Tweets: ' + num_tweets);

	svg_county.selectAll('path.county')	// dim other counties
		.style('opacity', 0.3)
		.style('stroke', null);

	svg_county.select(fips)						// highlight this county on map
		.style('opacity', 1)
		.style('stroke', '#222')
		.raise();
	svg_scatter.select(fips)
		.attr('r', 10)
		.style('fill', fill_color)
		.style('opacity', 1)
		.style('stroke', '#fff')
		.style('stroke-width', 1)
		.raise();

	svg_bar.select(fips)
		.attr('stroke', '#222')
		.attr('stroke-width', 1.5);
}
function unhighlight_county(county) {
	tooltip_county.style('visibility', 'hidden');
	svg_county.selectAll('path.county').style('opacity', 1);
	//select states too

	var fips = '.FIPS-' + county.properties.FIPS;
	svg_county.select(fips).transition(50)
		.style('opacity', 0.7)
		.style('stroke', '#fff');
	svg_scatter.select(fips).transition(50)
		.attr('r', 3.5)
		.style('opacity', 0.7)
		.style('fill', '#ccc')
		.style('stroke', null)
		.style('stroke-width', null);
	svg_bar.select(fips).transition(50)
		.style('stroke', null)
		.style('stroke-width', null);
}
function move_county() {
	return tooltip_county.style("top", (d3.event.pageY-52) + "px").style("left", (d3.event.pageX+18) + "px");
}
