// Class made to create SVGs to display St. Himark maps.
class MapData {

  constructor(width, height) {
    // Viewbox width and height.
    this.width = width;
    this.height = height;

    this.svg = document.createElementNS(d3.namespaces.svg, "svg");

    // Sets viewBox dimensions for SVG instead of width and height. This allows
    // SVGs to be resized with css dynamically.
    this.content = d3.select(this.svg)
      .attr("viewBox", "0 0 " + this.width + " " + this.height)
      .append("g");

    this.colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0,10]);

    // Creates the geoMercator projection object to convert map coordinates.
    this.projection = d3.geoMercator()
      .center([-119.847,0.11804])
      .scale(80000)
      .translate([width / 2, height / 2]);

    this.pathBuilder = d3.geoPath(this.projection);
    this.paths;
    this.data = []
  }

  // Function to initialize/draw the map.
  draw() {
    if (!this.paths) {
      this.paths = this.content
        .selectAll("path")
        .data(this.data)
        .enter()
        .append("path")
        .attr("d", this.pathBuilder)
        .style("stroke", "black")
        .style("fill", "white")
        .style("pointer-events", "all") // Needed to capture ANY mouse events.
        .attr("data-toggle", "tooltip")
        .attr("title", function(d) { return d.properties.Nbrhood; })
        .on("mouseover", function(d) {
          $(this).tooltip("show");
        });
    }
  }

  // Add event listener to every path in the map.
  on(type, func) {
    console.log("called");
    if (typeof type === "string") {
      if (typeof func === "function") {
        console.log("bound");
        this.paths.on(type, func);
      } else {
        throw new TypeError("Expected second argument of type function.");
      }
    } else {
      throw new TypeError("Expected first argument of type function.");
    }
  }

  // Set the color of a specific path based on the intensity provided.
  // Intensities should be within the range 0 to 10.
  setIntensity(id, intensity) {
    let self = this;
    this.paths.each(function(d) {
      if (d.properties.Id == id) {
        d3.select(this).style("fill", self.colorScale(intensity));
      }
    });
  }

  // Set the color of a specific path.
  setColor(id, color) {
    let self = this;
    console.log(color)
    this.paths.each(function(d) {
      if (d.properties.Id == id) {
        d3.select(this).style("fill", color);
      }
    });
  }


  // Gets the ids of all paths in the map.
  getPathIds() {
    let ids = [];
    this.paths.each(function(d) {
      ids.push(d.properties.Id);
    });
    return ids;
  }

}
