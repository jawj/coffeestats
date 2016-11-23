lifeExpDataTSV = '''Country	LifeExp	People.per.TV	People.per.Dr	LifeExp.Male	LifeExp.Female
Argentina	70.5	4	370	74	67
Bangladesh	53.5	315	6166	53	54
Brazil	65	4	684	68	62
Canada	76.5	1.7	449	80	73
China	70	8	643	72	68
Colombia	71	5.6	1551	74	68
Egypt	60.5	15	616	61	60
Ethiopia	51.5	503	36660	53	50
France	78	2.6	403	82	74
Germany	76	2.6	346	79	73
India	57.5	44	2471	58	57
Indonesia	61	24	7427	63	59
Iran	64.5	23	2992	65	64
Italy	78.5	3.8	233	82	75
Japan	79	1.8	609	82	76
Kenya	61	96	7615	63	59
Korea.North	70	90	370	73	67
Korea.South	70	4.9	1066	73	67
Mexico	72	6.6	600	76	68
Morocco	64.5	21	4873	66	63
Burma	54.5	592	3485	56	53
Pakistan	56.5	73	2364	57	56
Peru	64.5	14	1016	67	62
Philippines	64.5	8.8	1062	67	62
Poland	73	3.9	480	77	69
Romania	72	6	559	75	69
Russia	69	3.2	259	74	64
South.Africa	64	11	1340	67	61
Spain	78.5	2.6	275	82	75
Sudan	53	23	12550	54	52
Taiwan	75	3.2	965	78	72
Tanzania	52.5		25229	55	50
Thailand	68.5	11	4883	71	66
Turkey	70	5	1189	72	68
Ukraine	70.5	3	226	75	66
UK	76	3	611	79	73
USA	75.5	1.3	404	79	72
Venezuela	74.5	5.6	576	78	71
Vietnam	65	29	3096	67	63
Zaire	54		23193	56	52'''


CoffeeStats =

  starLevels: [
    [0.001, '***']
    [0.01,  '**']
    [0.05,  '*']
    [0.1,   '+']
  ]
  starLegend: -> ("#{level[1]} p < #{level[0]}" for level in CoffeeStats.starLevels).reverse().join(', ')
  
  identityFunc: (x) -> x
  intFormatFunc: (x) -> x.toString()
  floatFormatFuncFactory: (precision) -> (x) -> x.toPrecision(precision).replace('-', '– ')


class CoffeeStats.Data
  
  constructor: (@dataRows) ->  # arg is an array of arrays: first array is labels row, subsequent are data rows
    @labelRow = @dataRows.shift()
    this.reindexLabels()
  
  labels: -> @labelRow
  rows:   -> @dataRows

  reindexLabels: ->
    @labelIndices = {}
    for i in [0...@labelRow.length]
      @labelIndices[@labelRow[i]] = i
      
  columnWithLabel: (label) ->
    index = @labelIndices[label]
    row[index] for row in @dataRows

  filteredByLabels: (labels) ->
    filterLabelIndices = @labelIndices[label] for label in labels
    newRows = for row in @dataRows
      row[index] for index in filterLabelIndices
    newRows.unshift(labels)
    new CoffeeStats.Data(newRows)
    
  filteredByCompleteRows: ->
    newRows = []
    for row in @dataRows
      anyNull = false
      for cell in row
        if cell == null
          anyNull = true
          break
      newRows.push(row) unless anyNull
    newRows.unshift(@labelRow)
    new CoffeeStats.Data(newRows)
      
  generate: (label, genFunc) ->
    @labelRow.push(label)
    this.reindexLabels()
    for row in @dataRows
      getVarFunc = (label) => row[@labelIndices[label]]
      row.push(genFunc(getVarFunc))
    this  # for chaining


