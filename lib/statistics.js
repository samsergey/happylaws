function Histogram(s)
{
    this.step = s || 1
    this.data = {}
    this.bins = []
    this.total = 0
    this.number = 0
    this.mode = undefined
    this.antimode = undefined
    this.minBin = 1/0
    this.maxBin = -1/0
    this.minValue = 1/0
    this.maxValue = 0

    this.fromList = function (lst)
    {
	lst.forEach(x => this.add(x))
	return this
    }
    
    this.add = function (x,n)
    {
	var n = n || 1

	var bin
	if (this.step == 'none')
	    bin = x
	else
	    bin = Math.floor(x/this.step)*this.step
	this.bins = this.bins.add(bin)
	this.total += bin
	this.number += n
	this.data[bin] = this.data[bin] + n || n
	this.maxBin = Math.max(this.maxBin,bin)
	this.minBin = Math.min(this.minBin,bin)
	this.maxValue = Math.max(this.maxValue,this.data[bin])
	this.minValue = Math.min(this.minValue,this.data[bin])
	if (this.mode == undefined) this.mode = bin
	if (this.data[this.mode] < this.data[bin])
	    this.mode = bin
	if (this.antimode == undefined) this.antimode = bin
	if (this.data[this.antimode] > this.data[bin])
	    this.antimode = bin
	return this
    }
       
    this.pdf = function(x)
    {
	var bin
	if (this.step == 'none')
	    bin = x
	else
	    bin = Math.floor(x/this.step)*this.step
	return this.data[bin]/this.number/this.step
    }

    this.cdf = function(x)
    {
	var s = 0
	for(var i = 0; i < this.bins.length; i++)
	{
	    s += this.data[this.bins[i]]
	    if (this.bins[i] > x) break
	}
	return s/this.number
    }
}

Object.defineProperty
(Histogram.prototype, "mean",
 { get : function ()
   {
       return this.total/this.number
   }
 }
)

Object.defineProperty
(Histogram.prototype, "median",
 { get : function ()
   {
       var s = 0
       for(var i = 0; i < this.bins.length; i++)
       {
	   s += this.data[this.bins[i]]
	   if (s >= this.number / 2) return this.bins[i] 
       }
   }
 }
)


Object.defineProperty
(Histogram.prototype,
 "variance",
 { get : function ()
   {
	var res = 0, m = this.mean
	for(var b in this.data)
	    res += (b - m)*(b - m)*this.data[b]
	return res/this.number
   }
 }
)

Object.defineProperty
(Histogram.prototype,
 "stdev",
 { get : function ()
   {
	return Math.sqrt(this.variance) 
   }
 }
)

Object.defineProperty
(Histogram.prototype,
 "LorenzCurve",
 { get : function ()
   {
       var res = [[0,0]], x = 0, y = 0
       this.bins.forEach(b => res.push([x+=this.data[b],y+=this.data[b]*b]))
       return res.map(r => [r[0]/x,r[1]/y])
   }
 }
)

Histogram.prototype.approximateNormal = function ()
{
    return Normal(this.mean,this.stdev)
}

Histogram.prototype.approximateGamma = function ()
{
    var s1 = 0
    for(var b in this.data)
	if (b > 0)
	    s1 += Math.log(b)*this.data[b]  
    var s = Math.log(this.mean) - s1/this.number,
	a = (3 - s + Math.sqrt((s-3)*(s-3)+24*s))/(12*s),
	b = a/this.mean
    return Gamma(a, b)
}

Histogram.prototype.approximateExponential = function ()
{
    return Exponential(1/this.mean)
}


function gamma(x) {
    var p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];
 
    var g = 7;
    if (x < 0.5) {
        return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
    }
 
    x -= 1;
    var a = p[0];
    var t = x + g + 0.5;
    for (var i = 1; i < p.length; i++) {
        a += p[i] / (x + i);
    }
 
    return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}

Array.prototype.foldList = function(f,x0)
{
    var res = [], s = x0 || this[0]
    res.push(s)
    this.forEach(x => res.push(s=f(s,x)))
    return res
}

Array.prototype.accumsum = function (x0)
{
    return this.foldList((x,y)=>x+y,x0);
}

Array.prototype.ema = function (a)
{
    return this.foldList((x,y)=>x*(1-a)+a*y);
}

