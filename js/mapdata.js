class MapData {

  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.svg = document.createElementNS(d3.namespaces.svg, "svg");
    this.content = d3.select(this.svg)
      .attr("viewBox", "0 0 " + this.width + " " + this.height)
      .append("g");

    this.colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0,10]);

    this.projection = d3.geoMercator()
      .center([-119.847,0.11804])
      .scale(80000)
      .translate([width / 2, height / 2]);

    this.pathBuilder = d3.geoPath(this.projection);
    this.paths;
    this.data = []
  }

  draw() {
    if (!this.paths) {
      this.paths = this.content
        .selectAll("path")
        .data(this.data)
        .enter()
        .append("path")
        .attr("d", this.pathBuilder)
        .style("stroke", "black")
        .style("fill", "white");
    }
  }

  setIntensity(id, intensity) {
    let self = this;
    this.paths.each(function(d) {
      if (d.properties.Id == id) {
        console.log("filled");
        d3.select(this).style("fill", self.colorScale(intensity));
      }
    });
  }

  getPathIds() {
    let ids = [];
    this.paths.each(function(d) {
      ids.push(d.properties.Id);
    });
    return ids;
  }

}