CoffeeStats.Data.Parser =

  split: (string, rowSep, colSep, missingValue) -> 
    data = for row in string.split(rowSep)
      for cell in row.split(colSep)
        if cell == '' || cell == missingValue then null 
        else if /^-?[0-9]+([.][0-9]+)?(e[0-9]+)?$/.test(cell) then parseFloat(cell) 
        else cell  
    new CoffeeStats.Data(data)

  splitCSV: (string, missingValue) ->
    CoffeeStats.Data.Parser.split(string, /\r\n|\r|\n/, ",", missingValue)

  splitTSV: (string, missingValue) ->
    CoffeeStats.Data.Parser.split(string, /\r\n|\r|\n/, "\t", missingValue)


CoffeeStats.Distributions =
  
  logGamma: (z) -> (z - 0.5) * Math.log(z + 4.5) - (z + 4.5) + Math.log((1 + 76.18009173 / z - 86.50532033 / (z + 1) + 24.01409822 / (z + 2) - 1.231739516 / (z + 3) + 0.00120858003 / (z + 4) - 0.00000536382 / (z + 5)) * 2.50662827465)

  betInc: (x, a, b) ->
    a0 = m9 = a2 = 0
    b0 = a1 = b1 = 1
    while Math.abs((a1 - a2) / a1) > 0.00001
      a2 = a1 
      c9 = - (a + m9) * (a + b + m9) * x / (a + 2 * m9) / (a + 2 * m9 + 1)
      a0 = a1 + c9 * a0
      b0 = b1 + c9 * b0
      m9 = m9 + 1
      c9 = m9 * (b - m9) * x / (a + 2 * m9 - 1) / (a + 2 * m9)
      a1 = a0 + c9 * a1
      b1 = b0 + c9 * b1
      a0 = a0 / b1
      b0 = b0 / b1
      a1 = a1 / b1
      b1 = 1
    a1 / a
    
  betaCDF: (z, a, b) ->
    CD = CoffeeStats.Distributions
    s = a + b
    bt = Math.exp(CD.logGamma(s) - CD.logGamma(b) - CD.logGamma(a) + a * Math.log(z) + b * Math.log(1 - z))
    if z < (a + 1) / (s + 2) then bt * CD.betInc(z, a, b)
    else 1 - bt * CD.betInc(1 - z, b, a)

  minimise: (func, stopBelow, input, step) ->
    bestInput = input
    bestMinimand = func(input)
    stepMul = 1
    for i in [0..1000]  # max iterations
      input += step * stepMul
      minimand = func(input)
      if Math.abs(minimand) < Math.abs(bestMinimand)
        bestMinimand = minimand
        bestInput = input
        break if Math.abs(bestMinimand) < stopBelow
      else if stepMul == 1
        input = bestInput
        stepMul = -1
      else
        input = bestInput
        step *= 0.5
        stepMul = 1
    bestInput

  t: (xv, df, tails) ->  # adapted from http://www.math.ucla.edu/~tom/distributions/tDist.html
    CD = CoffeeStats.Distributions
    a = df / 2
    s = a + 0.5
    z = df / (df + xv * xv);
    bt = Math.exp(CD.logGamma(s) - CD.logGamma(0.5) - CD.logGamma(a) + a * Math.log(z) + 0.5 * Math.log(1 - z))
    betacdf = if z < (a + 1) / (s + 2) then bt * CD.betInc(z, a, 0.5) else 1 - bt * CD.betInc(1 - z, 0.5, a)
    tails * betacdf / 2
    
  tInv: (p, df, tails) ->  # adapted from http://www.math.ucla.edu/~tom/distributions/Fcdf.html
    CD = CoffeeStats.Distributions
    CD.minimise(((input) -> p - CD.t(input, df, tails)), 0.00001, -2, 1)
    
  f: (x, dfNum, dfDen) ->
    CD = CoffeeStats.Distributions
    if x <= 0 then 0 else CD.betaCDF(x / (x + dfDen / dfNum), dfNum / 2, dfDen / 2)


