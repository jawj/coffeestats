var CoffeeStats, cov, indepVars, lifeExpData, lifeExpDataTSV, ols, onload;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
lifeExpDataTSV = 'Country	LifeExp	People.per.TV	People.per.Dr	LifeExp.Male	LifeExp.Female\nArgentina	70.5	4	370	74	67\nBangladesh	53.5	315	6166	53	54\nBrazil	65	4	684	68	62\nCanada	76.5	1.7	449	80	73\nChina	70	8	643	72	68\nColombia	71	5.6	1551	74	68\nEgypt	60.5	15	616	61	60\nEthiopia	51.5	503	36660	53	50\nFrance	78	2.6	403	82	74\nGermany	76	2.6	346	79	73\nIndia	57.5	44	2471	58	57\nIndonesia	61	24	7427	63	59\nIran	64.5	23	2992	65	64\nItaly	78.5	3.8	233	82	75\nJapan	79	1.8	609	82	76\nKenya	61	96	7615	63	59\nKorea.North	70	90	370	73	67\nKorea.South	70	4.9	1066	73	67\nMexico	72	6.6	600	76	68\nMorocco	64.5	21	4873	66	63\nBurma	54.5	592	3485	56	53\nPakistan	56.5	73	2364	57	56\nPeru	64.5	14	1016	67	62\nPhilippines	64.5	8.8	1062	67	62\nPoland	73	3.9	480	77	69\nRomania	72	6	559	75	69\nRussia	69	3.2	259	74	64\nSouth.Africa	64	11	1340	67	61\nSpain	78.5	2.6	275	82	75\nSudan	53	23	12550	54	52\nTaiwan	75	3.2	965	78	72\nTanzania	52.5		25229	55	50\nThailand	68.5	11	4883	71	66\nTurkey	70	5	1189	72	68\nUkraine	70.5	3	226	75	66\nUK	76	3	611	79	73\nUSA	75.5	1.3	404	79	72\nVenezuela	74.5	5.6	576	78	71\nVietnam	65	29	3096	67	63\nZaire	54		23193	56	52';
CoffeeStats = {
  starLevels: [[0.001, '***'], [0.01, '**'], [0.05, '*'], [0.1, '+']],
  starLegend: function() {
    var _i, _len, _ref, _result, level;
    return (function() {
      _result = []; _ref = CoffeeStats.starLevels;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        level = _ref[_i];
        _result.push("" + (level[1]) + " p < " + (level[0]));
      }
      return _result;
    })().reverse().join(', ');
  },
  identityFunc: function(x) {
    return x;
  },
  intFormatFunc: function(x) {
    return x.toString();
  },
  floatFormatFuncFactory: function(precision) {
    return function(x) {
      return x.toPrecision(precision).replace('-', '– ');
    };
  }
};
CoffeeStats.Data = function(_arg) {
  this.dataRows = _arg;
  this.labelRow = this.dataRows.shift();
  this.reindexLabels();
  return this;
};
CoffeeStats.Data.prototype.labels = function() {
  return this.labelRow;
};
CoffeeStats.Data.prototype.rows = function() {
  return this.dataRows;
};
CoffeeStats.Data.prototype.reindexLabels = function() {
  var _ref, _result, i;
  this.labelIndices = {};
  _result = []; _ref = this.labelRow.length;
  for (i = 0; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
    _result.push(this.labelIndices[this.labelRow[i]] = i);
  }
  return _result;
};
CoffeeStats.Data.prototype.columnWithLabel = function(label) {
  var _i, _len, _ref, _result, index, row;
  index = this.labelIndices[label];
  _result = []; _ref = this.dataRows;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    row = _ref[_i];
    _result.push(row[index]);
  }
  return _result;
};
CoffeeStats.Data.prototype.filteredByLabels = function(labels) {
  var _i, _j, _len, _len2, _ref, _ref2, _result, _result2, filterLabelIndices, index, label, newRows, row;
  filterLabelIndices = (function() {
    _result = []; _ref = labels;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      label = _ref[_i];
      _result.push(this.labelIndices[label]);
    }
    return _result;
  }).call(this);
  newRows = (function() {
    _result = []; _ref = this.dataRows;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      _result.push((function() {
        _result2 = []; _ref2 = filterLabelIndices;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          index = _ref2[_j];
          _result2.push(row[index]);
        }
        return _result2;
      })());
    }
    return _result;
  }).call(this);
  newRows.unshift(labels);
  return new CoffeeStats.Data(newRows);
};
CoffeeStats.Data.prototype.filteredByCompleteRows = function() {
  var _i, _j, _len, _len2, _ref, _ref2, anyNull, cell, newRows, row;
  newRows = [];
  _ref = this.dataRows;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    row = _ref[_i];
    anyNull = false;
    _ref2 = row;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      cell = _ref2[_j];
      if (cell === null) {
        anyNull = true;
        break;
      }
    }
    if (!(anyNull)) {
      newRows.push(row);
    }
  }
  newRows.unshift(this.labelRow);
  return new CoffeeStats.Data(newRows);
};
CoffeeStats.Data.prototype.generate = function(label, genFunc) {
  var _i, _len, _ref;
  this.labelRow.push(label);
  this.reindexLabels();
  _ref = this.dataRows;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    (function() {
      var getVarFunc;
      var row = _ref[_i];
      getVarFunc = __bind(function(label) {
        return row[this.labelIndices[label]];
      }, this);
      return row.push(genFunc(getVarFunc));
    }).call(this);
  }
  return this;
};
CoffeeStats.Data.Parser = {
  split: function(string, rowSep, colSep, missingValue) {
    var _i, _j, _len, _len2, _ref, _ref2, _result, _result2, cell, data, row;
    data = (function() {
      _result = []; _ref = string.split(rowSep);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        _result.push((function() {
          _result2 = []; _ref2 = row.split(colSep);
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            cell = _ref2[_j];
            _result2.push((function() {
              if (cell === '' || cell === missingValue) {
                return null;
              } else if (/^-?[0-9]+([.][0-9]+)?(e[0-9]+)?$/.test(cell)) {
                return parseFloat(cell);
              } else {
                return cell;
              }
            })());
          }
          return _result2;
        })());
      }
      return _result;
    })();
    return new CoffeeStats.Data(data);
  },
  splitCSV: function(string, missingValue) {
    return CoffeeStats.Data.Parser.split(string, /\r\n|\r|\n/, ",", missingValue);
  },
  splitTSV: function(string, missingValue) {
    return CoffeeStats.Data.Parser.split(string, /\r\n|\r|\n/, "\t", missingValue);
  }
};
CoffeeStats.Distributions = {
  logGamma: function(z) {
    return (z - 0.5) * Math.log(z + 4.5) - (z + 4.5) + Math.log((1 + 76.18009173 / z - 86.50532033 / (z + 1) + 24.01409822 / (z + 2) - 1.231739516 / (z + 3) + 0.00120858003 / (z + 4) - 0.00000536382 / (z + 5)) * 2.50662827465);
  },
  betInc: function(x, a, b) {
    var a0, a1, a2, b0, b1, c9, m9;
    a0 = (m9 = (a2 = 0));
    b0 = (a1 = (b1 = 1));
    while (Math.abs((a1 - a2) / a1) > 0.00001) {
      a2 = a1;
      c9 = -(a + m9) * (a + b + m9) * x / (a + 2 * m9) / (a + 2 * m9 + 1);
      a0 = a1 + c9 * a0;
      b0 = b1 + c9 * b0;
      m9 = m9 + 1;
      c9 = m9 * (b - m9) * x / (a + 2 * m9 - 1) / (a + 2 * m9);
      a1 = a0 + c9 * a1;
      b1 = b0 + c9 * b1;
      a0 = a0 / b1;
      b0 = b0 / b1;
      a1 = a1 / b1;
      b1 = 1;
    }
    return a1 / a;
  },
  betaCDF: function(z, a, b) {
    var CD, bt, s;
    CD = CoffeeStats.Distributions;
    s = a + b;
    bt = Math.exp(CD.logGamma(s) - CD.logGamma(b) - CD.logGamma(a) + a * Math.log(z) + b * Math.log(1 - z));
    return z < (a + 1) / (s + 2) ? bt * CD.betInc(z, a, b) : 1 - bt * CD.betInc(1 - z, b, a);
  },
  minimise: function(func, stopBelow, input, step) {
    var bestInput, bestMinimand, i, minimand, stepMul;
    bestInput = input;
    bestMinimand = func(input);
    stepMul = 1;
    for (i = 0; i <= 1000; i++) {
      input += step * stepMul;
      minimand = func(input);
      if (Math.abs(minimand) < Math.abs(bestMinimand)) {
        bestMinimand = minimand;
        bestInput = input;
        if (Math.abs(bestMinimand) < stopBelow) {
          break;
        }
      } else if (stepMul === 1) {
        input = bestInput;
        stepMul = -1;
      } else {
        input = bestInput;
        step *= 0.5;
        stepMul = 1;
      }
    }
    return bestInput;
  },
  t: function(xv, df, tails) {
    var CD, a, betacdf, bt, s, z;
    CD = CoffeeStats.Distributions;
    a = df / 2;
    s = a + 0.5;
    z = df / (df + xv * xv);
    bt = Math.exp(CD.logGamma(s) - CD.logGamma(0.5) - CD.logGamma(a) + a * Math.log(z) + 0.5 * Math.log(1 - z));
    betacdf = z < (a + 1) / (s + 2) ? bt * CD.betInc(z, a, 0.5) : 1 - bt * CD.betInc(1 - z, 0.5, a);
    return tails * betacdf / 2;
  },
  tInv: function(p, df, tails) {
    var CD;
    CD = CoffeeStats.Distributions;
    return CD.minimise(function(input) {
      return p - CD.t(input, df, tails);
    }, 0.00001, -2, 1);
  },
  f: function(x, dfNum, dfDen) {
    var CD;
    CD = CoffeeStats.Distributions;
    return x <= 0 ? 0 : CD.betaCDF(x / (x + dfDen / dfNum), dfNum / 2, dfDen / 2);
  }
};
CoffeeStats.ColumnarTable = function(_arg, _arg2) {
  this.defaultCellFormatFunc = _arg2;
  this.className = _arg;
  this.defaultCellFormatFunc || (this.defaultCellFormatFunc = function(x) {
    return x.toString();
  });
  this.cols = [];
  this.maxRows = 0;
  return this;
};
CoffeeStats.ColumnarTable.prototype.column = function(heading, cells, cellFormatFunc) {
  var _i, _len, _ref, _result, cell;
  cellFormatFunc || (cellFormatFunc = this.defaultCellFormatFunc);
  this.cols.push([heading].concat((function() {
    _result = []; _ref = cells;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cell = _ref[_i];
      _result.push(cellFormatFunc(cell));
    }
    return _result;
  })()));
  this.maxRows = Math.max(this.maxRows, cells.length);
  return this;
};
CoffeeStats.ColumnarTable.prototype.render = function() {
  return $.HTML.table({
    className: ("columnarTable " + (this.className))
  }, __bind(function(t) {
    var _i, _ref, _result, row;
    t.tr(__bind(function(r) {
      var _i, _len, _ref, _result, col;
      _result = []; _ref = this.cols;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        col = _ref[_i];
        _result.push(r.th(col[0]));
      }
      return _result;
    }, this));
    _result = []; _ref = this.maxRows;
    for (_i = 1; (1 <= _ref ? _i <= _ref : _i >= _ref); (1 <= _ref ? _i += 1 : _i -= 1)) {
      (function() {
        var row = _i;
        return _result.push(t.tr(__bind(function(r) {
          var _j, _len, _ref2, _result2, col;
          _result2 = []; _ref2 = this.cols;
          for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
            col = _ref2[_j];
            _result2.push(r.td(col[row]));
          }
          return _result2;
        }, this)));
      }).call(this);
    }
    return _result;
  }, this));
};
CoffeeStats.RowTable = function(_arg, _arg2) {
  this.defaultCellFormatFunc = _arg2;
  this.className = _arg;
  this.defaultCellFormatFunc || (this.defaultCellFormatFunc = function(x) {
    return x.toString();
  });
  this.rows = [];
  return this;
};
CoffeeStats.RowTable.prototype.row = function(heading, cells, cellFormatFunc) {
  var _i, _len, _ref, _result, cell;
  cellFormatFunc || (cellFormatFunc = this.defaultCellFormatFunc);
  this.rows.push([heading].concat((function() {
    _result = []; _ref = cells;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cell = _ref[_i];
      _result.push(cellFormatFunc(cell));
    }
    return _result;
  })()));
  return this;
};
CoffeeStats.RowTable.prototype.render = function() {
  return $.HTML.table({
    className: ("rowTable " + (this.className))
  }, __bind(function(t) {
    var _i, _len, _ref, _result;
    _result = []; _ref = this.rows;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      (function() {
        var row = _ref[_i];
        return _result.push(t.tr(__bind(function(r) {
          var _ref2, _result2, i;
          r.th(row[0]);
          _result2 = []; _ref2 = row.length;
          for (i = 1; (1 <= _ref2 ? i <= _ref2 : i >= _ref2); (1 <= _ref2 ? i += 1 : i -= 1)) {
            _result2.push(r.td(row[i]));
          }
          return _result2;
        }, this)));
      }).call(this);
    }
    return _result;
  }, this));
};
CoffeeStats.Covariance = function(data, _arg) {
  var InvStdDevDiag, J, MeanRow, Means, NOnes, X, XDemeaned, covData;
  this.labels = _arg;
  covData = data.filteredByLabels(this.labels);
  X = $M(covData.rows());
  J = X.map(function() {
    return 1;
  });
  MeanRow = $M(J.transpose().x(X).x(1 / X.rows()).row(1));
  NOnes = $M([
    X.col(1).map(function() {
      return 1;
    }).elements
  ]);
  Means = MeanRow.x(NOnes).transpose();
  XDemeaned = X.subtract(Means);
  this.VCV = XDemeaned.transpose().x(XDemeaned).x(1 / (X.rows() - 1));
  this.Variance = this.VCV.diagonal();
  InvStdDevDiag = this.Variance.map(function(x) {
    return Math.sqrt(x);
  }).toDiagonalMatrix().inverse();
  this.Cor = InvStdDevDiag.x(this.VCV).x(InvStdDevDiag);
  return this;
};
CoffeeStats.Covariance.prototype.correlationTable = function() {
  var _ref, row, t;
  t = new CoffeeStats.RowTable('correlations', CoffeeStats.floatFormatFuncFactory(3)).row('', this.labels, CoffeeStats.identityFunc);
  _ref = this.Cor.rows();
  for (row = 1; (1 <= _ref ? row <= _ref : row >= _ref); (1 <= _ref ? row += 1 : row -= 1)) {
    t.row(this.labels[row - 1], this.Cor.row(row).elements.slice(0, row));
  }
  return t;
};
CoffeeStats.OLS = function(data, _arg, independentLabels, opts) {
  var CD, X, Xprime, Y, Ydemeaned, _i, _len, _ref, _result, ciDeltas, ciT, colinears, olsData, x, ymean;
  this.dependentLabel = _arg;
  opts || (opts = {});
  opts.ci || (opts.ci = 0.95);
  opts.constantLabel || (opts.constantLabel = 'constant');
  CD = CoffeeStats.Distributions;
  this.errors = [];
  this.independentLabels = (function() {
    _result = []; _ref = independentLabels;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      _result.push(x);
    }
    return _result;
  })();
  olsData = data.filteredByLabels(this.independentLabels.concat(this.dependentLabel)).filteredByCompleteRows();
  Y = $M(olsData.filteredByLabels([this.dependentLabel]).rows());
  if (!(opts.noConstant)) {
    olsData.generate(opts.constantLabel, function() {
      return 1;
    });
    this.independentLabels.push(opts.constantLabel);
  }
  X = $M(olsData.filteredByLabels(this.independentLabels).rows());
  colinears = X.cols() - X.rank();
  if (colinears > 0) {
    this.errors.push('Non-singular matrix');
    return null;
  }
  this.n = X.rows();
  this.k = X.cols();
  this.dfm = this.k - (opts.noConstant ? 0 : 1);
  this.dfe = this.n - this.k;
  this.dft = this.dfm + this.dfe;
  Xprime = X.transpose();
  this.Bhat = (Xprime.x(X)).inverse().x(Xprime.x(Y));
  this.Ehat = Y.subtract(X.x(this.Bhat));
  this.sse = this.Ehat.transpose().x(this.Ehat).e(1, 1);
  this.mse = this.sse / this.dfe;
  this.mseSqrt = Math.sqrt(this.mse);
  this.VCV = Xprime.x(X).inverse().x(this.mse);
  this.Variance = this.VCV.diagonal();
  this.SE = this.Variance.map(function(x) {
    return Math.sqrt(x);
  });
  this.T = this.SE.toDiagonalMatrix().inverse().x(this.Bhat);
  this.PT = this.T.map(__bind(function(x) {
    return CD.t(x, this.dfe, 2);
  }, this));
  this.PStars = this.PT.map(function(p) {
    var _j, _len2, _ref2, level;
    _ref2 = CoffeeStats.starLevels;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      level = _ref2[_j];
            if (p < level[0]) {
        return level[1];
      };
    }
    return '';
  });
  ciT = Math.abs(CD.tInv(1 - opts.ci, this.dfe, 2));
  ciDeltas = this.SE.x(ciT);
  this.ciLow = this.Bhat.subtract(ciDeltas);
  this.ciHigh = this.Bhat.add(ciDeltas);
  ymean = opts.noConstant ? 0 : Y.col(1).toDiagonalMatrix().trace() / Y.rows();
  Ydemeaned = Y.map(function(x) {
    return x - ymean;
  });
  this.sst = Ydemeaned.transpose().x(Ydemeaned).e(1, 1);
  this.mst = this.sst / this.dft;
  this.r2 = 1 - this.sse / this.sst;
  this.adjr2 = 1 - this.mse / this.mst;
  this.ssm = this.sst - this.sse;
  this.msm = this.ssm / this.dfm;
  this.f = this.msm / this.mse;
  this.pf = 1 - CD.f(this.f, this.dfm, this.dfe);
  return this;
};
CoffeeStats.OLS.prototype.coeffsTable = function() {
  var floatFormatFunc;
  floatFormatFunc = CoffeeStats.floatFormatFuncFactory(3);
  return new CoffeeStats.ColumnarTable('resultsTable', floatFormatFunc).column(this.dependentLabel, this.independentLabels, CoffeeStats.identityFunc).column('β', this.Bhat.col(1).elements).column('SE', this.SE.elements).column('t', this.T.col(1).elements).column('P > |t|', this.PT.col(1).elements).column('', this.PStars.col(1).elements, CoffeeStats.identityFunc).column('95% CI low', this.ciLow.col(1).elements).column('95% CI high', this.ciHigh.col(1).elements);
};
CoffeeStats.OLS.prototype.squaresTable = function() {
  return new CoffeeStats.ColumnarTable('squaresTable', CoffeeStats.floatFormatFuncFactory(7)).column('Source', ['Model', 'Residual', 'Total'], CoffeeStats.identityFunc).column('SS', [this.ssm, this.sse, this.sst]).column('df', [this.dfm, this.dfe, this.dft], CoffeeStats.intFormatFunc).column('MS', [this.msm, this.mse, this.mst]);
};
CoffeeStats.OLS.prototype.infoTable = function() {
  return new CoffeeStats.RowTable('generalTable', CoffeeStats.floatFormatFuncFactory(3)).row('N', [this.n], CoffeeStats.intFormatFunc).row("F(" + (this.dfm) + ", " + (this.dfe) + ")", [this.f]).row('P > F', [this.pf]).row('R²', [this.r2]).row('Adj. R²', [this.adjr2]).row('Root MSE', [this.mseSqrt]);
};
lifeExpData = CoffeeStats.Data.Parser.splitTSV(lifeExpDataTSV, 'NA');
lifeExpData.generate('Frenchness', function(c) {
  return c('Country') === 'France' ? 1 : 0;
});
indepVars = ['People.per.Dr', 'People.per.TV', 'Frenchness'];
cov = new CoffeeStats.Covariance(lifeExpData, indepVars);
ols = new CoffeeStats.OLS(lifeExpData, 'LifeExp', indepVars);
onload = function() {
  $('body').insert(cov.correlationTable().render());
  $('body').insert(ols.infoTable().render());
  $('body').insert(ols.squaresTable().render());
  $('body').insert(ols.coeffsTable().render());
  return $('body').insert($.HTML.p(CoffeeStats.starLegend()));
};