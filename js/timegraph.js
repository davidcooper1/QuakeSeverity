function TimeSeriesGraph(width, height, margin) {
    this.margin = (margin) ? margin : {top: 0, right: 0, bottom: 0, left: 0};
    this.width = (width) ? width : 0;
    this.height = (height) ? height : 0;
    this.id = TimeSeriesGraph.id;
    TimeSeriesGraph.id++;
    this.svg = document.createElementNS(d3.namespaces.svg, "svg");
    this.zoom = d3.zoom().on("zoom", this.zoomData.bind(this));
    this.mouseMove;

    this.content = d3.select(this.svg)
        .attr("viewBox", "0 0 " + this.width + " " + this.height)
        .append("g")
        //.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.clip = d3.select(this.svg)
        .append("clipPath")
        .attr("id", "_tsg" + this.id)
        .append("rect")
        .attr("width", this.getContentWidth())
        .attr("height", this.getContentHeight());

    this.eventRect = d3.select(this.svg)
        .style("pointer-events", "all")
        .append("rect")
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
        .attr("width", this.getContentWidth())
        .attr("height", this.getContentHeight());

    this.line = d3.line()
        .x(function(d) { return this.zoomedXScale(0); })
        .y(function(d) { return this.zoomedYScale(0); });

    this.xScale = d3.scaleTime().range([0, this.getContentWidth()]);
    this.yScale = d3.scaleLinear().range([this.getContentHeight(), 0]);

    this.zoomedXScale = this.xScale;
    this.zoomedYScale = this.yScale;

    this.xTickCount;
    this.yTickCount;

    this.yAxis = this.content.append("g");
    this.yAxisLabel = this.content.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - this.margin.left)
        .attr("x", 0 - this.getContentHeight() / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle");

    this.xAxis = this.content.append("g")
        .attr("transform", "translate(0," + this.getContentHeight() + ")");
    this.xAxisLabel = this.content.append("text")
        .attr("transform", "translate(" +
            (this.getContentWidth() / 2) + "," +
            (this.getContentHeight() + this.margin.top + 20) + ")")
        .style("text-anchor", "middle");

    this.paths = [];
    this.pathIdArray = [];

    //d3.select(this.svg).call(this.zoom);
}

TimeSeriesGraph.id = 0;

TimeSeriesGraph.prototype.zoomData = function() {
    this.zoomedXScale = d3.event.transform.rescaleX(this.xScale);
    this.zoomedYScale = this.yScale;
    //this.zoomedYScale.domain(this.yScale.domain());
    //this.zoomedYScale = d3.event.transform.rescaleY(this.yScale);
    this.draw(0);
    if (this.mouseMove) {
        this.mouseMove();
    }
};

TimeSeriesGraph.prototype.resetZoom = function() {
    this.zoomedXScale = this.xScale;
    this.zoomedYScale = this.yScale;
    this.draw(1000);
};

TimeSeriesGraph.prototype.draw = function(delay) {
    for (var i = 0; i < this.paths.length; i++) {
        this.paths[i].transition().duration(delay)
            .attr("d", this.line(this.paths[i].datum()));
    }

    if (this.xTickCount)
        this.xAxis.transition().duration(delay)
            .call(d3.axisBottom(this.zoomedXScale).ticks(this.xTickCount));
    else
        this.xAxis.transition().duration(delay)
            .call(d3.axisBottom(this.zoomedXScale));
    if (this.yTickCount)
        this.yAxis.transition().duration(delay)
            .call(d3.axisLeft(this.zoomedYScale).ticks(this.yTickCount));
    else
        this.yAxis.transition().duration(delay)
            .call(d3.axisLeft(this.zoomedYScale));
    //this.xAxis.call(d3.axisBottom(this.xScale));
    //this.yAxis.call(d3.axisLeft(this.yScale));
};

TimeSeriesGraph.prototype.setPath = function(id, data) {
    var index = this.pathIdArray.indexOf(id);
    if (index !== -1) {
        this.paths[index].datum(data);
    } else {
        this.paths.push(this.content.append("path")
            .attr("clip-path", "url(#_tsg" + this.id  + ")")
            .attr("class", "line")
            .style("stroke", "hsl(" + (Math.random() * 361 >> 0) + ",100%," + (30 + (Math.random() * 15 >> 0)) + "%)")
            .datum(data));
        this.pathIdArray.push(id);
    }
};

