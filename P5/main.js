var width = 1000;
var height = 600;

var pad = {t: 40, r: 40, b: 40, l: 40};


// Create a <div>, then create an <svg> in it and save a reference to the d3 selection of the <svg>.
var svg = d3.select('#main')
  .append('svg')
  .attr('width', width + pad.l + pad.r)
  .attr('height', height + pad.t + pad.b)
  .style('border', '1px solid gray')
  .append("g");


var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal(d3.schemeCategory20.map(fader)),
    format = d3.format(",d");

var treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .round(true)
    .paddingInner(1);

var nest = d3.nest()
    .key(function(d) { return d['Region']; })
    .key(function(d) { return d['Name']; })
    .rollup(function(d) { return d3.sum(d, function(d) { return d['Mean Earnings 8 years After Entry']; }); });

d3.csv("colleges100.csv", function(error, data) {
  if (error) throw error;

  var tool = d3.select("body")
    .append("div")
    .attr("class", "toolTip")
    .style("height", 60 + "px")
    .style("width", 120 + "px");

  data.forEach(function(d) {
          if (d.parent == "null") { d.parent = null};
      });

  var root = d3.hierarchy({values: nest.entries(data)}, function(d) { return d.values; })
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return b.value - a.value; });

  treemap(root);

  var node = d3.select("#main")
      .selectAll(".node")
      .data(root.leaves())
      .enter().append("div")
      .attr("class", "node")
      .style("left", function(d) { return d.x0 + "px"; })
      .style("top", function(d) { return d.y0 + "px"; })
      .style("width", function(d) { return d.x1 - d.x0 + "px"; })
      .style("height", function(d) { return d.y1 - d.y0 + "px"; })
      .style("background", function(d) { while (d.depth > 1) d = d.parent; return color(d.data.key); })
      .on("mousemove", function (d) {
          tool.style("left", d3.event.pageX + 10 + "px")
          tool.style("top", d3.event.pageY - 20 + "px")
          tool.style("display", "inline-block");
          tool.text(d.data.key + ":\n" + format(d.data.value));
          console.log(d);
      }).on("mouseout", function (d) {
          tool.style("display", "none");
      });

  node.append("div")
      .attr("class", "node-label")
      .text(function(d) { return d.data.key + "\n" + d.parent.data.key; });

  node.append("div")
      .attr("class", "node-value")
      .text(function(d) { return format(d.value); });

  var form = d3.select("body")
    .append("div")
      .style("transform", "translateY(650px)")
    .append('form');

  form.append('input')
      .attr('type', 'radio')
      .attr('value', 'Salary')
      .attr('name', 'toggle')
      .attr('checked', 'checked')
      .on('click', function () {
          sortBy(data, node, 'Mean Earnings 8 years After Entry');
      });

  form.append('label')
    .html('Salary');

  form.append('input')
      .attr('type', 'radio')
      .attr('value', 'Admission Rate')
      .attr('name', 'toggle')
      .on('click', function () {
        sortBy(data, node, 'Admission Rate');
      });

  form.append('label')
      .html('Admission Rate');

  form.append('input')
      .attr('type', 'radio')
      .attr('value', 'Average Cost')
      .attr('name', 'toggle')
      .on('click', function () {
        sortBy(data, node, 'Average Cost');
      });

  form.append('label')
      .html('Average Cost');

  form.append('input')
      .attr('type', 'radio')
      .attr('value', 'Median Debt')
      .attr('name', 'toggle')
      .on('click', function () {
        sortBy(data, node, 'Median Debt');
      });

  form.append('label')
      .html('Median Debt');

  var timeout = d3.timeout(function() {
    d3.select("input[value=\"sumByCount\"]")
        .property("checked", true)
        .dispatch("change");
  }, 2000);

  function changed(sum) {
    timeout.stop();

    treemap(root.sum(sum));

    cell.transition()
        .duration(750)
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
      .select("rect")
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; });
  }
});

function sortBy(data, node, sortKey) {
  nest = d3.nest()
      .key(function(d) { return d['Region']; })
      .key(function(d) { return d['Name']; })
      .rollup(function(d) { return d3.sum(d, function(d) { return d[sortKey]; }); });

  root = d3.hierarchy({values: nest.entries(data)}, function(d) { return d.values; })
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return d3.descending(a.value, b.value); });

  treemap(root);

  console.log(root);

  if (sortKey === 'Admission Rate') {
    format = d3.format(",.2%");
  } else {
    format = d3.format(",d");
  }

  node.data(root.leaves())
      .transition()
        .duration(750)
        .style("left", function(d) { return d.x0 + "px"; })
        .style("top", function(d) { return d.y0 + "px"; })
        .style("width", function(d) { return d.x1 - d.x0 + "px"; })
        .style("height", function(d) { return d.y1 - d.y0 + "px"; })
        .style("background", function(d) { while (d.depth > 1) d = d.parent; return color(d.data.key); })
      .select("div.node-value")
        .text(function(d) { return format(d.value); });

  node.data(root.leaves())
      .select("div.node-label")
          .text(function(d) { return d.data.key + "\n" + d.parent.data.key; });
}

function sumByCount(d) {
  return d.children ? 0 : 1;
}

function sumBySize(d) {
  return d.size;
}