function Gamma(a,b)
{
    var res = {
	parameters : {
	    alpha : a || 1,
	    beta  : b || 1
	}}
    res.pdf = function (x)
    {
	if (x <= 0) return 0
	return Math.pow(b,a)/gamma(a)*Math.pow(x,a-1)*Math.exp(-b*x)
    }
    res.cdf = function (x)
    {
	return integrate(this.pdf,[0,x])
    }    
    res.support   = [0,Infinity]
    res.mean      = a / b
    res.median    = res.mean*(3*a-0.8)/(3*a+0.2)
    res.variance  = a / Math.pow(b,2)
    res.stdev     = Math.sqrt(res.variance)	
    res.mode      = a >= 1 ? (a - 1)/b : 0
    res.skewness  = 2/Math.sqrt(a)
    res.curtosis  = 6/a
    res.generator = gammaGen(a,b)
    return res
}

function gammaGen(a,b)
{
    return function ()
    {
	// Gamma(alpha,lambda) generator using Marsaglia and Tsang method
	// Algorithm 4.33
	var randn = d3.randomNormal(0,1), rand = Math.random
	if (a>1)
	{
	    var d=a-1/3,
		c=1/Math.sqrt(9*d),
		flag = true,
		Z,V,U
	    while (flag)
	    {
		Z = randn()
		if (Z>-1/c)
		{
		    V=Math.pow(1 + c*Z, 3)
		    U=rand()
		    flag = Math.log(U) > (Z*Z/2 + d - d*V + d*Math.log(V))
		}
	    }
	    return d*V/b;
	}
	else
	{
	    return gammaGen(a+1,b)()*Math.pow(Math.random(),1/a);
	}
    }
}


function Exponential(l)
{
    var res = {
	parameters : {
	    lambda : l || 1
	}
    }
    res.pdf      = x => l*Math.exp(-x*l)
    res.cdf      = x => 1 - Math.exp(-l*x)
    res.support  = [0,Infinity]
    res.mean     = 1/l
    res.median   = Math.log(2)/l
    res.variance = 1/l/l
    res.stdev    = 1/l
    res.mode     = 0
    res.skewness = 2
    res.curtosis = 6
    res.generator = () => -Math.log(Math.random())/l
    return res
}

function Normal(m,s)
{
    var res = {
	parameters : {
	    mu : m || 0,
	    sigma  : s || 1
	}
    }	
    res.pdf = function (x)
    {
	var v = s*s
	return Math.sqrt(0.5/Math.PI/v)*Math.exp(-(x-m)*(x-m)/(2*v))
    }
    res.cdf       = x => 1/2*(1 + erf((x-m)/(s*Math.sqrt(2))))
    res.support   = [-Infinity,Infinity]
    res.mean      = m  
    res.median    = m 
    res.variance  = s*s 
    res.stdev     = s 
    res.mode      = m 
    res.skewness  = 0
    res.curtosis  = 0
    res.generator = d3.randomNormal(m,s)
}

function erf(x){
    // erf(x) = 2/sqrt(pi) * integrate(from=0, to=x, e^-(t^2) ) dt
    // with using Taylor expansion,
    // = 2/sqrt(pi) * sigma(n=0 to +inf, ((-1)^n * x^(2n+1))/(n! * (2n+1)))
    // calculationg n=0 to 50 bellow (note that inside sigma equals x when n = 0, and 50 may be enough)
    var m = 1.00;
    var s = 1.00;
    var sum = x * 1.0;
    for(var i = 1; i < 50; i++){
	m *= i;
	s *= -1;
	sum += (s * Math.pow(x, 2.0 * i + 1.0)) / (m * (2.0 * i + 1.0));
    }
    return 2 * sum / Math.sqrt(Math.PI);
}

Array.prototype.add = function (x)
{
    var n = this.length
    if (n == 0) {
	this.push(x)
	return this
    }
    var res = [],y
    for(var i = 0; i < n; i++)
    {
	y = this.shift()
	if (y == x)
	{
	    res.push(y)
	    break
	}
	if (y > x)
	{
	    res.push(x)
	    res.push(y)
	    break
	}
	res.push(y)
    }
    if (i == n) res.push(x) 
    return res.concat(this)
}

function PoissonProcess(l)
{
    var g = Exponential(l).generator
    var T = g()
    return () => {
	if (T > 0)
	{
	    T--
	    return 0
	}
	else
	{
	    T = g()
	    return 1
	}
    }
}

Array.prototype.differences = function (dx)
{
    var res = []
    for(var i = dx;i < this.length; i++)
	res.push(this[i]-this[i-dx])
    return res
}

Array.prototype.positions = function (p)
{
    var res = []
    for(var i = 0;i < this.length; i++)
	if (p(this[i])) res.push(i)
    return res
}

Array.prototype.zipWith = function(lst,f)
{
    var res = []
    for(var i = 0; i < this.length; i++)
	res.push(f(this[i], lst[i]))
    return res
}