TimeSeriesGraph.prototype.setColor = function(id, color) {
    var index = this.pathIdArray.indexOf(id);
    if (index !== -1) {
        this.paths[index].style("stroke", color)
    }
}

TimeSeriesGraph.prototype.removePath = function(id) {
    var index = this.pathIdArray.indexOf(id);
    if (index !== -1) {
        this.paths[index].remove();
        this.paths.splice(index, 1);
        this.pathIdArray.splice(index, 1);
    }
};

TimeSeriesGraph.prototype.data = function() {
    var data = [];
    for (var i = 0; i < this.paths.length; i++) {
        data.push(this.paths[i].datum());
    }
    return data;
}

TimeSeriesGraph.prototype.lineGen = function(xDataFunc, yDataFunc) {
    var context = this;
    this.line = d3.line()
        .x(function(d) { return context.zoomedXScale(xDataFunc(d)); })
        .y(function(d) { return context.zoomedYScale(yDataFunc(d)); });
};

TimeSeriesGraph.prototype.getNode = function() {
    return d3.select(this.svg).node();
};

TimeSeriesGraph.prototype.getContentWidth = function() {
    return this.width - this.margin.left - this.margin.right;
};

TimeSeriesGraph.prototype.getContentHeight = function() {
    return this.height - this.margin.top - this.margin.bottom;
};

TimeSeriesGraph.prototype.setXDomain = function(domain, useNice) {
    if (!domain)
        return;
    if (useNice)
        this.xScale.domain(domain).nice();
    else
        this.xScale.domain(domain);
};

TimeSeriesGraph.prototype.setYDomain = function(domain, useNice) {
    if (!domain)
        return;
    if (useNice)
        this.yScale.domain(domain).nice();
    else
        this.yScale.domain(domain);
};

TimeSeriesGraph.prototype.setXLabel = function(val) {
    this.xAxisLabel.text(val);
};

TimeSeriesGraph.prototype.setYLabel = function(val) {
    this.yAxisLabel.text(val);
};

TimeSeriesGraph.prototype.setXTicks = function(tickCount) {
    this.xTickCount = tickCount;
};

TimeSeriesGraph.prototype.setYTicks = function(tickCount) {
    this.yTickCount = tickCount;
}

TimeSeriesGraph.prototype.setAxisClass = function(c) {
    this.xAxis.attr("class", c);
    this.yAxis.attr("class", c);
};

TimeSeriesGraph.prototype.setEventFunction = function(type, handler) {
    if (type === "mousemove") {
        this.mouseMove = handler.bind(this);
    }
    d3.select(this.svg).on(type, handler.bind(this));
};

TimeSeriesGraph.prototype.getMax = function(dataFunc) {
    var data = this.data();
    if (data.length === 0)
        return null;
    var result = d3.max(data[0], dataFunc);
    for (var i = 1; i < data.length; i++) {
        var max = d3.max(data[i], dataFunc);
        if (result < max) {
            result = max;
        }
    }
    return result;
};

TimeSeriesGraph.prototype.getMin = function(dataFunc) {
    var data = this.data();
    if (data.length === 0)
        return null;
    var result = d3.max(data[0], dataFunc);
    for (var i = 1; i < data.length; i++) {
        var min = d3.min(data[i], dataFunc);
        if (result > min) {
            result = min;
        }
    }
    return result;
};

TimeSeriesGraph.prototype.getExtent = function(dataFunc) {
    var data = this.data();
    if (data.length === 0)
        return null;
    var result = d3.extent(data[0], dataFunc);
    for (var i = 1; i < data.length; i++) {
        var extent = d3.extent(data[i], dataFunc);
        if (result[0] > extent[0]) {
            result[0] = extent[0];
        }
        if (result[1] < extent[1]) {
            result[1] = extent[1];
        }
    }
    return result;
};
