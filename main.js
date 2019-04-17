var width = 1200,
    height = 800;

d3.csv("colleges.csv", csv => {

    var margin = ({left: 1, right: -1, top: 30, bottom: -1});

    function treemap(data) {
        return d3.treemap().round(true)
            .tile(d3.treemapSliceDice)
            .size([
                width - margin.left - margin.right,
                height - margin.top - margin.bottom
            ])
            (d3.hierarchy(
                {
                    values: d3.nest()
                        .key(d => d.Region)
                        .key(d => d.Locale)
                        .entries(data)
                },
                d => d.values
            ).sum(d => +d.MedianDebt))
            .each(d => {
                d.x0 += margin.left;
                d.x1 += margin.left;
                d.y0 += margin.top;
                d.y1 += margin.top;
            })
    }

    var root = treemap(csv);

    var mosaicPlot = d3.select('#mosaic-plot')
        .append('svg:svg')
        .attr('width', '100%')
        .attr('height', height + 30)
        .style('font', '10px georgia')
        .append('g');

    var node = mosaicPlot.selectAll('g')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

    var column = node.filter(d => d.depth === 1);

    column.append('text')
        .attr('x', 3)
        .attr('y', '-1.7em')
        .style('font-weight', 'bold')
        .text(d => d.data.key);

    column.append('text')
        .attr('x', 3)
        .attr('y', '-0.5em')
        .style('fill-opacity', .7)
        .text(d => d.value.toLocaleString());

    column.append('line')
        .attr('x1', -0.5)
        .attr('x2', -0.5)
        .attr('y1', -30)
        .attr('y2', d => d.y1 - d.y0)
        .attr('stroke', '#000')
    
    var cell = node.filter(d => d.depth === 2);

    cell.append('rect')
        .attr('fill', 'blue')
        .attr('fill-opacity', d => d.value / d.parent.value)
        .attr('width', d => d.x1 - d.x0 - 1)
        .attr('height', d => d.y1 - d.y0 - 1);

    cell.append('text')
        .attr('x', 3)
        .attr('y', '1.1em')
        .text(d => d.data.key);

    cell.append('text')
        .attr('x', 3)
        .attr('y', '2.3em')
        .attr('fill-opacity', .7)
        .text(d => d.value.toLocaleString())

    return mosaicPlot.node();

})