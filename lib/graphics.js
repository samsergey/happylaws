function Graphics(viewport, opts)
{
    var defaults = {
	margin    : {left : 60, right : 15, top : 30, bottom : 60}, 
	xRange    : 'automatic',
	yRange    : 'automatic',
	xAxisType : 'linear',
	yAxisType : 'linear',
	xAxis     : true,
	yAxis     : true,
	'class'   : 'graphics'
    }
    this.options = Object.assign(defaults,opts || {})

    this.viewport = viewport.append('g').attr('class',this.options['class'])
    this.paper = this.viewport.append('g').attr('class','paper')

    this.viewportWidth = viewport.attr('width');
    this.viewportHeight = viewport.attr('height');
    
    this.width = this.viewportWidth - this.options.margin.left - this.options.margin.right
    this.height = this.viewportHeight - this.options.margin.top - this.options.margin.bottom    
    this.paper.attr('width',this.width)
	.attr('height',this.height)
	.attr('transform','translate('+this.options.margin.left+','+this.options.margin.top+')')
    
    this.xRange = function (x) {
	this.options.xRange = x || this.options.xRange
	this.X = this.X.domain(this.options.xRange)
	return x && this || this.options.xRange
    }

    this.xAxisType = function (x) {
	this.options.xAxisType = x || this.options.xAxisType
	this.logX = (x == 'log')
	this.X = this.logX ? d3.scaleLog() : d3.scaleLinear()
	this.X = this.X.domain(this.options.xRange).range([0,this.width])
	return x && this || this.options.xAxisType
    }

    this.yRange = function (x) {
	this.options.yRange = x || this.options.yRange
	this.Y = this.Y.domain(this.options.yRange)
	return x && this || this.options.yRange
    }

    this.yAxisType = function (x) {
	this.options.yAxisType = x || this.options.yAxisType
	this.logY = (x == 'log')
	this.Y = this.logY ? d3.scaleLog() : d3.scaleLinear()
	this.Y = this.Y.domain(this.options.yRange).range([this.height,0])
	return x && this || this.options.yAxisType
    }

    this.X = d3.scaleLinear().range([0,this.width])
    this.Y = d3.scaleLinear().range([this.height,0])

    this.logX = false
    this.logY = false
    
    this.rescale = function()
    {
	this.width = this.viewportWidth - this.options.margin.left - this.options.margin.right
	this.height = this.viewportHeight - this.options.margin.top - this.options.margin.bottom    
	this.paper.attr('width',this.width)
	    .attr('height',this.height)
	    .attr('transform','translate('+this.options.margin.left+','+this.options.margin.top+')')
	
	this.X = this.X.domain(this.options.xRange).range([0,this.width])
	this.Y = this.Y.domain(this.options.yRange).range([this.height,0])	
    }

    this.clean = function()
    {
	viewport.selectAll('.'+this.options['class']).remove();
	return this
    }
    
}

var fmt = {
    'normal' : null,
    'percent' : d3.format("." + Math.max(0, d3.precisionFixed(0.05) - 2) + "%")
}

Graphics.prototype.axes = function (opts)
{
    var defaults = {
	xTicks : 10,
	yTicks : 10,
	xLabel : "x",
	yLabel : "y",
	xTickFormat : null,
	yTickFormat : null,
	'class'     : null
    }
    var options = Object.assign(defaults, opts || {})    

    this.options.margin.bottom
    this.rescale()
    
    var xAxisPositionX = this.options.margin.left
    var xAxisPositionY = this.viewportHeight - this.options.margin.bottom+1
    var yAxisPositionX = this.options.margin.left-1
    var yAxisPositionY = this.options.margin.top
    var xAxisLabelPositionX = this.options.margin.left + this.width / 2
    var xAxisLabelPositionY = this.viewportHeight - this.options.margin.bottom / 3
    var yAxisLabelPositionX = this.options.margin.left / 3
    var yAxisLabelPositionY = this.options.margin.top + this.height / 2 

    var g = this.viewport.append('g').attr('class','axis')

    this.xAxis = d3.axisBottom()
	.scale(this.X)
	.tickFormat(options.xTickFormat)
	.ticks(options.xTicks)
    g.append("g").attr('class','x')
	.call(this.xAxis)
	.attr("transform", 'translate(' + xAxisPositionX + ',' + xAxisPositionY +')')

    g.append('g').attr('class','label')
	.attr("transform", 'translate(' + xAxisLabelPositionX + ',' + xAxisLabelPositionY + ')')
	.append("text").attr('class',options['class'])
	.attr('dx',-options.xLabel.length*4)
	.text(options.xLabel)

    this.yAxis = d3.axisLeft()
	.scale(this.Y)
	.tickFormat(options.yTickFormat)
	.ticks(options.yTicks)
    g.append("g").attr('class','y')
	.call(this.yAxis)
	.attr("transform", 'translate('+yAxisPositionX+','+yAxisPositionY+')');

    g.append('g').attr('class','label')
	.attr("transform", 'translate(' + yAxisLabelPositionX + ',' + yAxisLabelPositionY + ')')
	.append("text").attr('class',options['class'])
	.attr('dx',-options.yLabel.length*4)
	.attr('transform','rotate(-90)')
	.text(options.yLabel)

    return this
}