class CoffeeStats.ColumnarTable

  constructor: (@className, @defaultCellFormatFunc) ->
    @defaultCellFormatFunc ||= (x) -> x.toString()
    @cols = []
    @maxRows = 0

  column: (heading, cells, cellFormatFunc) ->
    cellFormatFunc ||= @defaultCellFormatFunc
    @cols.push([heading].concat(cellFormatFunc(cell) for cell in cells))
    @maxRows = Math.max(@maxRows, cells.length)
    this  # for chaining 

  render: ->
    $.HTML.table({className: "columnarTable #{@className}"}, (t) =>
      t.tr((r) => r.th(col[0]) for col in @cols)
      for row in [1..@maxRows]
        t.tr((r) => r.td(col[row]) for col in @cols) 
    )

 
class CoffeeStats.RowTable

  constructor: (@className, @defaultCellFormatFunc) ->
    @defaultCellFormatFunc ||= (x) -> x.toString()
    @rows = []

  row: (heading, cells, cellFormatFunc) ->
    cellFormatFunc ||= @defaultCellFormatFunc
    @rows.push([heading].concat(cellFormatFunc(cell) for cell in cells))
    this  # for chaining

  render: ->
    $.HTML.table({className: "rowTable #{@className}"}, (t) =>
      for row in @rows
        t.tr((r) =>
          r.th(row[0])
          r.td(row[i]) for i in [1..row.length]
        )
    )


class CoffeeStats.Covariance

  constructor: (data, @labels) ->
    covData = data.filteredByLabels(@labels)
    X = $M(covData.rows())
    J = X.map(-> 1)
    MeanRow = $M(J.transpose().x(X).x(1 / X.rows()).row(1))
    NOnes = $M([X.col(1).map(-> 1).elements])
    Means = MeanRow.x(NOnes).transpose()
    XDemeaned = X.subtract(Means)
    @VCV = XDemeaned.transpose().x(XDemeaned).x(1 / (X.rows() - 1))
    @Variance = @VCV.diagonal()
    InvStdDevDiag = @Variance.map((x) -> Math.sqrt(x)).toDiagonalMatrix().inverse()
    @Cor = InvStdDevDiag.x(@VCV).x(InvStdDevDiag)
    
  correlationTable: ->
    t = new CoffeeStats.RowTable('correlations', CoffeeStats.floatFormatFuncFactory(3))
      .row('', @labels, CoffeeStats.identityFunc)
    for row in [1..@Cor.rows()]
      t.row(@labels[row - 1], @Cor.row(row).elements[0...row])
    t
    

