window.CartoGrid = (function() {
  var self = this;
  var width = 960,
	  height = 500,
	  padding = 0.05,
	  x_scale = d3.scaleBand(),
	  y_scale = d3.scaleBand(),
	  sq_row = 18,
	  sq_col = 12,
	  square_size,
      data;

	// constructor
	function grid(selection) {
        selection.each(function(states) {

            // set grid scales and ultimately get the square dim
            square_size = get_square_size();

            // set chart scales
            var sq_x_scale = d3.scaleLinear().domain([0, sq_row]).range([0, square_size[0]]),
                sq_y_scale = d3.scaleLinear().domain([0, sq_col]).range([0, square_size[1]]);


            var svg = d3.select(this).append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g'),

            squares = svg.append('g').attr('class', 'states').selectAll('g')
                .data(states)
                .enter().append('g')
                .attr('class', 'state')
                .attr('id', function(d) { return 'st-' + d.state; })
                .attr('width', square_size[0])
                .attr('height', square_size[1])
                .attr('transform', function(d) {
                    var sq_x = x_scale(d.x),
                        sq_y = y_scale(d.y);
                    return 'translate(' + sq_x + ',' + sq_y + ')';
                });
            squares.append('text')
                .text(function(d) { return d.state; });


        });
	}

	// Functions
	function get_square_size() {
		/* get a 2D list of square dimensions */
		x_scale.domain(range(1, sq_row)).range([0, width]).padding(padding);
		y_scale.domain(range(1, sq_col)).range([0, height]).padding(padding);

		var sq_w = x_scale.bandwidth(),
			sq_h = y_scale.bandwidth();

		return [sq_w, sq_h];
    }
	function get_num_squares(square_size, size, axis) {
		/*
		  calc number of squares per row
		  @square_size [width, height]
		  @svg_width Int, either svg_width/height
		  @axis, calc which one ['x', 'y']
		*/
		var squares = Math.round(size / square_size[axis]);
		return squares;
	}
	function range(start, edge, step) {
	  // If only one number was passed in make it the edge and 0 the start.
	  if (arguments.length == 1) {
		edge = start;
		start = 0;
	  }

	  // Validate the edge and step numbers.
	  edge = edge || 0;
	  step = step || 1;

	  // Create the array of numbers, stopping befor the edge.
	  for (var ret = []; (edge - start) * step > 0; start += step) {
		ret.push(start);
	  }
	  return ret;
	}

	// Getters+setters
	grid.width = function(value) {
		if (!arguments.length) return width;
		width = value;
		return grid;
	};
	grid.height = function(value) {
		if (!arguments.length) return height;
		height = value;
		return grid;
	};
	grid.padding = function(value) {
		if (!arguments.length) return padding;
		padding = value;
		return grid;
	};
	grid.sq_row = function(value) {
		if (!arguments.length) return sq_row;
		sq_row = value;
		return grid;
	};
	grid.sq_col = function(value) {
		if (!arguments.length) return sq_col;
		sq_col = value;
		return grid;
	};
    /*grid.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        //if (typeof updateData === 'function') updateData();
        return grid;
    };*/



  return grid;
});