Graphics.prototype.label = function (txt,opts)
{
    var defaults = {
	at       : [0.5*(this.xRange()[0]+this.xRange()[1]),0.5*(this.yRange()[0]+this.yRange()[1])],
	angle    : 0,
	text     : txt || "label",
	'class'  : null,
	'parent' : null
        }

    var options = Object.assign(defaults, opts || {})    

    var parent = options.parent && d3.select(options.parent) || this.paper
    var g = parent.append('g').attr('class','label')
	.attr('transform','translate('+this.X(options.at[0])+','+this.Y(options.at[1])+')')

    g.append('text').attr('class',options['class'])
	.text(options.text)
	.attr('transform','rotate(-'+options.angle+')')

    return this

}


Graphics.prototype.listPlot = function (d, opts)
{
    var defaults = {
	'class' : null,
	'points' : true,
	'joined' : false,
	'filled' : false,
	'needles' : false,
	'pointsize' : 2,
	'parent' : null
    }

    var options = Object.assign(defaults, opts || {})

    var data = d
    
    if (typeof data[0] == 'number')
	data = d3.zip(d3.range(1,data.length+1),data)
	    
    if (this.xRange() == 'automatic')
	this.xRange(d3.extent(data, d => d[0]))
    if (this.yRange() == 'automatic')
	this.yRange(d3.extent(data, d => d[1]))

    var parent = options.parent && d3.select(options.parent) || this.paper
    var g = parent.append('g').attr('class','listPlot')
    g = g.append('g').attr('class',options['class'])

    if (options.filled)
    {
	var area = d3.area().x(d=>this.X(d[0])).y0(this.height).y1(d => this.Y(d[1]))
	g.append('path').attr('class','area')
	    .attr('stroke', 'none')
	    .attr('d', area(data));
    }

    if (options.needles)
    {
	var needles = g.append('g').attr('class','needles')
	needles.selectAll('line')
	    .data(data)
	    .enter()
	    .append('line')
	    .attr('x1', d => this.X(d[0]))
	    .attr('y1', d => this.logY ? this.height : this.Y(0))
	    .attr('x2', d => this.X(d[0]))
	    .attr('y2', d => this.Y(d[1]))
    }
    
    if (options.joined)
    {
	var line = d3.line().x(d=>this.X(d[0])).y(d => this.Y(d[1]))
	g.append('path').attr('class','line')
	    .attr('fill', 'none')
	    .attr('d', line(data));
    }

    if (options.points)
    {
	var dots = g.append('g').attr('class','points')
	dots.selectAll('circle')
	    .data(data)
	    .enter()
	    .append('circle')
	    .attr('cx', d => this.X(d[0]))
	    .attr('cy', d => this.Y(d[1]))
	    .attr('r', options.pointsize)
    }


    return this
}

Graphics.prototype.plot = function (f, opts)
{
    var defaults = {
	'class' : 'plot',
	'points' : false,
	'joined' : true,
	'filled' : false,
	'pointsize' : 3,
	'parent' : null
    }
    var options = Object.assign(defaults, opts || {})

    var data = []

    for(var i=0; i<this.width; i++)
	data.push([this.X.invert(i),f(this.X.invert(i))])

    return this.listPlot(data,options)
}