class CoffeeStats.OLS
  
  constructor: (data, @dependentLabel, independentLabels, opts) ->
      
    opts ||= {}
    opts.ci ||= 0.95
    opts.constantLabel ||= 'constant'
    CD = CoffeeStats.Distributions
    @errors = []
  
    @independentLabels = x for x in independentLabels  # clone this to avoid rude argument-modification
    olsData = data.filteredByLabels(@independentLabels.concat(@dependentLabel))
                  .filteredByCompleteRows()
    Y = $M(olsData.filteredByLabels([@dependentLabel]).rows())
                  
    unless opts.noConstant
      olsData.generate(opts.constantLabel, -> 1) 
      @independentLabels.push(opts.constantLabel)
    
    X = $M(olsData.filteredByLabels(@independentLabels).rows())
    
    colinears = X.cols() - X.rank()
    if colinears > 0
      @errors.push('Non-singular matrix')
      return    

    @n = X.rows()
    @k = X.cols()
    @dfm = @k - if opts.noConstant then 0 else 1
    @dfe = @n - @k
    @dft = @dfm + @dfe
    Xprime = X.transpose()
    
    @Bhat = (Xprime.x(X)).inverse().x(Xprime.x(Y))  # estimated betas
    @Ehat = Y.subtract(X.x(@Bhat))  # estimated errors/residuals
    @sse = @Ehat.transpose().x(@Ehat).e(1, 1)  # sum of squares: errors/residuals
    @mse = @sse / @dfe  # mean square: error
    @mseSqrt = Math.sqrt(@mse)  # root mean square error

    @VCV = Xprime.x(X).inverse().x(@mse)  # variance-covariance matrix
    @Variance = @VCV.diagonal()
    @SE = @Variance.map((x) -> Math.sqrt(x))  # standard error
    @T = @SE.toDiagonalMatrix().inverse().x(@Bhat)
    @PT = @T.map((x) => CD.t(x, @dfe, 2))
    @PStars = @PT.map((p) ->
      (return level[1] if p < level[0]) for level in CoffeeStats.starLevels
      return ''
    )
    
    ciT = Math.abs(CD.tInv(1 - opts.ci, @dfe, 2))  # t value for confidence intervals, made positive
    ciDeltas = @SE.x(ciT)
    @ciLow = @Bhat.subtract(ciDeltas)
    @ciHigh = @Bhat.add(ciDeltas)
    
    ymean = if opts.noConstant then 0 else Y.col(1).toDiagonalMatrix().trace() / Y.rows()
    Ydemeaned = Y.map((x) -> x - ymean)
    @sst = Ydemeaned.transpose().x(Ydemeaned).e(1, 1)  # sum of squares: total (sum of (Y - Ymean)^2)
    @mst = @sst / @dft  # mean square: total
    @r2 = 1 - @sse / @sst
    @adjr2 = 1 - @mse / @mst

    @ssm = @sst - @sse  # sum of squares: model
    @msm = @ssm / @dfm  # mean square: model
    @f = @msm / @mse
    @pf = 1 - CD.f(@f, @dfm, @dfe)
    
  coeffsTable: ->
    floatFormatFunc = CoffeeStats.floatFormatFuncFactory(3)
    new CoffeeStats.ColumnarTable('resultsTable', floatFormatFunc)
      .column(@dependentLabel, @independentLabels, CoffeeStats.identityFunc)
      .column('β', @Bhat.col(1).elements)
      .column('SE', @SE.elements)
      .column('t', @T.col(1).elements)
      .column('P > |t|', @PT.col(1).elements)
      .column('', @PStars.col(1).elements, CoffeeStats.identityFunc)
      .column('95% CI low', @ciLow.col(1).elements)
      .column('95% CI high', @ciHigh.col(1).elements)
  
  squaresTable: ->
    new CoffeeStats.ColumnarTable('squaresTable', CoffeeStats.floatFormatFuncFactory(7))
     .column('Source', ['Model', 'Residual', 'Total'], CoffeeStats.identityFunc)
     .column('SS', [@ssm, @sse, @sst])
     .column('df', [@dfm, @dfe, @dft], CoffeeStats.intFormatFunc)
     .column('MS', [@msm, @mse, @mst])
  
  infoTable: ->
    new CoffeeStats.RowTable('generalTable', CoffeeStats.floatFormatFuncFactory(3))
      .row('N', [@n], CoffeeStats.intFormatFunc)
      .row("F(#{@dfm}, #{@dfe})", [@f])
      .row('P > F', [@pf])
      .row('R²', [@r2])
      .row('Adj. R²', [@adjr2])
      .row('Root MSE', [@mseSqrt])


lifeExpData = CoffeeStats.Data.Parser.splitTSV(lifeExpDataTSV, 'NA')
lifeExpData.generate('Frenchness', (c) -> if c('Country') == 'France' then 1 else 0)
indepVars = ['People.per.Dr', 'People.per.TV', 'Frenchness']
cov = new CoffeeStats.Covariance(lifeExpData, indepVars)
ols = new CoffeeStats.OLS(lifeExpData, 'LifeExp', indepVars)

onload = -> 
  $('body').insert(cov.correlationTable().render())
  $('body').insert(ols.infoTable().render())
  $('body').insert(ols.squaresTable().render())
  $('body').insert(ols.coeffsTable().render())
  $('body').insert($.HTML.p(CoffeeStats.starLegend()))

