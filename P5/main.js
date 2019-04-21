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
          d3.select('#story-header').select('text').text("Salary");
          d3.select('#pg-story').select('text')
            .text("After analyzing the researched data, the higher mean salaries from college alumni seem to come from the Mid-Atlantic and New England regions, and the lower salaries from the Rocky Mountains and the Outlying Areas. Previous students from the Massachusetts Institute of Technology are leading with an average salary of $125,100, while students from the Pontifical Catholic University of Puerto Rico-Mayaguez are coming out with an average salary of $19,000.");
          });

  form.append('label')
    .html('Salary');

  form.append('input')
      .attr('type', 'radio')
      .attr('value', 'Admission Rate')
      .attr('name', 'toggle')
      .on('click', function () {
        sortBy(data, node, 'Admission Rate');
        d3.select('#story-header').select('text').text("Admission Rate");
        d3.select('#pg-story').select('text')
          .text("Private schools from any region seem to be a lot more selective in terms of admitting students into their schools. One would probably have a difficult time finding the highest or lowest overall admission rates for a certain region, since these types of values seem to spread all over the mosaic chart. The world-renown Stanford University provides a significantly low admission rate of 5.69%, while the public college, CUNY York, gives us a higher admission rate of 35.1%.");
        });

  form.append('label')
      .html('Admission Rate');

  form.append('input')
      .attr('type', 'radio')
      .attr('value', 'Average Cost')
      .attr('name', 'toggle')
      .on('click', function () {
        sortBy(data, node, 'Average Cost');
        d3.select('#story-header').select('text').text("Average Cost");
        d3.select('#pg-story').select('text')
          .text("Along with having remarkably lower admission rates, private schools also take the lead with their costs of attendance. In terms of regions, colleges from the Mid-Atlantic and New England regions seem to have the higher overall costs of attendance. The Great Plains’ very own Washington University in St. Louis leads in expenses with an average cost of $62,594, while the University of Puerto Rico-Bayamon asks their prospective students for a more reasonable payment of $8,509.");
        });

  form.append('label')
      .html('Average Cost');

  form.append('input')
      .attr('type', 'radio')
      .attr('value', 'Median Debt')
      .attr('name', 'toggle')
      .on('click', function () {
        sortBy(data, node, 'Median Debt');
        d3.select('#story-header').select('text').text("Median Debt");
        d3.select('#pg-story').select('text')
          .text("While the period of attending college and getting a degree is enjoyable for some students, accumulating debt with bundles of loans is quite the contrary. Students attending colleges in the Mid-Atlantic and New England regions seem to accumulate the most overall debt while in school. Private college students traditionally have the highest amount of debt, but some of the higher amounts from the researched data are surprisingly from public colleges. Students from Babson College and the College of the Holy Cross are ending up with a median debt of $27,000, while those from University of Puerto Rico-Bayamon have a median debt of $4,500.");
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