Graphics.prototype.diffListPlot = function(dataA, dataB, opts)
{
    var defaults = {
	'class' : null,
	'points' : false,
	'joined' : true,
	'filled' : true,
	'pointsize' : 3,
	'parent' : null
    }
    var options = Object.assign(defaults, opts || {})
    var A = dataA, B = dataB
    
    if (typeof A[0] == 'number')
	A = d3.zip(d3.range(1,A.length+1),A)
    if (typeof B[0] == 'number')
	B = d3.zip(d3.range(1,B.length+1),B)

    if (this.xRange() == 'automatic')
	this.xRange(d3.extent(d3.extent(A,x => x[0]).concat(d3.extent(B,x => x[0]))))
    if (this.yRange() == 'automatic')
	this.yRange(d3.extent(d3.extent(A,x => x[1]).concat(d3.extent(B,x => x[1]))))

    var mkarea = (ref) => d3.area()
	.x(d=>this.X(d[0])).y0(ref).y1(d=>this.Y(d[1]))
    
    var parent = options.parent && d3.select(options.parent) || this.paper
    var g = parent.append('g').attr('class','diffListPlot')
    g = g.append('g').attr('class',options['class'])

    if (options.filled)
    {
	parent.append('clipPath')
	    .attr("id","above")
	    .append("path")
	    .attr("d", mkarea(this.viewportHeight)(B));
	g.append("path").attr('class','areaBelow')
	    .attr("clip-path", "url(#above)")
	    .attr("d", mkarea(-this.options.margin.top)(A));
	
	parent.append("clipPath")
	    .attr("id","below")
	    .append("path")
	    .attr("d", mkarea(this.viewportHeight)(A));
	g.append("path").attr('class','areaAbove')
	    .attr("clip-path", "url(#below)")
	    .attr("d", mkarea(-this.options.margin.top)(B));
    }

    this.listPlot(A, {'class':'A',
		      'points' : options.points,
		      'joined' : options.joined,
		      'parent' : '.'+options['class'] || '.diffListPlot'})
    this.listPlot(B, {'class':'B',
		      'points' : options.points,
		      'joined' : options.joined,
		      'parent' : '.'+options['class'] || '.diffListPlot'})
    
    return this
}

Graphics.prototype.gridLines = function (opts)
{
    var defaults = {
	'x'      : null,
	'y'      : null,
	'class'  : null,
	'parent' : null
        }

    var options = Object.assign(defaults, opts || {})    

    var parent = options.parent && d3.select(options.parent) || this.paper
    var g = parent.append('g').attr('class','gridLines')

    if (options.x)
    {
	var dots = g.append('g').attr('class','x')
	dots.selectAll('line')
	    .data(options.x)
	    .enter()
	    .append('line')
	    .attr('x1', this.X)
	    .attr('y1', 0)
	    .attr('x2', this.X)
	    .attr('y2', this.height)
    }
    if (options.y)
    {
	var dots = g.append('g').attr('class','y')
	dots.selectAll('line')
	    .data(options.y)
	    .enter()
	    .append('line')
	    .attr('x1', 0)
	    .attr('y1', this.Y)
	    .attr('x2', this.width)
	    .attr('y2', this.Y)
    }
    return this
}


Graphics.prototype.histogram = function(hist, opts)
{
    var defaults = {
	'type'   : 'value',
	'class'  : null,
	'parent' : null,
	'barWidth' : 0.9
        }

    var options = Object.assign(defaults, opts || {})
    var parent = options.parent && d3.select(options.parent) || this.paper
    var g = parent.append('g').attr('class','histogram')

    var value = {
	'pdf' : x => hist.pdf(x),
	'cdf' : x => hist.cdf(x),
	'value' : x => hist.data[x]
    }[options.type]

    
    if (this.xRange() == 'automatic')
    {
	if (this.logX)
	    this.xRange([Math.max(hist.minBin,hist.step), hist.maxBin])
	else
	    this.xRange([hist.minBin, hist.maxBin])
    }
    if (this.yRange() == 'automatic')
	this.yRange([this.logY ? value(hist.antimode) : 0,
		     options.type == 'cdf' ? 1 : value(hist.mode)])
	
    var data = []

    var bw = options.barWidth * (this.logX ? 1 : this.X(hist.step)-this.X(0))

    for(var b in hist.data)
	if (!(this.logX && (b <= 0)))
	    data.push({'bin' : b, 'value' : value(b)})
	    
    g.selectAll("bar")
	.data(data)
	.enter().append("rect")
	.attr("x", d => this.X(d.bin))
	.attr("width", bw)
	.attr("y", d => Math.min(this.Y(this.logY ? 1 : 0),this.Y(d.value)))
	.attr("height", d => Math.abs(this.Y(this.logY ? 1 : 0) - this.Y(d.value)))
    
    return this
}
