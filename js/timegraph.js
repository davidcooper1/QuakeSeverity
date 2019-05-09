class TimeSeriesGraph {

    constructor(width, height, margin) {
      this.width = (width) ? width : 0;
      this.height = (height) ? height : 0;
      this.margin = (margin) ? margin : {top: 0, right: 0, bottom: 0, left: 0};

      // id is used to link the clip path to the content of the graph.
      this.id = TimeSeriesGraph.count++;

      this.svg = document.createElementNS(d3.namespaces.svg, "svg");

      this.eventRect = d3.select(this.svg)
        .append("rect")
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
        .attr("width", this.getContentWidth())
        .attr("height", this.getContentHeight());

      this.content = d3.select(this.svg)
        .attr("viewBox", "0 0 " + this.width + " " + this.height)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

      this.clip = d3.select(this.svg)
        .append("clipPath")
        .attr("id", "_time_series_graph_" + this.id)
        .append("rect")
        .attr("width", this.getContentWidth())
        .attr("height", this.getContentHeight());

      this.xScale = d3.scaleTime().range([0, this.getContentWidth()]);
      this.yScale = d3.scaleLinear().range([this.getContentHeight(), 0]);

      this.xAxis = this.content.append("g")
        .attr("transform", "translate(0," + this.getContentHeight() + ")");
      this.xAxisLabel = this.content.append("text")
        .attr("transform", "translate(" +
          (this.getContentWidth() / 2) + "," +
          (this.getContentHeight() + this.margin.top) + ")")
        .style("text-anchor", "middle");

      this.yAxis = this.content.append("g");
      this.yAxisLabel = this.content.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - this.margin.left)
        .attr("x", 0 - this.getContentHeight() / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle");

      this.paths = [];
    }

    // Get the usable graph width.
    getContentWidth() {
      return this.width - this.margin.left - this.margin.right;
    }

    // Get the usable graph height.
    getContentHeight() {
      return this.height - this.margin.top - this.margin.bottom;
    }

    setLabel(axis, val) {
      ((axis) ? this.yAxisLabel : this.xAxisLabel).text(val);
    }

    // Search the paths property for a path with given id.
    getPath(id) {
      for (let i = 0; i < this.paths.length; i++) {
        if (this.paths[i].id == id) {
          return this.paths[i];
        }
      }
    }

    // Add a path to the graph if there is no other path with the same id.
    addPath(path) {
      for (let i = 0; i < this.paths.length; i++) {
        if (this.paths[i].id == path.id) {
          throw new Error(`Path with id (${path.id}) already exists in graph.`);
        }
      }

      this.paths.push(path);
      path.add(this);
      this.draw();
    }

    // Remove the path from the graph with the given id should it exist.
    removePath(id) {
      for (let i = 0; i < this.paths.length; i++) {
        if (this.paths[i].id == id) {
          this.paths[i].remove();
          this.paths.splice(i, 1);
          break;
        }
      }

      this.draw();
    }

    // Get the min and max values for the given axis of the graph.
    getExtent(axis) {
      // If no paths exist return null.
      if (this.paths.length == 0)
        return null;

      // Set initial extent to compare to.
      let result = this.paths[0].getExtent(axis);

      // Loop through other extents to get proper min and max.
      for (let i = 1; i < this.paths.length; i++) {
        let extent = this.paths[i].getExtent(axis);
        if (result[0] > extent[0]) {
          result[0] = extent[0];
        }
        if (result[1] < extent[1]) {
          result[1] = extent[1];
        }
      }

      return result;
    }

    draw() {
      this.xScale.domain(this.getExtent(TimeSeriesGraph.X)).nice();
      this.yScale.domain(this.getExtent(TimeSeriesGraph.Y)).nice();

      for (let i = 0; i < this.paths.length; i++) {
        this.paths[i].draw(this.xScale, this.yScale);
      }

      this.xAxis.transition().duration(0)
        .call(d3.axisBottom(this.xScale).ticks(5));

      this.yAxis.transition().duration(0)
        .call(d3.axisLeft(this.yScale).ticks(10));
    }

    on(type, func) {
      if (typeof type === "string") {
        if (typeof func === "function") {
          //$(this.eventRect.node()).on(type, func.bind(this));
          this.eventRect.on(type, func.bind(this), true);
          console.log("bound")
        } else {
          throw new TypeError("Expected second argument of type function.");
        }
      } else {
        throw new TypeError("Expected first argument of type function.");
      }
    }

}

TimeSeriesGraph.count = 0;
TimeSeriesGraph.X = 0;
TimeSeriesGraph.Y = 1;

class Path {

  // TODO: implement add and remove methods

  constructor(id, data, xAccessor, yAccessor) {
    this.id = id;
    this.data = data;
    this.xAccessor = xAccessor;
    this.yAccessor = yAccessor;
    this.element = null;
  }

  // Uses TimeSeriesGraph constants for axis determination.
  getExtent(axis) {
    return d3.extent(this.data, (axis) ? this.yAccessor : this.xAccessor);
  }

  add(context) {
    this.element = context.content.append("path")
      .attr("clip-path", "url(#_time_series_graph_" + context.id + ")")
      .attr("class", "line")
      .style("stroke", "black")
      .style("fill", "none")
      .datum(this.data);
  }

  remove() {
    this.element.remove();
    this.element = null;
  }

  draw(xScale, yScale) {
    this.element.transition().duration(500)
      .attr("d", d3.line()
        .x(function(d) { return xScale(this.xAccessor(d)) }.bind(this))
        .y(function(d) { return yScale(this.yAccessor(d)) }.bind(this))
      )
  }

}
