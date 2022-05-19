/*!
 * Chartkick.js
 * Create beautiful charts with one line of JavaScript
 * https://github.com/ankane/chartkick.js
 * v4.1.1
 * MIT License
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Chartkick = factory());
}(this, (function () { 'use strict';

  function isArray(variable) {
    return Object.prototype.toString.call(variable) === "[object Array]";
  }

  function isFunction(variable) {
    return variable instanceof Function;
  }

  function isPlainObject(variable) {
    // protect against prototype pollution, defense 2
    return Object.prototype.toString.call(variable) === "[object Object]" && !isFunction(variable) && variable instanceof Object;
  }

  // https://github.com/madrobby/zepto/blob/master/src/zepto.js
  function extend(target, source) {
    var key;
    for (key in source) {
      // protect against prototype pollution, defense 1
      if (key === "__proto__") { continue; }

      if (isPlainObject(source[key]) || isArray(source[key])) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
          target[key] = {};
        }
        if (isArray(source[key]) && !isArray(target[key])) {
          target[key] = [];
        }
        extend(target[key], source[key]);
      } else if (source[key] !== undefined) {
        target[key] = source[key];
      }
    }
  }

  function merge(obj1, obj2) {
    var target = {};
    extend(target, obj1);
    extend(target, obj2);
    return target;
  }

  var DATE_PATTERN = /^(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)$/i;

  function negativeValues(series) {
    var i, j, data;
    for (i = 0; i < series.length; i++) {
      data = series[i].data;
      for (j = 0; j < data.length; j++) {
        if (data[j][1] < 0) {
          return true;
        }
      }
    }
    return false;
  }

  function toStr(n) {
    return "" + n;
  }

  function toFloat(n) {
    return parseFloat(n);
  }

  function toDate(n) {
    var matches, year, month, day;
    if (typeof n !== "object") {
      if (typeof n === "number") {
        n = new Date(n * 1000); // ms
      } else {
        n = toStr(n);
        if ((matches = n.match(DATE_PATTERN))) {
          year = parseInt(matches[1], 10);
          month = parseInt(matches[3], 10) - 1;
          day = parseInt(matches[5], 10);
          return new Date(year, month, day);
        } else {
          // try our best to get the str into iso8601
          // TODO be smarter about this
          var str = n.replace(/ /, "T").replace(" ", "").replace("UTC", "Z");
          // Date.parse returns milliseconds if valid and NaN if invalid
          n = new Date(Date.parse(str) || n);
        }
      }
    }
    return n;
  }

  function toArr(n) {
    if (!isArray(n)) {
      var arr = [], i;
      for (i in n) {
        if (n.hasOwnProperty(i)) {
          arr.push([i, n[i]]);
        }
      }
      n = arr;
    }
    return n;
  }

  function jsOptionsFunc(defaultOptions, hideLegend, setTitle, setMin, setMax, setStacked, setXtitle, setYtitle) {
    return function (chart, opts, chartOptions) {
      var series = chart.data;
      var options = merge({}, defaultOptions);
      options = merge(options, chartOptions || {});

      if (chart.singleSeriesFormat || "legend" in opts) {
        hideLegend(options, opts.legend, chart.singleSeriesFormat);
      }

      if (opts.title) {
        setTitle(options, opts.title);
      }

      // min
      if ("min" in opts) {
        setMin(options, opts.min);
      } else if (!negativeValues(series)) {
        setMin(options, 0);
      }

      // max
      if (opts.max) {
        setMax(options, opts.max);
      }

      if ("stacked" in opts) {
        setStacked(options, opts.stacked);
      }

      if (opts.colors) {
        options.colors = opts.colors;
      }

      if (opts.xtitle) {
        setXtitle(options, opts.xtitle);
      }

      if (opts.ytitle) {
        setYtitle(options, opts.ytitle);
      }

      // merge library last
      options = merge(options, opts.library || {});

      return options;
    };
  }

  function sortByTime(a, b) {
    return a[0].getTime() - b[0].getTime();
  }

  function sortByNumberSeries(a, b) {
    return a[0] - b[0];
  }

  function sortByNumber(a, b) {
    return a - b;
  }

  function isMinute(d) {
    return d.getMilliseconds() === 0 && d.getSeconds() === 0;
  }

  function isHour(d) {
    return isMinute(d) && d.getMinutes() === 0;
  }

  function isDay(d) {
    return isHour(d) && d.getHours() === 0;
  }

  function isWeek(d, dayOfWeek) {
    return isDay(d) && d.getDay() === dayOfWeek;
  }

  function isMonth(d) {
    return isDay(d) && d.getDate() === 1;
  }

  function isYear(d) {
    return isMonth(d) && d.getMonth() === 0;
  }

  function isDate(obj) {
    return !isNaN(toDate(obj)) && toStr(obj).length >= 6;
  }

  function isNumber(obj) {
    return typeof obj === "number";
  }

  var byteSuffixes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB"];

  function formatValue(pre, value, options, axis) {
    pre = pre || "";
    if (options.prefix) {
      if (value < 0) {
        value = value * -1;
        pre += "-";
      }
      pre += options.prefix;
    }

    var suffix = options.suffix || "";
    var precision = options.precision;
    var round = options.round;

    if (options.byteScale) {
      var suffixIdx;
      var baseValue = axis ? options.byteScale : value;

      if (baseValue >= 1152921504606846976) {
        value /= 1152921504606846976;
        suffixIdx = 6;
      } else if (baseValue >= 1125899906842624) {
        value /= 1125899906842624;
        suffixIdx = 5;
      } else if (baseValue >= 1099511627776) {
        value /= 1099511627776;
        suffixIdx = 4;
      } else if (baseValue >= 1073741824) {
        value /= 1073741824;
        suffixIdx = 3;
      } else if (baseValue >= 1048576) {
        value /= 1048576;
        suffixIdx = 2;
      } else if (baseValue >= 1024) {
        value /= 1024;
        suffixIdx = 1;
      } else {
        suffixIdx = 0;
      }

      // TODO handle manual precision case
      if (precision === undefined && round === undefined) {
        if (value >= 1023.5) {
          if (suffixIdx < byteSuffixes.length - 1) {
            value = 1.0;
            suffixIdx += 1;
          }
        }
        precision = value >= 1000 ? 4 : 3;
      }
      suffix = " " + byteSuffixes[suffixIdx];
    }

    if (precision !== undefined && round !== undefined) {
      throw Error("Use either round or precision, not both");
    }

    if (!axis) {
      if (precision !== undefined) {
        value = value.toPrecision(precision);
        if (!options.zeros) {
          value = parseFloat(value);
        }
      }

      if (round !== undefined) {
        if (round < 0) {
          var num = Math.pow(10, -1 * round);
          value = parseInt((1.0 * value / num).toFixed(0)) * num;
        } else {
          value = value.toFixed(round);
          if (!options.zeros) {
            value = parseFloat(value);
          }
        }
      }
    }

    if (options.thousands || options.decimal) {
      value = toStr(value);
      var parts = value.split(".");
      value = parts[0];
      if (options.thousands) {
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, options.thousands);
      }
      if (parts.length > 1) {
        value += (options.decimal || ".") + parts[1];
      }
    }

    return pre + value + suffix;
  }

  function seriesOption(chart, series, option) {
    if (option in series) {
      return series[option];
    } else if (option in chart.options) {
      return chart.options[option];
    }
    return null;
  }

  function allZeros(data) {
    var i, j, d;
    for (i = 0; i < data.length; i++) {
      d = data[i].data;
      for (j = 0; j < d.length; j++) {
        if (d[j][1] != 0) {
          return false;
        }
      }
    }
    return true;
  }

  var baseOptions = {
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {},
      tooltip: {
        displayColors: false,
        callbacks: {}
      },
      title: {
        font: {
          size: 20
        },
        color: "#333"
      }
    },
    interaction: {}
  };

  var defaultOptions$2 = {
    scales: {
      y: {
        ticks: {
          maxTicksLimit: 4
        },
        title: {
          font: {
            size: 16
          },
          color: "#333"
        },
        grid: {}
      },
      x: {
        grid: {
          drawOnChartArea: false
        },
        title: {
          font: {
            size: 16
          },
          color: "#333"
        },
        time: {},
        ticks: {}
      }
    }
  };

  // http://there4.io/2012/05/02/google-chart-color-list/
  var defaultColors = [
    "#3366CC", "#DC3912", "#FF9900", "#109618", "#990099", "#3B3EAC", "#0099C6",
    "#DD4477", "#66AA00", "#B82E2E", "#316395", "#994499", "#22AA99", "#AAAA11",
    "#6633CC", "#E67300", "#8B0707", "#329262", "#5574A6", "#651067"
  ];

  var hideLegend$2 = function (options, legend, hideLegend) {
    if (legend !== undefined) {
      options.plugins.legend.display = !!legend;
      if (legend && legend !== true) {
        options.plugins.legend.position = legend;
      }
    } else if (hideLegend) {
      options.plugins.legend.display = false;
    }
  };

  var setTitle$2 = function (options, title) {
    options.plugins.title.display = true;
    options.plugins.title.text = title;
  };

  var setMin$2 = function (options, min) {
    if (min !== null) {
      options.scales.y.min = toFloat(min);
    }
  };

  var setMax$2 = function (options, max) {
    options.scales.y.max = toFloat(max);
  };

  var setBarMin$1 = function (options, min) {
    if (min !== null) {
      options.scales.x.min = toFloat(min);
    }
  };

  var setBarMax$1 = function (options, max) {
    options.scales.x.max = toFloat(max);
  };

  var setStacked$2 = function (options, stacked) {
    options.scales.x.stacked = !!stacked;
    options.scales.y.stacked = !!stacked;
  };

  var setXtitle$2 = function (options, title) {
    options.scales.x.title.display = true;
    options.scales.x.title.text = title;
  };

  var setYtitle$2 = function (options, title) {
    options.scales.y.title.display = true;
    options.scales.y.title.text = title;
  };

  // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
  var addOpacity = function (hex, opacity) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? "rgba(" + parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16) + ", " + opacity + ")" : hex;
  };

  // check if not null or undefined
  // https://stackoverflow.com/a/27757708/1177228
  var notnull = function (x) {
    return x != null;
  };

  var setLabelSize = function (chart, data, options) {
    var maxLabelSize = Math.ceil(chart.element.offsetWidth / 4.0 / data.labels.length);
    if (maxLabelSize > 25) {
      maxLabelSize = 25;
    } else if (maxLabelSize < 10) {
      maxLabelSize = 10;
    }
    if (!options.scales.x.ticks.callback) {
      options.scales.x.ticks.callback = function (value) {
        value = toStr(this.getLabelForValue(value));
        if (value.length > maxLabelSize) {
          return value.substring(0, maxLabelSize - 2) + "...";
        } else {
          return value;
        }
      };
    }
  };

  var setFormatOptions$1 = function (chart, options, chartType) {
    var formatOptions = {
      prefix: chart.options.prefix,
      suffix: chart.options.suffix,
      thousands: chart.options.thousands,
      decimal: chart.options.decimal,
      precision: chart.options.precision,
      round: chart.options.round,
      zeros: chart.options.zeros
    };

    if (chart.options.bytes) {
      var series = chart.data;
      if (chartType === "pie") {
        series = [{data: series}];
      }

      // calculate max
      var max = 0;
      for (var i = 0; i < series.length; i++) {
        var s = series[i];
        for (var j = 0; j < s.data.length; j++) {
          if (s.data[j][1] > max) {
            max = s.data[j][1];
          }
        }
      }

      // calculate scale
      var scale = 1;
      while (max >= 1024) {
        scale *= 1024;
        max /= 1024;
      }

      // set step size
      formatOptions.byteScale = scale;
    }

    if (chartType !== "pie") {
      var axis = options.scales.y;
      if (chartType === "bar") {
        axis = options.scales.x;
      }

      if (formatOptions.byteScale) {
        if (!axis.ticks.stepSize) {
          axis.ticks.stepSize = formatOptions.byteScale / 2;
        }
        if (!axis.ticks.maxTicksLimit) {
          axis.ticks.maxTicksLimit = 4;
        }
      }

      if (!axis.ticks.callback) {
        axis.ticks.callback = function (value) {
          return formatValue("", value, formatOptions, true);
        };
      }
    }

    if (!options.plugins.tooltip.callbacks.label) {
      if (chartType === "scatter") {
        options.plugins.tooltip.callbacks.label = function (context) {
          var label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          return label + '(' + context.label + ', ' + context.formattedValue + ')';
        };
      } else if (chartType === "bubble") {
        options.plugins.tooltip.callbacks.label = function (context) {
          var label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          var dataPoint = context.raw;
          return label + '(' + dataPoint.x + ', ' + dataPoint.y + ', ' + dataPoint.v + ')';
        };
      } else if (chartType === "pie") {
        // need to use separate label for pie charts
        options.plugins.tooltip.callbacks.label = function (context) {
          var dataLabel = context.label;
          var value = ': ';

          if (isArray(dataLabel)) {
            // show value on first line of multiline label
            // need to clone because we are changing the value
            dataLabel = dataLabel.slice();
            dataLabel[0] += value;
          } else {
            dataLabel += value;
          }

          return formatValue(dataLabel, context.parsed, formatOptions);
        };
      } else {
        var valueLabel = chartType === "bar" ? "x" : "y";
        options.plugins.tooltip.callbacks.label = function (context) {
          // don't show null values for stacked charts
          if (context.parsed[valueLabel] === null) {
            return;
          }

          var label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          return formatValue(label, context.parsed[valueLabel], formatOptions);
        };
      }
    }
  };

  var jsOptions$2 = jsOptionsFunc(merge(baseOptions, defaultOptions$2), hideLegend$2, setTitle$2, setMin$2, setMax$2, setStacked$2, setXtitle$2, setYtitle$2);

  var createDataTable = function (chart, options, chartType) {
    var datasets = [];
    var labels = [];

    var colors = chart.options.colors || defaultColors;

    var day = true;
    var week = true;
    var dayOfWeek;
    var month = true;
    var year = true;
    var hour = true;
    var minute = true;

    var series = chart.data;

    var max = 0;
    if (chartType === "bubble") {
      for (var i$1 = 0; i$1 < series.length; i$1++) {
        var s$1 = series[i$1];
        for (var j$1 = 0; j$1 < s$1.data.length; j$1++) {
          if (s$1.data[j$1][2] > max) {
            max = s$1.data[j$1][2];
          }
        }
      }
    }

    var i, j, s, d, key, rows = [], rows2 = [];

    if (chartType === "bar" || chartType === "column" || (chart.xtype !== "number" && chart.xtype !== "bubble")) {
      var sortedLabels = [];

      for (i = 0; i < series.length; i++) {
        s = series[i];

        for (j = 0; j < s.data.length; j++) {
          d = s.data[j];
          key = chart.xtype == "datetime" ? d[0].getTime() : d[0];
          if (!rows[key]) {
            rows[key] = new Array(series.length);
          }
          rows[key][i] = toFloat(d[1]);
          if (sortedLabels.indexOf(key) === -1) {
            sortedLabels.push(key);
          }
        }
      }

      if (chart.xtype === "datetime" || chart.xtype === "number") {
        sortedLabels.sort(sortByNumber);
      }

      for (j = 0; j < series.length; j++) {
        rows2.push([]);
      }

      var value;
      var k;
      for (k = 0; k < sortedLabels.length; k++) {
        i = sortedLabels[k];
        if (chart.xtype === "datetime") {
          value = new Date(toFloat(i));
          // TODO make this efficient
          day = day && isDay(value);
          if (!dayOfWeek) {
            dayOfWeek = value.getDay();
          }
          week = week && isWeek(value, dayOfWeek);
          month = month && isMonth(value);
          year = year && isYear(value);
          hour = hour && isHour(value);
          minute = minute && isMinute(value);
        } else {
          value = i;
        }
        labels.push(value);
        for (j = 0; j < series.length; j++) {
          // Chart.js doesn't like undefined
          rows2[j].push(rows[i][j] === undefined ? null : rows[i][j]);
        }
      }
    } else {
      for (var i$2 = 0; i$2 < series.length; i$2++) {
        var s$2 = series[i$2];
        var d$1 = [];
        for (var j$2 = 0; j$2 < s$2.data.length; j$2++) {
          var point = {
            x: toFloat(s$2.data[j$2][0]),
            y: toFloat(s$2.data[j$2][1])
          };
          if (chartType === "bubble") {
            point.r = toFloat(s$2.data[j$2][2]) * 20 / max;
            // custom attribute, for tooltip
            point.v = s$2.data[j$2][2];
          }
          d$1.push(point);
        }
        rows2.push(d$1);
      }
    }

    var color;
    var backgroundColor;

    for (i = 0; i < series.length; i++) {
      s = series[i];

      // use colors for each bar for single series format
      if (chart.options.colors && chart.singleSeriesFormat && (chartType === "bar" || chartType === "column") && !s.color && isArray(chart.options.colors) && !isArray(chart.options.colors[0])) {
        color = colors;
        backgroundColor = [];
        for (var j$3 = 0; j$3 < colors.length; j$3++) {
          backgroundColor[j$3] = addOpacity(color[j$3], 0.5);
        }
      } else {
        color = s.color || colors[i];
        backgroundColor = chartType !== "line" ? addOpacity(color, 0.5) : color;
      }

      var dataset = {
        label: s.name || "",
        data: rows2[i],
        fill: chartType === "area",
        borderColor: color,
        backgroundColor: backgroundColor,
        borderWidth: 2
      };

      var pointChart = chartType === "line" || chartType === "area" || chartType === "scatter" || chartType === "bubble";
      if (pointChart) {
        dataset.pointBackgroundColor = color;
        dataset.pointHoverBackgroundColor = color;
        dataset.pointHitRadius = 50;
      }

      if (chartType === "bubble") {
        dataset.pointBackgroundColor = backgroundColor;
        dataset.pointHoverBackgroundColor = backgroundColor;
        dataset.pointHoverBorderWidth = 2;
      }

      if (s.stack) {
        dataset.stack = s.stack;
      }

      var curve = seriesOption(chart, s, "curve");
      if (curve === false) {
        dataset.tension = 0;
      } else if (pointChart) {
        dataset.tension = 0.4;
      }

      var points = seriesOption(chart, s, "points");
      if (points === false) {
        dataset.pointRadius = 0;
        dataset.pointHoverRadius = 0;
      }

      dataset = merge(dataset, chart.options.dataset || {});
      dataset = merge(dataset, s.library || {});
      dataset = merge(dataset, s.dataset || {});

      datasets.push(dataset);
    }

    var xmin = chart.options.xmin;
    var xmax = chart.options.xmax;

    if (chart.xtype === "datetime") {
      if (notnull(xmin)) {
        options.scales.x.min = toDate(xmin).getTime();
      }
      if (notnull(xmax)) {
        options.scales.x.max = toDate(xmax).getTime();
      }
    } else if (chart.xtype === "number") {
      if (notnull(xmin)) {
        options.scales.x.min = xmin;
      }
      if (notnull(xmax)) {
        options.scales.x.max = xmax;
      }
    }

    // for empty datetime chart
    if (chart.xtype === "datetime" && labels.length === 0) {
      if (notnull(xmin)) {
        labels.push(toDate(xmin));
      }
      if (notnull(xmax)) {
        labels.push(toDate(xmax));
      }
      day = false;
      week = false;
      month = false;
      year = false;
      hour = false;
      minute = false;
    }

    if (chart.xtype === "datetime" && labels.length > 0) {
      var minTime = (notnull(xmin) ? toDate(xmin) : labels[0]).getTime();
      var maxTime = (notnull(xmax) ? toDate(xmax) : labels[0]).getTime();

      for (i = 1; i < labels.length; i++) {
        var value$1 = labels[i].getTime();
        if (value$1 < minTime) {
          minTime = value$1;
        }
        if (value$1 > maxTime) {
          maxTime = value$1;
        }
      }

      var timeDiff = (maxTime - minTime) / (86400 * 1000.0);

      if (!options.scales.x.time.unit) {
        var step;
        if (year || timeDiff > 365 * 10) {
          options.scales.x.time.unit = "year";
          step = 365;
        } else if (month || timeDiff > 30 * 10) {
          options.scales.x.time.unit = "month";
          step = 30;
        } else if (day || timeDiff > 10) {
          options.scales.x.time.unit = "day";
          step = 1;
        } else if (hour || timeDiff > 0.5) {
          options.scales.x.time.displayFormats = {hour: "MMM d, h a"};
          options.scales.x.time.unit = "hour";
          step = 1 / 24.0;
        } else if (minute) {
          options.scales.x.time.displayFormats = {minute: "h:mm a"};
          options.scales.x.time.unit = "minute";
          step = 1 / 24.0 / 60.0;
        }

        if (step && timeDiff > 0) {
          // width not available for hidden elements
          var width = chart.element.offsetWidth;
          if (width > 0) {
            var unitStepSize = Math.ceil(timeDiff / step / (width / 100.0));
            if (week && step === 1) {
              unitStepSize = Math.ceil(unitStepSize / 7.0) * 7;
            }
            options.scales.x.time.stepSize = unitStepSize;
          }
        }
      }

      if (!options.scales.x.time.tooltipFormat) {
        if (day) {
          options.scales.x.time.tooltipFormat = "PP";
        } else if (hour) {
          options.scales.x.time.tooltipFormat = "MMM d, h a";
        } else if (minute) {
          options.scales.x.time.tooltipFormat = "h:mm a";
        }
      }
    }

    var data = {
      labels: labels,
      datasets: datasets
    };

    return data;
  };

  var defaultExport$2 = function defaultExport(library) {
    this.name = "chartjs";
    this.library = library;
  };

  defaultExport$2.prototype.renderLineChart = function renderLineChart (chart, chartType) {
    var chartOptions = {};
    // fix for https://github.com/chartjs/Chart.js/issues/2441
    if (!chart.options.max && allZeros(chart.data)) {
      chartOptions.max = 1;
    }

    var options = jsOptions$2(chart, merge(chartOptions, chart.options));
    setFormatOptions$1(chart, options, chartType);

    var data = createDataTable(chart, options, chartType || "line");

    if (chart.xtype === "number") {
      options.scales.x.type = options.scales.x.type || "linear";
      options.scales.x.position = options.scales.x.position ||"bottom";
    } else {
      options.scales.x.type = chart.xtype === "string" ? "category" : "time";
    }

    this.drawChart(chart, "line", data, options);
  };

  defaultExport$2.prototype.renderPieChart = function renderPieChart (chart) {
    var options = merge({}, baseOptions);
    if (chart.options.donut) {
      options.cutout = "50%";
    }

    if ("legend" in chart.options) {
      hideLegend$2(options, chart.options.legend);
    }

    if (chart.options.title) {
      setTitle$2(options, chart.options.title);
    }

    options = merge(options, chart.options.library || {});
    setFormatOptions$1(chart, options, "pie");

    var labels = [];
    var values = [];
    for (var i = 0; i < chart.data.length; i++) {
      var point = chart.data[i];
      labels.push(point[0]);
      values.push(point[1]);
    }

    var dataset = {
      data: values,
      backgroundColor: chart.options.colors || defaultColors
    };
    dataset = merge(dataset, chart.options.dataset || {});

    var data = {
      labels: labels,
      datasets: [dataset]
    };

    this.drawChart(chart, "pie", data, options);
  };

  defaultExport$2.prototype.renderColumnChart = function renderColumnChart (chart, chartType) {
    var options;
    if (chartType === "bar") {
      var barOptions = merge(baseOptions, defaultOptions$2);
      barOptions.indexAxis = "y";

      // ensure gridlines have proper orientation
      barOptions.scales.x.grid.drawOnChartArea = true;
      barOptions.scales.y.grid.drawOnChartArea = false;
      delete barOptions.scales.y.ticks.maxTicksLimit;

      options = jsOptionsFunc(barOptions, hideLegend$2, setTitle$2, setBarMin$1, setBarMax$1, setStacked$2, setXtitle$2, setYtitle$2)(chart, chart.options);
    } else {
      options = jsOptions$2(chart, chart.options);
    }
    setFormatOptions$1(chart, options, chartType);
    var data = createDataTable(chart, options, "column");
    if (chartType !== "bar") {
      setLabelSize(chart, data, options);
    }
    this.drawChart(chart, "bar", data, options);
  };

  defaultExport$2.prototype.renderAreaChart = function renderAreaChart (chart) {
    this.renderLineChart(chart, "area");
  };

  defaultExport$2.prototype.renderBarChart = function renderBarChart (chart) {
    this.renderColumnChart(chart, "bar");
  };

  defaultExport$2.prototype.renderScatterChart = function renderScatterChart (chart, chartType) {
    chartType = chartType || "scatter";

    var options = jsOptions$2(chart, chart.options);
    setFormatOptions$1(chart, options, chartType);

    if (!("showLine" in options)) {
      options.showLine = false;
    }

    var data = createDataTable(chart, options, chartType);

    options.scales.x.type = options.scales.x.type || "linear";
    options.scales.x.position = options.scales.x.position || "bottom";

    // prevent grouping hover and tooltips
    if (!("mode" in options.interaction)) {
      options.interaction.mode = "nearest";
    }

    this.drawChart(chart, chartType, data, options);
  };

  defaultExport$2.prototype.renderBubbleChart = function renderBubbleChart (chart) {
    this.renderScatterChart(chart, "bubble");
  };

  defaultExport$2.prototype.destroy = function destroy (chart) {
    if (chart.chart) {
      chart.chart.destroy();
    }
  };

  defaultExport$2.prototype.drawChart = function drawChart (chart, type, data, options) {
    this.destroy(chart);
    if (chart.destroyed) { return; }

    var chartOptions = {
      type: type,
      data: data,
      options: options
    };

    if (chart.options.code) {
      window.console.log("new Chart(ctx, " + JSON.stringify(chartOptions) + ");");
    }

    chart.element.innerHTML = "<canvas></canvas>";
    var ctx = chart.element.getElementsByTagName("CANVAS")[0];
    chart.chart = new this.library(ctx, chartOptions);
  };

  var defaultOptions$1 = {
    chart: {},
    xAxis: {
      title: {
        text: null
      },
      labels: {
        style: {
          fontSize: "12px"
        }
      }
    },
    yAxis: {
      title: {
        text: null
      },
      labels: {
        style: {
          fontSize: "12px"
        }
      }
    },
    title: {
      text: null
    },
    credits: {
      enabled: false
    },
    legend: {
      borderWidth: 0
    },
    tooltip: {
      style: {
        fontSize: "12px"
      }
    },
    plotOptions: {
      areaspline: {},
      area: {},
      series: {
        marker: {}
      }
    },
    time: {
      useUTC: false
    }
  };

  var hideLegend$1 = function (options, legend, hideLegend) {
    if (legend !== undefined) {
      options.legend.enabled = !!legend;
      if (legend && legend !== true) {
        if (legend === "top" || legend === "bottom") {
          options.legend.verticalAlign = legend;
        } else {
          options.legend.layout = "vertical";
          options.legend.verticalAlign = "middle";
          options.legend.align = legend;
        }
      }
    } else if (hideLegend) {
      options.legend.enabled = false;
    }
  };

  var setTitle$1 = function (options, title) {
    options.title.text = title;
  };

  var setMin$1 = function (options, min) {
    options.yAxis.min = min;
  };

  var setMax$1 = function (options, max) {
    options.yAxis.max = max;
  };

  var setStacked$1 = function (options, stacked) {
    var stackedValue = stacked ? (stacked === true ? "normal" : stacked) : null;
    options.plotOptions.series.stacking = stackedValue;
    options.plotOptions.area.stacking = stackedValue;
    options.plotOptions.areaspline.stacking = stackedValue;
  };

  var setXtitle$1 = function (options, title) {
    options.xAxis.title.text = title;
  };

  var setYtitle$1 = function (options, title) {
    options.yAxis.title.text = title;
  };

  var jsOptions$1 = jsOptionsFunc(defaultOptions$1, hideLegend$1, setTitle$1, setMin$1, setMax$1, setStacked$1, setXtitle$1, setYtitle$1);

  var setFormatOptions = function(chart, options, chartType) {
    var formatOptions = {
      prefix: chart.options.prefix,
      suffix: chart.options.suffix,
      thousands: chart.options.thousands,
      decimal: chart.options.decimal,
      precision: chart.options.precision,
      round: chart.options.round,
      zeros: chart.options.zeros
    };

    if (chartType !== "pie" && !options.yAxis.labels.formatter) {
      options.yAxis.labels.formatter = function () {
        return formatValue("", this.value, formatOptions);
      };
    }

    if (!options.tooltip.pointFormatter && !options.tooltip.pointFormat) {
      options.tooltip.pointFormatter = function () {
        return '<span style="color:' + this.color + '">\u25CF</span> ' + formatValue(this.series.name + ': <b>', this.y, formatOptions) + '</b><br/>';
      };
    }
  };

  var defaultExport$1 = function defaultExport(library) {
    this.name = "highcharts";
    this.library = library;
  };

  defaultExport$1.prototype.renderLineChart = function renderLineChart (chart, chartType) {
    chartType = chartType || "spline";
    var chartOptions = {};
    if (chartType === "areaspline") {
      chartOptions = {
        plotOptions: {
          areaspline: {
            stacking: "normal"
          },
          area: {
            stacking: "normal"
          },
          series: {
            marker: {
              enabled: false
            }
          }
        }
      };
    }

    if (chart.options.curve === false) {
      if (chartType === "areaspline") {
        chartType = "area";
      } else if (chartType === "spline") {
        chartType = "line";
      }
    }

    var options = jsOptions$1(chart, chart.options, chartOptions), data, i, j;
    if (chart.xtype === "number") {
      options.xAxis.type = options.xAxis.type || "linear";
    } else {
      options.xAxis.type = chart.xtype === "string" ? "category" : "datetime";
    }
    if (!options.chart.type) {
      options.chart.type = chartType;
    }
    setFormatOptions(chart, options, chartType);

    var series = chart.data;
    for (i = 0; i < series.length; i++) {
      series[i].name = series[i].name || "Value";
      data = series[i].data;
      if (chart.xtype === "datetime") {
        for (j = 0; j < data.length; j++) {
          data[j][0] = data[j][0].getTime();
        }
      }
      series[i].marker = {symbol: "circle"};
      if (chart.options.points === false) {
        series[i].marker.enabled = false;
      }
    }

    this.drawChart(chart, series, options);
  };

  defaultExport$1.prototype.renderScatterChart = function renderScatterChart (chart) {
    var options = jsOptions$1(chart, chart.options, {});
    options.chart.type = "scatter";
    this.drawChart(chart, chart.data, options);
  };

  defaultExport$1.prototype.renderPieChart = function renderPieChart (chart) {
    var chartOptions = merge(defaultOptions$1, {});

    if (chart.options.colors) {
      chartOptions.colors = chart.options.colors;
    }
    if (chart.options.donut) {
      chartOptions.plotOptions = {pie: {innerSize: "50%"}};
    }

    if ("legend" in chart.options) {
      hideLegend$1(chartOptions, chart.options.legend);
    }

    if (chart.options.title) {
      setTitle$1(chartOptions, chart.options.title);
    }

    var options = merge(chartOptions, chart.options.library || {});
    setFormatOptions(chart, options, "pie");
    var series = [{
      type: "pie",
      name: chart.options.label || "Value",
      data: chart.data
    }];

    this.drawChart(chart, series, options);
  };

  defaultExport$1.prototype.renderColumnChart = function renderColumnChart (chart, chartType) {
    chartType = chartType || "column";
    var series = chart.data;
    var options = jsOptions$1(chart, chart.options), i, j, s, d, rows = [], categories = [];
    options.chart.type = chartType;
    setFormatOptions(chart, options, chartType);

    for (i = 0; i < series.length; i++) {
      s = series[i];

      for (j = 0; j < s.data.length; j++) {
        d = s.data[j];
        if (!rows[d[0]]) {
          rows[d[0]] = new Array(series.length);
          categories.push(d[0]);
        }
        rows[d[0]][i] = d[1];
      }
    }

    if (chart.xtype === "number") {
      categories.sort(sortByNumber);
    }

    options.xAxis.categories = categories;

    var newSeries = [], d2;
    for (i = 0; i < series.length; i++) {
      d = [];
      for (j = 0; j < categories.length; j++) {
        d.push(rows[categories[j]][i] || 0);
      }

      d2 = {
        name: series[i].name || "Value",
        data: d
      };
      if (series[i].stack) {
        d2.stack = series[i].stack;
      }

      newSeries.push(d2);
    }

    this.drawChart(chart, newSeries, options);
  };

  defaultExport$1.prototype.renderBarChart = function renderBarChart (chart) {
    this.renderColumnChart(chart, "bar");
  };

  defaultExport$1.prototype.renderAreaChart = function renderAreaChart (chart) {
    this.renderLineChart(chart, "areaspline");
  };

  defaultExport$1.prototype.destroy = function destroy (chart) {
    if (chart.chart) {
      chart.chart.destroy();
    }
  };

  defaultExport$1.prototype.drawChart = function drawChart (chart, data, options) {
    this.destroy(chart);
    if (chart.destroyed) { return; }

    options.chart.renderTo = chart.element.id;
    options.series = data;

    if (chart.options.code) {
      window.console.log("new Highcharts.Chart(" + JSON.stringify(options) + ");");
    }

    chart.chart = new this.library.Chart(options);
  };

  var loaded = {};
  var callbacks = [];

  // Set chart options
  var defaultOptions = {
    chartArea: {},
    fontName: "'Lucida Grande', 'Lucida Sans Unicode', Verdana, Arial, Helvetica, sans-serif",
    pointSize: 6,
    legend: {
      textStyle: {
        fontSize: 12,
        color: "#444"
      },
      alignment: "center",
      position: "right"
    },
    curveType: "function",
    hAxis: {
      textStyle: {
        color: "#666",
        fontSize: 12
      },
      titleTextStyle: {},
      gridlines: {
        color: "transparent"
      },
      baselineColor: "#ccc",
      viewWindow: {}
    },
    vAxis: {
      textStyle: {
        color: "#666",
        fontSize: 12
      },
      titleTextStyle: {},
      baselineColor: "#ccc",
      viewWindow: {}
    },
    tooltip: {
      textStyle: {
        color: "#666",
        fontSize: 12
      }
    }
  };

  var hideLegend = function (options, legend, hideLegend) {
    if (legend !== undefined) {
      var position;
      if (!legend) {
        position = "none";
      } else if (legend === true) {
        position = "right";
      } else {
        position = legend;
      }
      options.legend.position = position;
    } else if (hideLegend) {
      options.legend.position = "none";
    }
  };

  var setTitle = function (options, title) {
    options.title = title;
    options.titleTextStyle = {color: "#333", fontSize: "20px"};
  };

  var setMin = function (options, min) {
    options.vAxis.viewWindow.min = min;
  };

  var setMax = function (options, max) {
    options.vAxis.viewWindow.max = max;
  };

  var setBarMin = function (options, min) {
    options.hAxis.viewWindow.min = min;
  };

  var setBarMax = function (options, max) {
    options.hAxis.viewWindow.max = max;
  };

  var setStacked = function (options, stacked) {
    options.isStacked = stacked ? stacked : false;
  };

  var setXtitle = function (options, title) {
    options.hAxis.title = title;
    options.hAxis.titleTextStyle.italic = false;
  };

  var setYtitle = function (options, title) {
    options.vAxis.title = title;
    options.vAxis.titleTextStyle.italic = false;
  };

  var jsOptions = jsOptionsFunc(defaultOptions, hideLegend, setTitle, setMin, setMax, setStacked, setXtitle, setYtitle);

  var resize = function (callback) {
    if (window.attachEvent) {
      window.attachEvent("onresize", callback);
    } else if (window.addEventListener) {
      window.addEventListener("resize", callback, true);
    }
    callback();
  };

  var defaultExport = function defaultExport(library) {
    this.name = "google";
    this.library = library;
  };

  defaultExport.prototype.renderLineChart = function renderLineChart (chart) {
      var this$1 = this;

    this.waitForLoaded(chart, function () {
      var chartOptions = {};

      if (chart.options.curve === false) {
        chartOptions.curveType = "none";
      }

      if (chart.options.points === false) {
        chartOptions.pointSize = 0;
      }

      var options = jsOptions(chart, chart.options, chartOptions);
      var data = this$1.createDataTable(chart.data, chart.xtype);

      this$1.drawChart(chart, "LineChart", data, options);
    });
  };

  defaultExport.prototype.renderPieChart = function renderPieChart (chart) {
      var this$1 = this;

    this.waitForLoaded(chart, function () {
      var chartOptions = {
        chartArea: {
          top: "10%",
          height: "80%"
        },
        legend: {}
      };
      if (chart.options.colors) {
        chartOptions.colors = chart.options.colors;
      }
      if (chart.options.donut) {
        chartOptions.pieHole = 0.5;
      }
      if ("legend" in chart.options) {
        hideLegend(chartOptions, chart.options.legend);
      }
      if (chart.options.title) {
        setTitle(chartOptions, chart.options.title);
      }
      var options = merge(merge(defaultOptions, chartOptions), chart.options.library || {});

      var data = new this$1.library.visualization.DataTable();
      data.addColumn("string", "");
      data.addColumn("number", "Value");
      data.addRows(chart.data);

      this$1.drawChart(chart, "PieChart", data, options);
    });
  };

  defaultExport.prototype.renderColumnChart = function renderColumnChart (chart) {
      var this$1 = this;

    this.waitForLoaded(chart, function () {
      var options = jsOptions(chart, chart.options);
      var data = this$1.createDataTable(chart.data, chart.xtype);

      this$1.drawChart(chart, "ColumnChart", data, options);
    });
  };

  defaultExport.prototype.renderBarChart = function renderBarChart (chart) {
      var this$1 = this;

    this.waitForLoaded(chart, function () {
      var chartOptions = {
        hAxis: {
          gridlines: {
            color: "#ccc"
          }
        }
      };
      var options = jsOptionsFunc(defaultOptions, hideLegend, setTitle, setBarMin, setBarMax, setStacked, setXtitle, setYtitle)(chart, chart.options, chartOptions);
      var data = this$1.createDataTable(chart.data, chart.xtype);

      this$1.drawChart(chart, "BarChart", data, options);
    });
  };

  defaultExport.prototype.renderAreaChart = function renderAreaChart (chart) {
      var this$1 = this;

    this.waitForLoaded(chart, function () {
      var chartOptions = {
        isStacked: true,
        pointSize: 0,
        areaOpacity: 0.5
      };

      var options = jsOptions(chart, chart.options, chartOptions);
      var data = this$1.createDataTable(chart.data, chart.xtype);

      this$1.drawChart(chart, "AreaChart", data, options);
    });
  };

  defaultExport.prototype.renderGeoChart = function renderGeoChart (chart) {
      var this$1 = this;

    this.waitForLoaded(chart, "geochart", function () {
      var chartOptions = {
        legend: "none",
        colorAxis: {
          colors: chart.options.colors || ["#f6c7b6", "#ce502d"]
        }
      };
      var options = merge(merge(defaultOptions, chartOptions), chart.options.library || {});

      var data = new this$1.library.visualization.DataTable();
      data.addColumn("string", "");
      data.addColumn("number", chart.options.label || "Value");
      data.addRows(chart.data);

      this$1.drawChart(chart, "GeoChart", data, options);
    });
  };

  defaultExport.prototype.renderScatterChart = function renderScatterChart (chart) {
      var this$1 = this;

    this.waitForLoaded(chart, function () {
      var chartOptions = {};
      var options = jsOptions(chart, chart.options, chartOptions);

      var series = chart.data, rows2 = [], i, j, data, d;
      for (i = 0; i < series.length; i++) {
        series[i].name = series[i].name || "Value";
        d = series[i].data;
        for (j = 0; j < d.length; j++) {
          var row = new Array(series.length + 1);
          row[0] = d[j][0];
          row[i + 1] = d[j][1];
          rows2.push(row);
        }
      }

      data = new this$1.library.visualization.DataTable();
      data.addColumn("number", "");
      for (i = 0; i < series.length; i++) {
        data.addColumn("number", series[i].name);
      }
      data.addRows(rows2);

      this$1.drawChart(chart, "ScatterChart", data, options);
    });
  };

  defaultExport.prototype.renderTimeline = function renderTimeline (chart) {
      var this$1 = this;

    this.waitForLoaded(chart, "timeline", function () {
      var chartOptions = {
        legend: "none"
      };

      if (chart.options.colors) {
        chartOptions.colors = chart.options.colors;
      }
      var options = merge(merge(defaultOptions, chartOptions), chart.options.library || {});

      var data = new this$1.library.visualization.DataTable();
      data.addColumn({type: "string", id: "Name"});
      data.addColumn({type: "date", id: "Start"});
      data.addColumn({type: "date", id: "End"});
      data.addRows(chart.data);

      chart.element.style.lineHeight = "normal";

      this$1.drawChart(chart, "Timeline", data, options);
    });
  };

  // TODO remove resize events
  defaultExport.prototype.destroy = function destroy (chart) {
    if (chart.chart) {
      chart.chart.clearChart();
    }
  };

  defaultExport.prototype.drawChart = function drawChart (chart, type, data, options) {
    this.destroy(chart);
    if (chart.destroyed) { return; }

    if (chart.options.code) {
      window.console.log("var data = new google.visualization.DataTable(" + data.toJSON() + ");\nvar chart = new google.visualization." + type + "(element);\nchart.draw(data, " + JSON.stringify(options) + ");");
    }

    chart.chart = new this.library.visualization[type](chart.element);
    resize(function () {
      chart.chart.draw(data, options);
    });
  };

  defaultExport.prototype.waitForLoaded = function waitForLoaded (chart, pack, callback) {
      var this$1 = this;

    if (!callback) {
      callback = pack;
      pack = "corechart";
    }

    callbacks.push({pack: pack, callback: callback});

    if (loaded[pack]) {
      this.runCallbacks();
    } else {
      loaded[pack] = true;

      // https://groups.google.com/forum/#!topic/google-visualization-api/fMKJcyA2yyI
      var loadOptions = {
        packages: [pack],
        callback: function () { this$1.runCallbacks(); }
      };
      var config = chart.__config();
      if (config.language) {
        loadOptions.language = config.language;
      }
      if (pack === "geochart" && config.mapsApiKey) {
        loadOptions.mapsApiKey = config.mapsApiKey;
      }

      this.library.charts.load("current", loadOptions);
    }
  };

  defaultExport.prototype.runCallbacks = function runCallbacks () {
    var cb, call;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      call = this.library.visualization && ((cb.pack === "corechart" && this.library.visualization.LineChart) || (cb.pack === "timeline" && this.library.visualization.Timeline) || (cb.pack === "geochart" && this.library.visualization.GeoChart));
      if (call) {
        cb.callback();
        callbacks.splice(i, 1);
        i--;
      }
    }
  };

  // cant use object as key
  defaultExport.prototype.createDataTable = function createDataTable (series, columnType) {
    var i, j, s, d, key, rows = [], sortedLabels = [];
    for (i = 0; i < series.length; i++) {
      s = series[i];
      series[i].name = series[i].name || "Value";

      for (j = 0; j < s.data.length; j++) {
        d = s.data[j];
        key = (columnType === "datetime") ? d[0].getTime() : d[0];
        if (!rows[key]) {
          rows[key] = new Array(series.length);
          sortedLabels.push(key);
        }
        rows[key][i] = toFloat(d[1]);
      }
    }

    var rows2 = [];
    var day = true;
    var value;
    for (j = 0; j < sortedLabels.length; j++) {
      i = sortedLabels[j];
      if (columnType === "datetime") {
        value = new Date(toFloat(i));
        day = day && isDay(value);
      } else if (columnType === "number") {
        value = toFloat(i);
      } else {
        value = i;
      }
      rows2.push([value].concat(rows[i]));
    }
    if (columnType === "datetime") {
      rows2.sort(sortByTime);
    } else if (columnType === "number") {
      rows2.sort(sortByNumberSeries);

      for (i = 0; i < rows2.length; i++) {
        rows2[i][0] = toStr(rows2[i][0]);
      }

      columnType = "string";
    }

    // create datatable
    var data = new this.library.visualization.DataTable();
    columnType = columnType === "datetime" && day ? "date" : columnType;
    data.addColumn(columnType, "");
    for (i = 0; i < series.length; i++) {
      data.addColumn("number", series[i].name);
    }
    data.addRows(rows2);

    return data;
  };

  function formatSeriesData(data, keyType) {
    var r = [], j, keyFunc;

    if (keyType === "number") {
      keyFunc = toFloat;
    } else if (keyType === "datetime") {
      keyFunc = toDate;
    } else {
      keyFunc = toStr;
    }

    if (keyType === "bubble") {
      for (j = 0; j < data.length; j++) {
        r.push([toFloat(data[j][0]), toFloat(data[j][1]), toFloat(data[j][2])]);
      }
    } else {
      for (j = 0; j < data.length; j++) {
        r.push([keyFunc(data[j][0]), toFloat(data[j][1])]);
      }
    }

    if (keyType === "datetime") {
      r.sort(sortByTime);
    } else if (keyType === "number") {
      r.sort(sortByNumberSeries);
    }

    return r;
  }

  function detectXType(series, noDatetime, options) {
    if (dataEmpty(series)) {
      if ((options.xmin || options.xmax) && (!options.xmin || isDate(options.xmin)) && (!options.xmax || isDate(options.xmax))) {
        return "datetime";
      } else {
        return "number";
      }
    } else if (detectXTypeWithFunction(series, isNumber)) {
      return "number";
    } else if (!noDatetime && detectXTypeWithFunction(series, isDate)) {
      return "datetime";
    } else {
      return "string";
    }
  }

  function detectXTypeWithFunction(series, func) {
    var i, j, data;
    for (i = 0; i < series.length; i++) {
      data = toArr(series[i].data);
      for (j = 0; j < data.length; j++) {
        if (!func(data[j][0])) {
          return false;
        }
      }
    }
    return true;
  }

  // creates a shallow copy of each element of the array
  // elements are expected to be objects
  function copySeries(series) {
    var newSeries = [], i, j;
    for (i = 0; i < series.length; i++) {
      var copy = {};
      for (j in series[i]) {
        if (series[i].hasOwnProperty(j)) {
          copy[j] = series[i][j];
        }
      }
      newSeries.push(copy);
    }
    return newSeries;
  }

  function processSeries(chart, keyType, noDatetime) {
    var i;

    var opts = chart.options;
    var series = chart.rawData;

    // see if one series or multiple
    chart.singleSeriesFormat = (!isArray(series) || typeof series[0] !== "object" || isArray(series[0]));
    if (chart.singleSeriesFormat) {
      series = [{name: opts.label, data: series}];
    }

    // convert to array
    // must come before dataEmpty check
    series = copySeries(series);
    for (i = 0; i < series.length; i++) {
      series[i].data = toArr(series[i].data);
    }

    chart.xtype = keyType ? keyType : (opts.discrete ? "string" : detectXType(series, noDatetime, opts));

    // right format
    for (i = 0; i < series.length; i++) {
      series[i].data = formatSeriesData(series[i].data, chart.xtype);
    }

    return series;
  }

  function processSimple(chart) {
    var perfectData = toArr(chart.rawData), i;
    for (i = 0; i < perfectData.length; i++) {
      perfectData[i] = [toStr(perfectData[i][0]), toFloat(perfectData[i][1])];
    }
    return perfectData;
  }

  function dataEmpty(data, chartType) {
    if (chartType === "PieChart" || chartType === "GeoChart" || chartType === "Timeline") {
      return data.length === 0;
    } else {
      for (var i = 0; i < data.length; i++) {
        if (data[i].data.length > 0) {
          return false;
        }
      }
      return true;
    }
  }

  function addDownloadButton(chart) {
    var element = chart.element;
    var link = document.createElement("a");

    var download = chart.options.download;
    if (download === true) {
      download = {};
    } else if (typeof download === "string") {
      download = {filename: download};
    }
    link.download = download.filename || "chart.png"; // https://caniuse.com/download

    link.style.position = "absolute";
    link.style.top = "20px";
    link.style.right = "20px";
    link.style.zIndex = 1000;
    link.style.lineHeight = "20px";
    link.target = "_blank"; // for safari
    var image = document.createElement("img");
    image.alt = "Download";
    image.style.border = "none";
    // icon from font-awesome
    // http://fa2png.io/
    image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAABCFBMVEUAAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMywEsqxAAAAV3RSTlMAAQIDBggJCgsMDQ4PERQaHB0eISIjJCouLzE0OTo/QUJHSUpLTU5PUllhYmltcHh5foWLjI+SlaCio6atr7S1t7m6vsHHyM7R2tze5Obo7fHz9ff5+/1hlxK2AAAA30lEQVQYGUXBhVYCQQBA0TdYWAt2d3d3YWAHyur7/z9xgD16Lw0DW+XKx+1GgX+FRzM3HWQWrHl5N/oapW5RPe0PkBu+UYeICvozTWZVK23Ao04B79oJrOsJDOoxkZoQPWgX29pHpCZEk7rEvQYiNSFq1UMqvlCjJkRBS1R8hb00Vb/TajtBL7nTHE1X1vyMQF732dQhyF2o6SAwrzP06iUQzvwsArlnzcOdrgBhJyHa1QOgO9U1GsKuvjUTjavliZYQ8nNPapG6sap/3nrIdJ6bOWzmX/fy0XVpfzZP3S8OJT3g9EEiJwAAAABJRU5ErkJggg==";
    link.appendChild(image);
    element.style.position = "relative";

    chart.__downloadAttached = true;

    // mouseenter
    chart.__enterEvent = addEvent(element, "mouseover", function(e) {
      var related = e.relatedTarget;
      // check download option again to ensure it wasn't changed
      if ((!related || (related !== this && !childOf(this, related))) && chart.options.download) {
        link.href = chart.toImage(download);
        element.appendChild(link);
      }
    });

    // mouseleave
    chart.__leaveEvent = addEvent(element, "mouseout", function(e) {
      var related = e.relatedTarget;
      if (!related || (related !== this && !childOf(this, related))) {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }
    });
  }

  // https://stackoverflow.com/questions/10149963/adding-event-listener-cross-browser
  function addEvent(elem, event, fn) {
    if (elem.addEventListener) {
      elem.addEventListener(event, fn, false);
      return fn;
    } else {
      var fn2 = function() {
        // set the this pointer same as addEventListener when fn is called
        return(fn.call(elem, window.event));
      };
      elem.attachEvent("on" + event, fn2);
      return fn2;
    }
  }

  function removeEvent(elem, event, fn) {
    if (elem.removeEventListener) {
      elem.removeEventListener(event, fn, false);
    } else {
      elem.detachEvent("on" + event, fn);
    }
  }

  // https://gist.github.com/shawnbot/4166283
  function childOf(p, c) {
    if (p === c) { return false; }
    while (c && c !== p) { c = c.parentNode; }
    return c === p;
  }

  var pendingRequests = [], runningRequests = 0, maxRequests = 4;

  function pushRequest(url, success, error) {
    pendingRequests.push([url, success, error]);
    runNext();
  }

  function runNext() {
    if (runningRequests < maxRequests) {
      var request = pendingRequests.shift();
      if (request) {
        runningRequests++;
        getJSON(request[0], request[1], request[2]);
        runNext();
      }
    }
  }

  function requestComplete() {
    runningRequests--;
    runNext();
  }

  function getJSON(url, success, error) {
    ajaxCall(url, success, function (jqXHR, textStatus, errorThrown) {
      var message = (typeof errorThrown === "string") ? errorThrown : errorThrown.message;
      error(message);
    });
  }

  function ajaxCall(url, success, error) {
    var $ = window.jQuery || window.Zepto || window.$;

    if ($ && $.ajax) {
      $.ajax({
        dataType: "json",
        url: url,
        success: success,
        error: error,
        complete: requestComplete
      });
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = function () {
        requestComplete();
        if (xhr.status === 200) {
          success(JSON.parse(xhr.responseText), xhr.statusText, xhr);
        } else {
          error(xhr, "error", xhr.statusText);
        }
      };
      xhr.send();
    }
  }

  var config = {};
  var adapters = [];

  // helpers

  function setText(element, text) {
    if (document.body.innerText) {
      element.innerText = text;
    } else {
      element.textContent = text;
    }
  }

  // TODO remove prefix for all messages
  function chartError(element, message, noPrefix) {
    if (!noPrefix) {
      message = "Error Loading Chart: " + message;
    }
    setText(element, message);
    element.style.color = "#ff0000";
  }

  function errorCatcher(chart) {
    try {
      chart.__render();
    } catch (err) {
      chartError(chart.element, err.message);
      throw err;
    }
  }

  function fetchDataSource(chart, dataSource, showLoading) {
    // only show loading message for urls and callbacks
    if (showLoading && chart.options.loading && (typeof dataSource === "string" || typeof dataSource === "function")) {
      setText(chart.element, chart.options.loading);
    }

    if (typeof dataSource === "string") {
      pushRequest(dataSource, function (data) {
        chart.rawData = data;
        errorCatcher(chart);
      }, function (message) {
        chartError(chart.element, message);
      });
    } else if (typeof dataSource === "function") {
      try {
        dataSource(function (data) {
          chart.rawData = data;
          errorCatcher(chart);
        }, function (message) {
          chartError(chart.element, message, true);
        });
      } catch (err) {
        chartError(chart.element, err, true);
      }
    } else {
      chart.rawData = dataSource;
      errorCatcher(chart);
    }
  }

  function getAdapterType(library) {
    if (library) {
      if (library.product === "Highcharts") {
        return defaultExport$1;
      } else if (library.charts) {
        return defaultExport;
      } else if (isFunction(library)) {
        return defaultExport$2;
      }
    }
    throw new Error("Unknown adapter");
  }

  function addAdapter(library) {
    var adapterType = getAdapterType(library);
    var adapter = new adapterType(library);

    if (adapters.indexOf(adapter) === -1) {
      adapters.push(adapter);
    }
  }

  function loadAdapters() {
    if ("Chart" in window) {
      addAdapter(window.Chart);
    }

    if ("Highcharts" in window) {
      addAdapter(window.Highcharts);
    }

    if (window.google && window.google.charts) {
      addAdapter(window.google);
    }
  }

  function renderChart(chartType, chart) {
    if (dataEmpty(chart.data, chartType)) {
      var message = chart.options.empty || (chart.options.messages && chart.options.messages.empty) || "No data";
      setText(chart.element, message);
    } else {
      callAdapter(chartType, chart);
      if (chart.options.download && !chart.__downloadAttached && chart.adapter === "chartjs") {
        addDownloadButton(chart);
      }
    }
  }

  // TODO remove chartType if cross-browser way
  // to get the name of the chart class
  function callAdapter(chartType, chart) {
    var i, adapter, fnName, adapterName;
    fnName = "render" + chartType;
    adapterName = chart.options.adapter;

    loadAdapters();

    for (i = 0; i < adapters.length; i++) {
      adapter = adapters[i];
      if ((!adapterName || adapterName === adapter.name) && isFunction(adapter[fnName])) {
        chart.adapter = adapter.name;
        chart.__adapterObject = adapter;
        return adapter[fnName](chart);
      }
    }

    if (adapters.length > 0) {
      throw new Error("No charting library found for " + chartType);
    } else {
      throw new Error("No charting libraries found - be sure to include one before your charts");
    }
  }

  // define classes

  var Chart = function Chart(element, dataSource, options) {
    var elementId;
    if (typeof element === "string") {
      elementId = element;
      element = document.getElementById(element);
      if (!element) {
        throw new Error("No element with id " + elementId);
      }
    }
    this.element = element;
    this.options = merge(Chartkick.options, options || {});
    this.dataSource = dataSource;

    Chartkick.charts[element.id] = this;

    fetchDataSource(this, dataSource, true);

    if (this.options.refresh) {
      this.startRefresh();
    }
  };

  Chart.prototype.getElement = function getElement () {
    return this.element;
  };

  Chart.prototype.getDataSource = function getDataSource () {
    return this.dataSource;
  };

  Chart.prototype.getData = function getData () {
    return this.data;
  };

  Chart.prototype.getOptions = function getOptions () {
    return this.options;
  };

  Chart.prototype.getChartObject = function getChartObject () {
    return this.chart;
  };

  Chart.prototype.getAdapter = function getAdapter () {
    return this.adapter;
  };

  Chart.prototype.updateData = function updateData (dataSource, options) {
    this.dataSource = dataSource;
    if (options) {
      this.__updateOptions(options);
    }
    fetchDataSource(this, dataSource, true);
  };

  Chart.prototype.setOptions = function setOptions (options) {
    this.__updateOptions(options);
    this.redraw();
  };

  Chart.prototype.redraw = function redraw () {
    fetchDataSource(this, this.rawData);
  };

  Chart.prototype.refreshData = function refreshData () {
    if (typeof this.dataSource === "string") {
      // prevent browser from caching
      var sep = this.dataSource.indexOf("?") === -1 ? "?" : "&";
      var url = this.dataSource + sep + "_=" + (new Date()).getTime();
      fetchDataSource(this, url);
    } else if (typeof this.dataSource === "function") {
      fetchDataSource(this, this.dataSource);
    }
  };

  Chart.prototype.startRefresh = function startRefresh () {
      var this$1 = this;

    var refresh = this.options.refresh;

    if (refresh && typeof this.dataSource !== "string" && typeof this.dataSource !== "function") {
      throw new Error("Data source must be a URL or callback for refresh");
    }

    if (!this.intervalId) {
      if (refresh) {
        this.intervalId = setInterval( function () {
          this$1.refreshData();
        }, refresh * 1000);
      } else {
        throw new Error("No refresh interval");
      }
    }
  };

  Chart.prototype.stopRefresh = function stopRefresh () {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  };

  Chart.prototype.toImage = function toImage (download) {
    if (this.adapter === "chartjs") {
      if (download && download.background && download.background !== "transparent") {
        // https://stackoverflow.com/questions/30464750/chartjs-line-chart-set-background-color
        var canvas = this.chart.canvas;
        var ctx = this.chart.ctx;
        var tmpCanvas = document.createElement("canvas");
        var tmpCtx = tmpCanvas.getContext("2d");
        tmpCanvas.width = ctx.canvas.width;
        tmpCanvas.height = ctx.canvas.height;
        tmpCtx.fillStyle = download.background;
        tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        tmpCtx.drawImage(canvas, 0, 0);
        return tmpCanvas.toDataURL("image/png");
      } else {
        return this.chart.toBase64Image();
      }
    } else {
      throw new Error("Feature only available for Chart.js");
    }
  };

  Chart.prototype.destroy = function destroy () {
    this.destroyed = true;
    this.stopRefresh();

    if (this.__adapterObject) {
      this.__adapterObject.destroy(this);
    }

    if (this.__enterEvent) {
      removeEvent(this.element, "mouseover", this.__enterEvent);
    }

    if (this.__leaveEvent) {
      removeEvent(this.element, "mouseout", this.__leaveEvent);
    }
  };

  Chart.prototype.__updateOptions = function __updateOptions (options) {
    var updateRefresh = options.refresh && options.refresh !== this.options.refresh;
    this.options = merge(Chartkick.options, options);
    if (updateRefresh) {
      this.stopRefresh();
      this.startRefresh();
    }
  };

  Chart.prototype.__render = function __render () {
    this.data = this.__processData();
    renderChart(this.__chartName(), this);
  };

  Chart.prototype.__config = function __config () {
    return config;
  };

  var LineChart = /*@__PURE__*/(function (Chart) {
    function LineChart () {
      Chart.apply(this, arguments);
    }

    if ( Chart ) LineChart.__proto__ = Chart;
    LineChart.prototype = Object.create( Chart && Chart.prototype );
    LineChart.prototype.constructor = LineChart;

    LineChart.prototype.__processData = function __processData () {
      return processSeries(this);
    };

    LineChart.prototype.__chartName = function __chartName () {
      return "LineChart";
    };

    return LineChart;
  }(Chart));

  var PieChart = /*@__PURE__*/(function (Chart) {
    function PieChart () {
      Chart.apply(this, arguments);
    }

    if ( Chart ) PieChart.__proto__ = Chart;
    PieChart.prototype = Object.create( Chart && Chart.prototype );
    PieChart.prototype.constructor = PieChart;

    PieChart.prototype.__processData = function __processData () {
      return processSimple(this);
    };

    PieChart.prototype.__chartName = function __chartName () {
      return "PieChart";
    };

    return PieChart;
  }(Chart));

  var ColumnChart = /*@__PURE__*/(function (Chart) {
    function ColumnChart () {
      Chart.apply(this, arguments);
    }

    if ( Chart ) ColumnChart.__proto__ = Chart;
    ColumnChart.prototype = Object.create( Chart && Chart.prototype );
    ColumnChart.prototype.constructor = ColumnChart;

    ColumnChart.prototype.__processData = function __processData () {
      return processSeries(this, null, true);
    };

    ColumnChart.prototype.__chartName = function __chartName () {
      return "ColumnChart";
    };

    return ColumnChart;
  }(Chart));

  var BarChart = /*@__PURE__*/(function (Chart) {
    function BarChart () {
      Chart.apply(this, arguments);
    }

    if ( Chart ) BarChart.__proto__ = Chart;
    BarChart.prototype = Object.create( Chart && Chart.prototype );
    BarChart.prototype.constructor = BarChart;

    BarChart.prototype.__processData = function __processData () {
      return processSeries(this, null, true);
    };

    BarChart.prototype.__chartName = function __chartName () {
      return "BarChart";
    };

    return BarChart;
  }(Chart));

  var AreaChart = /*@__PURE__*/(function (Chart) {
    function AreaChart () {
      Chart.apply(this, arguments);
    }

    if ( Chart ) AreaChart.__proto__ = Chart;
    AreaChart.prototype = Object.create( Chart && Chart.prototype );
    AreaChart.prototype.constructor = AreaChart;

    AreaChart.prototype.__processData = function __processData () {
      return processSeries(this);
    };

    AreaChart.prototype.__chartName = function __chartName () {
      return "AreaChart";
    };

    return AreaChart;
  }(Chart));

  var GeoChart = /*@__PURE__*/(function (Chart) {
    function GeoChart () {
      Chart.apply(this, arguments);
    }

    if ( Chart ) GeoChart.__proto__ = Chart;
    GeoChart.prototype = Object.create( Chart && Chart.prototype );
    GeoChart.prototype.constructor = GeoChart;

    GeoChart.prototype.__processData = function __processData () {
      return processSimple(this);
    };

    GeoChart.prototype.__chartName = function __chartName () {
      return "GeoChart";
    };

    return GeoChart;
  }(Chart));

  var ScatterChart = /*@__PURE__*/(function (Chart) {
    function ScatterChart () {
      Chart.apply(this, arguments);
    }

    if ( Chart ) ScatterChart.__proto__ = Chart;
    ScatterChart.prototype = Object.create( Chart && Chart.prototype );
    ScatterChart.prototype.constructor = ScatterChart;

    ScatterChart.prototype.__processData = function __processData () {
      return processSeries(this, "number");
    };

    ScatterChart.prototype.__chartName = function __chartName () {
      return "ScatterChart";
    };

    return ScatterChart;
  }(Chart));

  var BubbleChart = /*@__PURE__*/(function (Chart) {
    function BubbleChart () {
      Chart.apply(this, arguments);
    }

    if ( Chart ) BubbleChart.__proto__ = Chart;
    BubbleChart.prototype = Object.create( Chart && Chart.prototype );
    BubbleChart.prototype.constructor = BubbleChart;

    BubbleChart.prototype.__processData = function __processData () {
      return processSeries(this, "bubble");
    };

    BubbleChart.prototype.__chartName = function __chartName () {
      return "BubbleChart";
    };

    return BubbleChart;
  }(Chart));

  var Timeline = /*@__PURE__*/(function (Chart) {
    function Timeline () {
      Chart.apply(this, arguments);
    }

    if ( Chart ) Timeline.__proto__ = Chart;
    Timeline.prototype = Object.create( Chart && Chart.prototype );
    Timeline.prototype.constructor = Timeline;

    Timeline.prototype.__processData = function __processData () {
      var i, data = this.rawData;
      for (i = 0; i < data.length; i++) {
        data[i][1] = toDate(data[i][1]);
        data[i][2] = toDate(data[i][2]);
      }
      return data;
    };

    Timeline.prototype.__chartName = function __chartName () {
      return "Timeline";
    };

    return Timeline;
  }(Chart));

  var Chartkick = {
    LineChart: LineChart,
    PieChart: PieChart,
    ColumnChart: ColumnChart,
    BarChart: BarChart,
    AreaChart: AreaChart,
    GeoChart: GeoChart,
    ScatterChart: ScatterChart,
    BubbleChart: BubbleChart,
    Timeline: Timeline,
    charts: {},
    configure: function (options) {
      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          config[key] = options[key];
        }
      }
    },
    setDefaultOptions: function (opts) {
      Chartkick.options = opts;
    },
    eachChart: function (callback) {
      for (var chartId in Chartkick.charts) {
        if (Chartkick.charts.hasOwnProperty(chartId)) {
          callback(Chartkick.charts[chartId]);
        }
      }
    },
    destroyAll: function() {
      for (var chartId in Chartkick.charts) {
        if (Chartkick.charts.hasOwnProperty(chartId)) {
          Chartkick.charts[chartId].destroy();
          delete Chartkick.charts[chartId];
        }
      }
    },
    config: config,
    options: {},
    adapters: adapters,
    addAdapter: addAdapter,
    use: function(adapter) {
      addAdapter(adapter);
      return Chartkick;
    }
  };

  // not ideal, but allows for simpler integration
  if (typeof window !== "undefined" && !window.Chartkick) {
    window.Chartkick = Chartkick;

    // clean up previous charts before Turbolinks loads new page
    document.addEventListener("turbolinks:before-render", function() {
      Chartkick.destroyAll();
    });
    document.addEventListener("turbo:before-render", function() {
      Chartkick.destroyAll();
    });

    // use setTimeout so charting library can come later in same JS file
    setTimeout(function() {
      window.dispatchEvent(new Event("chartkick:load"));
    }, 0);
  }

  // backwards compatibility for esm require
  Chartkick.default = Chartkick;

  return Chartkick;

})));


/*
 Highcharts JS v10.1.0 (2022-04-29)

 (c) 2009-2021 Torstein Honsi

 License: www.highcharts.com/license
*/
(function(U,K){"object"===typeof module&&module.exports?(K["default"]=K,module.exports=U.document?K(U):K):"function"===typeof define&&define.amd?define("highcharts/highcharts",function(){return K(U)}):(U.Highcharts&&U.Highcharts.error(16,!0),U.Highcharts=K(U))})("undefined"!==typeof window?window:this,function(U){function K(a,C,f,H){a.hasOwnProperty(C)||(a[C]=H.apply(null,f),"function"===typeof CustomEvent&&U.dispatchEvent(new CustomEvent("HighchartsModuleLoaded",{detail:{path:C,module:a[C]}})))}
var f={};K(f,"Core/Globals.js",[],function(){var a;(function(a){a.SVG_NS="http://www.w3.org/2000/svg";a.product="Highcharts";a.version="10.1.0";a.win="undefined"!==typeof U?U:{};a.doc=a.win.document;a.svg=a.doc&&a.doc.createElementNS&&!!a.doc.createElementNS(a.SVG_NS,"svg").createSVGRect;a.userAgent=a.win.navigator&&a.win.navigator.userAgent||"";a.isChrome=-1!==a.userAgent.indexOf("Chrome");a.isFirefox=-1!==a.userAgent.indexOf("Firefox");a.isMS=/(edge|msie|trident)/i.test(a.userAgent)&&!a.win.opera;
a.isSafari=!a.isChrome&&-1!==a.userAgent.indexOf("Safari");a.isTouchDevice=/(Mobile|Android|Windows Phone)/.test(a.userAgent);a.isWebKit=-1!==a.userAgent.indexOf("AppleWebKit");a.deg2rad=2*Math.PI/360;a.hasBidiBug=a.isFirefox&&4>parseInt(a.userAgent.split("Firefox/")[1],10);a.hasTouch=!!a.win.TouchEvent;a.marginNames=["plotTop","marginRight","marginBottom","plotLeft"];a.noop=function(){};a.supportsPassiveEvents=function(){var f=!1;if(!a.isMS){var C=Object.defineProperty({},"passive",{get:function(){f=
!0}});a.win.addEventListener&&a.win.removeEventListener&&(a.win.addEventListener("testPassive",a.noop,C),a.win.removeEventListener("testPassive",a.noop,C))}return f}();a.charts=[];a.dateFormats={};a.seriesTypes={};a.symbolSizes={};a.chartCount=0})(a||(a={}));"";return a});K(f,"Core/Utilities.js",[f["Core/Globals.js"]],function(a){function f(d,r,h,l){var v=r?"Highcharts error":"Highcharts warning";32===d&&(d=v+": Deprecated member");var m=n(d),c=m?v+" #"+d+": www.highcharts.com/errors/"+d+"/":d.toString();
if("undefined"!==typeof l){var q="";m&&(c+="?");y(l,function(b,d){q+="\n - "+d+": "+b;m&&(c+=encodeURI(d)+"="+encodeURI(b))});c+=q}z(a,"displayError",{chart:h,code:d,message:c,params:l},function(){if(r)throw Error(c);b.console&&-1===f.messages.indexOf(c)&&console.warn(c)});f.messages.push(c)}function B(b,d){var v={};y(b,function(r,h){if(I(b[h],!0)&&!b.nodeType&&d[h])r=B(b[h],d[h]),Object.keys(r).length&&(v[h]=r);else if(I(b[h])||b[h]!==d[h]||h in b&&!(h in d))v[h]=b[h]});return v}function H(b,d){return parseInt(b,
d||10)}function w(b){return"string"===typeof b}function E(b){b=Object.prototype.toString.call(b);return"[object Array]"===b||"[object Array Iterator]"===b}function I(b,d){return!!b&&"object"===typeof b&&(!d||!E(b))}function A(b){return I(b)&&"number"===typeof b.nodeType}function u(b){var d=b&&b.constructor;return!(!I(b,!0)||A(b)||!d||!d.name||"Object"===d.name)}function n(b){return"number"===typeof b&&!isNaN(b)&&Infinity>b&&-Infinity<b}function k(b){return"undefined"!==typeof b&&null!==b}function e(b,
d,h){var v=w(d)&&!k(h),r,l=function(d,h){k(d)?b.setAttribute(h,d):v?(r=b.getAttribute(h))||"class"!==h||(r=b.getAttribute(h+"Name")):b.removeAttribute(h)};w(d)?l(h,d):y(d,l);return r}function c(b,d){var v;b||(b={});for(v in d)b[v]=d[v];return b}function p(){for(var b=arguments,d=b.length,h=0;h<d;h++){var l=b[h];if("undefined"!==typeof l&&null!==l)return l}}function g(b,d){a.isMS&&!a.svg&&d&&k(d.opacity)&&(d.filter="alpha(opacity="+100*d.opacity+")");c(b.style,d)}function t(b){return Math.pow(10,Math.floor(Math.log(b)/
Math.LN10))}function q(b,d){return 1E14<b?b:parseFloat(b.toPrecision(d||14))}function F(d,r,h){var v=a.getStyle||F;if("width"===r)return r=Math.min(d.offsetWidth,d.scrollWidth),h=d.getBoundingClientRect&&d.getBoundingClientRect().width,h<r&&h>=r-1&&(r=Math.floor(h)),Math.max(0,r-(v(d,"padding-left",!0)||0)-(v(d,"padding-right",!0)||0));if("height"===r)return Math.max(0,Math.min(d.offsetHeight,d.scrollHeight)-(v(d,"padding-top",!0)||0)-(v(d,"padding-bottom",!0)||0));b.getComputedStyle||f(27,!0);if(d=
b.getComputedStyle(d,void 0)){var l=d.getPropertyValue(r);p(h,"opacity"!==r)&&(l=H(l))}return l}function y(b,d,h){for(var v in b)Object.hasOwnProperty.call(b,v)&&d.call(h||b[v],b[v],v,b)}function x(b,d,h){function v(d,J){var v=b.removeEventListener||a.removeEventListenerPolyfill;v&&v.call(b,d,J,!1)}function r(r){var J;if(b.nodeName){if(d){var L={};L[d]=!0}else L=r;y(L,function(b,d){if(r[d])for(J=r[d].length;J--;)v(d,r[d][J].fn)})}}var l="function"===typeof b&&b.prototype||b;if(Object.hasOwnProperty.call(l,
"hcEvents")){var m=l.hcEvents;d?(l=m[d]||[],h?(m[d]=l.filter(function(b){return h!==b.fn}),v(d,h)):(r(m),m[d]=[])):(r(m),delete l.hcEvents)}}function z(b,d,l,m){l=l||{};if(h.createEvent&&(b.dispatchEvent||b.fireEvent&&b!==a)){var v=h.createEvent("Events");v.initEvent(d,!0,!0);l=c(v,l);b.dispatchEvent?b.dispatchEvent(l):b.fireEvent(d,l)}else if(b.hcEvents){l.target||c(l,{preventDefault:function(){l.defaultPrevented=!0},target:b,type:d});v=[];for(var r=b,q=!1;r.hcEvents;)Object.hasOwnProperty.call(r,
"hcEvents")&&r.hcEvents[d]&&(v.length&&(q=!0),v.unshift.apply(v,r.hcEvents[d])),r=Object.getPrototypeOf(r);q&&v.sort(function(b,d){return b.order-d.order});v.forEach(function(d){!1===d.fn.call(b,l)&&l.preventDefault()})}m&&!l.defaultPrevented&&m.call(b,l)}var m=a.charts,h=a.doc,b=a.win;(f||(f={})).messages=[];Math.easeInOutSine=function(b){return-.5*(Math.cos(Math.PI*b)-1)};var l=Array.prototype.find?function(b,d){return b.find(d)}:function(b,d){var v,r=b.length;for(v=0;v<r;v++)if(d(b[v],v))return b[v]};
y({map:"map",each:"forEach",grep:"filter",reduce:"reduce",some:"some"},function(b,d){a[d]=function(v){var r;f(32,!1,void 0,(r={},r["Highcharts."+d]="use Array."+b,r));return Array.prototype[b].apply(v,[].slice.call(arguments,1))}});var d,D=function(){var b=Math.random().toString(36).substring(2,9)+"-",r=0;return function(){return"highcharts-"+(d?"":b)+r++}}();b.jQuery&&(b.jQuery.fn.highcharts=function(){var b=[].slice.call(arguments);if(this[0])return b[0]?(new (a[w(b[0])?b.shift():"Chart"])(this[0],
b[0],b[1]),this):m[e(this[0],"data-highcharts-chart")]});l={addEvent:function(b,d,h,l){void 0===l&&(l={});var r="function"===typeof b&&b.prototype||b;Object.hasOwnProperty.call(r,"hcEvents")||(r.hcEvents={});r=r.hcEvents;a.Point&&b instanceof a.Point&&b.series&&b.series.chart&&(b.series.chart.runTrackerClick=!0);var v=b.addEventListener||a.addEventListenerPolyfill;v&&v.call(b,d,h,a.supportsPassiveEvents?{passive:void 0===l.passive?-1!==d.indexOf("touch"):l.passive,capture:!1}:!1);r[d]||(r[d]=[]);
r[d].push({fn:h,order:"number"===typeof l.order?l.order:Infinity});r[d].sort(function(b,d){return b.order-d.order});return function(){x(b,d,h)}},arrayMax:function(b){for(var d=b.length,v=b[0];d--;)b[d]>v&&(v=b[d]);return v},arrayMin:function(b){for(var d=b.length,v=b[0];d--;)b[d]<v&&(v=b[d]);return v},attr:e,clamp:function(b,d,h){return b>d?b<h?b:h:d},cleanRecursively:B,clearTimeout:function(b){k(b)&&clearTimeout(b)},correctFloat:q,createElement:function(b,d,l,m,q){b=h.createElement(b);d&&c(b,d);
q&&g(b,{padding:"0",border:"none",margin:"0"});l&&g(b,l);m&&m.appendChild(b);return b},css:g,defined:k,destroyObjectProperties:function(b,d){y(b,function(r,v){r&&r!==d&&r.destroy&&r.destroy();delete b[v]})},discardElement:function(b){b&&b.parentElement&&b.parentElement.removeChild(b)},erase:function(b,d){for(var r=b.length;r--;)if(b[r]===d){b.splice(r,1);break}},error:f,extend:c,extendClass:function(b,d){var r=function(){};r.prototype=new b;c(r.prototype,d);return r},find:l,fireEvent:z,getMagnitude:t,
getNestedProperty:function(d,r){for(d=d.split(".");d.length&&k(r);){var h=d.shift();if("undefined"===typeof h||"__proto__"===h)return;r=r[h];if(!k(r)||"function"===typeof r||"number"===typeof r.nodeType||r===b)return}return r},getStyle:F,inArray:function(b,d,h){f(32,!1,void 0,{"Highcharts.inArray":"use Array.indexOf"});return d.indexOf(b,h)},isArray:E,isClass:u,isDOMElement:A,isFunction:function(b){return"function"===typeof b},isNumber:n,isObject:I,isString:w,keys:function(b){f(32,!1,void 0,{"Highcharts.keys":"use Object.keys"});
return Object.keys(b)},merge:function(){var b,d=arguments,h={},l=function(b,d){"object"!==typeof b&&(b={});y(d,function(r,J){"__proto__"!==J&&"constructor"!==J&&(!I(r,!0)||u(r)||A(r)?b[J]=d[J]:b[J]=l(b[J]||{},r))});return b};!0===d[0]&&(h=d[1],d=Array.prototype.slice.call(d,2));var m=d.length;for(b=0;b<m;b++)h=l(h,d[b]);return h},normalizeTickInterval:function(b,d,h,l,m){var r=b;h=p(h,t(b));var v=b/h;d||(d=m?[1,1.2,1.5,2,2.5,3,4,5,6,8,10]:[1,2,2.5,5,10],!1===l&&(1===h?d=d.filter(function(b){return 0===
b%1}):.1>=h&&(d=[1/h])));for(l=0;l<d.length&&!(r=d[l],m&&r*h>=b||!m&&v<=(d[l]+(d[l+1]||d[l]))/2);l++);return r=q(r*h,-Math.round(Math.log(.001)/Math.LN10))},objectEach:y,offset:function(d){var r=h.documentElement;d=d.parentElement||d.parentNode?d.getBoundingClientRect():{top:0,left:0,width:0,height:0};return{top:d.top+(b.pageYOffset||r.scrollTop)-(r.clientTop||0),left:d.left+(b.pageXOffset||r.scrollLeft)-(r.clientLeft||0),width:d.width,height:d.height}},pad:function(b,d,h){return Array((d||2)+1-String(b).replace("-",
"").length).join(h||"0")+b},pick:p,pInt:H,relativeLength:function(b,d,h){return/%$/.test(b)?d*parseFloat(b)/100+(h||0):parseFloat(b)},removeEvent:x,splat:function(b){return E(b)?b:[b]},stableSort:function(b,d){var h=b.length,r,l;for(l=0;l<h;l++)b[l].safeI=l;b.sort(function(b,h){r=d(b,h);return 0===r?b.safeI-h.safeI:r});for(l=0;l<h;l++)delete b[l].safeI},syncTimeout:function(b,d,h){if(0<d)return setTimeout(b,d,h);b.call(0,h);return-1},timeUnits:{millisecond:1,second:1E3,minute:6E4,hour:36E5,day:864E5,
week:6048E5,month:24192E5,year:314496E5},uniqueKey:D,useSerialIds:function(b){return d=p(b,d)},wrap:function(b,d,h){var l=b[d];b[d]=function(){var b=Array.prototype.slice.call(arguments),d=arguments,r=this;r.proceed=function(){l.apply(r,arguments.length?arguments:d)};b.unshift(l);b=h.apply(this,b);r.proceed=null;return b}}};"";return l});K(f,"Core/Chart/ChartDefaults.js",[],function(){return{alignThresholds:!1,panning:{enabled:!1,type:"x"},styledMode:!1,borderRadius:0,colorCount:10,allowMutatingData:!0,
defaultSeriesType:"line",ignoreHiddenSeries:!0,spacing:[10,10,15,10],resetZoomButton:{theme:{zIndex:6},position:{align:"right",x:-10,y:10}},zoomBySingleTouch:!1,width:null,height:null,borderColor:"#335cad",backgroundColor:"#ffffff",plotBorderColor:"#cccccc"}});K(f,"Core/Color/Color.js",[f["Core/Globals.js"],f["Core/Utilities.js"]],function(a,f){var C=f.isNumber,H=f.merge,w=f.pInt;f=function(){function f(C){this.rgba=[NaN,NaN,NaN,NaN];this.input=C;var A=a.Color;if(A&&A!==f)return new A(C);if(!(this instanceof
f))return new f(C);this.init(C)}f.parse=function(a){return a?new f(a):f.None};f.prototype.init=function(a){var A;if("object"===typeof a&&"undefined"!==typeof a.stops)this.stops=a.stops.map(function(e){return new f(e[1])});else if("string"===typeof a){this.input=a=f.names[a.toLowerCase()]||a;if("#"===a.charAt(0)){var u=a.length;var n=parseInt(a.substr(1),16);7===u?A=[(n&16711680)>>16,(n&65280)>>8,n&255,1]:4===u&&(A=[(n&3840)>>4|(n&3840)>>8,(n&240)>>4|n&240,(n&15)<<4|n&15,1])}if(!A)for(n=f.parsers.length;n--&&
!A;){var k=f.parsers[n];(u=k.regex.exec(a))&&(A=k.parse(u))}}A&&(this.rgba=A)};f.prototype.get=function(a){var A=this.input,u=this.rgba;if("object"===typeof A&&"undefined"!==typeof this.stops){var n=H(A);n.stops=[].slice.call(n.stops);this.stops.forEach(function(k,e){n.stops[e]=[n.stops[e][0],k.get(a)]});return n}return u&&C(u[0])?"rgb"===a||!a&&1===u[3]?"rgb("+u[0]+","+u[1]+","+u[2]+")":"a"===a?""+u[3]:"rgba("+u.join(",")+")":A};f.prototype.brighten=function(a){var A=this.rgba;if(this.stops)this.stops.forEach(function(n){n.brighten(a)});
else if(C(a)&&0!==a)for(var u=0;3>u;u++)A[u]+=w(255*a),0>A[u]&&(A[u]=0),255<A[u]&&(A[u]=255);return this};f.prototype.setOpacity=function(a){this.rgba[3]=a;return this};f.prototype.tweenTo=function(a,A){var u=this.rgba,n=a.rgba;if(!C(u[0])||!C(n[0]))return a.input||"none";a=1!==n[3]||1!==u[3];return(a?"rgba(":"rgb(")+Math.round(n[0]+(u[0]-n[0])*(1-A))+","+Math.round(n[1]+(u[1]-n[1])*(1-A))+","+Math.round(n[2]+(u[2]-n[2])*(1-A))+(a?","+(n[3]+(u[3]-n[3])*(1-A)):"")+")"};f.names={white:"#ffffff",black:"#000000"};
f.parsers=[{regex:/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]?(?:\.[0-9]+)?)\s*\)/,parse:function(a){return[w(a[1]),w(a[2]),w(a[3]),parseFloat(a[4],10)]}},{regex:/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/,parse:function(a){return[w(a[1]),w(a[2]),w(a[3]),1]}}];f.None=new f("");return f}();"";return f});K(f,"Core/Color/Palettes.js",[],function(){return{colors:"#7cb5ec #434348 #90ed7d #f7a35c #8085e9 #f15c80 #e4d354 #2b908f #f45b5b #91e8e1".split(" ")}});
K(f,"Core/Time.js",[f["Core/Globals.js"],f["Core/Utilities.js"]],function(a,f){var C=a.win,H=f.defined,w=f.error,E=f.extend,I=f.isObject,A=f.merge,u=f.objectEach,n=f.pad,k=f.pick,e=f.splat,c=f.timeUnits,p=a.isSafari&&C.Intl&&C.Intl.DateTimeFormat.prototype.formatRange,g=a.isSafari&&C.Intl&&!C.Intl.DateTimeFormat.prototype.formatRange;f=function(){function t(c){this.options={};this.variableTimezone=this.useUTC=!1;this.Date=C.Date;this.getTimezoneOffset=this.timezoneOffsetFunction();this.update(c)}
t.prototype.get=function(c,e){if(this.variableTimezone||this.timezoneOffset){var q=e.getTime(),p=q-this.getTimezoneOffset(e);e.setTime(p);c=e["getUTC"+c]();e.setTime(q);return c}return this.useUTC?e["getUTC"+c]():e["get"+c]()};t.prototype.set=function(c,e,g){if(this.variableTimezone||this.timezoneOffset){if("Milliseconds"===c||"Seconds"===c||"Minutes"===c&&0===this.getTimezoneOffset(e)%36E5)return e["setUTC"+c](g);var q=this.getTimezoneOffset(e);q=e.getTime()-q;e.setTime(q);e["setUTC"+c](g);c=this.getTimezoneOffset(e);
q=e.getTime()+c;return e.setTime(q)}return this.useUTC||p&&"FullYear"===c?e["setUTC"+c](g):e["set"+c](g)};t.prototype.update=function(c){var e=k(c&&c.useUTC,!0);this.options=c=A(!0,this.options||{},c);this.Date=c.Date||C.Date||Date;this.timezoneOffset=(this.useUTC=e)&&c.timezoneOffset;this.getTimezoneOffset=this.timezoneOffsetFunction();this.variableTimezone=e&&!(!c.getTimezoneOffset&&!c.timezone)};t.prototype.makeTime=function(c,e,p,t,z,m){if(this.useUTC){var h=this.Date.UTC.apply(0,arguments);var b=
this.getTimezoneOffset(h);h+=b;var l=this.getTimezoneOffset(h);b!==l?h+=l-b:b-36E5!==this.getTimezoneOffset(h-36E5)||g||(h-=36E5)}else h=(new this.Date(c,e,k(p,1),k(t,0),k(z,0),k(m,0))).getTime();return h};t.prototype.timezoneOffsetFunction=function(){var c=this,e=this.options,p=e.getTimezoneOffset,g=e.moment||C.moment;if(!this.useUTC)return function(c){return 6E4*(new Date(c.toString())).getTimezoneOffset()};if(e.timezone){if(g)return function(c){return 6E4*-g.tz(c,e.timezone).utcOffset()};w(25)}return this.useUTC&&
p?function(c){return 6E4*p(c.valueOf())}:function(){return 6E4*(c.timezoneOffset||0)}};t.prototype.dateFormat=function(c,e,p){if(!H(e)||isNaN(e))return a.defaultOptions.lang&&a.defaultOptions.lang.invalidDate||"";c=k(c,"%Y-%m-%d %H:%M:%S");var q=this,g=new this.Date(e),m=this.get("Hours",g),h=this.get("Day",g),b=this.get("Date",g),l=this.get("Month",g),d=this.get("FullYear",g),D=a.defaultOptions.lang,v=D&&D.weekdays,r=D&&D.shortWeekdays;g=E({a:r?r[h]:v[h].substr(0,3),A:v[h],d:n(b),e:n(b,2," "),w:h,
b:D.shortMonths[l],B:D.months[l],m:n(l+1),o:l+1,y:d.toString().substr(2,2),Y:d,H:n(m),k:m,I:n(m%12||12),l:m%12||12,M:n(this.get("Minutes",g)),p:12>m?"AM":"PM",P:12>m?"am":"pm",S:n(g.getSeconds()),L:n(Math.floor(e%1E3),3)},a.dateFormats);u(g,function(b,d){for(;-1!==c.indexOf("%"+d);)c=c.replace("%"+d,"function"===typeof b?b.call(q,e):b)});return p?c.substr(0,1).toUpperCase()+c.substr(1):c};t.prototype.resolveDTLFormat=function(c){return I(c,!0)?c:(c=e(c),{main:c[0],from:c[1],to:c[2]})};t.prototype.getTimeTicks=
function(e,g,p,t){var q=this,m=[],h={},b=new q.Date(g),l=e.unitRange,d=e.count||1,D;t=k(t,1);if(H(g)){q.set("Milliseconds",b,l>=c.second?0:d*Math.floor(q.get("Milliseconds",b)/d));l>=c.second&&q.set("Seconds",b,l>=c.minute?0:d*Math.floor(q.get("Seconds",b)/d));l>=c.minute&&q.set("Minutes",b,l>=c.hour?0:d*Math.floor(q.get("Minutes",b)/d));l>=c.hour&&q.set("Hours",b,l>=c.day?0:d*Math.floor(q.get("Hours",b)/d));l>=c.day&&q.set("Date",b,l>=c.month?1:Math.max(1,d*Math.floor(q.get("Date",b)/d)));if(l>=
c.month){q.set("Month",b,l>=c.year?0:d*Math.floor(q.get("Month",b)/d));var v=q.get("FullYear",b)}l>=c.year&&q.set("FullYear",b,v-v%d);l===c.week&&(v=q.get("Day",b),q.set("Date",b,q.get("Date",b)-v+t+(v<t?-7:0)));v=q.get("FullYear",b);t=q.get("Month",b);var r=q.get("Date",b),y=q.get("Hours",b);g=b.getTime();!q.variableTimezone&&q.useUTC||!H(p)||(D=p-g>4*c.month||q.getTimezoneOffset(g)!==q.getTimezoneOffset(p));g=b.getTime();for(b=1;g<p;)m.push(g),g=l===c.year?q.makeTime(v+b*d,0):l===c.month?q.makeTime(v,
t+b*d):!D||l!==c.day&&l!==c.week?D&&l===c.hour&&1<d?q.makeTime(v,t,r,y+b*d):g+l*d:q.makeTime(v,t,r+b*d*(l===c.day?1:7)),b++;m.push(g);l<=c.hour&&1E4>m.length&&m.forEach(function(b){0===b%18E5&&"000000000"===q.dateFormat("%H%M%S%L",b)&&(h[b]="day")})}m.info=E(e,{higherRanks:h,totalRange:l*d});return m};t.prototype.getDateFormat=function(e,g,p,t){var q=this.dateFormat("%m-%d %H:%M:%S.%L",g),m={millisecond:15,second:12,minute:9,hour:6,day:3},h="millisecond";for(b in c){if(e===c.week&&+this.dateFormat("%w",
g)===p&&"00:00:00.000"===q.substr(6)){var b="week";break}if(c[b]>e){b=h;break}if(m[b]&&q.substr(m[b])!=="01-01 00:00:00.000".substr(m[b]))break;"week"!==b&&(h=b)}if(b)var l=this.resolveDTLFormat(t[b]).main;return l};return t}();"";return f});K(f,"Core/DefaultOptions.js",[f["Core/Chart/ChartDefaults.js"],f["Core/Color/Color.js"],f["Core/Globals.js"],f["Core/Color/Palettes.js"],f["Core/Time.js"],f["Core/Utilities.js"]],function(a,f,B,H,w,E){f=f.parse;var C=E.merge,A={colors:H.colors,symbols:["circle",
"diamond","square","triangle","triangle-down"],lang:{loading:"Loading...",months:"January February March April May June July August September October November December".split(" "),shortMonths:"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "),weekdays:"Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),decimalPoint:".",numericSymbols:"kMGTPE".split(""),resetZoom:"Reset zoom",resetZoomTitle:"Reset zoom level 1:1",thousandsSep:" "},global:{},time:{Date:void 0,getTimezoneOffset:void 0,
timezone:void 0,timezoneOffset:0,useUTC:!0},chart:a,title:{text:"Chart title",align:"center",margin:15,widthAdjust:-44},subtitle:{text:"",align:"center",widthAdjust:-44},caption:{margin:15,text:"",align:"left",verticalAlign:"bottom"},plotOptions:{},labels:{style:{position:"absolute",color:"#333333"}},legend:{enabled:!0,align:"center",alignColumns:!0,className:"highcharts-no-tooltip",layout:"horizontal",labelFormatter:function(){return this.name},borderColor:"#999999",borderRadius:0,navigation:{activeColor:"#003399",
inactiveColor:"#cccccc"},itemStyle:{color:"#333333",cursor:"pointer",fontSize:"12px",fontWeight:"bold",textOverflow:"ellipsis"},itemHoverStyle:{color:"#000000"},itemHiddenStyle:{color:"#cccccc"},shadow:!1,itemCheckboxStyle:{position:"absolute",width:"13px",height:"13px"},squareSymbol:!0,symbolPadding:5,verticalAlign:"bottom",x:0,y:0,title:{style:{fontWeight:"bold"}}},loading:{labelStyle:{fontWeight:"bold",position:"relative",top:"45%"},style:{position:"absolute",backgroundColor:"#ffffff",opacity:.5,
textAlign:"center"}},tooltip:{enabled:!0,animation:B.svg,borderRadius:3,dateTimeLabelFormats:{millisecond:"%A, %b %e, %H:%M:%S.%L",second:"%A, %b %e, %H:%M:%S",minute:"%A, %b %e, %H:%M",hour:"%A, %b %e, %H:%M",day:"%A, %b %e, %Y",week:"Week from %A, %b %e, %Y",month:"%B %Y",year:"%Y"},footerFormat:"",headerShape:"callout",hideDelay:500,padding:8,shape:"callout",shared:!1,snap:B.isTouchDevice?25:10,headerFormat:'<span style="font-size: 10px">{point.key}</span><br/>',pointFormat:'<span style="color:{point.color}">\u25cf</span> {series.name}: <b>{point.y}</b><br/>',
backgroundColor:f("#f7f7f7").setOpacity(.85).get(),borderWidth:1,shadow:!0,stickOnContact:!1,style:{color:"#333333",cursor:"default",fontSize:"12px",whiteSpace:"nowrap"},useHTML:!1},credits:{enabled:!0,href:"https://www.highcharts.com?credits",position:{align:"right",x:-10,verticalAlign:"bottom",y:-5},style:{cursor:"pointer",color:"#999999",fontSize:"9px"},text:"Highcharts.com"}};A.chart.styledMode=!1;"";var u=new w(C(A.global,A.time));a={defaultOptions:A,defaultTime:u,getOptions:function(){return A},
setOptions:function(n){C(!0,A,n);if(n.time||n.global)B.time?B.time.update(C(A.global,A.time,n.global,n.time)):B.time=u;return A}};"";return a});K(f,"Core/Animation/Fx.js",[f["Core/Color/Color.js"],f["Core/Globals.js"],f["Core/Utilities.js"]],function(a,f,B){var C=a.parse,w=f.win,E=B.isNumber,I=B.objectEach;return function(){function a(a,n,k){this.pos=NaN;this.options=n;this.elem=a;this.prop=k}a.prototype.dSetter=function(){var a=this.paths,n=a&&a[0];a=a&&a[1];var k=this.now||0,e=[];if(1!==k&&n&&a)if(n.length===
a.length&&1>k)for(var c=0;c<a.length;c++){for(var p=n[c],g=a[c],t=[],q=0;q<g.length;q++){var F=p[q],y=g[q];E(F)&&E(y)&&("A"!==g[0]||4!==q&&5!==q)?t[q]=F+k*(y-F):t[q]=y}e.push(t)}else e=a;else e=this.toD||[];this.elem.attr("d",e,void 0,!0)};a.prototype.update=function(){var a=this.elem,n=this.prop,k=this.now,e=this.options.step;if(this[n+"Setter"])this[n+"Setter"]();else a.attr?a.element&&a.attr(n,k,null,!0):a.style[n]=k+this.unit;e&&e.call(a,k,this)};a.prototype.run=function(u,n,k){var e=this,c=e.options,
p=function(c){return p.stopped?!1:e.step(c)},g=w.requestAnimationFrame||function(c){setTimeout(c,13)},t=function(){for(var c=0;c<a.timers.length;c++)a.timers[c]()||a.timers.splice(c--,1);a.timers.length&&g(t)};u!==n||this.elem["forceAnimate:"+this.prop]?(this.startTime=+new Date,this.start=u,this.end=n,this.unit=k,this.now=this.start,this.pos=0,p.elem=this.elem,p.prop=this.prop,p()&&1===a.timers.push(p)&&g(t)):(delete c.curAnim[this.prop],c.complete&&0===Object.keys(c.curAnim).length&&c.complete.call(this.elem))};
a.prototype.step=function(a){var n=+new Date,k=this.options,e=this.elem,c=k.complete,p=k.duration,g=k.curAnim;if(e.attr&&!e.element)a=!1;else if(a||n>=p+this.startTime){this.now=this.end;this.pos=1;this.update();var t=g[this.prop]=!0;I(g,function(c){!0!==c&&(t=!1)});t&&c&&c.call(e);a=!1}else this.pos=k.easing((n-this.startTime)/p),this.now=this.start+(this.end-this.start)*this.pos,this.update(),a=!0;return a};a.prototype.initPath=function(a,n,k){function e(c,m){for(;c.length<x;){var h=c[0],b=m[x-
c.length];b&&"M"===h[0]&&(c[0]="C"===b[0]?["C",h[1],h[2],h[1],h[2],h[1],h[2]]:["L",h[1],h[2]]);c.unshift(h);t&&(h=c.pop(),c.push(c[c.length-1],h))}}function c(c,m){for(;c.length<x;)if(m=c[Math.floor(c.length/q)-1].slice(),"C"===m[0]&&(m[1]=m[5],m[2]=m[6]),t){var h=c[Math.floor(c.length/q)].slice();c.splice(c.length/2,0,m,h)}else c.push(m)}var p=a.startX,g=a.endX;k=k.slice();var t=a.isArea,q=t?2:1;n=n&&n.slice();if(!n)return[k,k];if(p&&g&&g.length){for(a=0;a<p.length;a++)if(p[a]===g[0]){var F=a;break}else if(p[0]===
g[g.length-p.length+a]){F=a;var y=!0;break}else if(p[p.length-1]===g[g.length-p.length+a]){F=p.length-a;break}"undefined"===typeof F&&(n=[])}if(n.length&&E(F)){var x=k.length+F*q;y?(e(n,k),c(k,n)):(e(k,n),c(n,k))}return[n,k]};a.prototype.fillSetter=function(){a.prototype.strokeSetter.apply(this,arguments)};a.prototype.strokeSetter=function(){this.elem.attr(this.prop,C(this.start).tweenTo(C(this.end),this.pos),void 0,!0)};a.timers=[];return a}()});K(f,"Core/Animation/AnimationUtilities.js",[f["Core/Animation/Fx.js"],
f["Core/Utilities.js"]],function(a,f){function C(c){return u(c)?n({duration:500,defer:0},c):{duration:c?500:0,defer:0}}function H(c,e){for(var g=a.timers.length;g--;)a.timers[g].elem!==c||e&&e!==a.timers[g].prop||(a.timers[g].stopped=!0)}var w=f.defined,E=f.getStyle,I=f.isArray,A=f.isNumber,u=f.isObject,n=f.merge,k=f.objectEach,e=f.pick;return{animate:function(c,e,g){var p,q="",F,y;if(!u(g)){var x=arguments;g={duration:x[2],easing:x[3],complete:x[4]}}A(g.duration)||(g.duration=400);g.easing="function"===
typeof g.easing?g.easing:Math[g.easing]||Math.easeInOutSine;g.curAnim=n(e);k(e,function(t,m){H(c,m);y=new a(c,g,m);F=void 0;"d"===m&&I(e.d)?(y.paths=y.initPath(c,c.pathArray,e.d),y.toD=e.d,p=0,F=1):c.attr?p=c.attr(m):(p=parseFloat(E(c,m))||0,"opacity"!==m&&(q="px"));F||(F=t);"string"===typeof F&&F.match("px")&&(F=F.replace(/px/g,""));y.run(p,F,q)})},animObject:C,getDeferredAnimation:function(c,e,g){var p=C(e),q=0,k=0;(g?[g]:c.series).forEach(function(c){c=C(c.options.animation);q=e&&w(e.defer)?p.defer:
Math.max(q,c.duration+c.defer);k=Math.min(p.duration,c.duration)});c.renderer.forExport&&(q=0);return{defer:Math.max(0,q-k),duration:Math.min(q,k)}},setAnimation:function(c,p){p.renderer.globalAnimation=e(c,p.options.chart.animation,!0)},stop:H}});K(f,"Core/Renderer/HTML/AST.js",[f["Core/Globals.js"],f["Core/Utilities.js"]],function(a,f){var C=a.SVG_NS,H=f.attr,w=f.createElement,E=f.css,I=f.error,A=f.isFunction,u=f.isString,n=f.objectEach,k=f.splat,e=(f=a.win.trustedTypes)&&A(f.createPolicy)&&f.createPolicy("highcharts",
{createHTML:function(c){return c}}),c=e?e.createHTML(""):"";try{var p=!!(new DOMParser).parseFromString(c,"text/html")}catch(g){p=!1}A=function(){function g(c){this.nodes="string"===typeof c?this.parseMarkup(c):c}g.filterUserAttributes=function(c){n(c,function(e,p){var q=!0;-1===g.allowedAttributes.indexOf(p)&&(q=!1);-1!==["background","dynsrc","href","lowsrc","src"].indexOf(p)&&(q=u(e)&&g.allowedReferences.some(function(c){return 0===e.indexOf(c)}));q||(I(33,!1,void 0,{"Invalid attribute in config":""+
p}),delete c[p])});return c};g.parseStyle=function(c){return c.split(";").reduce(function(c,e){e=e.split(":").map(function(c){return c.trim()});var g=e.shift();g&&e.length&&(c[g.replace(/-([a-z])/g,function(c){return c[1].toUpperCase()})]=e.join(":"));return c},{})};g.setElementHTML=function(c,e){c.innerHTML=g.emptyHTML;e&&(new g(e)).addToDOM(c)};g.prototype.addToDOM=function(c){function e(c,p){var q;k(c).forEach(function(c){var m=c.tagName,h=c.textContent?a.doc.createTextNode(c.textContent):void 0,
b=g.bypassHTMLFiltering;if(m)if("#text"===m)var l=h;else if(-1!==g.allowedTags.indexOf(m)||b){m=a.doc.createElementNS("svg"===m?C:p.namespaceURI||C,m);var d=c.attributes||{};n(c,function(b,c){"tagName"!==c&&"attributes"!==c&&"children"!==c&&"style"!==c&&"textContent"!==c&&(d[c]=b)});H(m,b?d:g.filterUserAttributes(d));c.style&&E(m,c.style);h&&m.appendChild(h);e(c.children||[],m);l=m}else I(33,!1,void 0,{"Invalid tagName in config":m});l&&p.appendChild(l);q=l});return q}return e(this.nodes,c)};g.prototype.parseMarkup=
function(c){var q=[];c=c.trim().replace(/ style="/g,' data-style="');if(p)c=(new DOMParser).parseFromString(e?e.createHTML(c):c,"text/html");else{var k=w("div");k.innerHTML=c;c={body:k}}var t=function(c,e){var m=c.nodeName.toLowerCase(),h={tagName:m};"#text"===m&&(h.textContent=c.textContent||"");if(m=c.attributes){var b={};[].forEach.call(m,function(d){"data-style"===d.name?h.style=g.parseStyle(d.value):b[d.name]=d.value});h.attributes=b}if(c.childNodes.length){var l=[];[].forEach.call(c.childNodes,
function(b){t(b,l)});l.length&&(h.children=l)}e.push(h)};[].forEach.call(c.body.childNodes,function(c){return t(c,q)});return q};g.allowedAttributes="aria-controls aria-describedby aria-expanded aria-haspopup aria-hidden aria-label aria-labelledby aria-live aria-pressed aria-readonly aria-roledescription aria-selected class clip-path color colspan cx cy d dx dy disabled fill height href id in markerHeight markerWidth offset opacity orient padding paddingLeft paddingRight patternUnits r refX refY role scope slope src startOffset stdDeviation stroke stroke-linecap stroke-width style tableValues result rowspan summary target tabindex text-align textAnchor textLength title type valign width x x1 x2 y y1 y2 zIndex".split(" ");
g.allowedReferences="https:// http:// mailto: / ../ ./ #".split(" ");g.allowedTags="a abbr b br button caption circle clipPath code dd defs div dl dt em feComponentTransfer feFuncA feFuncB feFuncG feFuncR feGaussianBlur feOffset feMerge feMergeNode filter h1 h2 h3 h4 h5 h6 hr i img li linearGradient marker ol p path pattern pre rect small span stop strong style sub sup svg table text thead tbody tspan td th tr u ul #text".split(" ");g.emptyHTML=c;g.bypassHTMLFiltering=!1;return g}();"";return A});
K(f,"Core/FormatUtilities.js",[f["Core/DefaultOptions.js"],f["Core/Utilities.js"]],function(a,f){function C(a,k,e,c){a=+a||0;k=+k;var p=H.lang,g=(a.toString().split(".")[1]||"").split("e")[0].length,t=a.toString().split("e"),q=k;if(-1===k)k=Math.min(g,20);else if(!I(k))k=2;else if(k&&t[1]&&0>t[1]){var F=k+ +t[1];0<=F?(t[0]=(+t[0]).toExponential(F).split("e")[0],k=F):(t[0]=t[0].split(".")[0]||0,a=20>k?(t[0]*Math.pow(10,t[1])).toFixed(k):0,t[1]=0)}F=(Math.abs(t[1]?t[0]:a)+Math.pow(10,-Math.max(k,g)-
1)).toFixed(k);g=String(u(F));var y=3<g.length?g.length%3:0;e=A(e,p.decimalPoint);c=A(c,p.thousandsSep);a=(0>a?"-":"")+(y?g.substr(0,y)+c:"");a=0>+t[1]&&!q?"0":a+g.substr(y).replace(/(\d{3})(?=\d)/g,"$1"+c);k&&(a+=e+F.slice(-k));t[1]&&0!==+a&&(a+="e"+t[1]);return a}var H=a.defaultOptions,w=a.defaultTime,E=f.getNestedProperty,I=f.isNumber,A=f.pick,u=f.pInt;return{dateFormat:function(a,k,e){return w.dateFormat(a,k,e)},format:function(a,k,e){var c="{",p=!1,g=/f$/,t=/\.([0-9])/,q=H.lang,F=e&&e.time||
w;e=e&&e.numberFormatter||C;for(var y=[];a;){var x=a.indexOf(c);if(-1===x)break;var z=a.slice(0,x);if(p){z=z.split(":");c=E(z.shift()||"",k);if(z.length&&"number"===typeof c)if(z=z.join(":"),g.test(z)){var m=parseInt((z.match(t)||["","-1"])[1],10);null!==c&&(c=e(c,m,q.decimalPoint,-1<z.indexOf(",")?q.thousandsSep:""))}else c=F.dateFormat(z,c);y.push(c)}else y.push(z);a=a.slice(x+1);c=(p=!p)?"}":"{"}y.push(a);return y.join("")},numberFormat:C}});K(f,"Core/Renderer/RendererUtilities.js",[f["Core/Utilities.js"]],
function(a){var f=a.clamp,B=a.pick,H=a.stableSort,w;(function(a){function C(a,u,n){var k=a,e=k.reducedLen||u,c=function(c,e){return(e.rank||0)-(c.rank||0)},p=function(c,e){return c.target-e.target},g,t=!0,q=[],F=0;for(g=a.length;g--;)F+=a[g].size;if(F>e){H(a,c);for(F=g=0;F<=e;)F+=a[g].size,g++;q=a.splice(g-1,a.length)}H(a,p);for(a=a.map(function(c){return{size:c.size,targets:[c.target],align:B(c.align,.5)}});t;){for(g=a.length;g--;)e=a[g],c=(Math.min.apply(0,e.targets)+Math.max.apply(0,e.targets))/
2,e.pos=f(c-e.size*e.align,0,u-e.size);g=a.length;for(t=!1;g--;)0<g&&a[g-1].pos+a[g-1].size>a[g].pos&&(a[g-1].size+=a[g].size,a[g-1].targets=a[g-1].targets.concat(a[g].targets),a[g-1].align=.5,a[g-1].pos+a[g-1].size>u&&(a[g-1].pos=u-a[g-1].size),a.splice(g,1),t=!0)}k.push.apply(k,q);g=0;a.some(function(c){var e=0;return(c.targets||[]).some(function(){k[g].pos=c.pos+e;if("undefined"!==typeof n&&Math.abs(k[g].pos-k[g].target)>n)return k.slice(0,g+1).forEach(function(c){return delete c.pos}),k.reducedLen=
(k.reducedLen||u)-.1*u,k.reducedLen>.1*u&&C(k,u,n),!0;e+=k[g].size;g++;return!1})});H(k,p);return k}a.distribute=C})(w||(w={}));return w});K(f,"Core/Renderer/SVG/SVGElement.js",[f["Core/Animation/AnimationUtilities.js"],f["Core/Renderer/HTML/AST.js"],f["Core/Color/Color.js"],f["Core/Globals.js"],f["Core/Utilities.js"]],function(a,f,B,H,w){var C=a.animate,I=a.animObject,A=a.stop,u=H.deg2rad,n=H.doc,k=H.noop,e=H.svg,c=H.SVG_NS,p=H.win,g=w.addEvent,t=w.attr,q=w.createElement,F=w.css,y=w.defined,x=w.erase,
z=w.extend,m=w.fireEvent,h=w.isArray,b=w.isFunction,l=w.isNumber,d=w.isString,D=w.merge,v=w.objectEach,r=w.pick,O=w.pInt,P=w.syncTimeout,S=w.uniqueKey;a=function(){function a(){this.element=void 0;this.onEvents={};this.opacity=1;this.renderer=void 0;this.SVG_NS=c;this.symbolCustomAttribs="x y width height r start end innerR anchorX anchorY rounded".split(" ")}a.prototype._defaultGetter=function(b){b=r(this[b+"Value"],this[b],this.element?this.element.getAttribute(b):null,0);/^[\-0-9\.]+$/.test(b)&&
(b=parseFloat(b));return b};a.prototype._defaultSetter=function(b,d,c){c.setAttribute(d,b)};a.prototype.add=function(b){var d=this.renderer,c=this.element;b&&(this.parentGroup=b);this.parentInverted=b&&b.inverted;"undefined"!==typeof this.textStr&&"text"===this.element.nodeName&&d.buildText(this);this.added=!0;if(!b||b.handleZ||this.zIndex)var h=this.zIndexSetter();h||(b?b.element:d.box).appendChild(c);if(this.onAdd)this.onAdd();return this};a.prototype.addClass=function(b,d){var c=d?"":this.attr("class")||
"";b=(b||"").split(/ /g).reduce(function(b,d){-1===c.indexOf(d)&&b.push(d);return b},c?[c]:[]).join(" ");b!==c&&this.attr("class",b);return this};a.prototype.afterSetters=function(){this.doTransform&&(this.updateTransform(),this.doTransform=!1)};a.prototype.align=function(b,c,J){var h={},l=this.renderer,e=l.alignedObjects,m,a,G;if(b){if(this.alignOptions=b,this.alignByTranslate=c,!J||d(J))this.alignTo=m=J||"renderer",x(e,this),e.push(this),J=void 0}else b=this.alignOptions,c=this.alignByTranslate,
m=this.alignTo;J=r(J,l[m],"scrollablePlotBox"===m?l.plotBox:void 0,l);m=b.align;var v=b.verticalAlign;l=(J.x||0)+(b.x||0);e=(J.y||0)+(b.y||0);"right"===m?a=1:"center"===m&&(a=2);a&&(l+=(J.width-(b.width||0))/a);h[c?"translateX":"x"]=Math.round(l);"bottom"===v?G=1:"middle"===v&&(G=2);G&&(e+=(J.height-(b.height||0))/G);h[c?"translateY":"y"]=Math.round(e);this[this.placed?"animate":"attr"](h);this.placed=!0;this.alignAttr=h;return this};a.prototype.alignSetter=function(b){var d={left:"start",center:"middle",
right:"end"};d[b]&&(this.alignValue=b,this.element.setAttribute("text-anchor",d[b]))};a.prototype.animate=function(b,d,c){var J=this,h=I(r(d,this.renderer.globalAnimation,!0));d=h.defer;r(n.hidden,n.msHidden,n.webkitHidden,!1)&&(h.duration=0);0!==h.duration?(c&&(h.complete=c),P(function(){J.element&&C(J,b,h)},d)):(this.attr(b,void 0,c||h.complete),v(b,function(b,d){h.step&&h.step.call(this,b,{prop:d,pos:1,elem:this})},this));return this};a.prototype.applyTextOutline=function(b){var d=this.element;
-1!==b.indexOf("contrast")&&(b=b.replace(/contrast/g,this.renderer.getContrast(d.style.fill)));var J=b.split(" ");b=J[J.length-1];if((J=J[0])&&"none"!==J&&H.svg){this.fakeTS=!0;this.ySetter=this.xSetter;J=J.replace(/(^[\d\.]+)(.*?)$/g,function(b,d,c){return 2*Number(d)+c});this.removeTextOutline();var h=n.createElementNS(c,"tspan");t(h,{"class":"highcharts-text-outline",fill:b,stroke:b,"stroke-width":J,"stroke-linejoin":"round"});[].forEach.call(d.childNodes,function(b){var d=b.cloneNode(!0);d.removeAttribute&&
["fill","stroke","stroke-width","stroke"].forEach(function(b){return d.removeAttribute(b)});h.appendChild(d)});var l=n.createElementNS(c,"tspan");l.textContent="\u200b";["x","y"].forEach(function(b){var c=d.getAttribute(b);c&&l.setAttribute(b,c)});h.appendChild(l);d.insertBefore(h,d.firstChild)}};a.prototype.attr=function(b,d,c,h){var J=this.element,l=this.symbolCustomAttribs,r,L=this,G,e;if("string"===typeof b&&"undefined"!==typeof d){var m=b;b={};b[m]=d}"string"===typeof b?L=(this[b+"Getter"]||
this._defaultGetter).call(this,b,J):(v(b,function(d,c){G=!1;h||A(this,c);this.symbolName&&-1!==l.indexOf(c)&&(r||(this.symbolAttr(b),r=!0),G=!0);!this.rotation||"x"!==c&&"y"!==c||(this.doTransform=!0);G||(e=this[c+"Setter"]||this._defaultSetter,e.call(this,d,c,J),!this.styledMode&&this.shadows&&/^(width|height|visibility|x|y|d|transform|cx|cy|r)$/.test(c)&&this.updateShadows(c,d,e))},this),this.afterSetters());c&&c.call(this);return L};a.prototype.clip=function(b){return this.attr("clip-path",b?"url("+
this.renderer.url+"#"+b.id+")":"none")};a.prototype.crisp=function(b,d){d=d||b.strokeWidth||0;var c=Math.round(d)%2/2;b.x=Math.floor(b.x||this.x||0)+c;b.y=Math.floor(b.y||this.y||0)+c;b.width=Math.floor((b.width||this.width||0)-2*c);b.height=Math.floor((b.height||this.height||0)-2*c);y(b.strokeWidth)&&(b.strokeWidth=d);return b};a.prototype.complexColor=function(b,d,c){var J=this.renderer,l,r,e,a,G,g,p,q,k,t,x=[],z;m(this.renderer,"complexColor",{args:arguments},function(){b.radialGradient?r="radialGradient":
b.linearGradient&&(r="linearGradient");if(r){e=b[r];G=J.gradients;g=b.stops;k=c.radialReference;h(e)&&(b[r]=e={x1:e[0],y1:e[1],x2:e[2],y2:e[3],gradientUnits:"userSpaceOnUse"});"radialGradient"===r&&k&&!y(e.gradientUnits)&&(a=e,e=D(e,J.getRadialAttr(k,a),{gradientUnits:"userSpaceOnUse"}));v(e,function(b,d){"id"!==d&&x.push(d,b)});v(g,function(b){x.push(b)});x=x.join(",");if(G[x])t=G[x].attr("id");else{e.id=t=S();var L=G[x]=J.createElement(r).attr(e).add(J.defs);L.radAttr=a;L.stops=[];g.forEach(function(b){0===
b[1].indexOf("rgba")?(l=B.parse(b[1]),p=l.get("rgb"),q=l.get("a")):(p=b[1],q=1);b=J.createElement("stop").attr({offset:b[0],"stop-color":p,"stop-opacity":q}).add(L);L.stops.push(b)})}z="url("+J.url+"#"+t+")";c.setAttribute(d,z);c.gradient=x;b.toString=function(){return z}}})};a.prototype.css=function(b){var d=this.styles,c={},h=this.element,l=!d;b.color&&(b.fill=b.color);d&&v(b,function(b,J){d&&d[J]!==b&&(c[J]=b,l=!0)});if(l){d&&(b=z(d,c));if(null===b.width||"auto"===b.width)delete this.textWidth;
else if("text"===h.nodeName.toLowerCase()&&b.width)var r=this.textWidth=O(b.width);this.styles=b;r&&!e&&this.renderer.forExport&&delete b.width;var m=D(b);h.namespaceURI===this.SVG_NS&&["textOutline","textOverflow","width"].forEach(function(b){return m&&delete m[b]});F(h,m);this.added&&("text"===this.element.nodeName&&this.renderer.buildText(this),b.textOutline&&this.applyTextOutline(b.textOutline))}return this};a.prototype.dashstyleSetter=function(b){var d=this["stroke-width"];"inherit"===d&&(d=
1);if(b=b&&b.toLowerCase()){var c=b.replace("shortdashdotdot","3,1,1,1,1,1,").replace("shortdashdot","3,1,1,1").replace("shortdot","1,1,").replace("shortdash","3,1,").replace("longdash","8,3,").replace(/dot/g,"1,3,").replace("dash","4,3,").replace(/,$/,"").split(",");for(b=c.length;b--;)c[b]=""+O(c[b])*r(d,NaN);b=c.join(",").replace(/NaN/g,"none");this.element.setAttribute("stroke-dasharray",b)}};a.prototype.destroy=function(){var b=this,d=b.element||{},c=b.renderer,h=d.ownerSVGElement,l=c.isSVG&&
"SPAN"===d.nodeName&&b.parentGroup||void 0;d.onclick=d.onmouseout=d.onmouseover=d.onmousemove=d.point=null;A(b);if(b.clipPath&&h){var r=b.clipPath;[].forEach.call(h.querySelectorAll("[clip-path],[CLIP-PATH]"),function(b){-1<b.getAttribute("clip-path").indexOf(r.element.id)&&b.removeAttribute("clip-path")});b.clipPath=r.destroy()}if(b.stops){for(h=0;h<b.stops.length;h++)b.stops[h].destroy();b.stops.length=0;b.stops=void 0}b.safeRemoveChild(d);for(c.styledMode||b.destroyShadows();l&&l.div&&0===l.div.childNodes.length;)d=
l.parentGroup,b.safeRemoveChild(l.div),delete l.div,l=d;b.alignTo&&x(c.alignedObjects,b);v(b,function(d,c){b[c]&&b[c].parentGroup===b&&b[c].destroy&&b[c].destroy();delete b[c]})};a.prototype.destroyShadows=function(){(this.shadows||[]).forEach(function(b){this.safeRemoveChild(b)},this);this.shadows=void 0};a.prototype.destroyTextPath=function(b,d){var c=b.getElementsByTagName("text")[0];if(c){if(c.removeAttribute("dx"),c.removeAttribute("dy"),d.element.setAttribute("id",""),this.textPathWrapper&&
c.getElementsByTagName("textPath").length){for(b=this.textPathWrapper.element.childNodes;b.length;)c.appendChild(b[0]);c.removeChild(this.textPathWrapper.element)}}else if(b.getAttribute("dx")||b.getAttribute("dy"))b.removeAttribute("dx"),b.removeAttribute("dy");this.textPathWrapper&&(this.textPathWrapper=this.textPathWrapper.destroy())};a.prototype.dSetter=function(b,d,c){h(b)&&("string"===typeof b[0]&&(b=this.renderer.pathToSegments(b)),this.pathArray=b,b=b.reduce(function(b,d,c){return d&&d.join?
(c?b+" ":"")+d.join(" "):(d||"").toString()},""));/(NaN| {2}|^$)/.test(b)&&(b="M 0 0");this[d]!==b&&(c.setAttribute(d,b),this[d]=b)};a.prototype.fadeOut=function(b){var d=this;d.animate({opacity:0},{duration:r(b,150),complete:function(){d.attr({y:-9999}).hide()}})};a.prototype.fillSetter=function(b,d,c){"string"===typeof b?c.setAttribute(d,b):b&&this.complexColor(b,d,c)};a.prototype.getBBox=function(d,c){var h=this.alignValue,l=this.element,e=this.renderer,m=this.styles,v=this.textStr,g=e.cache,G=
e.cacheKeys,p=l.namespaceURI===this.SVG_NS;c=r(c,this.rotation,0);var q=e.styledMode?l&&a.prototype.getStyle.call(l,"font-size"):m&&m.fontSize,D;if(y(v)){var k=v.toString();-1===k.indexOf("<")&&(k=k.replace(/[0-9]/g,"0"));k+=["",c,q,this.textWidth,h,m&&m.textOverflow,m&&m.fontWeight].join()}k&&!d&&(D=g[k]);if(!D){if(p||e.forExport){try{var t=this.fakeTS&&function(b){var d=l.querySelector(".highcharts-text-outline");d&&F(d,{display:b})};b(t)&&t("none");D=l.getBBox?z({},l.getBBox()):{width:l.offsetWidth,
height:l.offsetHeight};b(t)&&t("")}catch(ha){""}if(!D||0>D.width)D={x:0,y:0,width:0,height:0}}else D=this.htmlGetBBox();if(e.isSVG&&(e=D.width,d=D.height,p&&(D.height=d={"11px,17":14,"13px,20":16}[(q||"")+","+Math.round(d)]||d),c)){p=Number(l.getAttribute("y")||0)-D.y;h={right:1,center:.5}[h||0]||0;m=c*u;q=(c-90)*u;var x=e*Math.cos(m);c=e*Math.sin(m);t=Math.cos(q);m=Math.sin(q);e=D.x+h*(e-x)+p*t;q=e+x;t=q-d*t;x=t-x;p=D.y+p-h*c+p*m;h=p+c;d=h-d*m;c=d-c;D.x=Math.min(e,q,t,x);D.y=Math.min(p,h,d,c);D.width=
Math.max(e,q,t,x)-D.x;D.height=Math.max(p,h,d,c)-D.y}if(k&&(""===v||0<D.height)){for(;250<G.length;)delete g[G.shift()];g[k]||G.push(k);g[k]=D}}return D};a.prototype.getStyle=function(b){return p.getComputedStyle(this.element||this,"").getPropertyValue(b)};a.prototype.hasClass=function(b){return-1!==(""+this.attr("class")).split(" ").indexOf(b)};a.prototype.hide=function(){return this.attr({visibility:"hidden"})};a.prototype.htmlGetBBox=function(){return{height:0,width:0,x:0,y:0}};a.prototype.init=
function(b,d){this.element="span"===d?q(d):n.createElementNS(this.SVG_NS,d);this.renderer=b;m(this,"afterInit")};a.prototype.invert=function(b){this.inverted=b;this.updateTransform();return this};a.prototype.on=function(b,d){var c=this.onEvents;if(c[b])c[b]();c[b]=g(this.element,b,d);return this};a.prototype.opacitySetter=function(b,d,c){this.opacity=b=Number(Number(b).toFixed(3));c.setAttribute(d,b)};a.prototype.removeClass=function(b){return this.attr("class",(""+this.attr("class")).replace(d(b)?
new RegExp("(^| )"+b+"( |$)"):b," ").replace(/ +/g," ").trim())};a.prototype.removeTextOutline=function(){var b=this.element.querySelector("tspan.highcharts-text-outline");b&&this.safeRemoveChild(b)};a.prototype.safeRemoveChild=function(b){var d=b.parentNode;d&&d.removeChild(b)};a.prototype.setRadialReference=function(b){var d=this.element.gradient&&this.renderer.gradients[this.element.gradient];this.element.radialReference=b;d&&d.radAttr&&d.animate(this.renderer.getRadialAttr(b,d.radAttr));return this};
a.prototype.setTextPath=function(b,d){var c=this.element,h=this.text?this.text.element:c,r={textAnchor:"text-anchor"},e=!1,m=this.textPathWrapper,a=!m;d=D(!0,{enabled:!0,attributes:{dy:-5,startOffset:"50%",textAnchor:"middle"}},d);var G=f.filterUserAttributes(d.attributes);if(b&&d&&d.enabled){m&&null===m.element.parentNode?(a=!0,m=m.destroy()):m&&this.removeTextOutline.call(m.parentGroup);this.options&&this.options.padding&&(G.dx=-this.options.padding);m||(this.textPathWrapper=m=this.renderer.createElement("textPath"),
e=!0);var g=m.element;(d=b.element.getAttribute("id"))||b.element.setAttribute("id",d=S());if(a)for(h.setAttribute("y",0),l(G.dx)&&h.setAttribute("x",-G.dx),b=[].slice.call(h.childNodes),a=0;a<b.length;a++){var q=b[a];q.nodeType!==p.Node.TEXT_NODE&&"tspan"!==q.nodeName||g.appendChild(q)}e&&m&&m.add({element:h});g.setAttributeNS("http://www.w3.org/1999/xlink","href",this.renderer.url+"#"+d);y(G.dy)&&(g.parentNode.setAttribute("dy",G.dy),delete G.dy);y(G.dx)&&(g.parentNode.setAttribute("dx",G.dx),delete G.dx);
v(G,function(b,d){g.setAttribute(r[d]||d,b)});c.removeAttribute("transform");this.removeTextOutline.call(m);this.text&&!this.renderer.styledMode&&this.attr({fill:"none","stroke-width":0});this.applyTextOutline=this.updateTransform=k}else m&&(delete this.updateTransform,delete this.applyTextOutline,this.destroyTextPath(c,b),this.updateTransform(),this.options&&this.options.rotation&&this.applyTextOutline(this.options.style.textOutline));return this};a.prototype.shadow=function(b,d,c){var h=[],l=this.element,
J=this.oldShadowOptions,r={color:"#000000",offsetX:this.parentInverted?-1:1,offsetY:this.parentInverted?-1:1,opacity:.15,width:3},e=!1,G;!0===b?G=r:"object"===typeof b&&(G=z(r,b));G&&(G&&J&&v(G,function(b,d){b!==J[d]&&(e=!0)}),e&&this.destroyShadows(),this.oldShadowOptions=G);if(!G)this.destroyShadows();else if(!this.shadows){var m=G.opacity/G.width;var a=this.parentInverted?"translate("+G.offsetY+", "+G.offsetX+")":"translate("+G.offsetX+", "+G.offsetY+")";for(r=1;r<=G.width;r++){var g=l.cloneNode(!1);
var p=2*G.width+1-2*r;t(g,{stroke:b.color||"#000000","stroke-opacity":m*r,"stroke-width":p,transform:a,fill:"none"});g.setAttribute("class",(g.getAttribute("class")||"")+" highcharts-shadow");c&&(t(g,"height",Math.max(t(g,"height")-p,0)),g.cutHeight=p);d?d.element.appendChild(g):l.parentNode&&l.parentNode.insertBefore(g,l);h.push(g)}this.shadows=h}return this};a.prototype.show=function(b){void 0===b&&(b=!0);return this.attr({visibility:b?"inherit":"visible"})};a.prototype.strokeSetter=function(b,
d,c){this[d]=b;this.stroke&&this["stroke-width"]?(a.prototype.fillSetter.call(this,this.stroke,"stroke",c),c.setAttribute("stroke-width",this["stroke-width"]),this.hasStroke=!0):"stroke-width"===d&&0===b&&this.hasStroke?(c.removeAttribute("stroke"),this.hasStroke=!1):this.renderer.styledMode&&this["stroke-width"]&&(c.setAttribute("stroke-width",this["stroke-width"]),this.hasStroke=!0)};a.prototype.strokeWidth=function(){if(!this.renderer.styledMode)return this["stroke-width"]||0;var b=this.getStyle("stroke-width"),
d=0;if(b.indexOf("px")===b.length-2)d=O(b);else if(""!==b){var h=n.createElementNS(c,"rect");t(h,{width:b,"stroke-width":0});this.element.parentNode.appendChild(h);d=h.getBBox().width;h.parentNode.removeChild(h)}return d};a.prototype.symbolAttr=function(b){var d=this;"x y r start end width height innerR anchorX anchorY clockwise".split(" ").forEach(function(c){d[c]=r(b[c],d[c])});d.attr({d:d.renderer.symbols[d.symbolName](d.x,d.y,d.width,d.height,d)})};a.prototype.textSetter=function(b){b!==this.textStr&&
(delete this.textPxLength,this.textStr=b,this.added&&this.renderer.buildText(this))};a.prototype.titleSetter=function(b){var d=this.element,c=d.getElementsByTagName("title")[0]||n.createElementNS(this.SVG_NS,"title");d.insertBefore?d.insertBefore(c,d.firstChild):d.appendChild(c);c.textContent=String(r(b,"")).replace(/<[^>]*>/g,"").replace(/&lt;/g,"<").replace(/&gt;/g,">")};a.prototype.toFront=function(){var b=this.element;b.parentNode.appendChild(b);return this};a.prototype.translate=function(b,d){return this.attr({translateX:b,
translateY:d})};a.prototype.updateShadows=function(b,d,c){var h=this.shadows;if(h)for(var l=h.length;l--;)c.call(h[l],"height"===b?Math.max(d-(h[l].cutHeight||0),0):"d"===b?this.d:d,b,h[l])};a.prototype.updateTransform=function(){var b=this.scaleX,d=this.scaleY,c=this.inverted,h=this.rotation,l=this.matrix,e=this.element,m=this.translateX||0,a=this.translateY||0;c&&(m+=this.width,a+=this.height);m=["translate("+m+","+a+")"];y(l)&&m.push("matrix("+l.join(",")+")");c?m.push("rotate(90) scale(-1,1)"):
h&&m.push("rotate("+h+" "+r(this.rotationOriginX,e.getAttribute("x"),0)+" "+r(this.rotationOriginY,e.getAttribute("y")||0)+")");(y(b)||y(d))&&m.push("scale("+r(b,1)+" "+r(d,1)+")");m.length&&e.setAttribute("transform",m.join(" "))};a.prototype.visibilitySetter=function(b,d,c){"inherit"===b?c.removeAttribute(d):this[d]!==b&&c.setAttribute(d,b);this[d]=b};a.prototype.xGetter=function(b){"circle"===this.element.nodeName&&("x"===b?b="cx":"y"===b&&(b="cy"));return this._defaultGetter(b)};a.prototype.zIndexSetter=
function(b,d){var c=this.renderer,h=this.parentGroup,l=(h||c).element||c.box,r=this.element;c=l===c.box;var e=!1;var m=this.added;var G;y(b)?(r.setAttribute("data-z-index",b),b=+b,this[d]===b&&(m=!1)):y(this[d])&&r.removeAttribute("data-z-index");this[d]=b;if(m){(b=this.zIndex)&&h&&(h.handleZ=!0);d=l.childNodes;for(G=d.length-1;0<=G&&!e;G--){h=d[G];m=h.getAttribute("data-z-index");var a=!y(m);if(h!==r)if(0>b&&a&&!c&&!G)l.insertBefore(r,d[G]),e=!0;else if(O(m)<=b||a&&(!y(b)||0<=b))l.insertBefore(r,
d[G+1]||null),e=!0}e||(l.insertBefore(r,d[c?3:0]||null),e=!0)}return e};return a}();a.prototype["stroke-widthSetter"]=a.prototype.strokeSetter;a.prototype.yGetter=a.prototype.xGetter;a.prototype.matrixSetter=a.prototype.rotationOriginXSetter=a.prototype.rotationOriginYSetter=a.prototype.rotationSetter=a.prototype.scaleXSetter=a.prototype.scaleYSetter=a.prototype.translateXSetter=a.prototype.translateYSetter=a.prototype.verticalAlignSetter=function(b,d){this[d]=b;this.doTransform=!0};"";return a});
K(f,"Core/Renderer/RendererRegistry.js",[f["Core/Globals.js"]],function(a){var f;(function(f){f.rendererTypes={};var C;f.getRendererType=function(a){void 0===a&&(a=C);return f.rendererTypes[a]||f.rendererTypes[C]};f.registerRendererType=function(w,B,I){f.rendererTypes[w]=B;if(!C||I)C=w,a.Renderer=B}})(f||(f={}));return f});K(f,"Core/Renderer/SVG/SVGLabel.js",[f["Core/Renderer/SVG/SVGElement.js"],f["Core/Utilities.js"]],function(a,f){var C=this&&this.__extends||function(){var a=function(k,e){a=Object.setPrototypeOf||
{__proto__:[]}instanceof Array&&function(c,e){c.__proto__=e}||function(c,e){for(var a in e)e.hasOwnProperty(a)&&(c[a]=e[a])};return a(k,e)};return function(k,e){function c(){this.constructor=k}a(k,e);k.prototype=null===e?Object.create(e):(c.prototype=e.prototype,new c)}}(),H=f.defined,w=f.extend,E=f.isNumber,I=f.merge,A=f.pick,u=f.removeEvent;return function(n){function k(e,c,a,g,t,q,F,y,x,z){var m=n.call(this)||this;m.paddingLeftSetter=m.paddingSetter;m.paddingRightSetter=m.paddingSetter;m.init(e,
"g");m.textStr=c;m.x=a;m.y=g;m.anchorX=q;m.anchorY=F;m.baseline=x;m.className=z;m.addClass("button"===z?"highcharts-no-tooltip":"highcharts-label");z&&m.addClass("highcharts-"+z);m.text=e.text(void 0,0,0,y).attr({zIndex:1});var h;"string"===typeof t&&((h=/^url\((.*?)\)$/.test(t))||m.renderer.symbols[t])&&(m.symbolKey=t);m.bBox=k.emptyBBox;m.padding=3;m.baselineOffset=0;m.needsBox=e.styledMode||h;m.deferredAttr={};m.alignFactor=0;return m}C(k,n);k.prototype.alignSetter=function(e){e={left:0,center:.5,
right:1}[e];e!==this.alignFactor&&(this.alignFactor=e,this.bBox&&E(this.xSetting)&&this.attr({x:this.xSetting}))};k.prototype.anchorXSetter=function(e,c){this.anchorX=e;this.boxAttr(c,Math.round(e)-this.getCrispAdjust()-this.xSetting)};k.prototype.anchorYSetter=function(e,c){this.anchorY=e;this.boxAttr(c,e-this.ySetting)};k.prototype.boxAttr=function(e,c){this.box?this.box.attr(e,c):this.deferredAttr[e]=c};k.prototype.css=function(e){if(e){var c={};e=I(e);k.textProps.forEach(function(a){"undefined"!==
typeof e[a]&&(c[a]=e[a],delete e[a])});this.text.css(c);var p="width"in c;"fontSize"in c||"fontWeight"in c?this.updateTextPadding():p&&this.updateBoxSize()}return a.prototype.css.call(this,e)};k.prototype.destroy=function(){u(this.element,"mouseenter");u(this.element,"mouseleave");this.text&&this.text.destroy();this.box&&(this.box=this.box.destroy());a.prototype.destroy.call(this)};k.prototype.fillSetter=function(e,c){e&&(this.needsBox=!0);this.fill=e;this.boxAttr(c,e)};k.prototype.getBBox=function(){this.textStr&&
0===this.bBox.width&&0===this.bBox.height&&this.updateBoxSize();var e=this.padding,c=A(this.paddingLeft,e);return{width:this.width,height:this.height,x:this.bBox.x-c,y:this.bBox.y-e}};k.prototype.getCrispAdjust=function(){return this.renderer.styledMode&&this.box?this.box.strokeWidth()%2/2:(this["stroke-width"]?parseInt(this["stroke-width"],10):0)%2/2};k.prototype.heightSetter=function(e){this.heightSetting=e};k.prototype.onAdd=function(){var e=this.textStr;this.text.add(this);this.attr({text:H(e)?
e:"",x:this.x,y:this.y});this.box&&H(this.anchorX)&&this.attr({anchorX:this.anchorX,anchorY:this.anchorY})};k.prototype.paddingSetter=function(e,c){E(e)?e!==this[c]&&(this[c]=e,this.updateTextPadding()):this[c]=void 0};k.prototype.rSetter=function(e,c){this.boxAttr(c,e)};k.prototype.shadow=function(e){e&&!this.renderer.styledMode&&(this.updateBoxSize(),this.box&&this.box.shadow(e));return this};k.prototype.strokeSetter=function(e,c){this.stroke=e;this.boxAttr(c,e)};k.prototype["stroke-widthSetter"]=
function(e,c){e&&(this.needsBox=!0);this["stroke-width"]=e;this.boxAttr(c,e)};k.prototype["text-alignSetter"]=function(e){this.textAlign=e};k.prototype.textSetter=function(e){"undefined"!==typeof e&&this.text.attr({text:e});this.updateTextPadding()};k.prototype.updateBoxSize=function(){var e=this.text.element.style,c={},a=this.padding,g=this.bBox=E(this.widthSetting)&&E(this.heightSetting)&&!this.textAlign||!H(this.text.textStr)?k.emptyBBox:this.text.getBBox();this.width=this.getPaddedWidth();this.height=
(this.heightSetting||g.height||0)+2*a;e=this.renderer.fontMetrics(e&&e.fontSize,this.text);this.baselineOffset=a+Math.min((this.text.firstLineMetrics||e).b,g.height||Infinity);this.heightSetting&&(this.baselineOffset+=(this.heightSetting-e.h)/2);this.needsBox&&(this.box||(a=this.box=this.symbolKey?this.renderer.symbol(this.symbolKey):this.renderer.rect(),a.addClass(("button"===this.className?"":"highcharts-label-box")+(this.className?" highcharts-"+this.className+"-box":"")),a.add(this)),a=this.getCrispAdjust(),
c.x=a,c.y=(this.baseline?-this.baselineOffset:0)+a,c.width=Math.round(this.width),c.height=Math.round(this.height),this.box.attr(w(c,this.deferredAttr)),this.deferredAttr={})};k.prototype.updateTextPadding=function(){var e=this.text;this.updateBoxSize();var c=this.baseline?0:this.baselineOffset,a=A(this.paddingLeft,this.padding);H(this.widthSetting)&&this.bBox&&("center"===this.textAlign||"right"===this.textAlign)&&(a+={center:.5,right:1}[this.textAlign]*(this.widthSetting-this.bBox.width));if(a!==
e.x||c!==e.y)e.attr("x",a),e.hasBoxWidthChanged&&(this.bBox=e.getBBox(!0)),"undefined"!==typeof c&&e.attr("y",c);e.x=a;e.y=c};k.prototype.widthSetter=function(e){this.widthSetting=E(e)?e:void 0};k.prototype.getPaddedWidth=function(){var e=this.padding,c=A(this.paddingLeft,e);e=A(this.paddingRight,e);return(this.widthSetting||this.bBox.width||0)+c+e};k.prototype.xSetter=function(e){this.x=e;this.alignFactor&&(e-=this.alignFactor*this.getPaddedWidth(),this["forceAnimate:x"]=!0);this.xSetting=Math.round(e);
this.attr("translateX",this.xSetting)};k.prototype.ySetter=function(e){this.ySetting=this.y=Math.round(e);this.attr("translateY",this.ySetting)};k.emptyBBox={width:0,height:0,x:0,y:0};k.textProps="color direction fontFamily fontSize fontStyle fontWeight lineHeight textAlign textDecoration textOutline textOverflow width".split(" ");return k}(a)});K(f,"Core/Renderer/SVG/Symbols.js",[f["Core/Utilities.js"]],function(a){function f(a,f,n,k,e){var c=[];if(e){var p=e.start||0,g=I(e.r,n);n=I(e.r,k||n);var t=
(e.end||0)-.001;k=e.innerR;var q=I(e.open,.001>Math.abs((e.end||0)-p-2*Math.PI)),F=Math.cos(p),y=Math.sin(p),x=Math.cos(t),z=Math.sin(t);p=I(e.longArc,.001>t-p-Math.PI?0:1);c.push(["M",a+g*F,f+n*y],["A",g,n,0,p,I(e.clockwise,1),a+g*x,f+n*z]);w(k)&&c.push(q?["M",a+k*x,f+k*z]:["L",a+k*x,f+k*z],["A",k,k,0,p,w(e.clockwise)?1-e.clockwise:0,a+k*F,f+k*y]);q||c.push(["Z"])}return c}function B(a,f,n,k,e){return e&&e.r?H(a,f,n,k,e):[["M",a,f],["L",a+n,f],["L",a+n,f+k],["L",a,f+k],["Z"]]}function H(a,f,n,k,
e){e=e&&e.r||0;return[["M",a+e,f],["L",a+n-e,f],["C",a+n,f,a+n,f,a+n,f+e],["L",a+n,f+k-e],["C",a+n,f+k,a+n,f+k,a+n-e,f+k],["L",a+e,f+k],["C",a,f+k,a,f+k,a,f+k-e],["L",a,f+e],["C",a,f,a,f,a+e,f]]}var w=a.defined,E=a.isNumber,I=a.pick;return{arc:f,callout:function(a,f,n,k,e){var c=Math.min(e&&e.r||0,n,k),p=c+6,g=e&&e.anchorX;e=e&&e.anchorY||0;var t=H(a,f,n,k,{r:c});if(!E(g))return t;a+g>=n?e>f+p&&e<f+k-p?t.splice(3,1,["L",a+n,e-6],["L",a+n+6,e],["L",a+n,e+6],["L",a+n,f+k-c]):t.splice(3,1,["L",a+n,k/
2],["L",g,e],["L",a+n,k/2],["L",a+n,f+k-c]):0>=a+g?e>f+p&&e<f+k-p?t.splice(7,1,["L",a,e+6],["L",a-6,e],["L",a,e-6],["L",a,f+c]):t.splice(7,1,["L",a,k/2],["L",g,e],["L",a,k/2],["L",a,f+c]):e&&e>k&&g>a+p&&g<a+n-p?t.splice(5,1,["L",g+6,f+k],["L",g,f+k+6],["L",g-6,f+k],["L",a+c,f+k]):e&&0>e&&g>a+p&&g<a+n-p&&t.splice(1,1,["L",g-6,f],["L",g,f-6],["L",g+6,f],["L",n-c,f]);return t},circle:function(a,u,n,k){return f(a+n/2,u+k/2,n/2,k/2,{start:.5*Math.PI,end:2.5*Math.PI,open:!1})},diamond:function(a,f,n,k){return[["M",
a+n/2,f],["L",a+n,f+k/2],["L",a+n/2,f+k],["L",a,f+k/2],["Z"]]},rect:B,roundedRect:H,square:B,triangle:function(a,f,n,k){return[["M",a+n/2,f],["L",a+n,f+k],["L",a,f+k],["Z"]]},"triangle-down":function(a,f,n,k){return[["M",a,f],["L",a+n,f],["L",a+n/2,f+k],["Z"]]}}});K(f,"Core/Renderer/SVG/TextBuilder.js",[f["Core/Renderer/HTML/AST.js"],f["Core/Globals.js"],f["Core/Utilities.js"]],function(a,f,B){var C=f.doc,w=f.SVG_NS,E=f.win,I=B.attr,A=B.extend,u=B.isString,n=B.objectEach,k=B.pick;return function(){function e(c){var a=
c.styles;this.renderer=c.renderer;this.svgElement=c;this.width=c.textWidth;this.textLineHeight=a&&a.lineHeight;this.textOutline=a&&a.textOutline;this.ellipsis=!(!a||"ellipsis"!==a.textOverflow);this.noWrap=!(!a||"nowrap"!==a.whiteSpace);this.fontSize=a&&a.fontSize}e.prototype.buildSVG=function(){var c=this.svgElement,e=c.element,g=c.renderer,t=k(c.textStr,"").toString(),q=-1!==t.indexOf("<"),f=e.childNodes;g=this.width&&!c.added&&g.box;var y=/<br.*?>/g,x=[t,this.ellipsis,this.noWrap,this.textLineHeight,
this.textOutline,this.fontSize,this.width].join();if(x!==c.textCache){c.textCache=x;delete c.actualWidth;for(x=f.length;x--;)e.removeChild(f[x]);q||this.ellipsis||this.width||-1!==t.indexOf(" ")&&(!this.noWrap||y.test(t))?""!==t&&(g&&g.appendChild(e),t=new a(t),this.modifyTree(t.nodes),t.addToDOM(c.element),this.modifyDOM(),this.ellipsis&&-1!==(e.textContent||"").indexOf("\u2026")&&c.attr("title",this.unescapeEntities(c.textStr||"",["&lt;","&gt;"])),g&&g.removeChild(e)):e.appendChild(C.createTextNode(this.unescapeEntities(t)));
u(this.textOutline)&&c.applyTextOutline&&c.applyTextOutline(this.textOutline)}};e.prototype.modifyDOM=function(){var c=this,a=this.svgElement,e=I(a.element,"x");a.firstLineMetrics=void 0;for(var k;k=a.element.firstChild;)if(/^[\s\u200B]*$/.test(k.textContent||" "))a.element.removeChild(k);else break;[].forEach.call(a.element.querySelectorAll("tspan.highcharts-br"),function(g,q){g.nextSibling&&g.previousSibling&&(0===q&&1===g.previousSibling.nodeType&&(a.firstLineMetrics=a.renderer.fontMetrics(void 0,
g.previousSibling)),I(g,{dy:c.getLineHeight(g.nextSibling),x:e}))});var q=this.width||0;if(q){var f=function(g,k){var m=g.textContent||"",h=m.replace(/([^\^])-/g,"$1- ").split(" "),b=!c.noWrap&&(1<h.length||1<a.element.childNodes.length),l=c.getLineHeight(k),d=0,D=a.actualWidth;if(c.ellipsis)m&&c.truncate(g,m,void 0,0,Math.max(0,q-parseInt(c.fontSize||12,10)),function(b,d){return b.substring(0,d)+"\u2026"});else if(b){m=[];for(b=[];k.firstChild&&k.firstChild!==g;)b.push(k.firstChild),k.removeChild(k.firstChild);
for(;h.length;)h.length&&!c.noWrap&&0<d&&(m.push(g.textContent||""),g.textContent=h.join(" ").replace(/- /g,"-")),c.truncate(g,void 0,h,0===d?D||0:0,q,function(b,d){return h.slice(0,d).join(" ").replace(/- /g,"-")}),D=a.actualWidth,d++;b.forEach(function(b){k.insertBefore(b,g)});m.forEach(function(b){k.insertBefore(C.createTextNode(b),g);b=C.createElementNS(w,"tspan");b.textContent="\u200b";I(b,{dy:l,x:e});k.insertBefore(b,g)})}},y=function(c){[].slice.call(c.childNodes).forEach(function(e){e.nodeType===
E.Node.TEXT_NODE?f(e,c):(-1!==e.className.baseVal.indexOf("highcharts-br")&&(a.actualWidth=0),y(e))})};y(a.element)}};e.prototype.getLineHeight=function(c){var a;c=c.nodeType===E.Node.TEXT_NODE?c.parentElement:c;this.renderer.styledMode||(a=c&&/(px|em)$/.test(c.style.fontSize)?c.style.fontSize:this.fontSize||this.renderer.style.fontSize||12);return this.textLineHeight?parseInt(this.textLineHeight.toString(),10):this.renderer.fontMetrics(a,c||this.svgElement.element).h};e.prototype.modifyTree=function(c){var a=
this,e=function(g,q){var k=g.attributes;k=void 0===k?{}:k;var p=g.children,t=g.style;t=void 0===t?{}:t;var f=g.tagName,m=a.renderer.styledMode;if("b"===f||"strong"===f)m?k["class"]="highcharts-strong":t.fontWeight="bold";else if("i"===f||"em"===f)m?k["class"]="highcharts-emphasized":t.fontStyle="italic";t&&t.color&&(t.fill=t.color);"br"===f?(k["class"]="highcharts-br",g.textContent="\u200b",(q=c[q+1])&&q.textContent&&(q.textContent=q.textContent.replace(/^ +/gm,""))):"a"===f&&p&&p.some(function(c){return"#text"===
c.tagName})&&(g.children=[{children:p,tagName:"tspan"}]);"#text"!==f&&"a"!==f&&(g.tagName="tspan");A(g,{attributes:k,style:t});p&&p.filter(function(c){return"#text"!==c.tagName}).forEach(e)};c.forEach(e)};e.prototype.truncate=function(c,a,e,k,q,f){var g=this.svgElement,p=g.renderer,t=g.rotation,m=[],h=e?1:0,b=(a||e||"").length,l=b,d,D=function(b,d){d=d||b;var h=c.parentNode;if(h&&"undefined"===typeof m[d])if(h.getSubStringLength)try{m[d]=k+h.getSubStringLength(0,e?d+1:d)}catch(S){""}else p.getSpanWidth&&
(c.textContent=f(a||e,b),m[d]=k+p.getSpanWidth(g,c));return m[d]};g.rotation=0;var v=D(c.textContent.length);if(k+v>q){for(;h<=b;)l=Math.ceil((h+b)/2),e&&(d=f(e,l)),v=D(l,d&&d.length-1),h===b?h=b+1:v>q?b=l-1:h=l;0===b?c.textContent="":a&&b===a.length-1||(c.textContent=d||f(a||e,l))}e&&e.splice(0,l);g.actualWidth=v;g.rotation=t};e.prototype.unescapeEntities=function(c,a){n(this.renderer.escapes,function(e,k){a&&-1!==a.indexOf(e)||(c=c.toString().replace(new RegExp(e,"g"),k))});return c};return e}()});
K(f,"Core/Renderer/SVG/SVGRenderer.js",[f["Core/Renderer/HTML/AST.js"],f["Core/Color/Color.js"],f["Core/Globals.js"],f["Core/Renderer/RendererRegistry.js"],f["Core/Renderer/SVG/SVGElement.js"],f["Core/Renderer/SVG/SVGLabel.js"],f["Core/Renderer/SVG/Symbols.js"],f["Core/Renderer/SVG/TextBuilder.js"],f["Core/Utilities.js"]],function(a,f,B,H,w,E,I,A,u){var n=B.charts,k=B.deg2rad,e=B.doc,c=B.isFirefox,p=B.isMS,g=B.isWebKit,t=B.noop,q=B.SVG_NS,F=B.symbolSizes,y=B.win,x=u.addEvent,z=u.attr,m=u.createElement,
h=u.css,b=u.defined,l=u.destroyObjectProperties,d=u.extend,D=u.isArray,v=u.isNumber,r=u.isObject,O=u.isString,P=u.merge,S=u.pick,N=u.pInt,C=u.uniqueKey,X;B=function(){function J(b,d,c,h,a,e,l){this.width=this.url=this.style=this.isSVG=this.imgCount=this.height=this.gradients=this.globalAnimation=this.defs=this.chartIndex=this.cacheKeys=this.cache=this.boxWrapper=this.box=this.alignedObjects=void 0;this.init(b,d,c,h,a,e,l)}J.prototype.init=function(b,d,a,l,r,m,J){var G=this.createElement("svg").attr({version:"1.1",
"class":"highcharts-root"}),L=G.element;J||G.css(this.getStyle(l));b.appendChild(L);z(b,"dir","ltr");-1===b.innerHTML.indexOf("xmlns")&&z(L,"xmlns",this.SVG_NS);this.isSVG=!0;this.box=L;this.boxWrapper=G;this.alignedObjects=[];this.url=this.getReferenceURL();this.createElement("desc").add().element.appendChild(e.createTextNode("Created with Highcharts 10.1.0"));this.defs=this.createElement("defs").add();this.allowHTML=m;this.forExport=r;this.styledMode=J;this.gradients={};this.cache={};this.cacheKeys=
[];this.imgCount=0;this.setSize(d,a,!1);var g;c&&b.getBoundingClientRect&&(d=function(){h(b,{left:0,top:0});g=b.getBoundingClientRect();h(b,{left:Math.ceil(g.left)-g.left+"px",top:Math.ceil(g.top)-g.top+"px"})},d(),this.unSubPixelFix=x(y,"resize",d))};J.prototype.definition=function(b){return(new a([b])).addToDOM(this.defs.element)};J.prototype.getReferenceURL=function(){if((c||g)&&e.getElementsByTagName("base").length){if(!b(X)){var d=C();d=(new a([{tagName:"svg",attributes:{width:8,height:8},children:[{tagName:"defs",
children:[{tagName:"clipPath",attributes:{id:d},children:[{tagName:"rect",attributes:{width:4,height:4}}]}]},{tagName:"rect",attributes:{id:"hitme",width:8,height:8,"clip-path":"url(#"+d+")",fill:"rgba(0,0,0,0.001)"}}]}])).addToDOM(e.body);h(d,{position:"fixed",top:0,left:0,zIndex:9E5});var l=e.elementFromPoint(6,6);X="hitme"===(l&&l.id);e.body.removeChild(d)}if(X)return y.location.href.split("#")[0].replace(/<[^>]*>/g,"").replace(/([\('\)])/g,"\\$1").replace(/ /g,"%20")}return""};J.prototype.getStyle=
function(b){return this.style=d({fontFamily:'"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif',fontSize:"12px"},b)};J.prototype.setStyle=function(b){this.boxWrapper.css(this.getStyle(b))};J.prototype.isHidden=function(){return!this.boxWrapper.getBBox().width};J.prototype.destroy=function(){var b=this.defs;this.box=null;this.boxWrapper=this.boxWrapper.destroy();l(this.gradients||{});this.gradients=null;b&&(this.defs=b.destroy());this.unSubPixelFix&&this.unSubPixelFix();return this.alignedObjects=
null};J.prototype.createElement=function(b){var d=new this.Element;d.init(this,b);return d};J.prototype.getRadialAttr=function(b,d){return{cx:b[0]-b[2]/2+(d.cx||0)*b[2],cy:b[1]-b[2]/2+(d.cy||0)*b[2],r:(d.r||0)*b[2]}};J.prototype.buildText=function(b){(new A(b)).buildSVG()};J.prototype.getContrast=function(b){b=f.parse(b).rgba;b[0]*=1;b[1]*=1.2;b[2]*=.5;return 459<b[0]+b[1]+b[2]?"#000000":"#FFFFFF"};J.prototype.button=function(b,c,h,l,e,m,J,g,v,q){var G=this.label(b,c,h,v,void 0,void 0,q,void 0,"button"),
D=this.styledMode;b=e&&e.states||{};e&&delete e.states;var L=0,k=e?P(e):{},f=P({color:"#333333",cursor:"pointer",fontWeight:"normal"},k.style);delete k.style;k=a.filterUserAttributes(k);G.attr(P({padding:8,r:2},k));if(!D){k=P({fill:"#f7f7f7",stroke:"#cccccc","stroke-width":1},k);m=P(k,{fill:"#e6e6e6"},a.filterUserAttributes(m||b.hover||{}));var t=m.style;delete m.style;J=P(k,{fill:"#e6ebf5",style:{color:"#000000",fontWeight:"bold"}},a.filterUserAttributes(J||b.select||{}));var M=J.style;delete J.style;
g=P(k,{style:{color:"#cccccc"}},a.filterUserAttributes(g||b.disabled||{}));var y=g.style;delete g.style}x(G.element,p?"mouseover":"mouseenter",function(){3!==L&&G.setState(1)});x(G.element,p?"mouseout":"mouseleave",function(){3!==L&&G.setState(L)});G.setState=function(b){1!==b&&(G.state=L=b);G.removeClass(/highcharts-button-(normal|hover|pressed|disabled)/).addClass("highcharts-button-"+["normal","hover","pressed","disabled"][b||0]);D||(G.attr([k,m,J,g][b||0]),b=[f,t,M,y][b||0],r(b)&&G.css(b))};D||
G.attr(k).css(d({cursor:"default"},f));return G.on("touchstart",function(b){return b.stopPropagation()}).on("click",function(b){3!==L&&l.call(G,b)})};J.prototype.crispLine=function(d,c,h){void 0===h&&(h="round");var a=d[0],e=d[1];b(a[1])&&a[1]===e[1]&&(a[1]=e[1]=Math[h](a[1])-c%2/2);b(a[2])&&a[2]===e[2]&&(a[2]=e[2]=Math[h](a[2])+c%2/2);return d};J.prototype.path=function(b){var c=this.styledMode?{}:{fill:"none"};D(b)?c.d=b:r(b)&&d(c,b);return this.createElement("path").attr(c)};J.prototype.circle=
function(b,d,c){b=r(b)?b:"undefined"===typeof b?{}:{x:b,y:d,r:c};d=this.createElement("circle");d.xSetter=d.ySetter=function(b,d,c){c.setAttribute("c"+d,b)};return d.attr(b)};J.prototype.arc=function(b,d,c,a,h,e){r(b)?(a=b,d=a.y,c=a.r,b=a.x):a={innerR:a,start:h,end:e};b=this.symbol("arc",b,d,c,c,a);b.r=c;return b};J.prototype.rect=function(b,d,c,a,h,e){h=r(b)?b.r:h;var l=this.createElement("rect");b=r(b)?b:"undefined"===typeof b?{}:{x:b,y:d,width:Math.max(c,0),height:Math.max(a,0)};this.styledMode||
("undefined"!==typeof e&&(b["stroke-width"]=e,b=l.crisp(b)),b.fill="none");h&&(b.r=h);l.rSetter=function(b,d,c){l.r=b;z(c,{rx:b,ry:b})};l.rGetter=function(){return l.r||0};return l.attr(b)};J.prototype.setSize=function(b,d,c){this.width=b;this.height=d;this.boxWrapper.animate({width:b,height:d},{step:function(){this.attr({viewBox:"0 0 "+this.attr("width")+" "+this.attr("height")})},duration:S(c,!0)?void 0:0});this.alignElements()};J.prototype.g=function(b){var d=this.createElement("g");return b?d.attr({"class":"highcharts-"+
b}):d};J.prototype.image=function(b,d,c,a,h,e){var l={preserveAspectRatio:"none"},r=function(b,d){b.setAttributeNS?b.setAttributeNS("http://www.w3.org/1999/xlink","href",d):b.setAttribute("hc-svg-href",d)};v(d)&&(l.x=d);v(c)&&(l.y=c);v(a)&&(l.width=a);v(h)&&(l.height=h);var m=this.createElement("image").attr(l);d=function(d){r(m.element,b);e.call(m,d)};e?(r(m.element,"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="),c=new y.Image,x(c,"load",d),c.src=b,c.complete&&d({})):
r(m.element,b);return m};J.prototype.symbol=function(c,a,l,r,J,G){var g=this,v=/^url\((.*?)\)$/,q=v.test(c),D=!q&&(this.symbols[c]?c:"circle"),k=D&&this.symbols[D],f;if(k){"number"===typeof a&&(f=k.call(this.symbols,Math.round(a||0),Math.round(l||0),r||0,J||0,G));var p=this.path(f);g.styledMode||p.attr("fill","none");d(p,{symbolName:D||void 0,x:a,y:l,width:r,height:J});G&&d(p,G)}else if(q){var L=c.match(v)[1];var t=p=this.image(L);t.imgwidth=S(F[L]&&F[L].width,G&&G.width);t.imgheight=S(F[L]&&F[L].height,
G&&G.height);var y=function(b){return b.attr({width:b.width,height:b.height})};["width","height"].forEach(function(d){t[d+"Setter"]=function(d,c){var a=this["img"+c];this[c]=d;b(a)&&(G&&"within"===G.backgroundSize&&this.width&&this.height&&(a=Math.round(a*Math.min(this.width/this.imgwidth,this.height/this.imgheight))),this.element&&this.element.setAttribute(c,a),this.alignByTranslate||(d=((this[c]||0)-a)/2,this.attr("width"===c?{translateX:d}:{translateY:d})))}});b(a)&&t.attr({x:a,y:l});t.isImg=!0;
b(t.imgwidth)&&b(t.imgheight)?y(t):(t.attr({width:0,height:0}),m("img",{onload:function(){var b=n[g.chartIndex];0===this.width&&(h(this,{position:"absolute",top:"-999em"}),e.body.appendChild(this));F[L]={width:this.width,height:this.height};t.imgwidth=this.width;t.imgheight=this.height;t.element&&y(t);this.parentNode&&this.parentNode.removeChild(this);g.imgCount--;if(!g.imgCount&&b&&!b.hasLoaded)b.onload()},src:L}),this.imgCount++)}return p};J.prototype.clipRect=function(b,d,c,a){var h=C()+"-",l=
this.createElement("clipPath").attr({id:h}).add(this.defs);b=this.rect(b,d,c,a,0).add(l);b.id=h;b.clipPath=l;b.count=0;return b};J.prototype.text=function(d,c,a,h){var l={};if(h&&(this.allowHTML||!this.forExport))return this.html(d,c,a);l.x=Math.round(c||0);a&&(l.y=Math.round(a));b(d)&&(l.text=d);d=this.createElement("text").attr(l);if(!h||this.forExport&&!this.allowHTML)d.xSetter=function(b,d,c){for(var a=c.getElementsByTagName("tspan"),h=c.getAttribute(d),l=0,e;l<a.length;l++)e=a[l],e.getAttribute(d)===
h&&e.setAttribute(d,b);c.setAttribute(d,b)};return d};J.prototype.fontMetrics=function(b,d){b=!this.styledMode&&/px/.test(b)||!y.getComputedStyle?b||d&&d.style&&d.style.fontSize||this.style&&this.style.fontSize:d&&w.prototype.getStyle.call(d,"font-size");b=/px/.test(b)?N(b):12;d=24>b?b+3:Math.round(1.2*b);return{h:d,b:Math.round(.8*d),f:b}};J.prototype.rotCorr=function(b,d,c){var a=b;d&&c&&(a=Math.max(a*Math.cos(d*k),4));return{x:-b/3*Math.sin(d*k),y:a}};J.prototype.pathToSegments=function(b){for(var d=
[],c=[],a={A:8,C:7,H:2,L:3,M:3,Q:5,S:5,T:3,V:2},h=0;h<b.length;h++)O(c[0])&&v(b[h])&&c.length===a[c[0].toUpperCase()]&&b.splice(h,0,c[0].replace("M","L").replace("m","l")),"string"===typeof b[h]&&(c.length&&d.push(c.slice(0)),c.length=0),c.push(b[h]);d.push(c.slice(0));return d};J.prototype.label=function(b,d,c,a,h,l,e,r,m){return new E(this,b,d,c,a,h,l,e,r,m)};J.prototype.alignElements=function(){this.alignedObjects.forEach(function(b){return b.align()})};return J}();d(B.prototype,{Element:w,SVG_NS:q,
escapes:{"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"},symbols:I,draw:t});H.registerRendererType("svg",B,!0);"";return B});K(f,"Core/Renderer/HTML/HTMLElement.js",[f["Core/Globals.js"],f["Core/Renderer/SVG/SVGElement.js"],f["Core/Utilities.js"]],function(a,f,B){var C=this&&this.__extends||function(){var c=function(a,e){c=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(c,a){c.__proto__=a}||function(c,a){for(var e in a)a.hasOwnProperty(e)&&(c[e]=a[e])};return c(a,e)};return function(a,
e){function g(){this.constructor=a}c(a,e);a.prototype=null===e?Object.create(e):(g.prototype=e.prototype,new g)}}(),w=a.isFirefox,E=a.isMS,I=a.isWebKit,A=a.win,u=B.css,n=B.defined,k=B.extend,e=B.pick,c=B.pInt;return function(a){function g(){return null!==a&&a.apply(this,arguments)||this}C(g,a);g.compose=function(c){if(-1===g.composedClasses.indexOf(c)){g.composedClasses.push(c);var a=g.prototype,e=c.prototype;e.getSpanCorrection=a.getSpanCorrection;e.htmlCss=a.htmlCss;e.htmlGetBBox=a.htmlGetBBox;
e.htmlUpdateTransform=a.htmlUpdateTransform;e.setSpanRotation=a.setSpanRotation}return c};g.prototype.getSpanCorrection=function(c,a,e){this.xCorr=-c*e;this.yCorr=-a};g.prototype.htmlCss=function(c){var a="SPAN"===this.element.tagName&&c&&"width"in c,g=e(a&&c.width,void 0);if(a){delete c.width;this.textWidth=g;var f=!0}c&&"ellipsis"===c.textOverflow&&(c.whiteSpace="nowrap",c.overflow="hidden");this.styles=k(this.styles,c);u(this.element,c);f&&this.htmlUpdateTransform();return this};g.prototype.htmlGetBBox=
function(){var c=this.element;return{x:c.offsetLeft,y:c.offsetTop,width:c.offsetWidth,height:c.offsetHeight}};g.prototype.htmlUpdateTransform=function(){if(this.added){var a=this.renderer,e=this.element,g=this.translateX||0,k=this.translateY||0,f=this.x||0,p=this.y||0,m=this.textAlign||"left",h={left:0,center:.5,right:1}[m],b=this.styles;b=b&&b.whiteSpace;u(e,{marginLeft:g,marginTop:k});!a.styledMode&&this.shadows&&this.shadows.forEach(function(b){u(b,{marginLeft:g+1,marginTop:k+1})});this.inverted&&
[].forEach.call(e.childNodes,function(b){a.invertChild(b,e)});if("SPAN"===e.tagName){var l=this.rotation,d=this.textWidth&&c(this.textWidth),D=[l,m,e.innerHTML,this.textWidth,this.textAlign].join(),v=void 0;v=!1;if(d!==this.oldTextWidth){if(this.textPxLength)var r=this.textPxLength;else u(e,{width:"",whiteSpace:b||"nowrap"}),r=e.offsetWidth;(d>this.oldTextWidth||r>d)&&(/[ \-]/.test(e.textContent||e.innerText)||"ellipsis"===e.style.textOverflow)&&(u(e,{width:r>d||l?d+"px":"auto",display:"block",whiteSpace:b||
"normal"}),this.oldTextWidth=d,v=!0)}this.hasBoxWidthChanged=v;D!==this.cTT&&(v=a.fontMetrics(e.style.fontSize,e).b,!n(l)||l===(this.oldRotation||0)&&m===this.oldAlign||this.setSpanRotation(l,h,v),this.getSpanCorrection(!n(l)&&this.textPxLength||e.offsetWidth,v,h,l,m));u(e,{left:f+(this.xCorr||0)+"px",top:p+(this.yCorr||0)+"px"});this.cTT=D;this.oldRotation=l;this.oldAlign=m}}else this.alignOnAdd=!0};g.prototype.setSpanRotation=function(c,a,e){var g={},k=E&&!/Edge/.test(A.navigator.userAgent)?"-ms-transform":
I?"-webkit-transform":w?"MozTransform":A.opera?"-o-transform":void 0;k&&(g[k]=g.transform="rotate("+c+"deg)",g[k+(w?"Origin":"-origin")]=g.transformOrigin=100*a+"% "+e+"px",u(this.element,g))};g.composedClasses=[];return g}(f)});K(f,"Core/Renderer/HTML/HTMLRenderer.js",[f["Core/Renderer/HTML/AST.js"],f["Core/Renderer/SVG/SVGElement.js"],f["Core/Renderer/SVG/SVGRenderer.js"],f["Core/Utilities.js"]],function(a,f,B,H){var C=this&&this.__extends||function(){var a=function(k,e){a=Object.setPrototypeOf||
{__proto__:[]}instanceof Array&&function(c,a){c.__proto__=a}||function(c,a){for(var e in a)a.hasOwnProperty(e)&&(c[e]=a[e])};return a(k,e)};return function(k,e){function c(){this.constructor=k}a(k,e);k.prototype=null===e?Object.create(e):(c.prototype=e.prototype,new c)}}(),E=H.attr,I=H.createElement,A=H.extend,u=H.pick;return function(n){function k(){return null!==n&&n.apply(this,arguments)||this}C(k,n);k.compose=function(a){-1===k.composedClasses.indexOf(a)&&(k.composedClasses.push(a),a.prototype.html=
k.prototype.html);return a};k.prototype.html=function(e,c,k){var g=this.createElement("span"),p=g.element,q=g.renderer,n=q.isSVG,y=function(c,a){["opacity","visibility"].forEach(function(e){c[e+"Setter"]=function(h,b,l){var d=c.div?c.div.style:a;f.prototype[e+"Setter"].call(this,h,b,l);d&&(d[b]=h)}});c.addedSetters=!0};g.textSetter=function(c){c!==this.textStr&&(delete this.bBox,delete this.oldTextWidth,a.setElementHTML(this.element,u(c,"")),this.textStr=c,g.doTransform=!0)};n&&y(g,g.element.style);
g.xSetter=g.ySetter=g.alignSetter=g.rotationSetter=function(c,a){"align"===a?g.alignValue=g.textAlign=c:g[a]=c;g.doTransform=!0};g.afterSetters=function(){this.doTransform&&(this.htmlUpdateTransform(),this.doTransform=!1)};g.attr({text:e,x:Math.round(c),y:Math.round(k)}).css({position:"absolute"});q.styledMode||g.css({fontFamily:this.style.fontFamily,fontSize:this.style.fontSize});p.style.whiteSpace="nowrap";g.css=g.htmlCss;n&&(g.add=function(c){var a=q.box.parentNode,e=[];if(this.parentGroup=c){var h=
c.div;if(!h){for(;c;)e.push(c),c=c.parentGroup;e.reverse().forEach(function(b){function c(d,c){b[c]=d;"translateX"===c?v.left=d+"px":v.top=d+"px";b.doTransform=!0}var d=E(b.element,"class"),m=b.styles||{};h=b.div=b.div||I("div",d?{className:d}:void 0,{position:"absolute",left:(b.translateX||0)+"px",top:(b.translateY||0)+"px",display:b.display,opacity:b.opacity,cursor:m.cursor,pointerEvents:m.pointerEvents,visibility:b.visibility},h||a);var v=h.style;A(b,{classSetter:function(b){return function(d){this.element.setAttribute("class",
d);b.className=d}}(h),on:function(){e[0].div&&g.on.apply({element:e[0].div,onEvents:b.onEvents},arguments);return b},translateXSetter:c,translateYSetter:c});b.addedSetters||y(b)})}}else h=a;h.appendChild(p);g.added=!0;g.alignOnAdd&&g.htmlUpdateTransform();return g});return g};k.composedClasses=[];return k}(B)});K(f,"Core/Axis/AxisDefaults.js",[],function(){var a;(function(a){a.defaultXAxisOptions={alignTicks:!0,allowDecimals:void 0,panningEnabled:!0,zIndex:2,zoomEnabled:!0,dateTimeLabelFormats:{millisecond:{main:"%H:%M:%S.%L",
range:!1},second:{main:"%H:%M:%S",range:!1},minute:{main:"%H:%M",range:!1},hour:{main:"%H:%M",range:!1},day:{main:"%e. %b"},week:{main:"%e. %b"},month:{main:"%b '%y"},year:{main:"%Y"}},endOnTick:!1,gridLineDashStyle:"Solid",gridZIndex:1,labels:{autoRotation:void 0,autoRotationLimit:80,distance:void 0,enabled:!0,indentation:10,overflow:"justify",padding:5,reserveSpace:void 0,rotation:void 0,staggerLines:0,step:0,useHTML:!1,x:0,zIndex:7,style:{color:"#666666",cursor:"default",fontSize:"11px"}},maxPadding:.01,
minorGridLineDashStyle:"Solid",minorTickLength:2,minorTickPosition:"outside",minPadding:.01,offset:void 0,opposite:!1,reversed:void 0,reversedStacks:!1,showEmpty:!0,showFirstLabel:!0,showLastLabel:!0,startOfWeek:1,startOnTick:!1,tickLength:10,tickPixelInterval:100,tickmarkPlacement:"between",tickPosition:"outside",title:{align:"middle",rotation:0,useHTML:!1,x:0,y:0,style:{color:"#666666"}},type:"linear",uniqueNames:!0,visible:!0,minorGridLineColor:"#f2f2f2",minorGridLineWidth:1,minorTickColor:"#999999",
lineColor:"#ccd6eb",lineWidth:1,gridLineColor:"#e6e6e6",gridLineWidth:void 0,tickColor:"#ccd6eb"};a.defaultYAxisOptions={reversedStacks:!0,endOnTick:!0,maxPadding:.05,minPadding:.05,tickPixelInterval:72,showLastLabel:!0,labels:{x:-8},startOnTick:!0,title:{rotation:270,text:"Values"},stackLabels:{animation:{},allowOverlap:!1,enabled:!1,crop:!0,overflow:"justify",formatter:function(){var a=this.axis.chart.numberFormatter;return a(this.total,-1)},style:{color:"#000000",fontSize:"11px",fontWeight:"bold",
textOutline:"1px contrast"}},gridLineWidth:1,lineWidth:0};a.defaultLeftAxisOptions={labels:{x:-15},title:{rotation:270}};a.defaultRightAxisOptions={labels:{x:15},title:{rotation:90}};a.defaultBottomAxisOptions={labels:{autoRotation:[-45],x:0},margin:15,title:{rotation:0}};a.defaultTopAxisOptions={labels:{autoRotation:[-45],x:0},margin:15,title:{rotation:0}}})(a||(a={}));return a});K(f,"Core/Foundation.js",[f["Core/Utilities.js"]],function(a){var f=a.addEvent,B=a.isFunction,H=a.objectEach,w=a.removeEvent,
E;(function(a){a.registerEventOptions=function(a,u){a.eventOptions=a.eventOptions||{};H(u.events,function(n,k){a.eventOptions[k]!==n&&(a.eventOptions[k]&&(w(a,k,a.eventOptions[k]),delete a.eventOptions[k]),B(n)&&(a.eventOptions[k]=n,f(a,k,n)))})}})(E||(E={}));return E});K(f,"Core/Axis/Tick.js",[f["Core/FormatUtilities.js"],f["Core/Globals.js"],f["Core/Utilities.js"]],function(a,f,B){var C=f.deg2rad,w=B.clamp,E=B.correctFloat,I=B.defined,A=B.destroyObjectProperties,u=B.extend,n=B.fireEvent,k=B.isNumber,
e=B.merge,c=B.objectEach,p=B.pick;f=function(){function g(c,a,e,g,k){this.isNewLabel=this.isNew=!0;this.axis=c;this.pos=a;this.type=e||"";this.parameters=k||{};this.tickmarkOffset=this.parameters.tickmarkOffset;this.options=this.parameters.options;n(this,"init");e||g||this.addLabel()}g.prototype.addLabel=function(){var c=this,e=c.axis,g=e.options,f=e.chart,x=e.categories,z=e.logarithmic,m=e.names,h=c.pos,b=p(c.options&&c.options.labels,g.labels),l=e.tickPositions,d=h===l[0],D=h===l[l.length-1],v=
(!b.step||1===b.step)&&1===e.tickInterval;l=l.info;var r=c.label,O;x=this.parameters.category||(x?p(x[h],m[h],h):h);z&&k(x)&&(x=E(z.lin2log(x)));if(e.dateTime)if(l){var P=f.time.resolveDTLFormat(g.dateTimeLabelFormats[!g.grid&&l.higherRanks[h]||l.unitName]);var S=P.main}else k(x)&&(S=e.dateTime.getXDateFormat(x,g.dateTimeLabelFormats||{}));c.isFirst=d;c.isLast=D;var N={axis:e,chart:f,dateTimeLabelFormat:S,isFirst:d,isLast:D,pos:h,tick:c,tickPositionInfo:l,value:x};n(this,"labelFormat",N);var C=function(d){return b.formatter?
b.formatter.call(d,d):b.format?(d.text=e.defaultLabelFormatter.call(d),a.format(b.format,d,f)):e.defaultLabelFormatter.call(d,d)};g=C.call(N,N);var X=P&&P.list;c.shortenLabel=X?function(){for(O=0;O<X.length;O++)if(u(N,{dateTimeLabelFormat:X[O]}),r.attr({text:C.call(N,N)}),r.getBBox().width<e.getSlotWidth(c)-2*b.padding)return;r.attr({text:""})}:void 0;v&&e._addedPlotLB&&c.moveLabel(g,b);I(r)||c.movedLabel?r&&r.textStr!==g&&!v&&(!r.textWidth||b.style.width||r.styles.width||r.css({width:null}),r.attr({text:g}),
r.textPxLength=r.getBBox().width):(c.label=r=c.createLabel({x:0,y:0},g,b),c.rotation=0)};g.prototype.createLabel=function(c,a,g){var k=this.axis,f=k.chart;if(c=I(a)&&g.enabled?f.renderer.text(a,c.x,c.y,g.useHTML).add(k.labelGroup):null)f.styledMode||c.css(e(g.style)),c.textPxLength=c.getBBox().width;return c};g.prototype.destroy=function(){A(this,this.axis)};g.prototype.getPosition=function(c,a,e,g){var k=this.axis,f=k.chart,m=g&&f.oldChartHeight||f.chartHeight;c={x:c?E(k.translate(a+e,null,null,
g)+k.transB):k.left+k.offset+(k.opposite?(g&&f.oldChartWidth||f.chartWidth)-k.right-k.left:0),y:c?m-k.bottom+k.offset-(k.opposite?k.height:0):E(m-k.translate(a+e,null,null,g)-k.transB)};c.y=w(c.y,-1E5,1E5);n(this,"afterGetPosition",{pos:c});return c};g.prototype.getLabelPosition=function(c,a,e,g,k,f,m,h){var b=this.axis,l=b.transA,d=b.isLinked&&b.linkedParent?b.linkedParent.reversed:b.reversed,D=b.staggerLines,v=b.tickRotCorr||{x:0,y:0},r=g||b.reserveSpaceDefault?0:-b.labelOffset*("center"===b.labelAlign?
.5:1),p={},q=k.y;I(q)||(q=0===b.side?e.rotation?-8:-e.getBBox().height:2===b.side?v.y+8:Math.cos(e.rotation*C)*(v.y-e.getBBox(!1,0).height/2));c=c+k.x+r+v.x-(f&&g?f*l*(d?-1:1):0);a=a+q-(f&&!g?f*l*(d?1:-1):0);D&&(e=m/(h||1)%D,b.opposite&&(e=D-e-1),a+=b.labelOffset/D*e);p.x=c;p.y=Math.round(a);n(this,"afterGetLabelPosition",{pos:p,tickmarkOffset:f,index:m});return p};g.prototype.getLabelSize=function(){return this.label?this.label.getBBox()[this.axis.horiz?"height":"width"]:0};g.prototype.getMarkPath=
function(c,a,e,g,k,f){return f.crispLine([["M",c,a],["L",c+(k?0:-e),a+(k?e:0)]],g)};g.prototype.handleOverflow=function(c){var a=this.axis,e=a.options.labels,g=c.x,k=a.chart.chartWidth,f=a.chart.spacing,m=p(a.labelLeft,Math.min(a.pos,f[3]));f=p(a.labelRight,Math.max(a.isRadial?0:a.pos+a.len,k-f[1]));var h=this.label,b=this.rotation,l={left:0,center:.5,right:1}[a.labelAlign||h.attr("align")],d=h.getBBox().width,D=a.getSlotWidth(this),v={},r=D,n=1,t;if(b||"justify"!==e.overflow)0>b&&g-l*d<m?t=Math.round(g/
Math.cos(b*C)-m):0<b&&g+l*d>f&&(t=Math.round((k-g)/Math.cos(b*C)));else if(k=g+(1-l)*d,g-l*d<m?r=c.x+r*(1-l)-m:k>f&&(r=f-c.x+r*l,n=-1),r=Math.min(D,r),r<D&&"center"===a.labelAlign&&(c.x+=n*(D-r-l*(D-Math.min(d,r)))),d>r||a.autoRotation&&(h.styles||{}).width)t=r;t&&(this.shortenLabel?this.shortenLabel():(v.width=Math.floor(t)+"px",(e.style||{}).textOverflow||(v.textOverflow="ellipsis"),h.css(v)))};g.prototype.moveLabel=function(a,e){var g=this,k=g.label,f=g.axis,p=f.reversed,m=!1;k&&k.textStr===a?
(g.movedLabel=k,m=!0,delete g.label):c(f.ticks,function(b){m||b.isNew||b===g||!b.label||b.label.textStr!==a||(g.movedLabel=b.label,m=!0,b.labelPos=g.movedLabel.xy,delete b.label)});if(!m&&(g.labelPos||k)){var h=g.labelPos||k.xy;k=f.horiz?p?0:f.width+f.left:h.x;f=f.horiz?h.y:p?f.width+f.left:0;g.movedLabel=g.createLabel({x:k,y:f},a,e);g.movedLabel&&g.movedLabel.attr({opacity:0})}};g.prototype.render=function(c,a,e){var g=this.axis,k=g.horiz,f=this.pos,m=p(this.tickmarkOffset,g.tickmarkOffset);f=this.getPosition(k,
f,m,a);m=f.x;var h=f.y;g=k&&m===g.pos+g.len||!k&&h===g.pos?-1:1;k=p(e,this.label&&this.label.newOpacity,1);e=p(e,1);this.isActive=!0;this.renderGridLine(a,e,g);this.renderMark(f,e,g);this.renderLabel(f,a,k,c);this.isNew=!1;n(this,"afterRender")};g.prototype.renderGridLine=function(c,a,e){var g=this.axis,k=g.options,f={},m=this.pos,h=this.type,b=p(this.tickmarkOffset,g.tickmarkOffset),l=g.chart.renderer,d=this.gridLine,D=k.gridLineWidth,v=k.gridLineColor,r=k.gridLineDashStyle;"minor"===this.type&&
(D=k.minorGridLineWidth,v=k.minorGridLineColor,r=k.minorGridLineDashStyle);d||(g.chart.styledMode||(f.stroke=v,f["stroke-width"]=D||0,f.dashstyle=r),h||(f.zIndex=1),c&&(a=0),this.gridLine=d=l.path().attr(f).addClass("highcharts-"+(h?h+"-":"")+"grid-line").add(g.gridGroup));if(d&&(e=g.getPlotLinePath({value:m+b,lineWidth:d.strokeWidth()*e,force:"pass",old:c})))d[c||this.isNew?"attr":"animate"]({d:e,opacity:a})};g.prototype.renderMark=function(c,a,e){var g=this.axis,k=g.options,f=g.chart.renderer,m=
this.type,h=g.tickSize(m?m+"Tick":"tick"),b=c.x;c=c.y;var l=p(k["minor"!==m?"tickWidth":"minorTickWidth"],!m&&g.isXAxis?1:0);k=k["minor"!==m?"tickColor":"minorTickColor"];var d=this.mark,D=!d;h&&(g.opposite&&(h[0]=-h[0]),d||(this.mark=d=f.path().addClass("highcharts-"+(m?m+"-":"")+"tick").add(g.axisGroup),g.chart.styledMode||d.attr({stroke:k,"stroke-width":l})),d[D?"attr":"animate"]({d:this.getMarkPath(b,c,h[0],d.strokeWidth()*e,g.horiz,f),opacity:a}))};g.prototype.renderLabel=function(c,a,e,g){var f=
this.axis,q=f.horiz,m=f.options,h=this.label,b=m.labels,l=b.step;f=p(this.tickmarkOffset,f.tickmarkOffset);var d=c.x;c=c.y;var D=!0;h&&k(d)&&(h.xy=c=this.getLabelPosition(d,c,h,q,b,f,g,l),this.isFirst&&!this.isLast&&!m.showFirstLabel||this.isLast&&!this.isFirst&&!m.showLastLabel?D=!1:!q||b.step||b.rotation||a||0===e||this.handleOverflow(c),l&&g%l&&(D=!1),D&&k(c.y)?(c.opacity=e,h[this.isNewLabel?"attr":"animate"](c).show(!0),this.isNewLabel=!1):(h.hide(),this.isNewLabel=!0))};g.prototype.replaceMovedLabel=
function(){var c=this.label,a=this.axis,e=a.reversed;if(c&&!this.isNew){var g=a.horiz?e?a.left:a.width+a.left:c.xy.x;e=a.horiz?c.xy.y:e?a.width+a.top:a.top;c.animate({x:g,y:e,opacity:0},void 0,c.destroy);delete this.label}a.isDirty=!0;this.label=this.movedLabel;delete this.movedLabel};return g}();"";return f});K(f,"Core/Axis/Axis.js",[f["Core/Animation/AnimationUtilities.js"],f["Core/Axis/AxisDefaults.js"],f["Core/Color/Color.js"],f["Core/DefaultOptions.js"],f["Core/Foundation.js"],f["Core/Globals.js"],
f["Core/Axis/Tick.js"],f["Core/Utilities.js"]],function(a,f,B,H,w,E,I,A){var u=a.animObject,n=H.defaultOptions,k=w.registerEventOptions,e=E.deg2rad,c=A.arrayMax,p=A.arrayMin,g=A.clamp,t=A.correctFloat,q=A.defined,F=A.destroyObjectProperties,y=A.erase,x=A.error,z=A.extend,m=A.fireEvent,h=A.isArray,b=A.isNumber,l=A.isString,d=A.merge,D=A.normalizeTickInterval,v=A.objectEach,r=A.pick,O=A.relativeLength,P=A.removeEvent,S=A.splat,N=A.syncTimeout,C=function(b,d){return D(d,void 0,void 0,r(b.options.allowDecimals,
.5>d||void 0!==b.tickAmount),!!b.tickAmount)};a=function(){function a(b,d){this.zoomEnabled=this.width=this.visible=this.userOptions=this.translationSlope=this.transB=this.transA=this.top=this.ticks=this.tickRotCorr=this.tickPositions=this.tickmarkOffset=this.tickInterval=this.tickAmount=this.side=this.series=this.right=this.positiveValuesOnly=this.pos=this.pointRangePadding=this.pointRange=this.plotLinesAndBandsGroups=this.plotLinesAndBands=this.paddedTicks=this.overlap=this.options=this.offset=
this.names=this.minPixelPadding=this.minorTicks=this.minorTickInterval=this.min=this.maxLabelLength=this.max=this.len=this.left=this.labelFormatter=this.labelEdge=this.isLinked=this.height=this.hasVisibleSeries=this.hasNames=this.eventOptions=this.coll=this.closestPointRange=this.chart=this.bottom=this.alternateBands=void 0;this.init(b,d)}a.prototype.init=function(d,c){var a=c.isX;this.chart=d;this.horiz=d.inverted&&!this.isZAxis?!a:a;this.isXAxis=a;this.coll=this.coll||(a?"xAxis":"yAxis");m(this,
"init",{userOptions:c});this.opposite=r(c.opposite,this.opposite);this.side=r(c.side,this.side,this.horiz?this.opposite?0:2:this.opposite?1:3);this.setOptions(c);var e=this.options,h=e.labels,l=e.type;this.userOptions=c;this.minPixelPadding=0;this.reversed=r(e.reversed,this.reversed);this.visible=e.visible;this.zoomEnabled=e.zoomEnabled;this.hasNames="category"===l||!0===e.categories;this.categories=e.categories||(this.hasNames?[]:void 0);this.names||(this.names=[],this.names.keys={});this.plotLinesAndBandsGroups=
{};this.positiveValuesOnly=!!this.logarithmic;this.isLinked=q(e.linkedTo);this.ticks={};this.labelEdge=[];this.minorTicks={};this.plotLinesAndBands=[];this.alternateBands={};this.len=0;this.minRange=this.userMinRange=e.minRange||e.maxZoom;this.range=e.range;this.offset=e.offset||0;this.min=this.max=null;c=r(e.crosshair,S(d.options.tooltip.crosshairs)[a?0:1]);this.crosshair=!0===c?{}:c;-1===d.axes.indexOf(this)&&(a?d.axes.splice(d.xAxis.length,0,this):d.axes.push(this),d[this.coll].push(this));this.series=
this.series||[];d.inverted&&!this.isZAxis&&a&&"undefined"===typeof this.reversed&&(this.reversed=!0);this.labelRotation=b(h.rotation)?h.rotation:void 0;k(this,e);m(this,"afterInit")};a.prototype.setOptions=function(b){this.options=d(f.defaultXAxisOptions,"yAxis"===this.coll&&f.defaultYAxisOptions,[f.defaultTopAxisOptions,f.defaultRightAxisOptions,f.defaultBottomAxisOptions,f.defaultLeftAxisOptions][this.side],d(n[this.coll],b));m(this,"afterSetOptions",{userOptions:b})};a.prototype.defaultLabelFormatter=
function(d){var c=this.axis;d=this.chart.numberFormatter;var a=b(this.value)?this.value:NaN,e=c.chart.time,h=this.dateTimeLabelFormat,l=n.lang,g=l.numericSymbols;l=l.numericSymbolMagnitude||1E3;var r=c.logarithmic?Math.abs(a):c.tickInterval,m=g&&g.length;if(c.categories)var J=""+this.value;else if(h)J=e.dateFormat(h,a);else if(m&&1E3<=r)for(;m--&&"undefined"===typeof J;)c=Math.pow(l,m+1),r>=c&&0===10*a%c&&null!==g[m]&&0!==a&&(J=d(a/c,-1)+g[m]);"undefined"===typeof J&&(J=1E4<=Math.abs(a)?d(a,-1):d(a,
-1,void 0,""));return J};a.prototype.getSeriesExtremes=function(){var d=this,c=d.chart,a;m(this,"getSeriesExtremes",null,function(){d.hasVisibleSeries=!1;d.dataMin=d.dataMax=d.threshold=null;d.softThreshold=!d.isXAxis;d.stacking&&d.stacking.buildStacks();d.series.forEach(function(e){if(e.visible||!c.options.chart.ignoreHiddenSeries){var h=e.options,l=h.threshold;d.hasVisibleSeries=!0;d.positiveValuesOnly&&0>=l&&(l=null);if(d.isXAxis){if(h=e.xData,h.length){h=d.logarithmic?h.filter(d.validatePositiveValue):
h;a=e.getXExtremes(h);var g=a.min;var m=a.max;b(g)||g instanceof Date||(h=h.filter(b),a=e.getXExtremes(h),g=a.min,m=a.max);h.length&&(d.dataMin=Math.min(r(d.dataMin,g),g),d.dataMax=Math.max(r(d.dataMax,m),m))}}else if(e=e.applyExtremes(),b(e.dataMin)&&(g=e.dataMin,d.dataMin=Math.min(r(d.dataMin,g),g)),b(e.dataMax)&&(m=e.dataMax,d.dataMax=Math.max(r(d.dataMax,m),m)),q(l)&&(d.threshold=l),!h.softThreshold||d.positiveValuesOnly)d.softThreshold=!1}})});m(this,"afterGetSeriesExtremes")};a.prototype.translate=
function(d,c,a,e,h,l){var g=this.linkedParent||this,m=e&&g.old?g.old.min:g.min,r=g.minPixelPadding;h=(g.isOrdinal||g.brokenAxis&&g.brokenAxis.hasBreaks||g.logarithmic&&h)&&g.lin2val;var k=1,J=0;e=e&&g.old?g.old.transA:g.transA;e||(e=g.transA);a&&(k*=-1,J=g.len);g.reversed&&(k*=-1,J-=k*(g.sector||g.len));c?(l=(d*k+J-r)/e+m,h&&(l=g.lin2val(l))):(h&&(d=g.val2lin(d)),d=k*(d-m)*e,l=b(m)?(g.isRadial?d:t(d))+J+k*r+(b(l)?e*l:0):void 0);return l};a.prototype.toPixels=function(b,d){return this.translate(b,
!1,!this.horiz,null,!0)+(d?0:this.pos)};a.prototype.toValue=function(b,d){return this.translate(b-(d?0:this.pos),!0,!this.horiz,null,!0)};a.prototype.getPlotLinePath=function(d){function c(b,d,c){if("pass"!==n&&b<d||b>c)n?b=g(b,d,c):P=!0;return b}var a=this,e=a.chart,h=a.left,l=a.top,k=d.old,J=d.value,f=d.lineWidth,v=k&&e.oldChartHeight||e.chartHeight,D=k&&e.oldChartWidth||e.chartWidth,p=a.transB,q=d.translatedValue,n=d.force,t,z,y,O,P;d={value:J,lineWidth:f,old:k,force:n,acrossPanes:d.acrossPanes,
translatedValue:q};m(this,"getPlotLinePath",d,function(d){q=r(q,a.translate(J,null,null,k));q=g(q,-1E5,1E5);t=y=Math.round(q+p);z=O=Math.round(v-q-p);b(q)?a.horiz?(z=l,O=v-a.bottom,t=y=c(t,h,h+a.width)):(t=h,y=D-a.right,z=O=c(z,l,l+a.height)):(P=!0,n=!1);d.path=P&&!n?null:e.renderer.crispLine([["M",t,z],["L",y,O]],f||1)});return d.path};a.prototype.getLinearTickPositions=function(b,d,c){var a=t(Math.floor(d/b)*b);c=t(Math.ceil(c/b)*b);var e=[],h;t(a+b)===a&&(h=20);if(this.single)return[d];for(d=a;d<=
c;){e.push(d);d=t(d+b,h);if(d===l)break;var l=d}return e};a.prototype.getMinorTickInterval=function(){var b=this.options;return!0===b.minorTicks?r(b.minorTickInterval,"auto"):!1===b.minorTicks?null:b.minorTickInterval};a.prototype.getMinorTickPositions=function(){var b=this.options,d=this.tickPositions,c=this.minorTickInterval,a=this.pointRangePadding||0,e=this.min-a;a=this.max+a;var h=a-e,l=[];if(h&&h/c<this.len/3){var g=this.logarithmic;if(g)this.paddedTicks.forEach(function(b,d,a){d&&l.push.apply(l,
g.getLogTickPositions(c,a[d-1],a[d],!0))});else if(this.dateTime&&"auto"===this.getMinorTickInterval())l=l.concat(this.getTimeTicks(this.dateTime.normalizeTimeTickInterval(c),e,a,b.startOfWeek));else for(b=e+(d[0]-e)%c;b<=a&&b!==l[0];b+=c)l.push(b)}0!==l.length&&this.trimTicks(l);return l};a.prototype.adjustForMinRange=function(){var b=this.options,d=this.logarithmic,a=this.min,e=this.max,h=0,l,g,m,k;this.isXAxis&&"undefined"===typeof this.minRange&&!d&&(q(b.min)||q(b.max)||q(b.floor)||q(b.ceiling)?
this.minRange=null:(this.series.forEach(function(b){m=b.xData;k=b.xIncrement?1:m.length-1;if(1<m.length)for(l=k;0<l;l--)if(g=m[l]-m[l-1],!h||g<h)h=g}),this.minRange=Math.min(5*h,this.dataMax-this.dataMin)));if(e-a<this.minRange){var f=this.dataMax-this.dataMin>=this.minRange;var v=this.minRange;var D=(v-e+a)/2;D=[a-D,r(b.min,a-D)];f&&(D[2]=this.logarithmic?this.logarithmic.log2lin(this.dataMin):this.dataMin);a=c(D);e=[a+v,r(b.max,a+v)];f&&(e[2]=d?d.log2lin(this.dataMax):this.dataMax);e=p(e);e-a<v&&
(D[0]=e-v,D[1]=r(b.min,e-v),a=c(D))}this.min=a;this.max=e};a.prototype.getClosest=function(){var b;this.categories?b=1:this.series.forEach(function(d){var c=d.closestPointRange,a=d.visible||!d.chart.options.chart.ignoreHiddenSeries;!d.noSharedTooltip&&q(c)&&a&&(b=q(b)?Math.min(b,c):c)});return b};a.prototype.nameToX=function(b){var d=h(this.options.categories),c=d?this.categories:this.names,a=b.options.x;b.series.requireSorting=!1;q(a)||(a=this.options.uniqueNames&&c?d?c.indexOf(b.name):r(c.keys[b.name],
-1):b.series.autoIncrement());if(-1===a){if(!d&&c)var e=c.length}else e=a;"undefined"!==typeof e&&(this.names[e]=b.name,this.names.keys[b.name]=e);return e};a.prototype.updateNames=function(){var b=this,d=this.names;0<d.length&&(Object.keys(d.keys).forEach(function(b){delete d.keys[b]}),d.length=0,this.minRange=this.userMinRange,(this.series||[]).forEach(function(d){d.xIncrement=null;if(!d.points||d.isDirtyData)b.max=Math.max(b.max,d.xData.length-1),d.processData(),d.generatePoints();d.data.forEach(function(c,
a){if(c&&c.options&&"undefined"!==typeof c.name){var e=b.nameToX(c);"undefined"!==typeof e&&e!==c.x&&(c.x=e,d.xData[a]=e)}})}))};a.prototype.setAxisTranslation=function(){var b=this,d=b.max-b.min,c=b.linkedParent,a=!!b.categories,e=b.isXAxis,h=b.axisPointRange||0,g=0,k=0,f=b.transA;if(e||a||h){var v=b.getClosest();c?(g=c.minPointOffset,k=c.pointRangePadding):b.series.forEach(function(d){var c=a?1:e?r(d.options.pointRange,v,0):b.axisPointRange||0,m=d.options.pointPlacement;h=Math.max(h,c);if(!b.single||
a)d=d.is("xrange")?!e:e,g=Math.max(g,d&&l(m)?0:c/2),k=Math.max(k,d&&"on"===m?0:c)});c=b.ordinal&&b.ordinal.slope&&v?b.ordinal.slope/v:1;b.minPointOffset=g*=c;b.pointRangePadding=k*=c;b.pointRange=Math.min(h,b.single&&a?1:d);e&&(b.closestPointRange=v)}b.translationSlope=b.transA=f=b.staticScale||b.len/(d+k||1);b.transB=b.horiz?b.left:b.bottom;b.minPixelPadding=f*g;m(this,"afterSetAxisTranslation")};a.prototype.minFromRange=function(){return this.max-this.range};a.prototype.setTickInterval=function(d){var c=
this.chart,a=this.logarithmic,e=this.options,h=this.isXAxis,l=this.isLinked,g=e.tickPixelInterval,k=this.categories,f=this.softThreshold,v=e.maxPadding,D=e.minPadding,J=b(e.tickInterval)&&0<=e.tickInterval?e.tickInterval:void 0,p=b(this.threshold)?this.threshold:null;this.dateTime||k||l||this.getTickAmount();var n=r(this.userMin,e.min);var z=r(this.userMax,e.max);if(l){this.linkedParent=c[this.coll][e.linkedTo];var y=this.linkedParent.getExtremes();this.min=r(y.min,y.dataMin);this.max=r(y.max,y.dataMax);
e.type!==this.linkedParent.options.type&&x(11,1,c)}else{if(f&&q(p))if(this.dataMin>=p)y=p,D=0;else if(this.dataMax<=p){var O=p;v=0}this.min=r(n,y,this.dataMin);this.max=r(z,O,this.dataMax)}a&&(this.positiveValuesOnly&&!d&&0>=Math.min(this.min,r(this.dataMin,this.min))&&x(10,1,c),this.min=t(a.log2lin(this.min),16),this.max=t(a.log2lin(this.max),16));this.range&&q(this.max)&&(this.userMin=this.min=n=Math.max(this.dataMin,this.minFromRange()),this.userMax=z=this.max,this.range=null);m(this,"foundExtremes");
this.beforePadding&&this.beforePadding();this.adjustForMinRange();!(k||this.axisPointRange||this.stacking&&this.stacking.usePercentage||l)&&q(this.min)&&q(this.max)&&(c=this.max-this.min)&&(!q(n)&&D&&(this.min-=c*D),!q(z)&&v&&(this.max+=c*v));b(this.userMin)||(b(e.softMin)&&e.softMin<this.min&&(this.min=n=e.softMin),b(e.floor)&&(this.min=Math.max(this.min,e.floor)));b(this.userMax)||(b(e.softMax)&&e.softMax>this.max&&(this.max=z=e.softMax),b(e.ceiling)&&(this.max=Math.min(this.max,e.ceiling)));f&&
q(this.dataMin)&&(p=p||0,!q(n)&&this.min<p&&this.dataMin>=p?this.min=this.options.minRange?Math.min(p,this.max-this.minRange):p:!q(z)&&this.max>p&&this.dataMax<=p&&(this.max=this.options.minRange?Math.max(p,this.min+this.minRange):p));b(this.min)&&b(this.max)&&!this.chart.polar&&this.min>this.max&&(q(this.options.min)?this.max=this.min:q(this.options.max)&&(this.min=this.max));this.tickInterval=this.min===this.max||"undefined"===typeof this.min||"undefined"===typeof this.max?1:l&&this.linkedParent&&
!J&&g===this.linkedParent.options.tickPixelInterval?J=this.linkedParent.tickInterval:r(J,this.tickAmount?(this.max-this.min)/Math.max(this.tickAmount-1,1):void 0,k?1:(this.max-this.min)*g/Math.max(this.len,g));if(h&&!d){var P=this.min!==(this.old&&this.old.min)||this.max!==(this.old&&this.old.max);this.series.forEach(function(b){b.forceCrop=b.forceCropping&&b.forceCropping();b.processData(P)});m(this,"postProcessData",{hasExtemesChanged:P})}this.setAxisTranslation();m(this,"initialAxisTranslation");
this.pointRange&&!J&&(this.tickInterval=Math.max(this.pointRange,this.tickInterval));d=r(e.minTickInterval,this.dateTime&&!this.series.some(function(b){return b.noSharedTooltip})?this.closestPointRange:0);!J&&this.tickInterval<d&&(this.tickInterval=d);this.dateTime||this.logarithmic||J||(this.tickInterval=C(this,this.tickInterval));this.tickAmount||(this.tickInterval=this.unsquish());this.setTickPositions()};a.prototype.setTickPositions=function(){var b=this.options,d=b.tickPositions,c=this.getMinorTickInterval(),
a=this.hasVerticalPanning(),e="colorAxis"===this.coll,h=(e||!a)&&b.startOnTick;a=(e||!a)&&b.endOnTick;e=b.tickPositioner;this.tickmarkOffset=this.categories&&"between"===b.tickmarkPlacement&&1===this.tickInterval?.5:0;this.minorTickInterval="auto"===c&&this.tickInterval?this.tickInterval/5:c;this.single=this.min===this.max&&q(this.min)&&!this.tickAmount&&(parseInt(this.min,10)===this.min||!1!==b.allowDecimals);this.tickPositions=c=d&&d.slice();if(!c){if(this.ordinal&&this.ordinal.positions||!((this.max-
this.min)/this.tickInterval>Math.max(2*this.len,200)))if(this.dateTime)c=this.getTimeTicks(this.dateTime.normalizeTimeTickInterval(this.tickInterval,b.units),this.min,this.max,b.startOfWeek,this.ordinal&&this.ordinal.positions,this.closestPointRange,!0);else if(this.logarithmic)c=this.logarithmic.getLogTickPositions(this.tickInterval,this.min,this.max);else for(var l=b=this.tickInterval;l<=2*b;)if(c=this.getLinearTickPositions(this.tickInterval,this.min,this.max),this.tickAmount&&c.length>this.tickAmount)this.tickInterval=
C(this,l*=1.1);else break;else c=[this.min,this.max],x(19,!1,this.chart);c.length>this.len&&(c=[c[0],c.pop()],c[0]===c[1]&&(c.length=1));this.tickPositions=c;e&&(e=e.apply(this,[this.min,this.max]))&&(this.tickPositions=c=e)}this.paddedTicks=c.slice(0);this.trimTicks(c,h,a);this.isLinked||(this.single&&2>c.length&&!this.categories&&!this.series.some(function(b){return b.is("heatmap")&&"between"===b.options.pointPlacement})&&(this.min-=.5,this.max+=.5),d||e||this.adjustTickAmount());m(this,"afterSetTickPositions")};
a.prototype.trimTicks=function(b,d,c){var a=b[0],e=b[b.length-1],h=!this.isOrdinal&&this.minPointOffset||0;m(this,"trimTicks");if(!this.isLinked){if(d&&-Infinity!==a)this.min=a;else for(;this.min-h>b[0];)b.shift();if(c)this.max=e;else for(;this.max+h<b[b.length-1];)b.pop();0===b.length&&q(a)&&!this.options.tickPositions&&b.push((e+a)/2)}};a.prototype.alignToOthers=function(){var d=this,c=[this],a=d.options,e="yAxis"===this.coll&&this.chart.options.chart.alignThresholds,h=[],l;d.thresholdAlignment=
void 0;if((!1!==this.chart.options.chart.alignTicks&&a.alignTicks||e)&&!1!==a.startOnTick&&!1!==a.endOnTick&&!d.logarithmic){var g=function(b){var d=b.options;return[b.horiz?d.left:d.top,d.width,d.height,d.pane].join()},m=g(this);this.chart[this.coll].forEach(function(b){var a=b.series;a.length&&a.some(function(b){return b.visible})&&b!==d&&g(b)===m&&(l=!0,c.push(b))})}if(l&&e){c.forEach(function(c){c=c.getThresholdAlignment(d);b(c)&&h.push(c)});var r=1<h.length?h.reduce(function(b,d){return b+d},
0)/h.length:void 0;c.forEach(function(b){b.thresholdAlignment=r})}return l};a.prototype.getThresholdAlignment=function(d){(!b(this.dataMin)||this!==d&&this.series.some(function(b){return b.isDirty||b.isDirtyData}))&&this.getSeriesExtremes();if(b(this.threshold))return d=g((this.threshold-(this.dataMin||0))/((this.dataMax||0)-(this.dataMin||0)),0,1),this.options.reversed&&(d=1-d),d};a.prototype.getTickAmount=function(){var b=this.options,d=b.tickPixelInterval,c=b.tickAmount;!q(b.tickInterval)&&!c&&
this.len<d&&!this.isRadial&&!this.logarithmic&&b.startOnTick&&b.endOnTick&&(c=2);!c&&this.alignToOthers()&&(c=Math.ceil(this.len/d)+1);4>c&&(this.finalTickAmt=c,c=5);this.tickAmount=c};a.prototype.adjustTickAmount=function(){var d=this,c=d.finalTickAmt,a=d.max,e=d.min,h=d.options,l=d.tickPositions,g=d.tickAmount,m=d.thresholdAlignment,k=l&&l.length,f=r(d.threshold,d.softThreshold?0:null);var v=d.tickInterval;if(b(m)){var D=.5>m?Math.ceil(m*(g-1)):Math.floor(m*(g-1));h.reversed&&(D=g-1-D)}if(d.hasData()&&
b(e)&&b(a)){m=function(){d.transA*=(k-1)/(g-1);d.min=h.startOnTick?l[0]:Math.min(e,l[0]);d.max=h.endOnTick?l[l.length-1]:Math.max(a,l[l.length-1])};if(b(D)&&b(d.threshold)){for(;l[D]!==f||l.length!==g||l[0]>e||l[l.length-1]<a;){l.length=0;for(l.push(d.threshold);l.length<g;)void 0===l[D]||l[D]>d.threshold?l.unshift(t(l[0]-v)):l.push(t(l[l.length-1]+v));if(v>8*d.tickInterval)break;v*=2}m()}else if(k<g){for(;l.length<g;)l.length%2||e===f?l.push(t(l[l.length-1]+v)):l.unshift(t(l[0]-v));m()}if(q(c)){for(v=
f=l.length;v--;)(3===c&&1===v%2||2>=c&&0<v&&v<f-1)&&l.splice(v,1);d.finalTickAmt=void 0}}};a.prototype.setScale=function(){var b=!1,d=!1;this.series.forEach(function(c){b=b||c.isDirtyData||c.isDirty;d=d||c.xAxis&&c.xAxis.isDirty||!1});this.setAxisSize();var c=this.len!==(this.old&&this.old.len);c||b||d||this.isLinked||this.forceRedraw||this.userMin!==(this.old&&this.old.userMin)||this.userMax!==(this.old&&this.old.userMax)||this.alignToOthers()?(this.stacking&&this.stacking.resetStacks(),this.forceRedraw=
!1,this.getSeriesExtremes(),this.setTickInterval(),this.isDirty||(this.isDirty=c||this.min!==(this.old&&this.old.min)||this.max!==(this.old&&this.old.max))):this.stacking&&this.stacking.cleanStacks();b&&this.panningState&&(this.panningState.isDirty=!0);m(this,"afterSetScale")};a.prototype.setExtremes=function(b,d,c,a,e){var h=this,l=h.chart;c=r(c,!0);h.series.forEach(function(b){delete b.kdTree});e=z(e,{min:b,max:d});m(h,"setExtremes",e,function(){h.userMin=b;h.userMax=d;h.eventArgs=e;c&&l.redraw(a)})};
a.prototype.zoom=function(b,d){var c=this,a=this.dataMin,e=this.dataMax,h=this.options,l=Math.min(a,r(h.min,a)),g=Math.max(e,r(h.max,e));b={newMin:b,newMax:d};m(this,"zoom",b,function(b){var d=b.newMin,h=b.newMax;if(d!==c.min||h!==c.max)c.allowZoomOutside||(q(a)&&(d<l&&(d=l),d>g&&(d=g)),q(e)&&(h<l&&(h=l),h>g&&(h=g))),c.displayBtn="undefined"!==typeof d||"undefined"!==typeof h,c.setExtremes(d,h,!1,void 0,{trigger:"zoom"});b.zoomed=!0});return b.zoomed};a.prototype.setAxisSize=function(){var b=this.chart,
d=this.options,c=d.offsets||[0,0,0,0],a=this.horiz,e=this.width=Math.round(O(r(d.width,b.plotWidth-c[3]+c[1]),b.plotWidth)),h=this.height=Math.round(O(r(d.height,b.plotHeight-c[0]+c[2]),b.plotHeight)),l=this.top=Math.round(O(r(d.top,b.plotTop+c[0]),b.plotHeight,b.plotTop));d=this.left=Math.round(O(r(d.left,b.plotLeft+c[3]),b.plotWidth,b.plotLeft));this.bottom=b.chartHeight-h-l;this.right=b.chartWidth-e-d;this.len=Math.max(a?e:h,0);this.pos=a?d:l};a.prototype.getExtremes=function(){var b=this.logarithmic;
return{min:b?t(b.lin2log(this.min)):this.min,max:b?t(b.lin2log(this.max)):this.max,dataMin:this.dataMin,dataMax:this.dataMax,userMin:this.userMin,userMax:this.userMax}};a.prototype.getThreshold=function(b){var d=this.logarithmic,c=d?d.lin2log(this.min):this.min;d=d?d.lin2log(this.max):this.max;null===b||-Infinity===b?b=c:Infinity===b?b=d:c>b?b=c:d<b&&(b=d);return this.translate(b,0,1,0,1)};a.prototype.autoLabelAlign=function(b){var d=(r(b,0)-90*this.side+720)%360;b={align:"center"};m(this,"autoLabelAlign",
b,function(b){15<d&&165>d?b.align="right":195<d&&345>d&&(b.align="left")});return b.align};a.prototype.tickSize=function(b){var d=this.options,c=r(d["tick"===b?"tickWidth":"minorTickWidth"],"tick"===b&&this.isXAxis&&!this.categories?1:0),a=d["tick"===b?"tickLength":"minorTickLength"];if(c&&a){"inside"===d[b+"Position"]&&(a=-a);var e=[a,c]}b={tickSize:e};m(this,"afterTickSize",b);return b.tickSize};a.prototype.labelMetrics=function(){var b=this.tickPositions&&this.tickPositions[0]||0;return this.chart.renderer.fontMetrics(this.options.labels.style.fontSize,
this.ticks[b]&&this.ticks[b].label)};a.prototype.unsquish=function(){var d=this.options.labels,c=this.horiz,a=this.tickInterval,h=this.len/(((this.categories?1:0)+this.max-this.min)/a),l=d.rotation,g=this.labelMetrics(),m=Math.max(this.max-this.min,0),k=function(b){var d=b/(h||1);d=1<d?Math.ceil(d):1;d*a>m&&Infinity!==b&&Infinity!==h&&m&&(d=Math.ceil(m/a));return t(d*a)},v=a,f,D,p=Number.MAX_VALUE;if(c){if(!d.staggerLines&&!d.step)if(b(l))var q=[l];else h<d.autoRotationLimit&&(q=d.autoRotation);q&&
q.forEach(function(b){if(b===l||b&&-90<=b&&90>=b){D=k(Math.abs(g.h/Math.sin(e*b)));var d=D+Math.abs(b/360);d<p&&(p=d,f=b,v=D)}})}else d.step||(v=k(g.h));this.autoRotation=q;this.labelRotation=r(f,b(l)?l:0);return v};a.prototype.getSlotWidth=function(d){var c=this.chart,a=this.horiz,e=this.options.labels,h=Math.max(this.tickPositions.length-(this.categories?0:1),1),l=c.margin[3];if(d&&b(d.slotWidth))return d.slotWidth;if(a&&2>e.step)return e.rotation?0:(this.staggerLines||1)*this.len/h;if(!a){d=e.style.width;
if(void 0!==d)return parseInt(String(d),10);if(l)return l-c.spacing[3]}return.33*c.chartWidth};a.prototype.renderUnsquish=function(){var b=this.chart,d=b.renderer,c=this.tickPositions,a=this.ticks,e=this.options.labels,h=e.style,g=this.horiz,m=this.getSlotWidth(),r=Math.max(1,Math.round(m-2*e.padding)),k={},v=this.labelMetrics(),f=h.textOverflow,D=0;l(e.rotation)||(k.rotation=e.rotation||0);c.forEach(function(b){b=a[b];b.movedLabel&&b.replaceMovedLabel();b&&b.label&&b.label.textPxLength>D&&(D=b.label.textPxLength)});
this.maxLabelLength=D;if(this.autoRotation)D>r&&D>v.h?k.rotation=this.labelRotation:this.labelRotation=0;else if(m){var p=r;if(!f){var q="clip";for(r=c.length;!g&&r--;){var n=c[r];if(n=a[n].label)n.styles&&"ellipsis"===n.styles.textOverflow?n.css({textOverflow:"clip"}):n.textPxLength>m&&n.css({width:m+"px"}),n.getBBox().height>this.len/c.length-(v.h-v.f)&&(n.specificTextOverflow="ellipsis")}}}k.rotation&&(p=D>.5*b.chartHeight?.33*b.chartHeight:D,f||(q="ellipsis"));if(this.labelAlign=e.align||this.autoLabelAlign(this.labelRotation))k.align=
this.labelAlign;c.forEach(function(b){var d=(b=a[b])&&b.label,c=h.width,e={};d&&(d.attr(k),b.shortenLabel?b.shortenLabel():p&&!c&&"nowrap"!==h.whiteSpace&&(p<d.textPxLength||"SPAN"===d.element.tagName)?(e.width=p+"px",f||(e.textOverflow=d.specificTextOverflow||q),d.css(e)):d.styles&&d.styles.width&&!e.width&&!c&&d.css({width:null}),delete d.specificTextOverflow,b.rotation=k.rotation)},this);this.tickRotCorr=d.rotCorr(v.b,this.labelRotation||0,0!==this.side)};a.prototype.hasData=function(){return this.series.some(function(b){return b.hasData()})||
this.options.showEmpty&&q(this.min)&&q(this.max)};a.prototype.addTitle=function(b){var c=this.chart.renderer,a=this.horiz,e=this.opposite,h=this.options.title,l=this.chart.styledMode,g;this.axisTitle||((g=h.textAlign)||(g=(a?{low:"left",middle:"center",high:"right"}:{low:e?"right":"left",middle:"center",high:e?"left":"right"})[h.align]),this.axisTitle=c.text(h.text||"",0,0,h.useHTML).attr({zIndex:7,rotation:h.rotation,align:g}).addClass("highcharts-axis-title"),l||this.axisTitle.css(d(h.style)),this.axisTitle.add(this.axisGroup),
this.axisTitle.isNew=!0);l||h.style.width||this.isRadial||this.axisTitle.css({width:this.len+"px"});this.axisTitle[b?"show":"hide"](b)};a.prototype.generateTick=function(b){var d=this.ticks;d[b]?d[b].addLabel():d[b]=new I(this,b)};a.prototype.getOffset=function(){var b=this,d=this,c=d.chart,a=d.horiz,e=d.options,h=d.side,l=d.ticks,g=d.tickPositions,k=d.coll,f=d.axisParent,D=c.renderer,p=c.inverted&&!d.isZAxis?[1,0,3,2][h]:h,n=d.hasData(),t=e.title,z=e.labels,y=c.axisOffset;c=c.clipOffset;var O=[-1,
1,1,-1][h],P=e.className,x,F=0,fa=0,ca=0;d.showAxis=x=n||e.showEmpty;d.staggerLines=d.horiz&&z.staggerLines||void 0;if(!d.axisGroup){var N=function(d,c,a){return D.g(d).attr({zIndex:a}).addClass("highcharts-"+k.toLowerCase()+c+" "+(b.isRadial?"highcharts-radial-axis"+c+" ":"")+(P||"")).add(f)};d.gridGroup=N("grid","-grid",e.gridZIndex);d.axisGroup=N("axis","",e.zIndex);d.labelGroup=N("axis-labels","-labels",z.zIndex)}n||d.isLinked?(g.forEach(function(b){d.generateTick(b)}),d.renderUnsquish(),d.reserveSpaceDefault=
0===h||2===h||{1:"left",3:"right"}[h]===d.labelAlign,r(z.reserveSpace,"center"===d.labelAlign?!0:null,d.reserveSpaceDefault)&&g.forEach(function(b){ca=Math.max(l[b].getLabelSize(),ca)}),d.staggerLines&&(ca*=d.staggerLines),d.labelOffset=ca*(d.opposite?-1:1)):v(l,function(b,d){b.destroy();delete l[d]});if(t&&t.text&&!1!==t.enabled&&(d.addTitle(x),x&&!1!==t.reserveSpace)){d.titleOffset=F=d.axisTitle.getBBox()[a?"height":"width"];var u=t.offset;fa=q(u)?0:r(t.margin,a?5:10)}d.renderLine();d.offset=O*
r(e.offset,y[h]?y[h]+(e.margin||0):0);d.tickRotCorr=d.tickRotCorr||{x:0,y:0};t=0===h?-d.labelMetrics().h:2===h?d.tickRotCorr.y:0;n=Math.abs(ca)+fa;ca&&(n=n-t+O*(a?r(z.y,d.tickRotCorr.y+8*O):z.x));d.axisTitleMargin=r(u,n);d.getMaxLabelDimensions&&(d.maxLabelDimensions=d.getMaxLabelDimensions(l,g));"colorAxis"!==k&&(a=this.tickSize("tick"),y[h]=Math.max(y[h],(d.axisTitleMargin||0)+F+O*d.offset,n,g&&g.length&&a?a[0]+O*d.offset:0),e=!d.axisLine||e.offset?0:2*Math.floor(d.axisLine.strokeWidth()/2),c[p]=
Math.max(c[p],e));m(this,"afterGetOffset")};a.prototype.getLinePath=function(b){var d=this.chart,c=this.opposite,a=this.offset,e=this.horiz,h=this.left+(c?this.width:0)+a;a=d.chartHeight-this.bottom-(c?this.height:0)+a;c&&(b*=-1);return d.renderer.crispLine([["M",e?this.left:h,e?a:this.top],["L",e?d.chartWidth-this.right:h,e?a:d.chartHeight-this.bottom]],b)};a.prototype.renderLine=function(){this.axisLine||(this.axisLine=this.chart.renderer.path().addClass("highcharts-axis-line").add(this.axisGroup),
this.chart.styledMode||this.axisLine.attr({stroke:this.options.lineColor,"stroke-width":this.options.lineWidth,zIndex:7}))};a.prototype.getTitlePosition=function(){var b=this.horiz,d=this.left,c=this.top,a=this.len,e=this.options.title,h=b?d:c,l=this.opposite,g=this.offset,r=e.x,k=e.y,v=this.axisTitle,f=this.chart.renderer.fontMetrics(e.style.fontSize,v);v=v?Math.max(v.getBBox(!1,0).height-f.h-1,0):0;a={low:h+(b?0:a),middle:h+a/2,high:h+(b?a:0)}[e.align];d=(b?c+this.height:d)+(b?1:-1)*(l?-1:1)*(this.axisTitleMargin||
0)+[-v,v,f.f,-v][this.side];b={x:b?a+r:d+(l?this.width:0)+g+r,y:b?d+k-(l?this.height:0)+g:a+k};m(this,"afterGetTitlePosition",{titlePosition:b});return b};a.prototype.renderMinorTick=function(b,d){var c=this.minorTicks;c[b]||(c[b]=new I(this,b,"minor"));d&&c[b].isNew&&c[b].render(null,!0);c[b].render(null,!1,1)};a.prototype.renderTick=function(b,d,c){var a=this.ticks;if(!this.isLinked||b>=this.min&&b<=this.max||this.grid&&this.grid.isColumn)a[b]||(a[b]=new I(this,b)),c&&a[b].isNew&&a[b].render(d,
!0,-1),a[b].render(d)};a.prototype.render=function(){var d=this,c=d.chart,a=d.logarithmic,e=d.options,h=d.isLinked,l=d.tickPositions,g=d.axisTitle,r=d.ticks,k=d.minorTicks,f=d.alternateBands,D=e.stackLabels,p=e.alternateGridColor,q=d.tickmarkOffset,n=d.axisLine,t=d.showAxis,z=u(c.renderer.globalAnimation),y,O;d.labelEdge.length=0;d.overlap=!1;[r,k,f].forEach(function(b){v(b,function(b){b.isActive=!1})});if(d.hasData()||h){var P=d.chart.hasRendered&&d.old&&b(d.old.min);d.minorTickInterval&&!d.categories&&
d.getMinorTickPositions().forEach(function(b){d.renderMinorTick(b,P)});l.length&&(l.forEach(function(b,c){d.renderTick(b,c,P)}),q&&(0===d.min||d.single)&&(r[-1]||(r[-1]=new I(d,-1,null,!0)),r[-1].render(-1)));p&&l.forEach(function(b,e){O="undefined"!==typeof l[e+1]?l[e+1]+q:d.max-q;0===e%2&&b<d.max&&O<=d.max+(c.polar?-q:q)&&(f[b]||(f[b]=new E.PlotLineOrBand(d)),y=b+q,f[b].options={from:a?a.lin2log(y):y,to:a?a.lin2log(O):O,color:p,className:"highcharts-alternate-grid"},f[b].render(),f[b].isActive=
!0)});d._addedPlotLB||(d._addedPlotLB=!0,(e.plotLines||[]).concat(e.plotBands||[]).forEach(function(b){d.addPlotBandOrLine(b)}))}[r,k,f].forEach(function(b){var d=[],a=z.duration;v(b,function(b,c){b.isActive||(b.render(c,!1,0),b.isActive=!1,d.push(c))});N(function(){for(var c=d.length;c--;)b[d[c]]&&!b[d[c]].isActive&&(b[d[c]].destroy(),delete b[d[c]])},b!==f&&c.hasRendered&&a?a:0)});n&&(n[n.isPlaced?"animate":"attr"]({d:this.getLinePath(n.strokeWidth())}),n.isPlaced=!0,n[t?"show":"hide"](t));g&&t&&
(e=d.getTitlePosition(),g[g.isNew?"attr":"animate"](e),g.isNew=!1);D&&D.enabled&&d.stacking&&d.stacking.renderStackTotals();d.old={len:d.len,max:d.max,min:d.min,transA:d.transA,userMax:d.userMax,userMin:d.userMin};d.isDirty=!1;m(this,"afterRender")};a.prototype.redraw=function(){this.visible&&(this.render(),this.plotLinesAndBands.forEach(function(b){b.render()}));this.series.forEach(function(b){b.isDirty=!0})};a.prototype.getKeepProps=function(){return this.keepProps||a.keepProps};a.prototype.destroy=
function(b){var d=this,c=d.plotLinesAndBands,a=this.eventOptions;m(this,"destroy",{keepEvents:b});b||P(d);[d.ticks,d.minorTicks,d.alternateBands].forEach(function(b){F(b)});if(c)for(b=c.length;b--;)c[b].destroy();"axisLine axisTitle axisGroup gridGroup labelGroup cross scrollbar".split(" ").forEach(function(b){d[b]&&(d[b]=d[b].destroy())});for(var e in d.plotLinesAndBandsGroups)d.plotLinesAndBandsGroups[e]=d.plotLinesAndBandsGroups[e].destroy();v(d,function(b,c){-1===d.getKeepProps().indexOf(c)&&
delete d[c]});this.eventOptions=a};a.prototype.drawCrosshair=function(b,d){var c=this.crosshair,a=r(c&&c.snap,!0),e=this.chart,h,l=this.cross;m(this,"drawCrosshair",{e:b,point:d});b||(b=this.cross&&this.cross.e);if(c&&!1!==(q(d)||!a)){a?q(d)&&(h=r("colorAxis"!==this.coll?d.crosshairPos:null,this.isXAxis?d.plotX:this.len-d.plotY)):h=b&&(this.horiz?b.chartX-this.pos:this.len-b.chartY+this.pos);if(q(h)){var g={value:d&&(this.isXAxis?d.x:r(d.stackY,d.y)),translatedValue:h};e.polar&&z(g,{isCrosshair:!0,
chartX:b&&b.chartX,chartY:b&&b.chartY,point:d});g=this.getPlotLinePath(g)||null}if(!q(g)){this.hideCrosshair();return}a=this.categories&&!this.isRadial;l||(this.cross=l=e.renderer.path().addClass("highcharts-crosshair highcharts-crosshair-"+(a?"category ":"thin ")+(c.className||"")).attr({zIndex:r(c.zIndex,2)}).add(),e.styledMode||(l.attr({stroke:c.color||(a?B.parse("#ccd6eb").setOpacity(.25).get():"#cccccc"),"stroke-width":r(c.width,1)}).css({"pointer-events":"none"}),c.dashStyle&&l.attr({dashstyle:c.dashStyle})));
l.show().attr({d:g});a&&!c.width&&l.attr({"stroke-width":this.transA});this.cross.e=b}else this.hideCrosshair();m(this,"afterDrawCrosshair",{e:b,point:d})};a.prototype.hideCrosshair=function(){this.cross&&this.cross.hide();m(this,"afterHideCrosshair")};a.prototype.hasVerticalPanning=function(){var b=this.chart.options.chart.panning;return!!(b&&b.enabled&&/y/.test(b.type))};a.prototype.validatePositiveValue=function(d){return b(d)&&0<d};a.prototype.update=function(b,c){var a=this.chart;b=d(this.userOptions,
b);this.destroy(!0);this.init(a,b);a.isDirtyBox=!0;r(c,!0)&&a.redraw()};a.prototype.remove=function(b){for(var d=this.chart,c=this.coll,a=this.series,e=a.length;e--;)a[e]&&a[e].remove(!1);y(d.axes,this);y(d[c],this);d[c].forEach(function(b,d){b.options.index=b.userOptions.index=d});this.destroy();d.isDirtyBox=!0;r(b,!0)&&d.redraw()};a.prototype.setTitle=function(b,d){this.update({title:b},d)};a.prototype.setCategories=function(b,d){this.update({categories:b},d)};a.defaultOptions=f.defaultXAxisOptions;
a.keepProps="extKey hcEvents names series userMax userMin".split(" ");return a}();"";return a});K(f,"Core/Axis/DateTimeAxis.js",[f["Core/Utilities.js"]],function(a){var f=a.addEvent,B=a.getMagnitude,H=a.normalizeTickInterval,w=a.timeUnits,E;(function(a){function A(){return this.chart.time.getTimeTicks.apply(this.chart.time,arguments)}function u(a){"datetime"!==a.userOptions.type?this.dateTime=void 0:this.dateTime||(this.dateTime=new k(this))}var n=[];a.compose=function(a){-1===n.indexOf(a)&&(n.push(a),
a.keepProps.push("dateTime"),a.prototype.getTimeTicks=A,f(a,"init",u));return a};var k=function(){function a(c){this.axis=c}a.prototype.normalizeTimeTickInterval=function(c,a){var e=a||[["millisecond",[1,2,5,10,20,25,50,100,200,500]],["second",[1,2,5,10,15,30]],["minute",[1,2,5,10,15,30]],["hour",[1,2,3,4,6,8,12]],["day",[1,2]],["week",[1,2]],["month",[1,2,3,4,6]],["year",null]];a=e[e.length-1];var k=w[a[0]],f=a[1],p;for(p=0;p<e.length&&!(a=e[p],k=w[a[0]],f=a[1],e[p+1]&&c<=(k*f[f.length-1]+w[e[p+
1][0]])/2);p++);k===w.year&&c<5*k&&(f=[1,2,5]);c=H(c/k,f,"year"===a[0]?Math.max(B(c/k),1):1);return{unitRange:k,count:c,unitName:a[0]}};a.prototype.getXDateFormat=function(c,a){var e=this.axis;return e.closestPointRange?e.chart.time.getDateFormat(e.closestPointRange,c,e.options.startOfWeek,a)||a.year:a.day};return a}();a.Additions=k})(E||(E={}));return E});K(f,"Core/Axis/LogarithmicAxis.js",[f["Core/Utilities.js"]],function(a){var f=a.addEvent,B=a.normalizeTickInterval,H=a.pick,w;(function(a){function w(a){var e=
this.logarithmic;"logarithmic"!==a.userOptions.type?this.logarithmic=void 0:e||(this.logarithmic=new n(this))}function A(){var a=this.logarithmic;a&&(this.lin2val=function(e){return a.lin2log(e)},this.val2lin=function(e){return a.log2lin(e)})}var u=[];a.compose=function(a){-1===u.indexOf(a)&&(u.push(a),a.keepProps.push("logarithmic"),f(a,"init",w),f(a,"afterInit",A));return a};var n=function(){function a(a){this.axis=a}a.prototype.getLogTickPositions=function(a,c,k,g){var e=this.axis,f=e.len,p=e.options,
n=[];g||(this.minorAutoInterval=void 0);if(.5<=a)a=Math.round(a),n=e.getLinearTickPositions(a,c,k);else if(.08<=a){var x=Math.floor(c),z,m=p=void 0;for(f=.3<a?[1,2,4]:.15<a?[1,2,4,6,8]:[1,2,3,4,5,6,7,8,9];x<k+1&&!m;x++){var h=f.length;for(z=0;z<h&&!m;z++){var b=this.log2lin(this.lin2log(x)*f[z]);b>c&&(!g||p<=k)&&"undefined"!==typeof p&&n.push(p);p>k&&(m=!0);p=b}}}else c=this.lin2log(c),k=this.lin2log(k),a=g?e.getMinorTickInterval():p.tickInterval,a=H("auto"===a?null:a,this.minorAutoInterval,p.tickPixelInterval/
(g?5:1)*(k-c)/((g?f/e.tickPositions.length:f)||1)),a=B(a),n=e.getLinearTickPositions(a,c,k).map(this.log2lin),g||(this.minorAutoInterval=a/5);g||(e.tickInterval=a);return n};a.prototype.lin2log=function(a){return Math.pow(10,a)};a.prototype.log2lin=function(a){return Math.log(a)/Math.LN10};return a}();a.Additions=n})(w||(w={}));return w});K(f,"Core/Axis/PlotLineOrBand/PlotLineOrBandAxis.js",[f["Core/Utilities.js"]],function(a){var f=a.erase,B=a.extend,H=a.isNumber,w;(function(a){var w=[],A;a.compose=
function(a,k){A||(A=a);-1===w.indexOf(k)&&(w.push(k),B(k.prototype,u.prototype));return k};var u=function(){function a(){}a.prototype.getPlotBandPath=function(a,e,c){void 0===c&&(c=this.options);var k=this.getPlotLinePath({value:e,force:!0,acrossPanes:c.acrossPanes}),g=[],f=this.horiz;e=!H(this.min)||!H(this.max)||a<this.min&&e<this.min||a>this.max&&e>this.max;a=this.getPlotLinePath({value:a,force:!0,acrossPanes:c.acrossPanes});c=1;if(a&&k){if(e){var q=a.toString()===k.toString();c=0}for(e=0;e<a.length;e+=
2){var n=a[e],y=a[e+1],x=k[e],z=k[e+1];"M"!==n[0]&&"L"!==n[0]||"M"!==y[0]&&"L"!==y[0]||"M"!==x[0]&&"L"!==x[0]||"M"!==z[0]&&"L"!==z[0]||(f&&x[1]===n[1]?(x[1]+=c,z[1]+=c):f||x[2]!==n[2]||(x[2]+=c,z[2]+=c),g.push(["M",n[1],n[2]],["L",y[1],y[2]],["L",z[1],z[2]],["L",x[1],x[2]],["Z"]));g.isFlat=q}}return g};a.prototype.addPlotBand=function(a){return this.addPlotBandOrLine(a,"plotBands")};a.prototype.addPlotLine=function(a){return this.addPlotBandOrLine(a,"plotLines")};a.prototype.addPlotBandOrLine=function(a,
e){var c=this,k=this.userOptions,g=new A(this,a);this.visible&&(g=g.render());if(g){this._addedPlotLB||(this._addedPlotLB=!0,(k.plotLines||[]).concat(k.plotBands||[]).forEach(function(a){c.addPlotBandOrLine(a)}));if(e){var f=k[e]||[];f.push(a);k[e]=f}this.plotLinesAndBands.push(g)}return g};a.prototype.removePlotBandOrLine=function(a){var e=this.plotLinesAndBands,c=this.options,k=this.userOptions;if(e){for(var g=e.length;g--;)e[g].id===a&&e[g].destroy();[c.plotLines||[],k.plotLines||[],c.plotBands||
[],k.plotBands||[]].forEach(function(c){for(g=c.length;g--;)(c[g]||{}).id===a&&f(c,c[g])})}};a.prototype.removePlotBand=function(a){this.removePlotBandOrLine(a)};a.prototype.removePlotLine=function(a){this.removePlotBandOrLine(a)};return a}()})(w||(w={}));return w});K(f,"Core/Axis/PlotLineOrBand/PlotLineOrBand.js",[f["Core/Axis/PlotLineOrBand/PlotLineOrBandAxis.js"],f["Core/Utilities.js"]],function(a,f){var C=f.arrayMax,H=f.arrayMin,w=f.defined,E=f.destroyObjectProperties,I=f.erase,A=f.fireEvent,
u=f.merge,n=f.objectEach,k=f.pick;f=function(){function e(c,a){this.axis=c;a&&(this.options=a,this.id=a.id)}e.compose=function(c){return a.compose(e,c)};e.prototype.render=function(){A(this,"render");var c=this,a=c.axis,e=a.horiz,f=a.logarithmic,q=c.options,F=q.color,y=k(q.zIndex,0),x=q.events,z={},m=a.chart.renderer,h=q.label,b=c.label,l=q.to,d=q.from,D=q.value,v=c.svgElem,r=[],O=w(d)&&w(l);r=w(D);var P=!v,S={"class":"highcharts-plot-"+(O?"band ":"line ")+(q.className||"")},N=O?"bands":"lines";f&&
(d=f.log2lin(d),l=f.log2lin(l),D=f.log2lin(D));a.chart.styledMode||(r?(S.stroke=F||"#999999",S["stroke-width"]=k(q.width,1),q.dashStyle&&(S.dashstyle=q.dashStyle)):O&&(S.fill=F||"#e6ebf5",q.borderWidth&&(S.stroke=q.borderColor,S["stroke-width"]=q.borderWidth)));z.zIndex=y;N+="-"+y;(f=a.plotLinesAndBandsGroups[N])||(a.plotLinesAndBandsGroups[N]=f=m.g("plot-"+N).attr(z).add());P&&(c.svgElem=v=m.path().attr(S).add(f));if(r)r=a.getPlotLinePath({value:D,lineWidth:v.strokeWidth(),acrossPanes:q.acrossPanes});
else if(O)r=a.getPlotBandPath(d,l,q);else return;!c.eventsAdded&&x&&(n(x,function(b,d){v.on(d,function(b){x[d].apply(c,[b])})}),c.eventsAdded=!0);(P||!v.d)&&r&&r.length?v.attr({d:r}):v&&(r?(v.show(),v.animate({d:r})):v.d&&(v.hide(),b&&(c.label=b=b.destroy())));h&&(w(h.text)||w(h.formatter))&&r&&r.length&&0<a.width&&0<a.height&&!r.isFlat?(h=u({align:e&&O&&"center",x:e?!O&&4:10,verticalAlign:!e&&O&&"middle",y:e?O?16:10:O?6:-4,rotation:e&&!O&&90},h),this.renderLabel(h,r,O,y)):b&&b.hide();return c};e.prototype.renderLabel=
function(c,a,e,f){var g=this.axis,k=g.chart.renderer,p=this.label;p||(this.label=p=k.text(this.getLabelText(c),0,0,c.useHTML).attr({align:c.textAlign||c.align,rotation:c.rotation,"class":"highcharts-plot-"+(e?"band":"line")+"-label "+(c.className||""),zIndex:f}).add(),g.chart.styledMode||p.css(u({textOverflow:"ellipsis"},c.style)));f=a.xBounds||[a[0][1],a[1][1],e?a[2][1]:a[0][1]];a=a.yBounds||[a[0][2],a[1][2],e?a[2][2]:a[0][2]];e=H(f);k=H(a);p.align(c,!1,{x:e,y:k,width:C(f)-e,height:C(a)-k});p.alignValue&&
"left"!==p.alignValue||p.css({width:(90===p.rotation?g.height-(p.alignAttr.y-g.top):g.width-(p.alignAttr.x-g.left))+"px"});p.show(!0)};e.prototype.getLabelText=function(a){return w(a.formatter)?a.formatter.call(this):a.text};e.prototype.destroy=function(){I(this.axis.plotLinesAndBands,this);delete this.axis;E(this)};return e}();"";"";return f});K(f,"Core/Tooltip.js",[f["Core/FormatUtilities.js"],f["Core/Globals.js"],f["Core/Renderer/RendererUtilities.js"],f["Core/Renderer/RendererRegistry.js"],f["Core/Utilities.js"]],
function(a,f,B,H,w){var C=a.format,I=f.doc,A=B.distribute,u=w.addEvent,n=w.clamp,k=w.css,e=w.defined,c=w.discardElement,p=w.extend,g=w.fireEvent,t=w.isArray,q=w.isNumber,F=w.isString,y=w.merge,x=w.pick,z=w.splat,m=w.syncTimeout;a=function(){function a(b,a){this.allowShared=!0;this.container=void 0;this.crosshairs=[];this.distance=0;this.isHidden=!0;this.isSticky=!1;this.now={};this.options={};this.outside=!1;this.chart=b;this.init(b,a)}a.prototype.applyFilter=function(){var b=this.chart;b.renderer.definition({tagName:"filter",
attributes:{id:"drop-shadow-"+b.index,opacity:.5},children:[{tagName:"feGaussianBlur",attributes:{"in":"SourceAlpha",stdDeviation:1}},{tagName:"feOffset",attributes:{dx:1,dy:1}},{tagName:"feComponentTransfer",children:[{tagName:"feFuncA",attributes:{type:"linear",slope:.3}}]},{tagName:"feMerge",children:[{tagName:"feMergeNode"},{tagName:"feMergeNode",attributes:{"in":"SourceGraphic"}}]}]})};a.prototype.bodyFormatter=function(b){return b.map(function(b){var d=b.series.tooltipOptions;return(d[(b.point.formatPrefix||
"point")+"Formatter"]||b.point.tooltipFormatter).call(b.point,d[(b.point.formatPrefix||"point")+"Format"]||"")})};a.prototype.cleanSplit=function(b){this.chart.series.forEach(function(a){var d=a&&a.tt;d&&(!d.isActive||b?a.tt=d.destroy():d.isActive=!1)})};a.prototype.defaultFormatter=function(b){var a=this.points||z(this);var d=[b.tooltipFooterHeaderFormatter(a[0])];d=d.concat(b.bodyFormatter(a));d.push(b.tooltipFooterHeaderFormatter(a[0],!0));return d};a.prototype.destroy=function(){this.label&&(this.label=
this.label.destroy());this.split&&this.tt&&(this.cleanSplit(!0),this.tt=this.tt.destroy());this.renderer&&(this.renderer=this.renderer.destroy(),c(this.container));w.clearTimeout(this.hideTimer);w.clearTimeout(this.tooltipTimeout)};a.prototype.getAnchor=function(b,a){var d=this.chart,c=d.pointer,e=d.inverted,h=d.plotTop,l=d.plotLeft,g,m,f=0,k=0;b=z(b);this.followPointer&&a?("undefined"===typeof a.chartX&&(a=c.normalize(a)),c=[a.chartX-l,a.chartY-h]):b[0].tooltipPos?c=b[0].tooltipPos:(b.forEach(function(b){g=
b.series.yAxis;m=b.series.xAxis;f+=b.plotX||0;k+=b.plotLow?(b.plotLow+(b.plotHigh||0))/2:b.plotY||0;m&&g&&(e?(f+=h+d.plotHeight-m.len-m.pos,k+=l+d.plotWidth-g.len-g.pos):(f+=m.pos-l,k+=g.pos-h))}),f/=b.length,k/=b.length,c=[e?d.plotWidth-k:f,e?d.plotHeight-f:k],this.shared&&1<b.length&&a&&(e?c[0]=a.chartX-l:c[1]=a.chartY-h));return c.map(Math.round)};a.prototype.getLabel=function(){var b=this,a=this.chart.styledMode,d=this.options,c=this.split&&this.allowShared,h="tooltip"+(e(d.className)?" "+d.className:
""),g=d.style.pointerEvents||(!this.followPointer&&d.stickOnContact?"auto":"none"),m=function(){b.inContact=!0},p=function(d){var a=b.chart.hoverSeries;b.inContact=b.shouldStickOnContact()&&b.chart.pointer.inClass(d.relatedTarget,"highcharts-tooltip");if(!b.inContact&&a&&a.onMouseOut)a.onMouseOut()},n,q=this.chart.renderer;if(b.label){var z=!b.label.hasClass("highcharts-label");(c&&!z||!c&&z)&&b.destroy()}if(!this.label){if(this.outside){z=this.chart.options.chart.style;var t=H.getRendererType();
this.container=n=f.doc.createElement("div");n.className="highcharts-tooltip-container";k(n,{position:"absolute",top:"1px",pointerEvents:g,zIndex:Math.max(this.options.style.zIndex||0,(z&&z.zIndex||0)+3)});u(n,"mouseenter",m);u(n,"mouseleave",p);f.doc.body.appendChild(n);this.renderer=q=new t(n,0,0,z,void 0,void 0,q.styledMode)}c?this.label=q.g(h):(this.label=q.label("",0,0,d.shape,void 0,void 0,d.useHTML,void 0,h).attr({padding:d.padding,r:d.borderRadius}),a||this.label.attr({fill:d.backgroundColor,
"stroke-width":d.borderWidth}).css(d.style).css({pointerEvents:g}).shadow(d.shadow));a&&d.shadow&&(this.applyFilter(),this.label.attr({filter:"url(#drop-shadow-"+this.chart.index+")"}));if(b.outside&&!b.split){var y=this.label,x=y.xSetter,F=y.ySetter;y.xSetter=function(d){x.call(y,b.distance);n.style.left=d+"px"};y.ySetter=function(d){F.call(y,b.distance);n.style.top=d+"px"}}this.label.on("mouseenter",m).on("mouseleave",p).attr({zIndex:8}).add()}return this.label};a.prototype.getPosition=function(b,
a,d){var c=this.chart,e=this.distance,h={},l=c.inverted&&d.h||0,g=this.outside,m=g?I.documentElement.clientWidth-2*e:c.chartWidth,f=g?Math.max(I.body.scrollHeight,I.documentElement.scrollHeight,I.body.offsetHeight,I.documentElement.offsetHeight,I.documentElement.clientHeight):c.chartHeight,k=c.pointer.getChartPosition(),p=function(h){var l="x"===h;return[h,l?m:f,l?b:a].concat(g?[l?b*k.scaleX:a*k.scaleY,l?k.left-e+(d.plotX+c.plotLeft)*k.scaleX:k.top-e+(d.plotY+c.plotTop)*k.scaleY,0,l?m:f]:[l?b:a,l?
d.plotX+c.plotLeft:d.plotY+c.plotTop,l?c.plotLeft:c.plotTop,l?c.plotLeft+c.plotWidth:c.plotTop+c.plotHeight])},n=p("y"),q=p("x"),z;p=!!d.negative;!c.polar&&c.hoverSeries&&c.hoverSeries.yAxis&&c.hoverSeries.yAxis.reversed&&(p=!p);var t=!this.followPointer&&x(d.ttBelow,!c.inverted===p),y=function(b,d,a,c,m,f,r){var v=g?"y"===b?e*k.scaleY:e*k.scaleX:e,D=(a-c)/2,G=c<m-e,p=m+e+c<d,n=m-v-a+D;m=m+v-D;if(t&&p)h[b]=m;else if(!t&&G)h[b]=n;else if(G)h[b]=Math.min(r-c,0>n-l?n:n-l);else if(p)h[b]=Math.max(f,m+
l+a>d?m:m+l);else return!1},F=function(b,d,a,c,l){var g;l<e||l>d-e?g=!1:h[b]=l<a/2?1:l>d-c/2?d-c-2:l-a/2;return g},G=function(b){var d=n;n=q;q=d;z=b},T=function(){!1!==y.apply(0,n)?!1!==F.apply(0,q)||z||(G(!0),T()):z?h.x=h.y=0:(G(!0),T())};(c.inverted||1<this.len)&&G();T();return h};a.prototype.hide=function(b){var a=this;w.clearTimeout(this.hideTimer);b=x(b,this.options.hideDelay);this.isHidden||(this.hideTimer=m(function(){a.getLabel().fadeOut(b?void 0:b);a.isHidden=!0},b))};a.prototype.init=function(b,
a){this.chart=b;this.options=a;this.crosshairs=[];this.now={x:0,y:0};this.isHidden=!0;this.split=a.split&&!b.inverted&&!b.polar;this.shared=a.shared||this.split;this.outside=x(a.outside,!(!b.scrollablePixelsX&&!b.scrollablePixelsY))};a.prototype.shouldStickOnContact=function(){return!(this.followPointer||!this.options.stickOnContact)};a.prototype.isStickyOnContact=function(){return!(!this.shouldStickOnContact()||!this.inContact)};a.prototype.move=function(b,a,d,c){var e=this,h=e.now,l=!1!==e.options.animation&&
!e.isHidden&&(1<Math.abs(b-h.x)||1<Math.abs(a-h.y)),g=e.followPointer||1<e.len;p(h,{x:l?(2*h.x+b)/3:b,y:l?(h.y+a)/2:a,anchorX:g?void 0:l?(2*h.anchorX+d)/3:d,anchorY:g?void 0:l?(h.anchorY+c)/2:c});e.getLabel().attr(h);e.drawTracker();l&&(w.clearTimeout(this.tooltipTimeout),this.tooltipTimeout=setTimeout(function(){e&&e.move(b,a,d,c)},32))};a.prototype.refresh=function(b,a){var d=this.chart,c=this.options,e=z(b),h=e[0],l=[],m=c.formatter||this.defaultFormatter,f=this.shared,k=d.styledMode,p={};if(c.enabled&&
h.series){w.clearTimeout(this.hideTimer);this.allowShared=!(!t(b)&&b.series&&b.series.noSharedTooltip);this.followPointer=!this.split&&h.series.tooltipOptions.followPointer;b=this.getAnchor(b,a);var n=b[0],q=b[1];f&&this.allowShared?(d.pointer.applyInactiveState(e),e.forEach(function(b){b.setState("hover");l.push(b.getLabelConfig())}),p={x:h.category,y:h.y},p.points=l):p=h.getLabelConfig();this.len=l.length;m=m.call(p,this);f=h.series;this.distance=x(f.tooltipOptions.distance,16);if(!1===m)this.hide();
else{if(this.split&&this.allowShared)this.renderSplit(m,e);else{var y=n,F=q;a&&d.pointer.isDirectTouch&&(y=a.chartX-d.plotLeft,F=a.chartY-d.plotTop);if(d.polar||!1===f.options.clip||e.some(function(b){return b.series.shouldShowTooltip(y,F)}))a=this.getLabel(),c.style.width&&!k||a.css({width:this.chart.spacingBox.width+"px"}),a.attr({text:m&&m.join?m.join(""):m}),a.removeClass(/highcharts-color-[\d]+/g).addClass("highcharts-color-"+x(h.colorIndex,f.colorIndex)),k||a.attr({stroke:c.borderColor||h.color||
f.color||"#666666"}),this.updatePosition({plotX:n,plotY:q,negative:h.negative,ttBelow:h.ttBelow,h:b[2]||0});else{this.hide();return}}this.isHidden&&this.label&&this.label.attr({opacity:1}).show();this.isHidden=!1}g(this,"refresh")}};a.prototype.renderSplit=function(b,a){function d(b,d,a,e,h){void 0===h&&(h=!0);a?(d=Z?0:E,b=n(b-e/2,M.left,M.right-e-(c.outside?R:0))):(d-=B,b=h?b-e-C:b+C,b=n(b,h?b:M.left,M.right));return{x:b,y:d}}var c=this,e=c.chart,h=c.chart,l=h.chartWidth,g=h.chartHeight,m=h.plotHeight,
f=h.plotLeft,k=h.plotTop,q=h.pointer,z=h.scrollablePixelsY;z=void 0===z?0:z;var t=h.scrollablePixelsX,y=h.scrollingContainer;y=void 0===y?{scrollLeft:0,scrollTop:0}:y;var u=y.scrollLeft;y=y.scrollTop;var w=h.styledMode,C=c.distance,G=c.options,T=c.options.positioner,M=c.outside&&"number"!==typeof t?I.documentElement.getBoundingClientRect():{left:u,right:u+l,top:y,bottom:y+g},V=c.getLabel(),W=this.renderer||e.renderer,Z=!(!e.xAxis[0]||!e.xAxis[0].opposite);e=q.getChartPosition();var R=e.left;e=e.top;
var B=k+y,aa=0,E=m-z;F(b)&&(b=[!1,b]);b=b.slice(0,a.length+1).reduce(function(b,e,h){if(!1!==e&&""!==e){h=a[h-1]||{isHeader:!0,plotX:a[0].plotX,plotY:m,series:{}};var l=h.isHeader,g=l?c:h.series;e=e.toString();var r=g.tt,v=h.isHeader;var D=h.series;var p="highcharts-color-"+x(h.colorIndex,D.colorIndex,"none");r||(r={padding:G.padding,r:G.borderRadius},w||(r.fill=G.backgroundColor,r["stroke-width"]=G.borderWidth),r=W.label("",0,0,G[v?"headerShape":"shape"],void 0,void 0,G.useHTML).addClass((v?"highcharts-tooltip-header ":
"")+"highcharts-tooltip-box "+p).attr(r).add(V));r.isActive=!0;r.attr({text:e});w||r.css(G.style).shadow(G.shadow).attr({stroke:G.borderColor||h.color||D.color||"#333333"});g=g.tt=r;v=g.getBBox();e=v.width+g.strokeWidth();l&&(aa=v.height,E+=aa,Z&&(B-=aa));D=h.plotX;D=void 0===D?0:D;p=h.plotY;p=void 0===p?0:p;r=h.series;if(h.isHeader){D=f+D;var q=k+m/2}else{var z=r.xAxis,fa=r.yAxis;D=z.pos+n(D,-C,z.len+C);r.shouldShowTooltip(0,fa.pos-k+p,{ignoreX:!0})&&(q=fa.pos+p)}D=n(D,M.left-C,M.right+C);"number"===
typeof q?(v=v.height+1,p=T?T.call(c,e,v,h):d(D,q,l,e),b.push({align:T?0:void 0,anchorX:D,anchorY:q,boxWidth:e,point:h,rank:x(p.rank,l?1:0),size:v,target:p.y,tt:g,x:p.x})):g.isActive=!1}return b},[]);!T&&b.some(function(b){var d=(c.outside?R:0)+b.anchorX;return d<M.left&&d+b.boxWidth<M.right?!0:d<R-M.left+b.boxWidth&&M.right-d>d})&&(b=b.map(function(b){var a=d(b.anchorX,b.anchorY,b.point.isHeader,b.boxWidth,!1);return p(b,{target:a.y,x:a.x})}));c.cleanSplit();A(b,E);var H=R,ba=R;b.forEach(function(b){var d=
b.x,a=b.boxWidth;b=b.isHeader;b||(c.outside&&R+d<H&&(H=R+d),!b&&c.outside&&H+a>ba&&(ba=R+d))});b.forEach(function(b){var d=b.x,a=b.anchorX,e=b.pos,h=b.point.isHeader;e={visibility:"undefined"===typeof e?"hidden":"inherit",x:d,y:e+B,anchorX:a,anchorY:b.anchorY};if(c.outside&&d<a){var l=R-H;0<l&&(h||(e.x=d+l,e.anchorX=a+l),h&&(e.x=(ba-H)/2,e.anchorX=a+l))}b.tt.attr(e)});b=c.container;z=c.renderer;c.outside&&b&&z&&(h=V.getBBox(),z.setSize(h.width+h.x,h.height+h.y,!1),b.style.left=H+"px",b.style.top=
e+"px")};a.prototype.drawTracker=function(){if(this.followPointer||!this.options.stickOnContact)this.tracker&&this.tracker.destroy();else{var b=this.chart,a=this.label,d=this.shared?b.hoverPoints:b.hoverPoint;if(a&&d){var c={x:0,y:0,width:0,height:0};d=this.getAnchor(d);var e=a.getBBox();d[0]+=b.plotLeft-a.translateX;d[1]+=b.plotTop-a.translateY;c.x=Math.min(0,d[0]);c.y=Math.min(0,d[1]);c.width=0>d[0]?Math.max(Math.abs(d[0]),e.width-d[0]):Math.max(Math.abs(d[0]),e.width);c.height=0>d[1]?Math.max(Math.abs(d[1]),
e.height-Math.abs(d[1])):Math.max(Math.abs(d[1]),e.height);this.tracker?this.tracker.attr(c):(this.tracker=a.renderer.rect(c).addClass("highcharts-tracker").add(a),b.styledMode||this.tracker.attr({fill:"rgba(0,0,0,0)"}))}}};a.prototype.styledModeFormat=function(b){return b.replace('style="font-size: 10px"','class="highcharts-header"').replace(/style="color:{(point|series)\.color}"/g,'class="highcharts-color-{$1.colorIndex}"')};a.prototype.tooltipFooterHeaderFormatter=function(b,a){var d=b.series,
c=d.tooltipOptions,e=d.xAxis,h=e&&e.dateTime;e={isFooter:a,labelConfig:b};var l=c.xDateFormat,m=c[a?"footerFormat":"headerFormat"];g(this,"headerFormatter",e,function(a){h&&!l&&q(b.key)&&(l=h.getXDateFormat(b.key,c.dateTimeLabelFormats));h&&l&&(b.point&&b.point.tooltipDateKeys||["key"]).forEach(function(b){m=m.replace("{point."+b+"}","{point."+b+":"+l+"}")});d.chart.styledMode&&(m=this.styledModeFormat(m));a.text=C(m,{point:b,series:d},this.chart)});return e.text};a.prototype.update=function(b){this.destroy();
y(!0,this.chart.options.tooltip.userOptions,b);this.init(this.chart,y(!0,this.options,b))};a.prototype.updatePosition=function(b){var a=this.chart,d=this.options,c=a.pointer,e=this.getLabel();c=c.getChartPosition();var h=(d.positioner||this.getPosition).call(this,e.width,e.height,b),g=b.plotX+a.plotLeft;b=b.plotY+a.plotTop;if(this.outside){d=d.borderWidth+2*this.distance;this.renderer.setSize(e.width+d,e.height+d,!1);if(1!==c.scaleX||1!==c.scaleY)k(this.container,{transform:"scale("+c.scaleX+", "+
c.scaleY+")"}),g*=c.scaleX,b*=c.scaleY;g+=c.left-h.x;b+=c.top-h.y}this.move(Math.round(h.x),Math.round(h.y||0),g,b)};return a}();"";return a});K(f,"Core/Series/Point.js",[f["Core/Renderer/HTML/AST.js"],f["Core/Animation/AnimationUtilities.js"],f["Core/DefaultOptions.js"],f["Core/FormatUtilities.js"],f["Core/Utilities.js"]],function(a,f,B,H,w){var C=f.animObject,I=B.defaultOptions,A=H.format,u=w.addEvent,n=w.defined,k=w.erase,e=w.extend,c=w.fireEvent,p=w.getNestedProperty,g=w.isArray,t=w.isFunction,
q=w.isNumber,F=w.isObject,y=w.merge,x=w.objectEach,z=w.pick,m=w.syncTimeout,h=w.removeEvent,b=w.uniqueKey;f=function(){function l(){this.colorIndex=this.category=void 0;this.formatPrefix="point";this.id=void 0;this.isNull=!1;this.percentage=this.options=this.name=void 0;this.selected=!1;this.total=this.series=void 0;this.visible=!0;this.x=void 0}l.prototype.animateBeforeDestroy=function(){var b=this,a={x:b.startXPos,opacity:0},c=b.getGraphicalProps();c.singular.forEach(function(d){b[d]=b[d].animate("dataLabel"===
d?{x:b[d].startXPos,y:b[d].startYPos,opacity:0}:a)});c.plural.forEach(function(d){b[d].forEach(function(d){d.element&&d.animate(e({x:b.startXPos},d.startYPos?{x:d.startXPos,y:d.startYPos}:{}))})})};l.prototype.applyOptions=function(b,a){var d=this.series,c=d.options.pointValKey||d.pointValKey;b=l.prototype.optionsToObject.call(this,b);e(this,b);this.options=this.options?e(this.options,b):b;b.group&&delete this.group;b.dataLabels&&delete this.dataLabels;c&&(this.y=l.prototype.getNestedProperty.call(this,
c));this.formatPrefix=(this.isNull=z(this.isValid&&!this.isValid(),null===this.x||!q(this.y)))?"null":"point";this.selected&&(this.state="select");"name"in this&&"undefined"===typeof a&&d.xAxis&&d.xAxis.hasNames&&(this.x=d.xAxis.nameToX(this));"undefined"===typeof this.x&&d?this.x="undefined"===typeof a?d.autoIncrement():a:q(b.x)&&d.options.relativeXValue&&(this.x=d.autoIncrement(b.x));return this};l.prototype.destroy=function(){function b(){if(a.graphic||a.dataLabel||a.dataLabels)h(a),a.destroyElements();
for(f in a)a[f]=null}var a=this,c=a.series,e=c.chart;c=c.options.dataSorting;var l=e.hoverPoints,g=C(a.series.chart.renderer.globalAnimation),f;a.legendItem&&e.legend.destroyItem(a);l&&(a.setState(),k(l,a),l.length||(e.hoverPoints=null));if(a===e.hoverPoint)a.onMouseOut();c&&c.enabled?(this.animateBeforeDestroy(),m(b,g.duration)):b();e.pointCount--};l.prototype.destroyElements=function(b){var d=this;b=d.getGraphicalProps(b);b.singular.forEach(function(b){d[b]=d[b].destroy()});b.plural.forEach(function(b){d[b].forEach(function(b){b.element&&
b.destroy()});delete d[b]})};l.prototype.firePointEvent=function(b,a,e){var d=this,h=this.series.options;(h.point.events[b]||d.options&&d.options.events&&d.options.events[b])&&d.importEvents();"click"===b&&h.allowPointSelect&&(e=function(b){d.select&&d.select(null,b.ctrlKey||b.metaKey||b.shiftKey)});c(d,b,a,e)};l.prototype.getClassName=function(){return"highcharts-point"+(this.selected?" highcharts-point-select":"")+(this.negative?" highcharts-negative":"")+(this.isNull?" highcharts-null-point":"")+
("undefined"!==typeof this.colorIndex?" highcharts-color-"+this.colorIndex:"")+(this.options.className?" "+this.options.className:"")+(this.zone&&this.zone.className?" "+this.zone.className.replace("highcharts-negative",""):"")};l.prototype.getGraphicalProps=function(b){var d=this,a=[],c={singular:[],plural:[]},e;b=b||{graphic:1,dataLabel:1};b.graphic&&a.push("graphic","upperGraphic","shadowGroup");b.dataLabel&&a.push("dataLabel","dataLabelUpper","connector");for(e=a.length;e--;){var h=a[e];d[h]&&
c.singular.push(h)}["dataLabel","connector"].forEach(function(a){var e=a+"s";b[a]&&d[e]&&c.plural.push(e)});return c};l.prototype.getLabelConfig=function(){return{x:this.category,y:this.y,color:this.color,colorIndex:this.colorIndex,key:this.name||this.category,series:this.series,point:this,percentage:this.percentage,total:this.total||this.stackTotal}};l.prototype.getNestedProperty=function(b){if(b)return 0===b.indexOf("custom.")?p(b,this.options):this[b]};l.prototype.getZone=function(){var b=this.series,
a=b.zones;b=b.zoneAxis||"y";var c,e=0;for(c=a[e];this[b]>=c.value;)c=a[++e];this.nonZonedColor||(this.nonZonedColor=this.color);this.color=c&&c.color&&!this.options.color?c.color:this.nonZonedColor;return c};l.prototype.hasNewShapeType=function(){return(this.graphic&&(this.graphic.symbolName||this.graphic.element.nodeName))!==this.shapeType};l.prototype.init=function(d,a,e){this.series=d;this.applyOptions(a,e);this.id=n(this.id)?this.id:b();this.resolveColor();d.chart.pointCount++;c(this,"afterInit");
return this};l.prototype.optionsToObject=function(b){var d=this.series,a=d.options.keys,c=a||d.pointArrayMap||["y"],e=c.length,h={},m=0,f=0;if(q(b)||null===b)h[c[0]]=b;else if(g(b))for(!a&&b.length>e&&(d=typeof b[0],"string"===d?h.name=b[0]:"number"===d&&(h.x=b[0]),m++);f<e;)a&&"undefined"===typeof b[m]||(0<c[f].indexOf(".")?l.prototype.setNestedProperty(h,b[m],c[f]):h[c[f]]=b[m]),m++,f++;else"object"===typeof b&&(h=b,b.dataLabels&&(d._hasPointLabels=!0),b.marker&&(d._hasPointMarkers=!0));return h};
l.prototype.resolveColor=function(){var b=this.series,a=b.chart.styledMode;var c=b.chart.options.chart.colorCount;delete this.nonZonedColor;if(b.options.colorByPoint){if(!a){c=b.options.colors||b.chart.options.colors;var e=c[b.colorCounter];c=c.length}a=b.colorCounter;b.colorCounter++;b.colorCounter===c&&(b.colorCounter=0)}else a||(e=b.color),a=b.colorIndex;this.colorIndex=z(this.options.colorIndex,a);this.color=z(this.options.color,e)};l.prototype.setNestedProperty=function(b,a,c){c.split(".").reduce(function(b,
d,c,e){b[d]=e.length-1===c?a:F(b[d],!0)?b[d]:{};return b[d]},b);return b};l.prototype.tooltipFormatter=function(b){var d=this.series,a=d.tooltipOptions,c=z(a.valueDecimals,""),e=a.valuePrefix||"",h=a.valueSuffix||"";d.chart.styledMode&&(b=d.chart.tooltip.styledModeFormat(b));(d.pointArrayMap||["y"]).forEach(function(d){d="{point."+d;if(e||h)b=b.replace(RegExp(d+"}","g"),e+d+"}"+h);b=b.replace(RegExp(d+"}","g"),d+":,."+c+"f}")});return A(b,{point:this,series:this.series},d.chart)};l.prototype.update=
function(b,a,c,e){function d(){h.applyOptions(b);var d=g&&h.hasDummyGraphic;d=null===h.y?!d:d;g&&d&&(h.graphic=g.destroy(),delete h.hasDummyGraphic);F(b,!0)&&(g&&g.element&&b&&b.marker&&"undefined"!==typeof b.marker.symbol&&(h.graphic=g.destroy()),b&&b.dataLabels&&h.dataLabel&&(h.dataLabel=h.dataLabel.destroy()),h.connector&&(h.connector=h.connector.destroy()));k=h.index;l.updateParallelArrays(h,k);f.data[k]=F(f.data[k],!0)||F(b,!0)?h.options:z(b,f.data[k]);l.isDirty=l.isDirtyData=!0;!l.fixedBox&&
l.hasCartesianSeries&&(m.isDirtyBox=!0);"point"===f.legendType&&(m.isDirtyLegend=!0);a&&m.redraw(c)}var h=this,l=h.series,g=h.graphic,m=l.chart,f=l.options,k;a=z(a,!0);!1===e?d():h.firePointEvent("update",{options:b},d)};l.prototype.remove=function(b,a){this.series.removePoint(this.series.data.indexOf(this),b,a)};l.prototype.select=function(b,a){var d=this,c=d.series,e=c.chart;this.selectedStaging=b=z(b,!d.selected);d.firePointEvent(b?"select":"unselect",{accumulate:a},function(){d.selected=d.options.selected=
b;c.options.data[c.data.indexOf(d)]=d.options;d.setState(b&&"select");a||e.getSelectedPoints().forEach(function(b){var a=b.series;b.selected&&b!==d&&(b.selected=b.options.selected=!1,a.options.data[a.data.indexOf(b)]=b.options,b.setState(e.hoverPoints&&a.options.inactiveOtherPoints?"inactive":""),b.firePointEvent("unselect"))})});delete this.selectedStaging};l.prototype.onMouseOver=function(b){var d=this.series.chart,a=d.pointer;b=b?a.normalize(b):a.getChartCoordinatesFromPoint(this,d.inverted);a.runPointActions(b,
this)};l.prototype.onMouseOut=function(){var b=this.series.chart;this.firePointEvent("mouseOut");this.series.options.inactiveOtherPoints||(b.hoverPoints||[]).forEach(function(b){b.setState()});b.hoverPoints=b.hoverPoint=null};l.prototype.importEvents=function(){if(!this.hasImportedEvents){var b=this,a=y(b.series.options.point,b.options).events;b.events=a;x(a,function(d,a){t(d)&&u(b,a,d)});this.hasImportedEvents=!0}};l.prototype.setState=function(b,h){var d=this.series,l=this.state,g=d.options.states[b||
"normal"]||{},m=I.plotOptions[d.type].marker&&d.options.marker,f=m&&!1===m.enabled,k=m&&m.states&&m.states[b||"normal"]||{},p=!1===k.enabled,n=this.marker||{},D=d.chart,y=m&&d.markerAttribs,t=d.halo,x,F=d.stateMarkerGraphic;b=b||"";if(!(b===this.state&&!h||this.selected&&"select"!==b||!1===g.enabled||b&&(p||f&&!1===k.enabled)||b&&n.states&&n.states[b]&&!1===n.states[b].enabled)){this.state=b;y&&(x=d.markerAttribs(this,b));if(this.graphic&&!this.hasDummyGraphic){l&&this.graphic.removeClass("highcharts-point-"+
l);b&&this.graphic.addClass("highcharts-point-"+b);if(!D.styledMode){var u=d.pointAttribs(this,b);var G=z(D.options.chart.animation,g.animation);d.options.inactiveOtherPoints&&q(u.opacity)&&((this.dataLabels||[]).forEach(function(b){b&&b.animate({opacity:u.opacity},G)}),this.connector&&this.connector.animate({opacity:u.opacity},G));this.graphic.animate(u,G)}x&&this.graphic.animate(x,z(D.options.chart.animation,k.animation,m.animation));F&&F.hide()}else{if(b&&k){l=n.symbol||d.symbol;F&&F.currentSymbol!==
l&&(F=F.destroy());if(x)if(F)F[h?"animate":"attr"]({x:x.x,y:x.y});else l&&(d.stateMarkerGraphic=F=D.renderer.symbol(l,x.x,x.y,x.width,x.height).add(d.markerGroup),F.currentSymbol=l);!D.styledMode&&F&&"inactive"!==this.state&&F.attr(d.pointAttribs(this,b))}F&&(F[b&&this.isInside?"show":"hide"](),F.element.point=this,F.addClass(this.getClassName(),!0))}g=g.halo;x=(F=this.graphic||F)&&F.visibility||"inherit";g&&g.size&&F&&"hidden"!==x&&!this.isCluster?(t||(d.halo=t=D.renderer.path().add(F.parentGroup)),
t.show()[h?"animate":"attr"]({d:this.haloPath(g.size)}),t.attr({"class":"highcharts-halo highcharts-color-"+z(this.colorIndex,d.colorIndex)+(this.className?" "+this.className:""),visibility:x,zIndex:-1}),t.point=this,D.styledMode||t.attr(e({fill:this.color||d.color,"fill-opacity":g.opacity},a.filterUserAttributes(g.attributes||{})))):t&&t.point&&t.point.haloPath&&t.animate({d:t.point.haloPath(0)},null,t.hide);c(this,"afterSetState",{state:b})}};l.prototype.haloPath=function(b){return this.series.chart.renderer.symbols.circle(Math.floor(this.plotX)-
b,this.plotY-b,2*b,2*b)};return l}();"";return f});K(f,"Core/Pointer.js",[f["Core/Color/Color.js"],f["Core/Globals.js"],f["Core/Tooltip.js"],f["Core/Utilities.js"]],function(a,f,B,H){var w=a.parse,C=f.charts,I=f.noop,A=H.addEvent,u=H.attr,n=H.css,k=H.defined,e=H.extend,c=H.find,p=H.fireEvent,g=H.isNumber,t=H.isObject,q=H.objectEach,F=H.offset,y=H.pick,x=H.splat;a=function(){function a(a,c){this.lastValidTouch={};this.pinchDown=[];this.runChartClick=!1;this.eventsToUnbind=[];this.chart=a;this.hasDragged=
!1;this.options=c;this.init(a,c)}a.prototype.applyInactiveState=function(a){var c=[],b;(a||[]).forEach(function(a){b=a.series;c.push(b);b.linkedParent&&c.push(b.linkedParent);b.linkedSeries&&(c=c.concat(b.linkedSeries));b.navigatorSeries&&c.push(b.navigatorSeries)});this.chart.series.forEach(function(b){-1===c.indexOf(b)?b.setState("inactive",!0):b.options.inactiveOtherPoints&&b.setAllPointsToState("inactive")})};a.prototype.destroy=function(){var c=this;this.eventsToUnbind.forEach(function(a){return a()});
this.eventsToUnbind=[];f.chartCount||(a.unbindDocumentMouseUp&&(a.unbindDocumentMouseUp=a.unbindDocumentMouseUp()),a.unbindDocumentTouchEnd&&(a.unbindDocumentTouchEnd=a.unbindDocumentTouchEnd()));clearInterval(c.tooltipTimeout);q(c,function(a,b){c[b]=void 0})};a.prototype.drag=function(a){var c=this.chart,b=c.options.chart,e=this.zoomHor,d=this.zoomVert,g=c.plotLeft,m=c.plotTop,f=c.plotWidth,k=c.plotHeight,p=this.mouseDownX||0,n=this.mouseDownY||0,q=t(b.panning)?b.panning&&b.panning.enabled:b.panning,
y=b.panKey&&a[b.panKey+"Key"],x=a.chartX,z=a.chartY,F=this.selectionMarker;if(!F||!F.touch)if(x<g?x=g:x>g+f&&(x=g+f),z<m?z=m:z>m+k&&(z=m+k),this.hasDragged=Math.sqrt(Math.pow(p-x,2)+Math.pow(n-z,2)),10<this.hasDragged){var u=c.isInsidePlot(p-g,n-m,{visiblePlotOnly:!0});!c.hasCartesianSeries&&!c.mapView||!this.zoomX&&!this.zoomY||!u||y||F||(this.selectionMarker=F=c.renderer.rect(g,m,e?1:f,d?1:k,0).attr({"class":"highcharts-selection-marker",zIndex:7}).add(),c.styledMode||F.attr({fill:b.selectionMarkerFill||
w("#335cad").setOpacity(.25).get()}));F&&e&&(e=x-p,F.attr({width:Math.abs(e),x:(0<e?0:e)+p}));F&&d&&(e=z-n,F.attr({height:Math.abs(e),y:(0<e?0:e)+n}));u&&!F&&q&&c.pan(a,b.panning)}};a.prototype.dragStart=function(a){var c=this.chart;c.mouseIsDown=a.type;c.cancelClick=!1;c.mouseDownX=this.mouseDownX=a.chartX;c.mouseDownY=this.mouseDownY=a.chartY};a.prototype.drop=function(a){var c=this,b=this.chart,l=this.hasPinched;if(this.selectionMarker){var d=this.selectionMarker,m=d.attr?d.attr("x"):d.x,f=d.attr?
d.attr("y"):d.y,r=d.attr?d.attr("width"):d.width,q=d.attr?d.attr("height"):d.height,t={originalEvent:a,xAxis:[],yAxis:[],x:m,y:f,width:r,height:q},y=!!b.mapView;if(this.hasDragged||l)b.axes.forEach(function(b){if(b.zoomEnabled&&k(b.min)&&(l||c[{xAxis:"zoomX",yAxis:"zoomY"}[b.coll]])&&g(m)&&g(f)){var d=b.horiz,e="touchend"===a.type?b.minPixelPadding:0,h=b.toValue((d?m:f)+e);d=b.toValue((d?m+r:f+q)-e);t[b.coll].push({axis:b,min:Math.min(h,d),max:Math.max(h,d)});y=!0}}),y&&p(b,"selection",t,function(d){b.zoom(e(d,
l?{animation:!1}:null))});g(b.index)&&(this.selectionMarker=this.selectionMarker.destroy());l&&this.scaleGroups()}b&&g(b.index)&&(n(b.container,{cursor:b._cursor}),b.cancelClick=10<this.hasDragged,b.mouseIsDown=this.hasDragged=this.hasPinched=!1,this.pinchDown=[])};a.prototype.findNearestKDPoint=function(a,c,b){var e=this.chart,d=e.hoverPoint;e=e.tooltip;if(d&&e&&e.isStickyOnContact())return d;var h;a.forEach(function(d){var a=!(d.noSharedTooltip&&c)&&0>d.options.findNearestPointBy.indexOf("y");d=
d.searchPoint(b,a);if((a=t(d,!0)&&d.series)&&!(a=!t(h,!0))){a=h.distX-d.distX;var e=h.dist-d.dist,l=(d.series.group&&d.series.group.zIndex)-(h.series.group&&h.series.group.zIndex);a=0<(0!==a&&c?a:0!==e?e:0!==l?l:h.series.index>d.series.index?-1:1)}a&&(h=d)});return h};a.prototype.getChartCoordinatesFromPoint=function(a,c){var b=a.series,e=b.xAxis;b=b.yAxis;var d=a.shapeArgs;if(e&&b){var h=y(a.clientX,a.plotX),m=a.plotY||0;a.isNode&&d&&g(d.x)&&g(d.y)&&(h=d.x,m=d.y);return c?{chartX:b.len+b.pos-m,chartY:e.len+
e.pos-h}:{chartX:h+e.pos,chartY:m+b.pos}}if(d&&d.x&&d.y)return{chartX:d.x,chartY:d.y}};a.prototype.getChartPosition=function(){if(this.chartPosition)return this.chartPosition;var a=this.chart.container,c=F(a);this.chartPosition={left:c.left,top:c.top,scaleX:1,scaleY:1};var b=a.offsetWidth;a=a.offsetHeight;2<b&&2<a&&(this.chartPosition.scaleX=c.width/b,this.chartPosition.scaleY=c.height/a);return this.chartPosition};a.prototype.getCoordinates=function(a){var c={xAxis:[],yAxis:[]};this.chart.axes.forEach(function(b){c[b.isXAxis?
"xAxis":"yAxis"].push({axis:b,value:b.toValue(a[b.horiz?"chartX":"chartY"])})});return c};a.prototype.getHoverData=function(a,e,b,l,d,g){var h=[];l=!(!l||!a);var m={chartX:g?g.chartX:void 0,chartY:g?g.chartY:void 0,shared:d};p(this,"beforeGetHoverData",m);var f=e&&!e.stickyTracking?[e]:b.filter(function(b){return m.filter?m.filter(b):b.visible&&!(!d&&b.directTouch)&&y(b.options.enableMouseTracking,!0)&&b.stickyTracking});var k=l||!g?a:this.findNearestKDPoint(f,d,g);e=k&&k.series;k&&(d&&!e.noSharedTooltip?
(f=b.filter(function(b){return m.filter?m.filter(b):b.visible&&!(!d&&b.directTouch)&&y(b.options.enableMouseTracking,!0)&&!b.noSharedTooltip}),f.forEach(function(b){var d=c(b.points,function(b){return b.x===k.x&&!b.isNull});t(d)&&(b.chart.isBoosting&&(d=b.getPoint(d)),h.push(d))})):h.push(k));m={hoverPoint:k};p(this,"afterGetHoverData",m);return{hoverPoint:m.hoverPoint,hoverSeries:e,hoverPoints:h}};a.prototype.getPointFromEvent=function(a){a=a.target;for(var c;a&&!c;)c=a.point,a=a.parentNode;return c};
a.prototype.onTrackerMouseOut=function(a){a=a.relatedTarget||a.toElement;var c=this.chart.hoverSeries;this.isDirectTouch=!1;if(!(!c||!a||c.stickyTracking||this.inClass(a,"highcharts-tooltip")||this.inClass(a,"highcharts-series-"+c.index)&&this.inClass(a,"highcharts-tracker")))c.onMouseOut()};a.prototype.inClass=function(a,c){for(var b;a;){if(b=u(a,"class")){if(-1!==b.indexOf(c))return!0;if(-1!==b.indexOf("highcharts-container"))return!1}a=a.parentElement}};a.prototype.init=function(a,c){this.options=
c;this.chart=a;this.runChartClick=!(!c.chart.events||!c.chart.events.click);this.pinchDown=[];this.lastValidTouch={};B&&(a.tooltip=new B(a,c.tooltip),this.followTouchMove=y(c.tooltip.followTouchMove,!0));this.setDOMEvents()};a.prototype.normalize=function(a,c){var b=a.touches,h=b?b.length?b.item(0):y(b.changedTouches,a.changedTouches)[0]:a;c||(c=this.getChartPosition());b=h.pageX-c.left;h=h.pageY-c.top;b/=c.scaleX;h/=c.scaleY;return e(a,{chartX:Math.round(b),chartY:Math.round(h)})};a.prototype.onContainerClick=
function(a){var c=this.chart,b=c.hoverPoint;a=this.normalize(a);var l=c.plotLeft,d=c.plotTop;c.cancelClick||(b&&this.inClass(a.target,"highcharts-tracker")?(p(b.series,"click",e(a,{point:b})),c.hoverPoint&&b.firePointEvent("click",a)):(e(a,this.getCoordinates(a)),c.isInsidePlot(a.chartX-l,a.chartY-d,{visiblePlotOnly:!0})&&p(c,"click",a)))};a.prototype.onContainerMouseDown=function(a){var c=1===((a.buttons||a.button)&1);a=this.normalize(a);if(f.isFirefox&&0!==a.button)this.onContainerMouseMove(a);
if("undefined"===typeof a.button||c)this.zoomOption(a),c&&a.preventDefault&&a.preventDefault(),this.dragStart(a)};a.prototype.onContainerMouseLeave=function(c){var e=C[y(a.hoverChartIndex,-1)],b=this.chart.tooltip;b&&b.shouldStickOnContact()&&this.inClass(c.relatedTarget,"highcharts-tooltip-container")||(c=this.normalize(c),e&&(c.relatedTarget||c.toElement)&&(e.pointer.reset(),e.pointer.chartPosition=void 0),b&&!b.isHidden&&this.reset())};a.prototype.onContainerMouseEnter=function(a){delete this.chartPosition};
a.prototype.onContainerMouseMove=function(a){var c=this.chart;a=this.normalize(a);this.setHoverChartIndex();a.preventDefault||(a.returnValue=!1);("mousedown"===c.mouseIsDown||this.touchSelect(a))&&this.drag(a);c.openMenu||!this.inClass(a.target,"highcharts-tracker")&&!c.isInsidePlot(a.chartX-c.plotLeft,a.chartY-c.plotTop,{visiblePlotOnly:!0})||(this.inClass(a.target,"highcharts-no-tooltip")?this.reset(!1,0):this.runPointActions(a))};a.prototype.onDocumentTouchEnd=function(c){var e=C[y(a.hoverChartIndex,
-1)];e&&e.pointer.drop(c)};a.prototype.onContainerTouchMove=function(a){if(this.touchSelect(a))this.onContainerMouseMove(a);else this.touch(a)};a.prototype.onContainerTouchStart=function(a){if(this.touchSelect(a))this.onContainerMouseDown(a);else this.zoomOption(a),this.touch(a,!0)};a.prototype.onDocumentMouseMove=function(a){var c=this.chart,b=this.chartPosition;a=this.normalize(a,b);var e=c.tooltip;!b||e&&e.isStickyOnContact()||c.isInsidePlot(a.chartX-c.plotLeft,a.chartY-c.plotTop,{visiblePlotOnly:!0})||
this.inClass(a.target,"highcharts-tracker")||this.reset()};a.prototype.onDocumentMouseUp=function(c){var e=C[y(a.hoverChartIndex,-1)];e&&e.pointer.drop(c)};a.prototype.pinch=function(a){var c=this,b=c.chart,l=c.pinchDown,d=a.touches||[],g=d.length,f=c.lastValidTouch,k=c.hasZoom,m={},n=1===g&&(c.inClass(a.target,"highcharts-tracker")&&b.runTrackerClick||c.runChartClick),q={},t=c.selectionMarker;1<g?c.initiated=!0:1===g&&this.followTouchMove&&(c.initiated=!1);k&&c.initiated&&!n&&!1!==a.cancelable&&
a.preventDefault();[].map.call(d,function(b){return c.normalize(b)});"touchstart"===a.type?([].forEach.call(d,function(b,a){l[a]={chartX:b.chartX,chartY:b.chartY}}),f.x=[l[0].chartX,l[1]&&l[1].chartX],f.y=[l[0].chartY,l[1]&&l[1].chartY],b.axes.forEach(function(a){if(a.zoomEnabled){var d=b.bounds[a.horiz?"h":"v"],c=a.minPixelPadding,e=a.toPixels(Math.min(y(a.options.min,a.dataMin),a.dataMin)),h=a.toPixels(Math.max(y(a.options.max,a.dataMax),a.dataMax)),l=Math.max(e,h);d.min=Math.min(a.pos,Math.min(e,
h)-c);d.max=Math.max(a.pos+a.len,l+c)}}),c.res=!0):c.followTouchMove&&1===g?this.runPointActions(c.normalize(a)):l.length&&(p(b,"touchpan",{originalEvent:a},function(){t||(c.selectionMarker=t=e({destroy:I,touch:!0},b.plotBox));c.pinchTranslate(l,d,m,t,q,f);c.hasPinched=k;c.scaleGroups(m,q)}),c.res&&(c.res=!1,this.reset(!1,0)))};a.prototype.pinchTranslate=function(a,c,b,e,d,g){this.zoomHor&&this.pinchTranslateDirection(!0,a,c,b,e,d,g);this.zoomVert&&this.pinchTranslateDirection(!1,a,c,b,e,d,g)};a.prototype.pinchTranslateDirection=
function(a,c,b,e,d,g,f,k){var h=this.chart,l=a?"x":"y",m=a?"X":"Y",r="chart"+m,p=a?"width":"height",n=h["plot"+(a?"Left":"Top")],q=h.inverted,v=h.bounds[a?"h":"v"],D=1===c.length,t=c[0][r],y=!D&&c[1][r];c=function(){"number"===typeof F&&20<Math.abs(t-y)&&(z=k||Math.abs(M-F)/Math.abs(t-y));G=(n-M)/z+t;x=h["plot"+(a?"Width":"Height")]/z};var x,G,z=k||1,M=b[0][r],F=!D&&b[1][r];c();b=G;if(b<v.min){b=v.min;var u=!0}else b+x>v.max&&(b=v.max-x,u=!0);u?(M-=.8*(M-f[l][0]),"number"===typeof F&&(F-=.8*(F-f[l][1])),
c()):f[l]=[M,F];q||(g[l]=G-n,g[p]=x);g=q?1/z:z;d[p]=x;d[l]=b;e[q?a?"scaleY":"scaleX":"scale"+m]=z;e["translate"+m]=g*n+(M-g*t)};a.prototype.reset=function(a,c){var b=this.chart,e=b.hoverSeries,d=b.hoverPoint,h=b.hoverPoints,g=b.tooltip,f=g&&g.shared?h:d;a&&f&&x(f).forEach(function(b){b.series.isCartesian&&"undefined"===typeof b.plotX&&(a=!1)});if(a)g&&f&&x(f).length&&(g.refresh(f),g.shared&&h?h.forEach(function(b){b.setState(b.state,!0);b.series.isCartesian&&(b.series.xAxis.crosshair&&b.series.xAxis.drawCrosshair(null,
b),b.series.yAxis.crosshair&&b.series.yAxis.drawCrosshair(null,b))}):d&&(d.setState(d.state,!0),b.axes.forEach(function(b){b.crosshair&&d.series[b.coll]===b&&b.drawCrosshair(null,d)})));else{if(d)d.onMouseOut();h&&h.forEach(function(b){b.setState()});if(e)e.onMouseOut();g&&g.hide(c);this.unDocMouseMove&&(this.unDocMouseMove=this.unDocMouseMove());b.axes.forEach(function(b){b.hideCrosshair()});this.hoverX=b.hoverPoints=b.hoverPoint=null}};a.prototype.runPointActions=function(e,h){var b=this.chart,
g=b.tooltip&&b.tooltip.options.enabled?b.tooltip:void 0,d=g?g.shared:!1,f=h||b.hoverPoint,k=f&&f.series||b.hoverSeries;h=this.getHoverData(f,k,b.series,(!e||"touchmove"!==e.type)&&(!!h||k&&k.directTouch&&this.isDirectTouch),d,e);f=h.hoverPoint;k=h.hoverSeries;var m=h.hoverPoints;h=k&&k.tooltipOptions.followPointer&&!k.tooltipOptions.split;var p=d&&k&&!k.noSharedTooltip;if(f&&(f!==b.hoverPoint||g&&g.isHidden)){(b.hoverPoints||[]).forEach(function(b){-1===m.indexOf(b)&&b.setState()});if(b.hoverSeries!==
k)k.onMouseOver();this.applyInactiveState(m);(m||[]).forEach(function(b){b.setState("hover")});b.hoverPoint&&b.hoverPoint.firePointEvent("mouseOut");if(!f.series)return;b.hoverPoints=m;b.hoverPoint=f;f.firePointEvent("mouseOver",void 0,function(){g&&f&&g.refresh(p?m:f,e)})}else h&&g&&!g.isHidden&&(d=g.getAnchor([{}],e),b.isInsidePlot(d[0],d[1],{visiblePlotOnly:!0})&&g.updatePosition({plotX:d[0],plotY:d[1]}));this.unDocMouseMove||(this.unDocMouseMove=A(b.container.ownerDocument,"mousemove",function(b){var d=
C[a.hoverChartIndex];if(d)d.pointer.onDocumentMouseMove(b)}),this.eventsToUnbind.push(this.unDocMouseMove));b.axes.forEach(function(a){var d=y((a.crosshair||{}).snap,!0),h;d&&((h=b.hoverPoint)&&h.series[a.coll]===a||(h=c(m,function(b){return b.series&&b.series[a.coll]===a})));h||!d?a.drawCrosshair(e,h):a.hideCrosshair()})};a.prototype.scaleGroups=function(a,c){var b=this.chart;b.series.forEach(function(e){var d=a||e.getPlotBox();e.group&&(e.xAxis&&e.xAxis.zoomEnabled||b.mapView)&&(e.group.attr(d),
e.markerGroup&&(e.markerGroup.attr(d),e.markerGroup.clip(c?b.clipRect:null)),e.dataLabelsGroup&&e.dataLabelsGroup.attr(d))});b.clipRect.attr(c||b.clipBox)};a.prototype.setDOMEvents=function(){var c=this,e=this.chart.container,b=e.ownerDocument;e.onmousedown=this.onContainerMouseDown.bind(this);e.onmousemove=this.onContainerMouseMove.bind(this);e.onclick=this.onContainerClick.bind(this);this.eventsToUnbind.push(A(e,"mouseenter",this.onContainerMouseEnter.bind(this)));this.eventsToUnbind.push(A(e,"mouseleave",
this.onContainerMouseLeave.bind(this)));a.unbindDocumentMouseUp||(a.unbindDocumentMouseUp=A(b,"mouseup",this.onDocumentMouseUp.bind(this)));for(var g=this.chart.renderTo.parentElement;g&&"BODY"!==g.tagName;)this.eventsToUnbind.push(A(g,"scroll",function(){delete c.chartPosition})),g=g.parentElement;f.hasTouch&&(this.eventsToUnbind.push(A(e,"touchstart",this.onContainerTouchStart.bind(this),{passive:!1})),this.eventsToUnbind.push(A(e,"touchmove",this.onContainerTouchMove.bind(this),{passive:!1})),
a.unbindDocumentTouchEnd||(a.unbindDocumentTouchEnd=A(b,"touchend",this.onDocumentTouchEnd.bind(this),{passive:!1})))};a.prototype.setHoverChartIndex=function(){var c=this.chart,e=f.charts[y(a.hoverChartIndex,-1)];if(e&&e!==c)e.pointer.onContainerMouseLeave({relatedTarget:c.container});e&&e.mouseIsDown||(a.hoverChartIndex=c.index)};a.prototype.touch=function(a,c){var b=this.chart,e;this.setHoverChartIndex();if(1===a.touches.length)if(a=this.normalize(a),(e=b.isInsidePlot(a.chartX-b.plotLeft,a.chartY-
b.plotTop,{visiblePlotOnly:!0}))&&!b.openMenu){c&&this.runPointActions(a);if("touchmove"===a.type){c=this.pinchDown;var d=c[0]?4<=Math.sqrt(Math.pow(c[0].chartX-a.chartX,2)+Math.pow(c[0].chartY-a.chartY,2)):!1}y(d,!0)&&this.pinch(a)}else c&&this.reset();else 2===a.touches.length&&this.pinch(a)};a.prototype.touchSelect=function(a){return!(!this.chart.options.chart.zoomBySingleTouch||!a.touches||1!==a.touches.length)};a.prototype.zoomOption=function(a){var c=this.chart,b=c.options.chart;c=c.inverted;
var e=b.zoomType||"";/touch/.test(a.type)&&(e=y(b.pinchType,e));this.zoomX=a=/x/.test(e);this.zoomY=b=/y/.test(e);this.zoomHor=a&&!c||b&&c;this.zoomVert=b&&!c||a&&c;this.hasZoom=a||b};return a}();"";return a});K(f,"Core/MSPointer.js",[f["Core/Globals.js"],f["Core/Pointer.js"],f["Core/Utilities.js"]],function(a,f,B){function C(){var a=[];a.item=function(a){return this[a]};c(g,function(c){a.push({pageX:c.pageX,pageY:c.pageY,target:c.target})});return a}function w(a,c,e,g){var k=I[f.hoverChartIndex||
NaN];"touch"!==a.pointerType&&a.pointerType!==a.MSPOINTER_TYPE_TOUCH||!k||(k=k.pointer,g(a),k[c]({type:e,target:a.currentTarget,preventDefault:u,touches:C()}))}var E=this&&this.__extends||function(){var a=function(c,e){a=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,c){a.__proto__=c}||function(a,c){for(var e in c)c.hasOwnProperty(e)&&(a[e]=c[e])};return a(c,e)};return function(c,e){function g(){this.constructor=c}a(c,e);c.prototype=null===e?Object.create(e):(g.prototype=e.prototype,
new g)}}(),I=a.charts,A=a.doc,u=a.noop,n=a.win,k=B.addEvent,e=B.css,c=B.objectEach,p=B.removeEvent,g={},t=!!n.PointerEvent;return function(c){function f(){return null!==c&&c.apply(this,arguments)||this}E(f,c);f.isRequired=function(){return!(a.hasTouch||!n.PointerEvent&&!n.MSPointerEvent)};f.prototype.batchMSEvents=function(a){a(this.chart.container,t?"pointerdown":"MSPointerDown",this.onContainerPointerDown);a(this.chart.container,t?"pointermove":"MSPointerMove",this.onContainerPointerMove);a(A,t?
"pointerup":"MSPointerUp",this.onDocumentPointerUp)};f.prototype.destroy=function(){this.batchMSEvents(p);c.prototype.destroy.call(this)};f.prototype.init=function(a,g){c.prototype.init.call(this,a,g);this.hasZoom&&e(a.container,{"-ms-touch-action":"none","touch-action":"none"})};f.prototype.onContainerPointerDown=function(a){w(a,"onContainerTouchStart","touchstart",function(a){g[a.pointerId]={pageX:a.pageX,pageY:a.pageY,target:a.currentTarget}})};f.prototype.onContainerPointerMove=function(a){w(a,
"onContainerTouchMove","touchmove",function(a){g[a.pointerId]={pageX:a.pageX,pageY:a.pageY};g[a.pointerId].target||(g[a.pointerId].target=a.currentTarget)})};f.prototype.onDocumentPointerUp=function(a){w(a,"onDocumentTouchEnd","touchend",function(a){delete g[a.pointerId]})};f.prototype.setDOMEvents=function(){c.prototype.setDOMEvents.call(this);(this.hasZoom||this.followTouchMove)&&this.batchMSEvents(k)};return f}(f)});K(f,"Core/Legend/Legend.js",[f["Core/Animation/AnimationUtilities.js"],f["Core/FormatUtilities.js"],
f["Core/Globals.js"],f["Core/Series/Point.js"],f["Core/Renderer/RendererUtilities.js"],f["Core/Utilities.js"]],function(a,f,B,H,w,E){var C=a.animObject,A=a.setAnimation,u=f.format;a=B.isFirefox;var n=B.marginNames;B=B.win;var k=w.distribute,e=E.addEvent,c=E.createElement,p=E.css,g=E.defined,t=E.discardElement,q=E.find,F=E.fireEvent,y=E.isNumber,x=E.merge,z=E.pick,m=E.relativeLength,h=E.stableSort,b=E.syncTimeout;w=E.wrap;E=function(){function a(b,a){this.allItems=[];this.contentGroup=this.box=void 0;
this.display=!1;this.group=void 0;this.offsetWidth=this.maxLegendWidth=this.maxItemWidth=this.legendWidth=this.legendHeight=this.lastLineHeight=this.lastItemY=this.itemY=this.itemX=this.itemMarginTop=this.itemMarginBottom=this.itemHeight=this.initialItemY=0;this.options=void 0;this.padding=0;this.pages=[];this.proximate=!1;this.scrollGroup=void 0;this.widthOption=this.totalItemWidth=this.titleHeight=this.symbolWidth=this.symbolHeight=0;this.chart=b;this.init(b,a)}a.prototype.init=function(b,a){this.chart=
b;this.setOptions(a);a.enabled&&(this.render(),e(this.chart,"endResize",function(){this.legend.positionCheckboxes()}),this.proximate?this.unchartrender=e(this.chart,"render",function(){this.legend.proximatePositions();this.legend.positionItems()}):this.unchartrender&&this.unchartrender())};a.prototype.setOptions=function(b){var a=z(b.padding,8);this.options=b;this.chart.styledMode||(this.itemStyle=b.itemStyle,this.itemHiddenStyle=x(this.itemStyle,b.itemHiddenStyle));this.itemMarginTop=b.itemMarginTop||
0;this.itemMarginBottom=b.itemMarginBottom||0;this.padding=a;this.initialItemY=a-5;this.symbolWidth=z(b.symbolWidth,16);this.pages=[];this.proximate="proximate"===b.layout&&!this.chart.inverted;this.baseline=void 0};a.prototype.update=function(b,a){var d=this.chart;this.setOptions(x(!0,this.options,b));this.destroy();d.isDirtyLegend=d.isDirtyBox=!0;z(a,!0)&&d.redraw();F(this,"afterUpdate")};a.prototype.colorizeItem=function(b,a){b.legendGroup[a?"removeClass":"addClass"]("highcharts-legend-item-hidden");
if(!this.chart.styledMode){var d=this.options,c=b.legendItem,e=b.legendLine,h=b.legendSymbol,g=this.itemHiddenStyle.color;d=a?d.itemStyle.color:g;var l=a?b.color||g:g,f=b.options&&b.options.marker,k={fill:l};c&&c.css({fill:d,color:d});e&&e.attr({stroke:l});h&&(f&&h.isMarker&&(k=b.pointAttribs(),a||(k.stroke=k.fill=g)),h.attr(k))}F(this,"afterColorizeItem",{item:b,visible:a})};a.prototype.positionItems=function(){this.allItems.forEach(this.positionItem,this);this.chart.isResizing||this.positionCheckboxes()};
a.prototype.positionItem=function(b){var a=this,d=this.options,c=d.symbolPadding,e=!d.rtl,h=b._legendItemPos;d=h[0];h=h[1];var l=b.checkbox,f=b.legendGroup;f&&f.element&&(c={translateX:e?d:this.legendWidth-d-2*c-4,translateY:h},e=function(){F(a,"afterPositionItem",{item:b})},g(f.translateY)?f.animate(c,void 0,e):(f.attr(c),e()));l&&(l.x=d,l.y=h)};a.prototype.destroyItem=function(b){var a=b.checkbox;["legendItem","legendLine","legendSymbol","legendGroup"].forEach(function(a){b[a]&&(b[a]=b[a].destroy())});
a&&t(b.checkbox)};a.prototype.destroy=function(){function b(b){this[b]&&(this[b]=this[b].destroy())}this.getAllItems().forEach(function(a){["legendItem","legendGroup"].forEach(b,a)});"clipRect up down pager nav box title group".split(" ").forEach(b,this);this.display=null};a.prototype.positionCheckboxes=function(){var b=this.group&&this.group.alignAttr,a=this.clipHeight||this.legendHeight,c=this.titleHeight;if(b){var e=b.translateY;this.allItems.forEach(function(d){var h=d.checkbox;if(h){var g=e+
c+h.y+(this.scrollOffset||0)+3;p(h,{left:b.translateX+d.checkboxOffset+h.x-20+"px",top:g+"px",display:this.proximate||g>e-6&&g<e+a-6?"":"none"})}},this)}};a.prototype.renderTitle=function(){var b=this.options,a=this.padding,c=b.title,e=0;c.text&&(this.title||(this.title=this.chart.renderer.label(c.text,a-3,a-4,void 0,void 0,void 0,b.useHTML,void 0,"legend-title").attr({zIndex:1}),this.chart.styledMode||this.title.css(c.style),this.title.add(this.group)),c.width||this.title.css({width:this.maxLegendWidth+
"px"}),b=this.title.getBBox(),e=b.height,this.offsetWidth=b.width,this.contentGroup.attr({translateY:e}));this.titleHeight=e};a.prototype.setText=function(b){var a=this.options;b.legendItem.attr({text:a.labelFormat?u(a.labelFormat,b,this.chart):a.labelFormatter.call(b)})};a.prototype.renderItem=function(b){var a=this.chart,d=a.renderer,c=this.options,e=this.symbolWidth,h=c.symbolPadding||0,g=this.itemStyle,l=this.itemHiddenStyle,f="horizontal"===c.layout?z(c.itemDistance,20):0,k=!c.rtl,m=!b.series,
p=!m&&b.series.drawLegendSymbol?b.series:b,n=p.options,q=this.createCheckboxForItem&&n&&n.showCheckbox,t=c.useHTML,y=b.options.className,G=b.legendItem;n=e+h+f+(q?20:0);G||(b.legendGroup=d.g("legend-item").addClass("highcharts-"+p.type+"-series highcharts-color-"+b.colorIndex+(y?" "+y:"")+(m?" highcharts-series-"+b.index:"")).attr({zIndex:1}).add(this.scrollGroup),b.legendItem=G=d.text("",k?e+h:-h,this.baseline||0,t),a.styledMode||G.css(x(b.visible?g:l)),G.attr({align:k?"left":"right",zIndex:2}).add(b.legendGroup),
this.baseline||(this.fontMetrics=d.fontMetrics(a.styledMode?12:g.fontSize,G),this.baseline=this.fontMetrics.f+3+this.itemMarginTop,G.attr("y",this.baseline),this.symbolHeight=c.symbolHeight||this.fontMetrics.f,c.squareSymbol&&(this.symbolWidth=z(c.symbolWidth,Math.max(this.symbolHeight,16)),n=this.symbolWidth+h+f+(q?20:0),k&&G.attr("x",this.symbolWidth+h))),p.drawLegendSymbol(this,b),this.setItemEvents&&this.setItemEvents(b,G,t));q&&!b.checkbox&&this.createCheckboxForItem&&this.createCheckboxForItem(b);
this.colorizeItem(b,b.visible);!a.styledMode&&g.width||G.css({width:(c.itemWidth||this.widthOption||a.spacingBox.width)-n+"px"});this.setText(b);a=G.getBBox();d=this.fontMetrics&&this.fontMetrics.h||0;b.itemWidth=b.checkboxOffset=c.itemWidth||b.legendItemWidth||a.width+n;this.maxItemWidth=Math.max(this.maxItemWidth,b.itemWidth);this.totalItemWidth+=b.itemWidth;this.itemHeight=b.itemHeight=Math.round(b.legendItemHeight||(a.height>1.5*d?a.height:d))};a.prototype.layoutItem=function(b){var a=this.options,
c=this.padding,d="horizontal"===a.layout,e=b.itemHeight,h=this.itemMarginBottom,g=this.itemMarginTop,l=d?z(a.itemDistance,20):0,f=this.maxLegendWidth;a=a.alignColumns&&this.totalItemWidth>f?this.maxItemWidth:b.itemWidth;d&&this.itemX-c+a>f&&(this.itemX=c,this.lastLineHeight&&(this.itemY+=g+this.lastLineHeight+h),this.lastLineHeight=0);this.lastItemY=g+this.itemY+h;this.lastLineHeight=Math.max(e,this.lastLineHeight);b._legendItemPos=[this.itemX,this.itemY];d?this.itemX+=a:(this.itemY+=g+e+h,this.lastLineHeight=
e);this.offsetWidth=this.widthOption||Math.max((d?this.itemX-c-(b.checkbox?0:l):a)+c,this.offsetWidth)};a.prototype.getAllItems=function(){var b=[];this.chart.series.forEach(function(a){var c=a&&a.options;a&&z(c.showInLegend,g(c.linkedTo)?!1:void 0,!0)&&(b=b.concat(a.legendItems||("point"===c.legendType?a.data:a)))});F(this,"afterGetAllItems",{allItems:b});return b};a.prototype.getAlignment=function(){var b=this.options;return this.proximate?b.align.charAt(0)+"tv":b.floating?"":b.align.charAt(0)+
b.verticalAlign.charAt(0)+b.layout.charAt(0)};a.prototype.adjustMargins=function(b,a){var c=this.chart,d=this.options,e=this.getAlignment();e&&[/(lth|ct|rth)/,/(rtv|rm|rbv)/,/(rbh|cb|lbh)/,/(lbv|lm|ltv)/].forEach(function(h,f){h.test(e)&&!g(b[f])&&(c[n[f]]=Math.max(c[n[f]],c.legend[(f+1)%2?"legendHeight":"legendWidth"]+[1,-1,-1,1][f]*d[f%2?"x":"y"]+z(d.margin,12)+a[f]+(c.titleOffset[f]||0)))})};a.prototype.proximatePositions=function(){var b=this.chart,a=[],c="left"===this.options.align;this.allItems.forEach(function(d){var e;
var h=c;if(d.yAxis){d.xAxis.options.reversed&&(h=!h);d.points&&(e=q(h?d.points:d.points.slice(0).reverse(),function(b){return y(b.plotY)}));h=this.itemMarginTop+d.legendItem.getBBox().height+this.itemMarginBottom;var g=d.yAxis.top-b.plotTop;d.visible?(e=e?e.plotY:d.yAxis.height,e+=g-.3*h):e=g+d.yAxis.height;a.push({target:e,size:h,item:d})}},this);k(a,b.plotHeight).forEach(function(a){a.item._legendItemPos&&(a.item._legendItemPos[1]=b.plotTop-b.spacing[0]+a.pos)})};a.prototype.render=function(){var b=
this.chart,a=b.renderer,c=this.options,e=this.padding,g=this.getAllItems(),f=this.group,l=this.box;this.itemX=e;this.itemY=this.initialItemY;this.lastItemY=this.offsetWidth=0;this.widthOption=m(c.width,b.spacingBox.width-e);var k=b.spacingBox.width-2*e-c.x;-1<["rm","lm"].indexOf(this.getAlignment().substring(0,2))&&(k/=2);this.maxLegendWidth=this.widthOption||k;f||(this.group=f=a.g("legend").addClass(c.className||"").attr({zIndex:7}).add(),this.contentGroup=a.g().attr({zIndex:1}).add(f),this.scrollGroup=
a.g().add(this.contentGroup));this.renderTitle();h(g,function(b,a){return(b.options&&b.options.legendIndex||0)-(a.options&&a.options.legendIndex||0)});c.reversed&&g.reverse();this.allItems=g;this.display=k=!!g.length;this.itemHeight=this.totalItemWidth=this.maxItemWidth=this.lastLineHeight=0;g.forEach(this.renderItem,this);g.forEach(this.layoutItem,this);g=(this.widthOption||this.offsetWidth)+e;var p=this.lastItemY+this.lastLineHeight+this.titleHeight;p=this.handleOverflow(p);p+=e;l||(this.box=l=
a.rect().addClass("highcharts-legend-box").attr({r:c.borderRadius}).add(f));b.styledMode||l.attr({stroke:c.borderColor,"stroke-width":c.borderWidth||0,fill:c.backgroundColor||"none"}).shadow(c.shadow);if(0<g&&0<p)l[l.placed?"animate":"attr"](l.crisp.call({},{x:0,y:0,width:g,height:p},l.strokeWidth()));l[k?"show":"hide"]();b.styledMode&&"none"===f.getStyle("display")&&(g=p=0);this.legendWidth=g;this.legendHeight=p;k&&this.align();this.proximate||this.positionItems();F(this,"afterRender")};a.prototype.align=
function(b){void 0===b&&(b=this.chart.spacingBox);var a=this.chart,c=this.options,d=b.y;/(lth|ct|rth)/.test(this.getAlignment())&&0<a.titleOffset[0]?d+=a.titleOffset[0]:/(lbh|cb|rbh)/.test(this.getAlignment())&&0<a.titleOffset[2]&&(d-=a.titleOffset[2]);d!==b.y&&(b=x(b,{y:d}));a.hasRendered||(this.group.placed=!1);this.group.align(x(c,{width:this.legendWidth,height:this.legendHeight,verticalAlign:this.proximate?"top":c.verticalAlign}),!0,b)};a.prototype.handleOverflow=function(b){var a=this,c=this.chart,
d=c.renderer,e=this.options,h=e.y,g="top"===e.verticalAlign,f=this.padding,l=e.maxHeight,k=e.navigation,m=z(k.animation,!0),p=k.arrowSize||12,n=this.pages,q=this.allItems,t=function(b){"number"===typeof b?F.attr({height:b}):F&&(a.clipRect=F.destroy(),a.contentGroup.clip());a.contentGroup.div&&(a.contentGroup.div.style.clip=b?"rect("+f+"px,9999px,"+(f+b)+"px,0)":"auto")},y=function(b){a[b]=d.circle(0,0,1.3*p).translate(p/2,p/2).add(M);c.styledMode||a[b].attr("fill","rgba(0,0,0,0.0001)");return a[b]},
G,x;h=c.spacingBox.height+(g?-h:h)-f;var M=this.nav,F=this.clipRect;"horizontal"!==e.layout||"middle"===e.verticalAlign||e.floating||(h/=2);l&&(h=Math.min(h,l));n.length=0;b&&0<h&&b>h&&!1!==k.enabled?(this.clipHeight=G=Math.max(h-20-this.titleHeight-f,0),this.currentPage=z(this.currentPage,1),this.fullHeight=b,q.forEach(function(b,a){var c=b._legendItemPos[1],d=Math.round(b.legendItem.getBBox().height),e=n.length;if(!e||c-n[e-1]>G&&(x||c)!==n[e-1])n.push(x||c),e++;b.pageIx=e-1;x&&(q[a-1].pageIx=e-
1);a===q.length-1&&c+d-n[e-1]>G&&d<=G&&(n.push(c),b.pageIx=e);c!==x&&(x=c)}),F||(F=a.clipRect=d.clipRect(0,f,9999,0),a.contentGroup.clip(F)),t(G),M||(this.nav=M=d.g().attr({zIndex:1}).add(this.group),this.up=d.symbol("triangle",0,0,p,p).add(M),y("upTracker").on("click",function(){a.scroll(-1,m)}),this.pager=d.text("",15,10).addClass("highcharts-legend-navigation"),!c.styledMode&&k.style&&this.pager.css(k.style),this.pager.add(M),this.down=d.symbol("triangle-down",0,0,p,p).add(M),y("downTracker").on("click",
function(){a.scroll(1,m)})),a.scroll(0),b=h):M&&(t(),this.nav=M.destroy(),this.scrollGroup.attr({translateY:1}),this.clipHeight=0);return b};a.prototype.scroll=function(a,c){var d=this,e=this.chart,h=this.pages,g=h.length,f=this.clipHeight,l=this.options.navigation,k=this.pager,m=this.padding,p=this.currentPage+a;p>g&&(p=g);0<p&&("undefined"!==typeof c&&A(c,e),this.nav.attr({translateX:m,translateY:f+this.padding+7+this.titleHeight,visibility:"inherit"}),[this.up,this.upTracker].forEach(function(b){b.attr({"class":1===
p?"highcharts-legend-nav-inactive":"highcharts-legend-nav-active"})}),k.attr({text:p+"/"+g}),[this.down,this.downTracker].forEach(function(b){b.attr({x:18+this.pager.getBBox().width,"class":p===g?"highcharts-legend-nav-inactive":"highcharts-legend-nav-active"})},this),e.styledMode||(this.up.attr({fill:1===p?l.inactiveColor:l.activeColor}),this.upTracker.css({cursor:1===p?"default":"pointer"}),this.down.attr({fill:p===g?l.inactiveColor:l.activeColor}),this.downTracker.css({cursor:p===g?"default":"pointer"})),
this.scrollOffset=-h[p-1]+this.initialItemY,this.scrollGroup.animate({translateY:this.scrollOffset}),this.currentPage=p,this.positionCheckboxes(),a=C(z(c,e.renderer.globalAnimation,!0)),b(function(){F(d,"afterScroll",{currentPage:p})},a.duration))};a.prototype.setItemEvents=function(b,a,c){var d=this,e=d.chart.renderer.boxWrapper,h=b instanceof H,g="highcharts-legend-"+(h?"point":"series")+"-active",f=d.chart.styledMode,l=function(a){d.allItems.forEach(function(c){b!==c&&[c].concat(c.linkedSeries||
[]).forEach(function(b){b.setState(a,!h)})})};(c?[a,b.legendSymbol]:[b.legendGroup]).forEach(function(c){if(c)c.on("mouseover",function(){b.visible&&l("inactive");b.setState("hover");b.visible&&e.addClass(g);f||a.css(d.options.itemHoverStyle)}).on("mouseout",function(){d.chart.styledMode||a.css(x(b.visible?d.itemStyle:d.itemHiddenStyle));l("");e.removeClass(g);b.setState()}).on("click",function(a){var c=function(){b.setVisible&&b.setVisible();l(b.visible?"inactive":"")};e.removeClass(g);a={browserEvent:a};
b.firePointEvent?b.firePointEvent("legendItemClick",a,c):F(b,"legendItemClick",a,c)})})};a.prototype.createCheckboxForItem=function(b){b.checkbox=c("input",{type:"checkbox",className:"highcharts-legend-checkbox",checked:b.selected,defaultChecked:b.selected},this.options.itemCheckboxStyle,this.chart.container);e(b.checkbox,"click",function(a){F(b.series||b,"checkboxClick",{checked:a.target.checked,item:b},function(){b.select()})})};return a}();(/Trident\/7\.0/.test(B.navigator&&B.navigator.userAgent)||
a)&&w(E.prototype,"positionItem",function(b,a){var c=this,d=function(){a._legendItemPos&&b.call(c,a)};d();c.bubbleLegend||setTimeout(d)});"";return E});K(f,"Core/Series/SeriesRegistry.js",[f["Core/Globals.js"],f["Core/DefaultOptions.js"],f["Core/Series/Point.js"],f["Core/Utilities.js"]],function(a,f,B,H){var w=f.defaultOptions,C=H.error,I=H.extendClass,A=H.merge,u;(function(f){function k(a,c){var e=w.plotOptions||{},g=c.defaultOptions;c.prototype.pointClass||(c.prototype.pointClass=B);c.prototype.type=
a;g&&(e[a]=g);f.seriesTypes[a]=c}f.seriesTypes=a.seriesTypes;f.getSeries=function(a,c){void 0===c&&(c={});var e=a.options.chart;e=c.type||e.type||e.defaultSeriesType||"";var g=f.seriesTypes[e];f||C(17,!0,a,{missingModuleFor:e});e=new g;"function"===typeof e.init&&e.init(a,c);return e};f.registerSeriesType=k;f.seriesType=function(a,c,p,g,n){var e=w.plotOptions||{};c=c||"";e[a]=A(e[c],p);k(a,I(f.seriesTypes[c]||function(){},g));f.seriesTypes[a].prototype.type=a;n&&(f.seriesTypes[a].prototype.pointClass=
I(B,n));return f.seriesTypes[a]}})(u||(u={}));return u});K(f,"Core/Chart/Chart.js",[f["Core/Animation/AnimationUtilities.js"],f["Core/Axis/Axis.js"],f["Core/FormatUtilities.js"],f["Core/Foundation.js"],f["Core/Globals.js"],f["Core/Legend/Legend.js"],f["Core/MSPointer.js"],f["Core/DefaultOptions.js"],f["Core/Pointer.js"],f["Core/Renderer/RendererRegistry.js"],f["Core/Series/SeriesRegistry.js"],f["Core/Renderer/SVG/SVGRenderer.js"],f["Core/Time.js"],f["Core/Utilities.js"],f["Core/Renderer/HTML/AST.js"]],
function(a,f,B,H,w,E,I,A,u,n,k,e,c,p,g){var t=a.animate,q=a.animObject,F=a.setAnimation,y=B.numberFormat,x=H.registerEventOptions,z=w.charts,m=w.doc,h=w.marginNames,b=w.svg,l=w.win,d=A.defaultOptions,D=A.defaultTime,v=k.seriesTypes,r=p.addEvent,C=p.attr,P=p.cleanRecursively,S=p.createElement,N=p.css,Y=p.defined,X=p.discardElement,J=p.erase,L=p.error,K=p.extend,da=p.find,Q=p.fireEvent,ea=p.getStyle,G=p.isArray,T=p.isNumber,M=p.isObject,V=p.isString,W=p.merge,Z=p.objectEach,R=p.pick,ha=p.pInt,aa=p.relativeLength,
ja=p.removeEvent,ia=p.splat,ba=p.syncTimeout,ka=p.uniqueKey;a=function(){function a(b,a,c){this.series=this.renderTo=this.renderer=this.pointer=this.pointCount=this.plotWidth=this.plotTop=this.plotLeft=this.plotHeight=this.plotBox=this.options=this.numberFormatter=this.margin=this.legend=this.labelCollectors=this.isResizing=this.index=this.eventOptions=this.container=this.colorCounter=this.clipBox=this.chartWidth=this.chartHeight=this.bounds=this.axisOffset=this.axes=void 0;this.sharedClips={};this.yAxis=
this.xAxis=this.userOptions=this.titleOffset=this.time=this.symbolCounter=this.spacingBox=this.spacing=void 0;this.getArgs(b,a,c)}a.chart=function(b,c,d){return new a(b,c,d)};a.prototype.getArgs=function(b,a,c){V(b)||b.nodeName?(this.renderTo=b,this.init(a,c)):this.init(b,a)};a.prototype.init=function(b,a){var e=b.plotOptions||{};Q(this,"init",{args:arguments},function(){var h=W(d,b),g=h.chart;Z(h.plotOptions,function(b,a){M(b)&&(b.tooltip=e[a]&&W(e[a].tooltip)||void 0)});h.tooltip.userOptions=b.chart&&
b.chart.forExport&&b.tooltip.userOptions||b.tooltip;this.userOptions=b;this.margin=[];this.spacing=[];this.bounds={h:{},v:{}};this.labelCollectors=[];this.callback=a;this.isResizing=0;this.options=h;this.axes=[];this.series=[];this.time=b.time&&Object.keys(b.time).length?new c(b.time):w.time;this.numberFormatter=g.numberFormatter||y;this.styledMode=g.styledMode;this.hasCartesianSeries=g.showAxes;this.index=z.length;z.push(this);w.chartCount++;x(this,g);this.xAxis=[];this.yAxis=[];this.pointCount=
this.colorCounter=this.symbolCounter=0;Q(this,"afterInit");this.firstRender()})};a.prototype.initSeries=function(b){var a=this.options.chart;a=b.type||a.type||a.defaultSeriesType;var c=v[a];c||L(17,!0,this,{missingModuleFor:a});a=new c;"function"===typeof a.init&&a.init(this,b);return a};a.prototype.setSeriesData=function(){this.getSeriesOrderByLinks().forEach(function(b){b.points||b.data||!b.enabledDataSorting||b.setData(b.options.data,!1)})};a.prototype.getSeriesOrderByLinks=function(){return this.series.concat().sort(function(b,
a){return b.linkedSeries.length||a.linkedSeries.length?a.linkedSeries.length-b.linkedSeries.length:0})};a.prototype.orderSeries=function(b){var a=this.series;b=b||0;for(var c=a.length;b<c;++b)a[b]&&(a[b].index=b,a[b].name=a[b].getName())};a.prototype.isInsidePlot=function(b,a,c){void 0===c&&(c={});var d=this.inverted,e=this.plotBox,h=this.plotLeft,g=this.plotTop,f=this.scrollablePlotBox,l=0;var k=0;c.visiblePlotOnly&&this.scrollingContainer&&(k=this.scrollingContainer,l=k.scrollLeft,k=k.scrollTop);
var m=c.series;e=c.visiblePlotOnly&&f||e;f=c.inverted?a:b;a=c.inverted?b:a;b={x:f,y:a,isInsidePlot:!0};if(!c.ignoreX){var p=m&&(d?m.yAxis:m.xAxis)||{pos:h,len:Infinity};f=c.paneCoordinates?p.pos+f:h+f;f>=Math.max(l+h,p.pos)&&f<=Math.min(l+h+e.width,p.pos+p.len)||(b.isInsidePlot=!1)}!c.ignoreY&&b.isInsidePlot&&(d=m&&(d?m.xAxis:m.yAxis)||{pos:g,len:Infinity},c=c.paneCoordinates?d.pos+a:g+a,c>=Math.max(k+g,d.pos)&&c<=Math.min(k+g+e.height,d.pos+d.len)||(b.isInsidePlot=!1));Q(this,"afterIsInsidePlot",
b);return b.isInsidePlot};a.prototype.redraw=function(b){Q(this,"beforeRedraw");var a=this.hasCartesianSeries?this.axes:this.colorAxis||[],c=this.series,d=this.pointer,e=this.legend,h=this.userOptions.legend,g=this.renderer,f=g.isHidden(),l=[],k=this.isDirtyBox,m=this.isDirtyLegend;this.setResponsive&&this.setResponsive(!1);F(this.hasRendered?b:!1,this);f&&this.temporaryDisplay();this.layOutTitles();for(b=c.length;b--;){var p=c[b];if(p.options.stacking||p.options.centerInCategory){var G=!0;if(p.isDirty){var n=
!0;break}}}if(n)for(b=c.length;b--;)p=c[b],p.options.stacking&&(p.isDirty=!0);c.forEach(function(b){b.isDirty&&("point"===b.options.legendType?("function"===typeof b.updateTotals&&b.updateTotals(),m=!0):h&&(h.labelFormatter||h.labelFormat)&&(m=!0));b.isDirtyData&&Q(b,"updatedData")});m&&e&&e.options.enabled&&(e.render(),this.isDirtyLegend=!1);G&&this.getStacks();a.forEach(function(b){b.updateNames();b.setScale()});this.getMargins();a.forEach(function(b){b.isDirty&&(k=!0)});a.forEach(function(b){var a=
b.min+","+b.max;b.extKey!==a&&(b.extKey=a,l.push(function(){Q(b,"afterSetExtremes",K(b.eventArgs,b.getExtremes()));delete b.eventArgs}));(k||G)&&b.redraw()});k&&this.drawChartBox();Q(this,"predraw");c.forEach(function(b){(k||b.isDirty)&&b.visible&&b.redraw();b.isDirtyData=!1});d&&d.reset(!0);g.draw();Q(this,"redraw");Q(this,"render");f&&this.temporaryDisplay(!0);l.forEach(function(b){b.call()})};a.prototype.get=function(b){function a(a){return a.id===b||a.options&&a.options.id===b}for(var c=this.series,
d=da(this.axes,a)||da(this.series,a),e=0;!d&&e<c.length;e++)d=da(c[e].points||[],a);return d};a.prototype.getAxes=function(){var b=this,a=this.options,c=a.xAxis=ia(a.xAxis||{});a=a.yAxis=ia(a.yAxis||{});Q(this,"getAxes");c.forEach(function(b,a){b.index=a;b.isX=!0});a.forEach(function(b,a){b.index=a});c.concat(a).forEach(function(a){new f(b,a)});Q(this,"afterGetAxes")};a.prototype.getSelectedPoints=function(){return this.series.reduce(function(b,a){a.getPointsCollection().forEach(function(a){R(a.selectedStaging,
a.selected)&&b.push(a)});return b},[])};a.prototype.getSelectedSeries=function(){return this.series.filter(function(b){return b.selected})};a.prototype.setTitle=function(b,a,c){this.applyDescription("title",b);this.applyDescription("subtitle",a);this.applyDescription("caption",void 0);this.layOutTitles(c)};a.prototype.applyDescription=function(b,a){var c=this,d="title"===b?{color:"#333333",fontSize:this.options.isStock?"16px":"18px"}:{color:"#666666"};d=this.options[b]=W(!this.styledMode&&{style:d},
this.options[b],a);var e=this[b];e&&a&&(this[b]=e=e.destroy());d&&!e&&(e=this.renderer.text(d.text,0,0,d.useHTML).attr({align:d.align,"class":"highcharts-"+b,zIndex:d.zIndex||4}).add(),e.update=function(a){c[{title:"setTitle",subtitle:"setSubtitle",caption:"setCaption"}[b]](a)},this.styledMode||e.css(d.style),this[b]=e)};a.prototype.layOutTitles=function(b){var a=[0,0,0],c=this.renderer,d=this.spacingBox;["title","subtitle","caption"].forEach(function(b){var e=this[b],h=this.options[b],g=h.verticalAlign||
"top";b="title"===b?"top"===g?-3:0:"top"===g?a[0]+2:0;var f;if(e){this.styledMode||(f=h.style&&h.style.fontSize);f=c.fontMetrics(f,e).b;e.css({width:(h.width||d.width+(h.widthAdjust||0))+"px"});var l=Math.round(e.getBBox(h.useHTML).height);e.align(K({y:"bottom"===g?f:b+f,height:l},h),!1,"spacingBox");h.floating||("top"===g?a[0]=Math.ceil(a[0]+l):"bottom"===g&&(a[2]=Math.ceil(a[2]+l)))}},this);a[0]&&"top"===(this.options.title.verticalAlign||"top")&&(a[0]+=this.options.title.margin);a[2]&&"bottom"===
this.options.caption.verticalAlign&&(a[2]+=this.options.caption.margin);var e=!this.titleOffset||this.titleOffset.join(",")!==a.join(",");this.titleOffset=a;Q(this,"afterLayOutTitles");!this.isDirtyBox&&e&&(this.isDirtyBox=this.isDirtyLegend=e,this.hasRendered&&R(b,!0)&&this.isDirtyBox&&this.redraw())};a.prototype.getChartSize=function(){var b=this.options.chart,a=b.width;b=b.height;var c=this.renderTo;Y(a)||(this.containerWidth=ea(c,"width"));Y(b)||(this.containerHeight=ea(c,"height"));this.chartWidth=
Math.max(0,a||this.containerWidth||600);this.chartHeight=Math.max(0,aa(b,this.chartWidth)||(1<this.containerHeight?this.containerHeight:400))};a.prototype.temporaryDisplay=function(b){var a=this.renderTo;if(b)for(;a&&a.style;)a.hcOrigStyle&&(N(a,a.hcOrigStyle),delete a.hcOrigStyle),a.hcOrigDetached&&(m.body.removeChild(a),a.hcOrigDetached=!1),a=a.parentNode;else for(;a&&a.style;){m.body.contains(a)||a.parentNode||(a.hcOrigDetached=!0,m.body.appendChild(a));if("none"===ea(a,"display",!1)||a.hcOricDetached)a.hcOrigStyle=
{display:a.style.display,height:a.style.height,overflow:a.style.overflow},b={display:"block",overflow:"hidden"},a!==this.renderTo&&(b.height=0),N(a,b),a.offsetWidth||a.style.setProperty("display","block","important");a=a.parentNode;if(a===m.body)break}};a.prototype.setClassName=function(b){this.container.className="highcharts-container "+(b||"")};a.prototype.getContainer=function(){var a=this.options,c=a.chart,d=ka(),h,f=this.renderTo;f||(this.renderTo=f=c.renderTo);V(f)&&(this.renderTo=f=m.getElementById(f));
f||L(13,!0,this);var l=ha(C(f,"data-highcharts-chart"));T(l)&&z[l]&&z[l].hasRendered&&z[l].destroy();C(f,"data-highcharts-chart",this.index);f.innerHTML=g.emptyHTML;c.skipClone||f.offsetWidth||this.temporaryDisplay();this.getChartSize();l=this.chartWidth;var k=this.chartHeight;N(f,{overflow:"hidden"});this.styledMode||(h=K({position:"relative",overflow:"hidden",width:l+"px",height:k+"px",textAlign:"left",lineHeight:"normal",zIndex:0,"-webkit-tap-highlight-color":"rgba(0,0,0,0)",userSelect:"none",
"touch-action":"manipulation",outline:"none"},c.style||{}));this.container=d=S("div",{id:d},h,f);this._cursor=d.style.cursor;this.renderer=new (c.renderer||!b?n.getRendererType(c.renderer):e)(d,l,k,void 0,c.forExport,a.exporting&&a.exporting.allowHTML,this.styledMode);F(void 0,this);this.setClassName(c.className);if(this.styledMode)for(var p in a.defs)this.renderer.definition(a.defs[p]);else this.renderer.setStyle(c.style);this.renderer.chartIndex=this.index;Q(this,"afterGetContainer")};a.prototype.getMargins=
function(b){var a=this.spacing,c=this.margin,d=this.titleOffset;this.resetMargins();d[0]&&!Y(c[0])&&(this.plotTop=Math.max(this.plotTop,d[0]+a[0]));d[2]&&!Y(c[2])&&(this.marginBottom=Math.max(this.marginBottom,d[2]+a[2]));this.legend&&this.legend.display&&this.legend.adjustMargins(c,a);Q(this,"getMargins");b||this.getAxisMargins()};a.prototype.getAxisMargins=function(){var b=this,a=b.axisOffset=[0,0,0,0],c=b.colorAxis,d=b.margin,e=function(b){b.forEach(function(b){b.visible&&b.getOffset()})};b.hasCartesianSeries?
e(b.axes):c&&c.length&&e(c);h.forEach(function(c,e){Y(d[e])||(b[c]+=a[e])});b.setChartSize()};a.prototype.reflow=function(b){var a=this,c=a.options.chart,d=a.renderTo,e=Y(c.width)&&Y(c.height),h=c.width||ea(d,"width");c=c.height||ea(d,"height");d=b?b.target:l;delete a.pointer.chartPosition;if(!e&&!a.isPrinting&&h&&c&&(d===l||d===m)){if(h!==a.containerWidth||c!==a.containerHeight)p.clearTimeout(a.reflowTimeout),a.reflowTimeout=ba(function(){a.container&&a.setSize(void 0,void 0,!1)},b?100:0);a.containerWidth=
h;a.containerHeight=c}};a.prototype.setReflow=function(b){var a=this;!1===b||this.unbindReflow?!1===b&&this.unbindReflow&&(this.unbindReflow=this.unbindReflow()):(this.unbindReflow=r(l,"resize",function(b){a.options&&a.reflow(b)}),r(this,"destroy",this.unbindReflow))};a.prototype.setSize=function(b,a,c){var d=this,e=d.renderer;d.isResizing+=1;F(c,d);c=e.globalAnimation;d.oldChartHeight=d.chartHeight;d.oldChartWidth=d.chartWidth;"undefined"!==typeof b&&(d.options.chart.width=b);"undefined"!==typeof a&&
(d.options.chart.height=a);d.getChartSize();d.styledMode||(c?t:N)(d.container,{width:d.chartWidth+"px",height:d.chartHeight+"px"},c);d.setChartSize(!0);e.setSize(d.chartWidth,d.chartHeight,c);d.axes.forEach(function(b){b.isDirty=!0;b.setScale()});d.isDirtyLegend=!0;d.isDirtyBox=!0;d.layOutTitles();d.getMargins();d.redraw(c);d.oldChartHeight=null;Q(d,"resize");ba(function(){d&&Q(d,"endResize",null,function(){--d.isResizing})},q(c).duration)};a.prototype.setChartSize=function(b){var a=this.inverted,
c=this.renderer,d=this.chartWidth,e=this.chartHeight,h=this.options.chart,g=this.spacing,f=this.clipOffset,l,k,m,p;this.plotLeft=l=Math.round(this.plotLeft);this.plotTop=k=Math.round(this.plotTop);this.plotWidth=m=Math.max(0,Math.round(d-l-this.marginRight));this.plotHeight=p=Math.max(0,Math.round(e-k-this.marginBottom));this.plotSizeX=a?p:m;this.plotSizeY=a?m:p;this.plotBorderWidth=h.plotBorderWidth||0;this.spacingBox=c.spacingBox={x:g[3],y:g[0],width:d-g[3]-g[1],height:e-g[0]-g[2]};this.plotBox=
c.plotBox={x:l,y:k,width:m,height:p};a=2*Math.floor(this.plotBorderWidth/2);d=Math.ceil(Math.max(a,f[3])/2);e=Math.ceil(Math.max(a,f[0])/2);this.clipBox={x:d,y:e,width:Math.floor(this.plotSizeX-Math.max(a,f[1])/2-d),height:Math.max(0,Math.floor(this.plotSizeY-Math.max(a,f[2])/2-e))};b||(this.axes.forEach(function(b){b.setAxisSize();b.setAxisTranslation()}),c.alignElements());Q(this,"afterSetChartSize",{skipAxes:b})};a.prototype.resetMargins=function(){Q(this,"resetMargins");var b=this,a=b.options.chart;
["margin","spacing"].forEach(function(c){var d=a[c],e=M(d)?d:[d,d,d,d];["Top","Right","Bottom","Left"].forEach(function(d,h){b[c][h]=R(a[c+d],e[h])})});h.forEach(function(a,c){b[a]=R(b.margin[c],b.spacing[c])});b.axisOffset=[0,0,0,0];b.clipOffset=[0,0,0,0]};a.prototype.drawChartBox=function(){var b=this.options.chart,a=this.renderer,c=this.chartWidth,d=this.chartHeight,e=this.styledMode,h=this.plotBGImage,g=b.backgroundColor,f=b.plotBackgroundColor,l=b.plotBackgroundImage,k=this.plotLeft,m=this.plotTop,
p=this.plotWidth,G=this.plotHeight,n=this.plotBox,q=this.clipRect,r=this.clipBox,t=this.chartBackground,M=this.plotBackground,y=this.plotBorder,z,x="animate";t||(this.chartBackground=t=a.rect().addClass("highcharts-background").add(),x="attr");if(e)var v=z=t.strokeWidth();else{v=b.borderWidth||0;z=v+(b.shadow?8:0);g={fill:g||"none"};if(v||t["stroke-width"])g.stroke=b.borderColor,g["stroke-width"]=v;t.attr(g).shadow(b.shadow)}t[x]({x:z/2,y:z/2,width:c-z-v%2,height:d-z-v%2,r:b.borderRadius});x="animate";
M||(x="attr",this.plotBackground=M=a.rect().addClass("highcharts-plot-background").add());M[x](n);e||(M.attr({fill:f||"none"}).shadow(b.plotShadow),l&&(h?(l!==h.attr("href")&&h.attr("href",l),h.animate(n)):this.plotBGImage=a.image(l,k,m,p,G).add()));q?q.animate({width:r.width,height:r.height}):this.clipRect=a.clipRect(r);x="animate";y||(x="attr",this.plotBorder=y=a.rect().addClass("highcharts-plot-border").attr({zIndex:1}).add());e||y.attr({stroke:b.plotBorderColor,"stroke-width":b.plotBorderWidth||
0,fill:"none"});y[x](y.crisp({x:k,y:m,width:p,height:G},-y.strokeWidth()));this.isDirtyBox=!1;Q(this,"afterDrawChartBox")};a.prototype.propFromSeries=function(){var b=this,a=b.options.chart,c=b.options.series,d,e,h;["inverted","angular","polar"].forEach(function(g){e=v[a.type||a.defaultSeriesType];h=a[g]||e&&e.prototype[g];for(d=c&&c.length;!h&&d--;)(e=v[c[d].type])&&e.prototype[g]&&(h=!0);b[g]=h})};a.prototype.linkSeries=function(){var b=this,a=b.series;a.forEach(function(b){b.linkedSeries.length=
0});a.forEach(function(a){var c=a.options.linkedTo;V(c)&&(c=":previous"===c?b.series[a.index-1]:b.get(c))&&c.linkedParent!==a&&(c.linkedSeries.push(a),a.linkedParent=c,c.enabledDataSorting&&a.setDataSortingOptions(),a.visible=R(a.options.visible,c.options.visible,a.visible))});Q(this,"afterLinkSeries")};a.prototype.renderSeries=function(){this.series.forEach(function(b){b.translate();b.render()})};a.prototype.renderLabels=function(){var b=this,a=b.options.labels;a.items&&a.items.forEach(function(c){var d=
K(a.style,c.style),e=ha(d.left)+b.plotLeft,h=ha(d.top)+b.plotTop+12;delete d.left;delete d.top;b.renderer.text(c.html,e,h).attr({zIndex:2}).css(d).add()})};a.prototype.render=function(){var b=this.axes,a=this.colorAxis,c=this.renderer,d=this.options,e=function(b){b.forEach(function(b){b.visible&&b.render()})},h=0;this.setTitle();this.legend=new E(this,d.legend);this.getStacks&&this.getStacks();this.getMargins(!0);this.setChartSize();d=this.plotWidth;b.some(function(b){if(b.horiz&&b.visible&&b.options.labels.enabled&&
b.series.length)return h=21,!0});var g=this.plotHeight=Math.max(this.plotHeight-h,0);b.forEach(function(b){b.setScale()});this.getAxisMargins();var f=1.1<d/this.plotWidth,l=1.05<g/this.plotHeight;if(f||l)b.forEach(function(b){(b.horiz&&f||!b.horiz&&l)&&b.setTickInterval(!0)}),this.getMargins();this.drawChartBox();this.hasCartesianSeries?e(b):a&&a.length&&e(a);this.seriesGroup||(this.seriesGroup=c.g("series-group").attr({zIndex:3}).add());this.renderSeries();this.renderLabels();this.addCredits();this.setResponsive&&
this.setResponsive();this.hasRendered=!0};a.prototype.addCredits=function(b){var a=this,c=W(!0,this.options.credits,b);c.enabled&&!this.credits&&(this.credits=this.renderer.text(c.text+(this.mapCredits||""),0,0).addClass("highcharts-credits").on("click",function(){c.href&&(l.location.href=c.href)}).attr({align:c.position.align,zIndex:8}),a.styledMode||this.credits.css(c.style),this.credits.add().align(c.position),this.credits.update=function(b){a.credits=a.credits.destroy();a.addCredits(b)})};a.prototype.destroy=
function(){var b=this,a=b.axes,c=b.series,d=b.container,e=d&&d.parentNode,h;Q(b,"destroy");b.renderer.forExport?J(z,b):z[b.index]=void 0;w.chartCount--;b.renderTo.removeAttribute("data-highcharts-chart");ja(b);for(h=a.length;h--;)a[h]=a[h].destroy();this.scroller&&this.scroller.destroy&&this.scroller.destroy();for(h=c.length;h--;)c[h]=c[h].destroy();"title subtitle chartBackground plotBackground plotBGImage plotBorder seriesGroup clipRect credits pointer rangeSelector legend resetZoomButton tooltip renderer".split(" ").forEach(function(a){var c=
b[a];c&&c.destroy&&(b[a]=c.destroy())});d&&(d.innerHTML=g.emptyHTML,ja(d),e&&X(d));Z(b,function(a,c){delete b[c]})};a.prototype.firstRender=function(){var b=this,a=b.options;if(!b.isReadyToRender||b.isReadyToRender()){b.getContainer();b.resetMargins();b.setChartSize();b.propFromSeries();b.getAxes();(G(a.series)?a.series:[]).forEach(function(a){b.initSeries(a)});b.linkSeries();b.setSeriesData();Q(b,"beforeRender");u&&(I.isRequired()?b.pointer=new I(b,a):b.pointer=new u(b,a));b.render();b.pointer.getChartPosition();
if(!b.renderer.imgCount&&!b.hasLoaded)b.onload();b.temporaryDisplay(!0)}};a.prototype.onload=function(){this.callbacks.concat([this.callback]).forEach(function(b){b&&"undefined"!==typeof this.index&&b.apply(this,[this])},this);Q(this,"load");Q(this,"render");Y(this.index)&&this.setReflow(this.options.chart.reflow);this.warnIfA11yModuleNotLoaded();this.hasLoaded=!0};a.prototype.warnIfA11yModuleNotLoaded=function(){var b=this;setTimeout(function(){var a=b&&b.options;!a||b.accessibility||a.accessibility&&
!1===a.accessibility.enabled||L('Highcharts warning: Consider including the "accessibility.js" module to make your chart more usable for people with disabilities. Set the "accessibility.enabled" option to false to remove this warning. See https://www.highcharts.com/docs/accessibility/accessibility-module.',!1,b)},100)};a.prototype.addSeries=function(b,a,c){var d=this,e;b&&(a=R(a,!0),Q(d,"addSeries",{options:b},function(){e=d.initSeries(b);d.isDirtyLegend=!0;d.linkSeries();e.enabledDataSorting&&e.setData(b.data,
!1);Q(d,"afterAddSeries",{series:e});a&&d.redraw(c)}));return e};a.prototype.addAxis=function(b,a,c,d){return this.createAxis(a?"xAxis":"yAxis",{axis:b,redraw:c,animation:d})};a.prototype.addColorAxis=function(b,a,c){return this.createAxis("colorAxis",{axis:b,redraw:a,animation:c})};a.prototype.createAxis=function(b,a){b=new f(this,W(a.axis,{index:this[b].length,isX:"xAxis"===b}));R(a.redraw,!0)&&this.redraw(a.animation);return b};a.prototype.showLoading=function(b){var a=this,c=a.options,d=c.loading,
e=function(){h&&N(h,{left:a.plotLeft+"px",top:a.plotTop+"px",width:a.plotWidth+"px",height:a.plotHeight+"px"})},h=a.loadingDiv,f=a.loadingSpan;h||(a.loadingDiv=h=S("div",{className:"highcharts-loading highcharts-loading-hidden"},null,a.container));f||(a.loadingSpan=f=S("span",{className:"highcharts-loading-inner"},null,h),r(a,"redraw",e));h.className="highcharts-loading";g.setElementHTML(f,R(b,c.lang.loading,""));a.styledMode||(N(h,K(d.style,{zIndex:10})),N(f,d.labelStyle),a.loadingShown||(N(h,{opacity:0,
display:""}),t(h,{opacity:d.style.opacity||.5},{duration:d.showDuration||0})));a.loadingShown=!0;e()};a.prototype.hideLoading=function(){var b=this.options,a=this.loadingDiv;a&&(a.className="highcharts-loading highcharts-loading-hidden",this.styledMode||t(a,{opacity:0},{duration:b.loading.hideDuration||100,complete:function(){N(a,{display:"none"})}}));this.loadingShown=!1};a.prototype.update=function(b,a,d,e){var h=this,g={credits:"addCredits",title:"setTitle",subtitle:"setSubtitle",caption:"setCaption"},
f=b.isResponsiveOptions,l=[],k,m;Q(h,"update",{options:b});f||h.setResponsive(!1,!0);b=P(b,h.options);h.userOptions=W(h.userOptions,b);var p=b.chart;if(p){W(!0,h.options.chart,p);"className"in p&&h.setClassName(p.className);"reflow"in p&&h.setReflow(p.reflow);if("inverted"in p||"polar"in p||"type"in p){h.propFromSeries();var G=!0}"alignTicks"in p&&(G=!0);"events"in p&&x(this,p);Z(p,function(b,a){-1!==h.propsRequireUpdateSeries.indexOf("chart."+a)&&(k=!0);-1!==h.propsRequireDirtyBox.indexOf(a)&&(h.isDirtyBox=
!0);-1!==h.propsRequireReflow.indexOf(a)&&(f?h.isDirtyBox=!0:m=!0)});!h.styledMode&&p.style&&h.renderer.setStyle(h.options.chart.style||{})}!h.styledMode&&b.colors&&(this.options.colors=b.colors);b.time&&(this.time===D&&(this.time=new c(b.time)),W(!0,h.options.time,b.time));Z(b,function(a,c){if(h[c]&&"function"===typeof h[c].update)h[c].update(a,!1);else if("function"===typeof h[g[c]])h[g[c]](a);else"colors"!==c&&-1===h.collectionsWithUpdate.indexOf(c)&&W(!0,h.options[c],b[c]);"chart"!==c&&-1!==h.propsRequireUpdateSeries.indexOf(c)&&
(k=!0)});this.collectionsWithUpdate.forEach(function(a){if(b[a]){var c=[];h[a].forEach(function(b,a){b.options.isInternal||c.push(R(b.options.index,a))});ia(b[a]).forEach(function(b,e){var g=Y(b.id),f;g&&(f=h.get(b.id));!f&&h[a]&&(f=h[a][c?c[e]:e])&&g&&Y(f.options.id)&&(f=void 0);f&&f.coll===a&&(f.update(b,!1),d&&(f.touched=!0));!f&&d&&h.collectionsWithInit[a]&&(h.collectionsWithInit[a][0].apply(h,[b].concat(h.collectionsWithInit[a][1]||[]).concat([!1])).touched=!0)});d&&h[a].forEach(function(b){b.touched||
b.options.isInternal?delete b.touched:l.push(b)})}});l.forEach(function(b){b.chart&&b.remove&&b.remove(!1)});G&&h.axes.forEach(function(b){b.update({},!1)});k&&h.getSeriesOrderByLinks().forEach(function(b){b.chart&&b.update({},!1)},this);G=p&&p.width;p=p&&(V(p.height)?aa(p.height,G||h.chartWidth):p.height);m||T(G)&&G!==h.chartWidth||T(p)&&p!==h.chartHeight?h.setSize(G,p,e):R(a,!0)&&h.redraw(e);Q(h,"afterUpdate",{options:b,redraw:a,animation:e})};a.prototype.setSubtitle=function(b,a){this.applyDescription("subtitle",
b);this.layOutTitles(a)};a.prototype.setCaption=function(b,a){this.applyDescription("caption",b);this.layOutTitles(a)};a.prototype.showResetZoom=function(){function b(){a.zoomOut()}var a=this,c=d.lang,e=a.options.chart.resetZoomButton,h=e.theme,g="chart"===e.relativeTo||"spacingBox"===e.relativeTo?null:"scrollablePlotBox";Q(this,"beforeShowResetZoom",null,function(){a.resetZoomButton=a.renderer.button(c.resetZoom,null,null,b,h).attr({align:e.position.align,title:c.resetZoomTitle}).addClass("highcharts-reset-zoom").add().align(e.position,
!1,g)});Q(this,"afterShowResetZoom")};a.prototype.zoomOut=function(){Q(this,"selection",{resetSelection:!0},this.zoom)};a.prototype.zoom=function(b){var a=this,c=a.pointer,d=a.inverted?c.mouseDownX:c.mouseDownY,e=!1,h;!b||b.resetSelection?(a.axes.forEach(function(b){h=b.zoom()}),c.initiated=!1):b.xAxis.concat(b.yAxis).forEach(function(b){var g=b.axis,f=a.inverted?g.left:g.top,l=a.inverted?f+g.width:f+g.height,k=g.isXAxis,m=!1;if(!k&&d>=f&&d<=l||k||!Y(d))m=!0;c[k?"zoomX":"zoomY"]&&m&&(h=g.zoom(b.min,
b.max),g.displayBtn&&(e=!0))});var g=a.resetZoomButton;e&&!g?a.showResetZoom():!e&&M(g)&&(a.resetZoomButton=g.destroy());h&&a.redraw(R(a.options.chart.animation,b&&b.animation,100>a.pointCount))};a.prototype.pan=function(b,a){var c=this,d=c.hoverPoints;a="object"===typeof a?a:{enabled:a,type:"x"};var e=c.options.chart,h=c.options.mapNavigation&&c.options.mapNavigation.enabled;e&&e.panning&&(e.panning=a);var g=a.type,f;Q(this,"pan",{originalEvent:b},function(){d&&d.forEach(function(b){b.setState()});
var a=c.xAxis;"xy"===g?a=a.concat(c.yAxis):"y"===g&&(a=c.yAxis);var e={};a.forEach(function(a){if(a.options.panningEnabled&&!a.options.isInternal){var d=a.horiz,l=b[d?"chartX":"chartY"];d=d?"mouseDownX":"mouseDownY";var k=c[d],m=a.minPointOffset||0,p=a.reversed&&!c.inverted||!a.reversed&&c.inverted?-1:1,G=a.getExtremes(),n=a.toValue(k-l,!0)+m*p,q=a.toValue(k+a.len-l,!0)-(m*p||a.isXAxis&&a.pointRangePadding||0),r=q<n;p=a.hasVerticalPanning();k=r?q:n;n=r?n:q;var t=a.panningState;!p||a.isXAxis||t&&!t.isDirty||
a.series.forEach(function(b){var a=b.getProcessedData(!0);a=b.getExtremes(a.yData,!0);t||(t={startMin:Number.MAX_VALUE,startMax:-Number.MAX_VALUE});T(a.dataMin)&&T(a.dataMax)&&(t.startMin=Math.min(R(b.options.threshold,Infinity),a.dataMin,t.startMin),t.startMax=Math.max(R(b.options.threshold,-Infinity),a.dataMax,t.startMax))});p=Math.min(R(t&&t.startMin,G.dataMin),m?G.min:a.toValue(a.toPixels(G.min)-a.minPixelPadding));q=Math.max(R(t&&t.startMax,G.dataMax),m?G.max:a.toValue(a.toPixels(G.max)+a.minPixelPadding));
a.panningState=t;a.isOrdinal||(m=p-k,0<m&&(n+=m,k=p),m=n-q,0<m&&(n=q,k-=m),a.series.length&&k!==G.min&&n!==G.max&&k>=p&&n<=q&&(a.setExtremes(k,n,!1,!1,{trigger:"pan"}),c.resetZoomButton||h||k===p||n===q||!g.match("y")||(c.showResetZoom(),a.displayBtn=!1),f=!0),e[d]=l)}});Z(e,function(b,a){c[a]=b});f&&c.redraw(!1);N(c.container,{cursor:"move"})})};return a}();K(a.prototype,{callbacks:[],collectionsWithInit:{xAxis:[a.prototype.addAxis,[!0]],yAxis:[a.prototype.addAxis,[!1]],series:[a.prototype.addSeries]},
collectionsWithUpdate:["xAxis","yAxis","series"],propsRequireDirtyBox:"backgroundColor borderColor borderWidth borderRadius plotBackgroundColor plotBackgroundImage plotBorderColor plotBorderWidth plotShadow shadow".split(" "),propsRequireReflow:"margin marginTop marginRight marginBottom marginLeft spacing spacingTop spacingRight spacingBottom spacingLeft".split(" "),propsRequireUpdateSeries:"chart.inverted chart.polar chart.ignoreHiddenSeries chart.type colors plotOptions time tooltip".split(" ")});
"";return a});K(f,"Core/Legend/LegendSymbol.js",[f["Core/Utilities.js"]],function(a){var f=a.merge,B=a.pick,H;(function(a){a.drawLineMarker=function(a){var w=this.options,A=a.symbolWidth,u=a.symbolHeight,n=u/2,k=this.chart.renderer,e=this.legendGroup;a=a.baseline-Math.round(.3*a.fontMetrics.b);var c={},p=w.marker;this.chart.styledMode||(c={"stroke-width":w.lineWidth||0},w.dashStyle&&(c.dashstyle=w.dashStyle));this.legendLine=k.path([["M",0,a],["L",A,a]]).addClass("highcharts-graph").attr(c).add(e);
p&&!1!==p.enabled&&A&&(w=Math.min(B(p.radius,n),n),0===this.symbol.indexOf("url")&&(p=f(p,{width:u,height:u}),w=0),this.legendSymbol=A=k.symbol(this.symbol,A/2-w,a-w,2*w,2*w,p).addClass("highcharts-point").add(e),A.isMarker=!0)};a.drawRectangle=function(a,f){var w=a.symbolHeight,u=a.options.squareSymbol;f.legendSymbol=this.chart.renderer.rect(u?(a.symbolWidth-w)/2:0,a.baseline-w+1,u?w:a.symbolWidth,w,B(a.options.symbolRadius,w/2)).addClass("highcharts-point").attr({zIndex:3}).add(f.legendGroup)}})(H||
(H={}));return H});K(f,"Core/Series/SeriesDefaults.js",[],function(){return{lineWidth:2,allowPointSelect:!1,crisp:!0,showCheckbox:!1,animation:{duration:1E3},events:{},marker:{enabledThreshold:2,lineColor:"#ffffff",lineWidth:0,radius:4,states:{normal:{animation:!0},hover:{animation:{duration:50},enabled:!0,radiusPlus:2,lineWidthPlus:1},select:{fillColor:"#cccccc",lineColor:"#000000",lineWidth:2}}},point:{events:{}},dataLabels:{animation:{},align:"center",defer:!0,formatter:function(){var a=this.series.chart.numberFormatter;
return"number"!==typeof this.y?"":a(this.y,-1)},padding:5,style:{fontSize:"11px",fontWeight:"bold",color:"contrast",textOutline:"1px contrast"},verticalAlign:"bottom",x:0,y:0},cropThreshold:300,opacity:1,pointRange:0,softThreshold:!0,states:{normal:{animation:!0},hover:{animation:{duration:50},lineWidthPlus:1,marker:{},halo:{size:10,opacity:.25}},select:{animation:{duration:0}},inactive:{animation:{duration:50},opacity:.2}},stickyTracking:!0,turboThreshold:1E3,findNearestPointBy:"x"}});K(f,"Core/Series/Series.js",
[f["Core/Animation/AnimationUtilities.js"],f["Core/DefaultOptions.js"],f["Core/Foundation.js"],f["Core/Globals.js"],f["Core/Legend/LegendSymbol.js"],f["Core/Series/Point.js"],f["Core/Series/SeriesDefaults.js"],f["Core/Series/SeriesRegistry.js"],f["Core/Renderer/SVG/SVGElement.js"],f["Core/Utilities.js"]],function(a,f,B,H,w,E,I,A,u,n){var k=a.animObject,e=a.setAnimation,c=f.defaultOptions,p=B.registerEventOptions,g=H.hasTouch,t=H.svg,q=H.win,F=A.seriesTypes,y=n.addEvent,x=n.arrayMax,z=n.arrayMin,m=
n.clamp,h=n.cleanRecursively,b=n.correctFloat,l=n.defined,d=n.erase,D=n.error,v=n.extend,r=n.find,C=n.fireEvent,P=n.getNestedProperty,S=n.isArray,N=n.isNumber,Y=n.isString,X=n.merge,J=n.objectEach,L=n.pick,K=n.removeEvent,da=n.splat,Q=n.syncTimeout;a=function(){function a(){this.zones=this.yAxis=this.xAxis=this.userOptions=this.tooltipOptions=this.processedYData=this.processedXData=this.points=this.options=this.linkedSeries=this.index=this.eventsToUnbind=this.eventOptions=this.data=this.chart=this._i=
void 0}a.prototype.init=function(b,a){C(this,"init",{options:a});var c=this,d=b.series;this.eventsToUnbind=[];c.chart=b;c.options=c.setOptions(a);a=c.options;c.linkedSeries=[];c.bindAxes();v(c,{name:a.name,state:"",visible:!1!==a.visible,selected:!0===a.selected});p(this,a);var e=a.events;if(e&&e.click||a.point&&a.point.events&&a.point.events.click||a.allowPointSelect)b.runTrackerClick=!0;c.getColor();c.getSymbol();c.parallelArrays.forEach(function(b){c[b+"Data"]||(c[b+"Data"]=[])});c.isCartesian&&
(b.hasCartesianSeries=!0);var h;d.length&&(h=d[d.length-1]);c._i=L(h&&h._i,-1)+1;c.opacity=c.options.opacity;b.orderSeries(this.insert(d));a.dataSorting&&a.dataSorting.enabled?c.setDataSortingOptions():c.points||c.data||c.setData(a.data,!1);C(this,"afterInit")};a.prototype.is=function(b){return F[b]&&this instanceof F[b]};a.prototype.insert=function(b){var a=this.options.index,c;if(N(a)){for(c=b.length;c--;)if(a>=L(b[c].options.index,b[c]._i)){b.splice(c+1,0,this);break}-1===c&&b.unshift(this);c+=
1}else b.push(this);return L(c,b.length-1)};a.prototype.bindAxes=function(){var b=this,a=b.options,c=b.chart,d;C(this,"bindAxes",null,function(){(b.axisTypes||[]).forEach(function(e){var h=0;c[e].forEach(function(c){d=c.options;if(a[e]===h&&!d.isInternal||"undefined"!==typeof a[e]&&a[e]===d.id||"undefined"===typeof a[e]&&0===d.index)b.insert(c.series),b[e]=c,c.isDirty=!0;d.isInternal||h++});b[e]||b.optionalAxis===e||D(18,!0,c)})});C(this,"afterBindAxes")};a.prototype.updateParallelArrays=function(b,
a){var c=b.series,d=arguments,e=N(a)?function(d){var e="y"===d&&c.toYData?c.toYData(b):b[d];c[d+"Data"][a]=e}:function(b){Array.prototype[a].apply(c[b+"Data"],Array.prototype.slice.call(d,2))};c.parallelArrays.forEach(e)};a.prototype.hasData=function(){return this.visible&&"undefined"!==typeof this.dataMax&&"undefined"!==typeof this.dataMin||this.visible&&this.yData&&0<this.yData.length};a.prototype.autoIncrement=function(b){var a=this.options,c=a.pointIntervalUnit,d=a.relativeXValue,e=this.chart.time,
h=this.xIncrement,g;h=L(h,a.pointStart,0);this.pointInterval=g=L(this.pointInterval,a.pointInterval,1);d&&N(b)&&(g*=b);c&&(a=new e.Date(h),"day"===c?e.set("Date",a,e.get("Date",a)+g):"month"===c?e.set("Month",a,e.get("Month",a)+g):"year"===c&&e.set("FullYear",a,e.get("FullYear",a)+g),g=a.getTime()-h);if(d&&N(b))return h+g;this.xIncrement=h+g;return h};a.prototype.setDataSortingOptions=function(){var b=this.options;v(this,{requireSorting:!1,sorted:!1,enabledDataSorting:!0,allowDG:!1});l(b.pointRange)||
(b.pointRange=1)};a.prototype.setOptions=function(b){var a=this.chart,d=a.options,e=d.plotOptions,h=a.userOptions||{};b=X(b);a=a.styledMode;var g={plotOptions:e,userOptions:b};C(this,"setOptions",g);var f=g.plotOptions[this.type],k=h.plotOptions||{};this.userOptions=g.userOptions;h=X(f,e.series,h.plotOptions&&h.plotOptions[this.type],b);this.tooltipOptions=X(c.tooltip,c.plotOptions.series&&c.plotOptions.series.tooltip,c.plotOptions[this.type].tooltip,d.tooltip.userOptions,e.series&&e.series.tooltip,
e[this.type].tooltip,b.tooltip);this.stickyTracking=L(b.stickyTracking,k[this.type]&&k[this.type].stickyTracking,k.series&&k.series.stickyTracking,this.tooltipOptions.shared&&!this.noSharedTooltip?!0:h.stickyTracking);null===f.marker&&delete h.marker;this.zoneAxis=h.zoneAxis;e=this.zones=(h.zones||[]).slice();!h.negativeColor&&!h.negativeFillColor||h.zones||(d={value:h[this.zoneAxis+"Threshold"]||h.threshold||0,className:"highcharts-negative"},a||(d.color=h.negativeColor,d.fillColor=h.negativeFillColor),
e.push(d));e.length&&l(e[e.length-1].value)&&e.push(a?{}:{color:this.color,fillColor:this.fillColor});C(this,"afterSetOptions",{options:h});return h};a.prototype.getName=function(){return L(this.options.name,"Series "+(this.index+1))};a.prototype.getCyclic=function(b,a,c){var d=this.chart,e=this.userOptions,h=b+"Index",g=b+"Counter",f=c?c.length:L(d.options.chart[b+"Count"],d[b+"Count"]);if(!a){var k=L(e[h],e["_"+h]);l(k)||(d.series.length||(d[g]=0),e["_"+h]=k=d[g]%f,d[g]+=1);c&&(a=c[k])}"undefined"!==
typeof k&&(this[h]=k);this[b]=a};a.prototype.getColor=function(){this.chart.styledMode?this.getCyclic("color"):this.options.colorByPoint?this.color="#cccccc":this.getCyclic("color",this.options.color||c.plotOptions[this.type].color,this.chart.options.colors)};a.prototype.getPointsCollection=function(){return(this.hasGroupedData?this.points:this.data)||[]};a.prototype.getSymbol=function(){this.getCyclic("symbol",this.options.marker.symbol,this.chart.options.symbols)};a.prototype.findPointIndex=function(b,
a){var c=b.id,d=b.x,e=this.points,h=this.options.dataSorting,g,f;if(c)h=this.chart.get(c),h instanceof E&&(g=h);else if(this.linkedParent||this.enabledDataSorting||this.options.relativeXValue)if(g=function(a){return!a.touched&&a.index===b.index},h&&h.matchByName?g=function(a){return!a.touched&&a.name===b.name}:this.options.relativeXValue&&(g=function(a){return!a.touched&&a.options.x===b.x}),g=r(e,g),!g)return;if(g){var l=g&&g.index;"undefined"!==typeof l&&(f=!0)}"undefined"===typeof l&&N(d)&&(l=this.xData.indexOf(d,
a));-1!==l&&"undefined"!==typeof l&&this.cropped&&(l=l>=this.cropStart?l-this.cropStart:l);!f&&N(l)&&e[l]&&e[l].touched&&(l=void 0);return l};a.prototype.updateData=function(b,a){var c=this.options,d=c.dataSorting,e=this.points,h=[],g=this.requireSorting,f=b.length===e.length,k,m,p,n=!0;this.xIncrement=null;b.forEach(function(b,a){var m=l(b)&&this.pointClass.prototype.optionsToObject.call({series:this},b)||{},n=m.x;if(m.id||N(n)){if(m=this.findPointIndex(m,p),-1===m||"undefined"===typeof m?h.push(b):
e[m]&&b!==c.data[m]?(e[m].update(b,!1,null,!1),e[m].touched=!0,g&&(p=m+1)):e[m]&&(e[m].touched=!0),!f||a!==m||d&&d.enabled||this.hasDerivedData)k=!0}else h.push(b)},this);if(k)for(b=e.length;b--;)(m=e[b])&&!m.touched&&m.remove&&m.remove(!1,a);else!f||d&&d.enabled?n=!1:(b.forEach(function(b,a){b!==e[a].y&&e[a].update&&e[a].update(b,!1,null,!1)}),h.length=0);e.forEach(function(b){b&&(b.touched=!1)});if(!n)return!1;h.forEach(function(b){this.addPoint(b,!1,null,null,!1)},this);null===this.xIncrement&&
this.xData&&this.xData.length&&(this.xIncrement=x(this.xData),this.autoIncrement());return!0};a.prototype.setData=function(b,a,c,d){var e=this,h=e.points,g=h&&h.length||0,f=e.options,l=e.chart,k=f.dataSorting,m=e.xAxis,p=f.turboThreshold,n=this.xData,q=this.yData,r=e.pointArrayMap;r=r&&r.length;var G=f.keys,t,y=0,z=1,x=null;if(!l.options.chart.allowMutatingData){f.data&&delete e.options.data;e.userOptions.data&&delete e.userOptions.data;var v=X(!0,b)}b=v||b||[];v=b.length;a=L(a,!0);k&&k.enabled&&
(b=this.sortData(b));l.options.chart.allowMutatingData&&!1!==d&&v&&g&&!e.cropped&&!e.hasGroupedData&&e.visible&&!e.isSeriesBoosting&&(t=this.updateData(b,c));if(!t){e.xIncrement=null;e.colorCounter=0;this.parallelArrays.forEach(function(b){e[b+"Data"].length=0});if(p&&v>p)if(x=e.getFirstValidPoint(b),N(x))for(c=0;c<v;c++)n[c]=this.autoIncrement(),q[c]=b[c];else if(S(x))if(r)if(x.length===r)for(c=0;c<v;c++)n[c]=this.autoIncrement(),q[c]=b[c];else for(c=0;c<v;c++)d=b[c],n[c]=d[0],q[c]=d.slice(1,r+1);
else if(G&&(y=G.indexOf("x"),z=G.indexOf("y"),y=0<=y?y:0,z=0<=z?z:1),1===x.length&&(z=0),y===z)for(c=0;c<v;c++)n[c]=this.autoIncrement(),q[c]=b[c][z];else for(c=0;c<v;c++)d=b[c],n[c]=d[y],q[c]=d[z];else D(12,!1,l);else for(c=0;c<v;c++)"undefined"!==typeof b[c]&&(d={series:e},e.pointClass.prototype.applyOptions.apply(d,[b[c]]),e.updateParallelArrays(d,c));q&&Y(q[0])&&D(14,!0,l);e.data=[];e.options.data=e.userOptions.data=b;for(c=g;c--;)h[c]&&h[c].destroy&&h[c].destroy();m&&(m.minRange=m.userMinRange);
e.isDirty=l.isDirtyBox=!0;e.isDirtyData=!!h;c=!1}"point"===f.legendType&&(this.processData(),this.generatePoints());a&&l.redraw(c)};a.prototype.sortData=function(b){var a=this,c=a.options.dataSorting.sortKey||"y",d=function(b,a){return l(a)&&b.pointClass.prototype.optionsToObject.call({series:b},a)||{}};b.forEach(function(c,e){b[e]=d(a,c);b[e].index=e},this);b.concat().sort(function(b,a){b=P(c,b);a=P(c,a);return a<b?-1:a>b?1:0}).forEach(function(b,a){b.x=a},this);a.linkedSeries&&a.linkedSeries.forEach(function(a){var c=
a.options,e=c.data;c.dataSorting&&c.dataSorting.enabled||!e||(e.forEach(function(c,h){e[h]=d(a,c);b[h]&&(e[h].x=b[h].x,e[h].index=h)}),a.setData(e,!1))});return b};a.prototype.getProcessedData=function(b){var a=this.xAxis,c=this.options,d=c.cropThreshold,e=b||this.getExtremesFromAll||c.getExtremesFromAll,h=this.isCartesian;b=a&&a.val2lin;c=!(!a||!a.logarithmic);var g=0,f=this.xData,l=this.yData,k=this.requireSorting;var m=!1;var p=f.length;if(a){m=a.getExtremes();var n=m.min;var q=m.max;m=!(!a.categories||
a.names.length)}if(h&&this.sorted&&!e&&(!d||p>d||this.forceCrop))if(f[p-1]<n||f[0]>q)f=[],l=[];else if(this.yData&&(f[0]<n||f[p-1]>q)){var r=this.cropData(this.xData,this.yData,n,q);f=r.xData;l=r.yData;g=r.start;r=!0}for(d=f.length||1;--d;)if(a=c?b(f[d])-b(f[d-1]):f[d]-f[d-1],0<a&&("undefined"===typeof G||a<G))var G=a;else 0>a&&k&&!m&&(D(15,!1,this.chart),k=!1);return{xData:f,yData:l,cropped:r,cropStart:g,closestPointRange:G}};a.prototype.processData=function(b){var a=this.xAxis;if(this.isCartesian&&
!this.isDirty&&!a.isDirty&&!this.yAxis.isDirty&&!b)return!1;b=this.getProcessedData();this.cropped=b.cropped;this.cropStart=b.cropStart;this.processedXData=b.xData;this.processedYData=b.yData;this.closestPointRange=this.basePointRange=b.closestPointRange;C(this,"afterProcessData")};a.prototype.cropData=function(b,a,c,d,e){var h=b.length,g,f=0,l=h;e=L(e,this.cropShoulder);for(g=0;g<h;g++)if(b[g]>=c){f=Math.max(0,g-e);break}for(c=g;c<h;c++)if(b[c]>d){l=c+e;break}return{xData:b.slice(f,l),yData:a.slice(f,
l),start:f,end:l}};a.prototype.generatePoints=function(){var b=this.options,a=this.processedData||b.data,c=this.processedXData,d=this.processedYData,e=this.pointClass,h=c.length,g=this.cropStart||0,f=this.hasGroupedData,l=b.keys,k=[];b=b.dataGrouping&&b.dataGrouping.groupAll?g:0;var m,p,n=this.data;if(!n&&!f){var q=[];q.length=a.length;n=this.data=q}l&&f&&(this.options.keys=!1);for(p=0;p<h;p++){q=g+p;if(f){var r=(new e).init(this,[c[p]].concat(da(d[p])));r.dataGroup=this.groupMap[b+p];r.dataGroup.options&&
(r.options=r.dataGroup.options,v(r,r.dataGroup.options),delete r.dataLabels)}else(r=n[q])||"undefined"===typeof a[q]||(n[q]=r=(new e).init(this,a[q],c[p]));r&&(r.index=f?b+p:q,k[p]=r)}this.options.keys=l;if(n&&(h!==(m=n.length)||f))for(p=0;p<m;p++)p!==g||f||(p+=h),n[p]&&(n[p].destroyElements(),n[p].plotX=void 0);this.data=n;this.points=k;C(this,"afterGeneratePoints")};a.prototype.getXExtremes=function(b){return{min:z(b),max:x(b)}};a.prototype.getExtremes=function(b,a){var c=this.xAxis,d=this.yAxis,
e=this.processedXData||this.xData,h=[],g=this.requireSorting?this.cropShoulder:0;d=d?d.positiveValuesOnly:!1;var f,l=0,k=0,m=0;b=b||this.stackedYData||this.processedYData||[];var p=b.length;if(c){var n=c.getExtremes();l=n.min;k=n.max}for(f=0;f<p;f++){var q=e[f];n=b[f];var r=(N(n)||S(n))&&(n.length||0<n||!d);q=a||this.getExtremesFromAll||this.options.getExtremesFromAll||this.cropped||!c||(e[f+g]||q)>=l&&(e[f-g]||q)<=k;if(r&&q)if(r=n.length)for(;r--;)N(n[r])&&(h[m++]=n[r]);else h[m++]=n}b={activeYData:h,
dataMin:z(h),dataMax:x(h)};C(this,"afterGetExtremes",{dataExtremes:b});return b};a.prototype.applyExtremes=function(){var b=this.getExtremes();this.dataMin=b.dataMin;this.dataMax=b.dataMax;return b};a.prototype.getFirstValidPoint=function(b){for(var a=b.length,c=0,d=null;null===d&&c<a;)d=b[c],c++;return d};a.prototype.translate=function(){this.processedXData||this.processData();this.generatePoints();var a=this.options,c=a.stacking,d=this.xAxis,e=d.categories,h=this.enabledDataSorting,g=this.yAxis,
f=this.points,k=f.length,p=this.pointPlacementToXValue(),n=!!p,q=a.threshold,r=a.startFromThreshold?q:0,t=this.zoneAxis||"y",y,z,x=Number.MAX_VALUE;for(y=0;y<k;y++){var v=f[y],F=v.x,u=void 0,D=void 0,w=v.y,A=v.low,B=c&&g.stacking&&g.stacking.stacks[(this.negStacks&&w<(r?0:q)?"-":"")+this.stackKey];if(g.positiveValuesOnly&&!g.validatePositiveValue(w)||d.positiveValuesOnly&&!d.validatePositiveValue(F))v.isNull=!0;v.plotX=z=b(m(d.translate(F,0,0,0,1,p,"flags"===this.type),-1E5,1E5));if(c&&this.visible&&
B&&B[F]){var H=this.getStackIndicator(H,F,this.index);v.isNull||(u=B[F],D=u.points[H.key])}S(D)&&(A=D[0],w=D[1],A===r&&H.key===B[F].base&&(A=L(N(q)&&q,g.min)),g.positiveValuesOnly&&0>=A&&(A=null),v.total=v.stackTotal=u.total,v.percentage=u.total&&v.y/u.total*100,v.stackY=w,this.irregularWidths||u.setOffset(this.pointXOffset||0,this.barW||0));v.yBottom=l(A)?m(g.translate(A,0,1,0,1),-1E5,1E5):null;this.dataModify&&(w=this.dataModify.modifyValue(w,y));v.plotY=void 0;N(w)&&(u=g.translate(w,!1,!0,!1,!0),
"undefined"!==typeof u&&(v.plotY=m(u,-1E5,1E5)));v.isInside=this.isPointInside(v);v.clientX=n?b(d.translate(F,0,0,0,1,p)):z;v.negative=v[t]<(a[t+"Threshold"]||q||0);v.category=L(e&&e[v.x],v.x);if(!v.isNull&&!1!==v.visible){"undefined"!==typeof I&&(x=Math.min(x,Math.abs(z-I)));var I=z}v.zone=this.zones.length?v.getZone():void 0;!v.graphic&&this.group&&h&&(v.isNew=!0)}this.closestPointRangePx=x;C(this,"afterTranslate")};a.prototype.getValidPoints=function(b,a,c){var d=this.chart;return(b||this.points||
[]).filter(function(b){return a&&!d.isInsidePlot(b.plotX,b.plotY,{inverted:d.inverted})?!1:!1!==b.visible&&(c||!b.isNull)})};a.prototype.getClipBox=function(){var b=this.chart,a=this.xAxis,c=this.yAxis,d=X(b.clipBox);a&&a.len!==b.plotSizeX&&(d.width=a.len);c&&c.len!==b.plotSizeY&&(d.height=c.len);return d};a.prototype.getSharedClipKey=function(){return this.sharedClipKey=(this.options.xAxis||0)+","+(this.options.yAxis||0)};a.prototype.setClip=function(){var b=this.chart,a=this.group,c=this.markerGroup,
d=b.sharedClips;b=b.renderer;var e=this.getClipBox(),h=this.getSharedClipKey(),g=d[h];g?g.animate(e):d[h]=g=b.clipRect(e);a&&a.clip(!1===this.options.clip?void 0:g);c&&c.clip()};a.prototype.animate=function(b){var a=this.chart,c=this.group,d=this.markerGroup,e=a.inverted,h=k(this.options.animation),g=[this.getSharedClipKey(),h.duration,h.easing,h.defer].join(),f=a.sharedClips[g],l=a.sharedClips[g+"m"];if(b&&c)h=this.getClipBox(),f?f.attr("height",h.height):(h.width=0,e&&(h.x=a.plotHeight),f=a.renderer.clipRect(h),
a.sharedClips[g]=f,l=a.renderer.clipRect({x:e?(a.plotSizeX||0)+99:-99,y:e?-a.plotLeft:-a.plotTop,width:99,height:e?a.chartWidth:a.chartHeight}),a.sharedClips[g+"m"]=l),c.clip(f),d&&d.clip(l);else if(f&&!f.hasClass("highcharts-animating")){a=this.getClipBox();var m=h.step;d&&d.element.childNodes.length&&(h.step=function(b,a){m&&m.apply(a,arguments);l&&l.element&&l.attr(a.prop,"width"===a.prop?b+99:b)});f.addClass("highcharts-animating").animate(a,h)}};a.prototype.afterAnimate=function(){var b=this;
this.setClip();J(this.chart.sharedClips,function(a,c,d){a&&!b.chart.container.querySelector('[clip-path="url(#'+a.id+')"]')&&(a.destroy(),delete d[c])});this.finishedAnimating=!0;C(this,"afterAnimate")};a.prototype.drawPoints=function(){var b=this.points,a=this.chart,c=this.options.marker,d=this[this.specialGroup]||this.markerGroup,e=this.xAxis,h=L(c.enabled,!e||e.isRadial?!0:null,this.closestPointRangePx>=c.enabledThreshold*c.radius),g,f;if(!1!==c.enabled||this._hasPointMarkers)for(g=0;g<b.length;g++){var l=
b[g];var k=(f=l.graphic)?"animate":"attr";var m=l.marker||{};var p=!!l.marker;if((h&&"undefined"===typeof m.enabled||m.enabled)&&!l.isNull&&!1!==l.visible){var n=L(m.symbol,this.symbol,"rect");var q=this.markerAttribs(l,l.selected&&"select");this.enabledDataSorting&&(l.startXPos=e.reversed?-(q.width||0):e.width);var r=!1!==l.isInside;f?f[r?"show":"hide"](r).animate(q):r&&(0<(q.width||0)||l.hasImage)&&(l.graphic=f=a.renderer.symbol(n,q.x,q.y,q.width,q.height,p?m:c).add(d),this.enabledDataSorting&&
a.hasRendered&&(f.attr({x:l.startXPos}),k="animate"));f&&"animate"===k&&f[r?"show":"hide"](r).animate(q);if(f&&!a.styledMode)f[k](this.pointAttribs(l,l.selected&&"select"));f&&f.addClass(l.getClassName(),!0)}else f&&(l.graphic=f.destroy())}};a.prototype.markerAttribs=function(b,a){var c=this.options,d=c.marker,e=b.marker||{},h=e.symbol||d.symbol,g=L(e.radius,d&&d.radius);a&&(d=d.states[a],a=e.states&&e.states[a],g=L(a&&a.radius,d&&d.radius,g&&g+(d&&d.radiusPlus||0)));b.hasImage=h&&0===h.indexOf("url");
b.hasImage&&(g=0);b=N(g)?{x:c.crisp?Math.floor(b.plotX-g):b.plotX-g,y:b.plotY-g}:{};g&&(b.width=b.height=2*g);return b};a.prototype.pointAttribs=function(b,a){var c=this.options.marker,d=b&&b.options,e=d&&d.marker||{},h=d&&d.color,g=b&&b.color,f=b&&b.zone&&b.zone.color,l=this.color;b=L(e.lineWidth,c.lineWidth);d=1;l=h||f||g||l;h=e.fillColor||c.fillColor||l;g=e.lineColor||c.lineColor||l;a=a||"normal";c=c.states[a]||{};a=e.states&&e.states[a]||{};b=L(a.lineWidth,c.lineWidth,b+L(a.lineWidthPlus,c.lineWidthPlus,
0));h=a.fillColor||c.fillColor||h;g=a.lineColor||c.lineColor||g;d=L(a.opacity,c.opacity,d);return{stroke:g,"stroke-width":b,fill:h,opacity:d}};a.prototype.destroy=function(b){var a=this,c=a.chart,e=/AppleWebKit\/533/.test(q.navigator.userAgent),h=a.data||[],g,f,l,k;C(a,"destroy",{keepEventsForUpdate:b});this.removeEvents(b);(a.axisTypes||[]).forEach(function(b){(k=a[b])&&k.series&&(d(k.series,a),k.isDirty=k.forceRedraw=!0)});a.legendItem&&a.chart.legend.destroyItem(a);for(f=h.length;f--;)(l=h[f])&&
l.destroy&&l.destroy();a.clips&&a.clips.forEach(function(b){return b.destroy()});n.clearTimeout(a.animationTimeout);J(a,function(b,a){b instanceof u&&!b.survive&&(g=e&&"group"===a?"hide":"destroy",b[g]())});c.hoverSeries===a&&(c.hoverSeries=void 0);d(c.series,a);c.orderSeries();J(a,function(c,d){b&&"hcEvents"===d||delete a[d]})};a.prototype.applyZones=function(){var b=this,a=this.chart,c=a.renderer,d=this.zones,e=this.clips||[],h=this.graph,g=this.area,f=Math.max(a.chartWidth,a.chartHeight),l=this[(this.zoneAxis||
"y")+"Axis"],k=a.inverted,p,n,q,r,t,y,v,z,x=!1;if(d.length&&(h||g)&&l&&"undefined"!==typeof l.min){var F=l.reversed;var u=l.horiz;h&&!this.showLine&&h.hide();g&&g.hide();var D=l.getExtremes();d.forEach(function(d,G){p=F?u?a.plotWidth:0:u?0:l.toPixels(D.min)||0;p=m(L(n,p),0,f);n=m(Math.round(l.toPixels(L(d.value,D.max),!0)||0),0,f);x&&(p=n=l.toPixels(D.max));r=Math.abs(p-n);t=Math.min(p,n);y=Math.max(p,n);l.isXAxis?(q={x:k?y:t,y:0,width:r,height:f},u||(q.x=a.plotHeight-q.x)):(q={x:0,y:k?y:t,width:f,
height:r},u&&(q.y=a.plotWidth-q.y));k&&c.isVML&&(q=l.isXAxis?{x:0,y:F?t:y,height:q.width,width:a.chartWidth}:{x:q.y-a.plotLeft-a.spacingBox.x,y:0,width:q.height,height:a.chartHeight});e[G]?e[G].animate(q):e[G]=c.clipRect(q);v=b["zone-area-"+G];z=b["zone-graph-"+G];h&&z&&z.clip(e[G]);g&&v&&v.clip(e[G]);x=d.value>D.max;b.resetZones&&0===n&&(n=void 0)});this.clips=e}else b.visible&&(h&&h.show(),g&&g.show())};a.prototype.invertGroups=function(b){function a(){["group","markerGroup"].forEach(function(a){c[a]&&
(d.renderer.isVML&&c[a].attr({width:c.yAxis.len,height:c.xAxis.len}),c[a].width=c.yAxis.len,c[a].height=c.xAxis.len,c[a].invert(c.isRadialSeries?!1:b))})}var c=this,d=c.chart;c.xAxis&&(c.eventsToUnbind.push(y(d,"resize",a)),a(),c.invertGroups=a)};a.prototype.plotGroup=function(b,a,c,d,e){var h=this[b],g=!h;c={visibility:c,zIndex:d||.1};"undefined"===typeof this.opacity||this.chart.styledMode||"inactive"===this.state||(c.opacity=this.opacity);g&&(this[b]=h=this.chart.renderer.g().add(e));h.addClass("highcharts-"+
a+" highcharts-series-"+this.index+" highcharts-"+this.type+"-series "+(l(this.colorIndex)?"highcharts-color-"+this.colorIndex+" ":"")+(this.options.className||"")+(h.hasClass("highcharts-tracker")?" highcharts-tracker":""),!0);h.attr(c)[g?"attr":"animate"](this.getPlotBox());return h};a.prototype.getPlotBox=function(){var b=this.chart,a=this.xAxis,c=this.yAxis;b.inverted&&(a=c,c=this.xAxis);return{translateX:a?a.left:b.plotLeft,translateY:c?c.top:b.plotTop,scaleX:1,scaleY:1}};a.prototype.removeEvents=
function(b){b||K(this);this.eventsToUnbind.length&&(this.eventsToUnbind.forEach(function(b){b()}),this.eventsToUnbind.length=0)};a.prototype.render=function(){var b=this,a=b.chart,c=b.options,d=k(c.animation),e=b.visible?"inherit":"hidden",h=c.zIndex,g=b.hasRendered,f=a.seriesGroup,l=a.inverted;a=!b.finishedAnimating&&a.renderer.isSVG?d.duration:0;C(this,"render");var m=b.plotGroup("group","series",e,h,f);b.markerGroup=b.plotGroup("markerGroup","markers",e,h,f);!1!==c.clip&&b.setClip();b.animate&&
a&&b.animate(!0);m.inverted=L(b.invertible,b.isCartesian)?l:!1;b.drawGraph&&(b.drawGraph(),b.applyZones());b.visible&&b.drawPoints();b.drawDataLabels&&b.drawDataLabels();b.redrawPoints&&b.redrawPoints();b.drawTracker&&!1!==b.options.enableMouseTracking&&b.drawTracker();b.invertGroups(l);b.animate&&a&&b.animate();g||(a&&d.defer&&(a+=d.defer),b.animationTimeout=Q(function(){b.afterAnimate()},a||0));b.isDirty=!1;b.hasRendered=!0;C(b,"afterRender")};a.prototype.redraw=function(){var b=this.chart,a=this.isDirty||
this.isDirtyData,c=this.group,d=this.xAxis,e=this.yAxis;c&&(b.inverted&&c.attr({width:b.plotWidth,height:b.plotHeight}),c.animate({translateX:L(d&&d.left,b.plotLeft),translateY:L(e&&e.top,b.plotTop)}));this.translate();this.render();a&&delete this.kdTree};a.prototype.searchPoint=function(b,a){var c=this.xAxis,d=this.yAxis,e=this.chart.inverted;return this.searchKDTree({clientX:e?c.len-b.chartY+c.pos:b.chartX-c.pos,plotY:e?d.len-b.chartX+d.pos:b.chartY-d.pos},a,b)};a.prototype.buildKDTree=function(b){function a(b,
d,e){var h=b&&b.length;if(h){var g=c.kdAxisArray[d%e];b.sort(function(b,a){return b[g]-a[g]});h=Math.floor(h/2);return{point:b[h],left:a(b.slice(0,h),d+1,e),right:a(b.slice(h+1),d+1,e)}}}this.buildingKdTree=!0;var c=this,d=-1<c.options.findNearestPointBy.indexOf("y")?2:1;delete c.kdTree;Q(function(){c.kdTree=a(c.getValidPoints(null,!c.directTouch),d,d);c.buildingKdTree=!1},c.options.kdNow||b&&"touchstart"===b.type?0:1)};a.prototype.searchKDTree=function(b,a,c){function d(b,a,c,k){var m=a.point,p=
e.kdAxisArray[c%k],n=m,q=l(b[h])&&l(m[h])?Math.pow(b[h]-m[h],2):null;var r=l(b[g])&&l(m[g])?Math.pow(b[g]-m[g],2):null;r=(q||0)+(r||0);m.dist=l(r)?Math.sqrt(r):Number.MAX_VALUE;m.distX=l(q)?Math.sqrt(q):Number.MAX_VALUE;p=b[p]-m[p];r=0>p?"left":"right";q=0>p?"right":"left";a[r]&&(r=d(b,a[r],c+1,k),n=r[f]<n[f]?r:m);a[q]&&Math.sqrt(p*p)<n[f]&&(b=d(b,a[q],c+1,k),n=b[f]<n[f]?b:n);return n}var e=this,h=this.kdAxisArray[0],g=this.kdAxisArray[1],f=a?"distX":"dist";a=-1<e.options.findNearestPointBy.indexOf("y")?
2:1;this.kdTree||this.buildingKdTree||this.buildKDTree(c);if(this.kdTree)return d(b,this.kdTree,a,a)};a.prototype.pointPlacementToXValue=function(){var b=this.options,a=b.pointRange,c=this.xAxis;b=b.pointPlacement;"between"===b&&(b=c.reversed?-.5:.5);return N(b)?b*(a||c.pointRange):0};a.prototype.isPointInside=function(b){var a=this.chart,c=this.xAxis,d=this.yAxis;return"undefined"!==typeof b.plotY&&"undefined"!==typeof b.plotX&&0<=b.plotY&&b.plotY<=(d?d.len:a.plotHeight)&&0<=b.plotX&&b.plotX<=(c?
c.len:a.plotWidth)};a.prototype.drawTracker=function(){var b=this,a=b.options,c=a.trackByArea,d=[].concat(c?b.areaPath:b.graphPath),e=b.chart,h=e.pointer,f=e.renderer,l=e.options.tooltip.snap,k=b.tracker,m=function(a){if(e.hoverSeries!==b)b.onMouseOver()},p="rgba(192,192,192,"+(t?.0001:.002)+")";k?k.attr({d:d}):b.graph&&(b.tracker=f.path(d).attr({visibility:b.visible?"inherit":"hidden",zIndex:2}).addClass(c?"highcharts-tracker-area":"highcharts-tracker-line").add(b.group),e.styledMode||b.tracker.attr({"stroke-linecap":"round",
"stroke-linejoin":"round",stroke:p,fill:c?p:"none","stroke-width":b.graph.strokeWidth()+(c?0:2*l)}),[b.tracker,b.markerGroup,b.dataLabelsGroup].forEach(function(b){if(b&&(b.addClass("highcharts-tracker").on("mouseover",m).on("mouseout",function(b){h.onTrackerMouseOut(b)}),a.cursor&&!e.styledMode&&b.css({cursor:a.cursor}),g))b.on("touchstart",m)}));C(this,"afterDrawTracker")};a.prototype.addPoint=function(b,a,c,d,e){var h=this.options,g=this.data,f=this.chart,l=this.xAxis;l=l&&l.hasNames&&l.names;
var k=h.data,m=this.xData,p;a=L(a,!0);var n={series:this};this.pointClass.prototype.applyOptions.apply(n,[b]);var q=n.x;var r=m.length;if(this.requireSorting&&q<m[r-1])for(p=!0;r&&m[r-1]>q;)r--;this.updateParallelArrays(n,"splice",r,0,0);this.updateParallelArrays(n,r);l&&n.name&&(l[q]=n.name);k.splice(r,0,b);if(p||this.processedData)this.data.splice(r,0,null),this.processData();"point"===h.legendType&&this.generatePoints();c&&(g[0]&&g[0].remove?g[0].remove(!1):(g.shift(),this.updateParallelArrays(n,
"shift"),k.shift()));!1!==e&&C(this,"addPoint",{point:n});this.isDirtyData=this.isDirty=!0;a&&f.redraw(d)};a.prototype.removePoint=function(b,a,c){var d=this,h=d.data,g=h[b],f=d.points,l=d.chart,k=function(){f&&f.length===h.length&&f.splice(b,1);h.splice(b,1);d.options.data.splice(b,1);d.updateParallelArrays(g||{series:d},"splice",b,1);g&&g.destroy();d.isDirty=!0;d.isDirtyData=!0;a&&l.redraw()};e(c,l);a=L(a,!0);g?g.firePointEvent("remove",null,k):k()};a.prototype.remove=function(b,a,c,d){function e(){h.destroy(d);
g.isDirtyLegend=g.isDirtyBox=!0;g.linkSeries();L(b,!0)&&g.redraw(a)}var h=this,g=h.chart;!1!==c?C(h,"remove",null,e):e()};a.prototype.update=function(b,a){b=h(b,this.userOptions);C(this,"update",{options:b});var c=this,d=c.chart,e=c.userOptions,g=c.initialType||c.type,f=d.options.plotOptions,l=F[g].prototype,k=c.finishedAnimating&&{animation:!1},m={},p,n=["eventOptions","navigatorSeries","baseSeries"],q=b.type||e.type||d.options.chart.type,r=!(this.hasDerivedData||q&&q!==this.type||"undefined"!==
typeof b.pointStart||"undefined"!==typeof b.pointInterval||"undefined"!==typeof b.relativeXValue||b.joinBy||b.mapData||c.hasOptionChanged("dataGrouping")||c.hasOptionChanged("pointStart")||c.hasOptionChanged("pointInterval")||c.hasOptionChanged("pointIntervalUnit")||c.hasOptionChanged("keys"));q=q||g;r&&(n.push("data","isDirtyData","points","processedData","processedXData","processedYData","xIncrement","cropped","_hasPointMarkers","_hasPointLabels","clips","nodes","layout","level","mapMap","mapData",
"minY","maxY","minX","maxX"),!1!==b.visible&&n.push("area","graph"),c.parallelArrays.forEach(function(b){n.push(b+"Data")}),b.data&&(b.dataSorting&&v(c.options.dataSorting,b.dataSorting),this.setData(b.data,!1)));b=X(e,k,{index:"undefined"===typeof e.index?c.index:e.index,pointStart:L(f&&f.series&&f.series.pointStart,e.pointStart,c.xData[0])},!r&&{data:c.options.data},b);r&&b.data&&(b.data=c.options.data);n=["group","markerGroup","dataLabelsGroup","transformGroup"].concat(n);n.forEach(function(b){n[b]=
c[b];delete c[b]});f=!1;if(F[q]){if(f=q!==c.type,c.remove(!1,!1,!1,!0),f)if(Object.setPrototypeOf)Object.setPrototypeOf(c,F[q].prototype);else{k=Object.hasOwnProperty.call(c,"hcEvents")&&c.hcEvents;for(p in l)c[p]=void 0;v(c,F[q].prototype);k?c.hcEvents=k:delete c.hcEvents}}else D(17,!0,d,{missingModuleFor:q});n.forEach(function(b){c[b]=n[b]});c.init(d,b);if(r&&this.points){var t=c.options;!1===t.visible?(m.graphic=1,m.dataLabel=1):c._hasPointLabels||(b=t.marker,l=t.dataLabels,!b||!1!==b.enabled&&
(e.marker&&e.marker.symbol)===b.symbol||(m.graphic=1),l&&!1===l.enabled&&(m.dataLabel=1));this.points.forEach(function(b){b&&b.series&&(b.resolveColor(),Object.keys(m).length&&b.destroyElements(m),!1===t.showInLegend&&b.legendItem&&d.legend.destroyItem(b))},this)}c.initialType=g;d.linkSeries();f&&c.linkedSeries.length&&(c.isDirtyData=!0);C(this,"afterUpdate");L(a,!0)&&d.redraw(r?void 0:!1)};a.prototype.setName=function(b){this.name=this.options.name=this.userOptions.name=b;this.chart.isDirtyLegend=
!0};a.prototype.hasOptionChanged=function(b){var a=this.options[b],c=this.chart.options.plotOptions,d=this.userOptions[b];return d?a!==d:a!==L(c&&c[this.type]&&c[this.type][b],c&&c.series&&c.series[b],a)};a.prototype.onMouseOver=function(){var b=this.chart,a=b.hoverSeries;b.pointer.setHoverChartIndex();if(a&&a!==this)a.onMouseOut();this.options.events.mouseOver&&C(this,"mouseOver");this.setState("hover");b.hoverSeries=this};a.prototype.onMouseOut=function(){var b=this.options,a=this.chart,c=a.tooltip,
d=a.hoverPoint;a.hoverSeries=null;if(d)d.onMouseOut();this&&b.events.mouseOut&&C(this,"mouseOut");!c||this.stickyTracking||c.shared&&!this.noSharedTooltip||c.hide();a.series.forEach(function(b){b.setState("",!0)})};a.prototype.setState=function(b,a){var c=this,d=c.options,e=c.graph,h=d.inactiveOtherPoints,g=d.states,f=L(g[b||"normal"]&&g[b||"normal"].animation,c.chart.options.chart.animation),l=d.lineWidth,k=0,m=d.opacity;b=b||"";if(c.state!==b&&([c.group,c.markerGroup,c.dataLabelsGroup].forEach(function(a){a&&
(c.state&&a.removeClass("highcharts-series-"+c.state),b&&a.addClass("highcharts-series-"+b))}),c.state=b,!c.chart.styledMode)){if(g[b]&&!1===g[b].enabled)return;b&&(l=g[b].lineWidth||l+(g[b].lineWidthPlus||0),m=L(g[b].opacity,m));if(e&&!e.dashstyle)for(d={"stroke-width":l},e.animate(d,f);c["zone-graph-"+k];)c["zone-graph-"+k].animate(d,f),k+=1;h||[c.group,c.markerGroup,c.dataLabelsGroup,c.labelBySeries].forEach(function(b){b&&b.animate({opacity:m},f)})}a&&h&&c.points&&c.setAllPointsToState(b||void 0)};
a.prototype.setAllPointsToState=function(b){this.points.forEach(function(a){a.setState&&a.setState(b)})};a.prototype.setVisible=function(b,a){var c=this,d=c.chart,e=c.legendItem,h=d.options.chart.ignoreHiddenSeries,g=c.visible,f=(c.visible=b=c.options.visible=c.userOptions.visible="undefined"===typeof b?!g:b)?"show":"hide";["group","dataLabelsGroup","markerGroup","tracker","tt"].forEach(function(b){if(c[b])c[b][f]()});if(d.hoverSeries===c||(d.hoverPoint&&d.hoverPoint.series)===c)c.onMouseOut();e&&
d.legend.colorizeItem(c,b);c.isDirty=!0;c.options.stacking&&d.series.forEach(function(b){b.options.stacking&&b.visible&&(b.isDirty=!0)});c.linkedSeries.forEach(function(a){a.setVisible(b,!1)});h&&(d.isDirtyBox=!0);C(c,f);!1!==a&&d.redraw()};a.prototype.show=function(){this.setVisible(!0)};a.prototype.hide=function(){this.setVisible(!1)};a.prototype.select=function(b){this.selected=b=this.options.selected="undefined"===typeof b?!this.selected:b;this.checkbox&&(this.checkbox.checked=b);C(this,b?"select":
"unselect")};a.prototype.shouldShowTooltip=function(b,a,c){void 0===c&&(c={});c.series=this;c.visiblePlotOnly=!0;return this.chart.isInsidePlot(b,a,c)};a.defaultOptions=I;return a}();v(a.prototype,{axisTypes:["xAxis","yAxis"],coll:"series",colorCounter:0,cropShoulder:1,directTouch:!1,drawLegendSymbol:w.drawLineMarker,isCartesian:!0,kdAxisArray:["clientX","plotY"],parallelArrays:["x","y"],pointClass:E,requireSorting:!0,sorted:!0});A.series=a;"";"";return a});K(f,"Extensions/ScrollablePlotArea.js",
[f["Core/Animation/AnimationUtilities.js"],f["Core/Axis/Axis.js"],f["Core/Chart/Chart.js"],f["Core/Series/Series.js"],f["Core/Renderer/RendererRegistry.js"],f["Core/Utilities.js"]],function(a,f,B,H,w,E){var C=a.stop,A=E.addEvent,u=E.createElement,n=E.merge,k=E.pick;A(B,"afterSetChartSize",function(a){var c=this.options.chart.scrollablePlotArea,e=c&&c.minWidth;c=c&&c.minHeight;if(!this.renderer.forExport){if(e){if(this.scrollablePixelsX=e=Math.max(0,e-this.chartWidth)){this.scrollablePlotBox=this.renderer.scrollablePlotBox=
n(this.plotBox);this.plotBox.width=this.plotWidth+=e;this.inverted?this.clipBox.height+=e:this.clipBox.width+=e;var g={1:{name:"right",value:e}}}}else c&&(this.scrollablePixelsY=e=Math.max(0,c-this.chartHeight))&&(this.scrollablePlotBox=this.renderer.scrollablePlotBox=n(this.plotBox),this.plotBox.height=this.plotHeight+=e,this.inverted?this.clipBox.width+=e:this.clipBox.height+=e,g={2:{name:"bottom",value:e}});g&&!a.skipAxes&&this.axes.forEach(function(a){g[a.side]?a.getPlotLinePath=function(){var c=
g[a.side].name,e=this[c];this[c]=e-g[a.side].value;var k=f.prototype.getPlotLinePath.apply(this,arguments);this[c]=e;return k}:(a.setAxisSize(),a.setAxisTranslation())})}});A(B,"render",function(){this.scrollablePixelsX||this.scrollablePixelsY?(this.setUpScrolling&&this.setUpScrolling(),this.applyFixed()):this.fixedDiv&&this.applyFixed()});B.prototype.setUpScrolling=function(){var a=this,c={WebkitOverflowScrolling:"touch",overflowX:"hidden",overflowY:"hidden"};this.scrollablePixelsX&&(c.overflowX=
"auto");this.scrollablePixelsY&&(c.overflowY="auto");this.scrollingParent=u("div",{className:"highcharts-scrolling-parent"},{position:"relative"},this.renderTo);this.scrollingContainer=u("div",{className:"highcharts-scrolling"},c,this.scrollingParent);A(this.scrollingContainer,"scroll",function(){a.pointer&&delete a.pointer.chartPosition});this.innerContainer=u("div",{className:"highcharts-inner-container"},null,this.scrollingContainer);this.innerContainer.appendChild(this.container);this.setUpScrolling=
null};B.prototype.moveFixedElements=function(){var a=this.container,c=this.fixedRenderer,f=".highcharts-contextbutton .highcharts-credits .highcharts-legend .highcharts-legend-checkbox .highcharts-navigator-series .highcharts-navigator-xaxis .highcharts-navigator-yaxis .highcharts-navigator .highcharts-reset-zoom .highcharts-drillup-button .highcharts-scrollbar .highcharts-subtitle .highcharts-title".split(" "),g;this.scrollablePixelsX&&!this.inverted?g=".highcharts-yaxis":this.scrollablePixelsX&&
this.inverted?g=".highcharts-xaxis":this.scrollablePixelsY&&!this.inverted?g=".highcharts-xaxis":this.scrollablePixelsY&&this.inverted&&(g=".highcharts-yaxis");g&&f.push(g+":not(.highcharts-radial-axis)",g+"-labels:not(.highcharts-radial-axis-labels)");f.forEach(function(e){[].forEach.call(a.querySelectorAll(e),function(a){(a.namespaceURI===c.SVG_NS?c.box:c.box.parentNode).appendChild(a);a.style.pointerEvents="auto"})})};B.prototype.applyFixed=function(){var a=!this.fixedDiv,c=this.options.chart,
f=c.scrollablePlotArea,g=w.getRendererType();a?(this.fixedDiv=u("div",{className:"highcharts-fixed"},{position:"absolute",overflow:"hidden",pointerEvents:"none",zIndex:(c.style&&c.style.zIndex||0)+2,top:0},null,!0),this.scrollingContainer&&this.scrollingContainer.parentNode.insertBefore(this.fixedDiv,this.scrollingContainer),this.renderTo.style.overflow="visible",this.fixedRenderer=c=new g(this.fixedDiv,this.chartWidth,this.chartHeight,this.options.chart.style),this.scrollableMask=c.path().attr({fill:this.options.chart.backgroundColor||
"#fff","fill-opacity":k(f.opacity,.85),zIndex:-1}).addClass("highcharts-scrollable-mask").add(),A(this,"afterShowResetZoom",this.moveFixedElements),A(this,"afterApplyDrilldown",this.moveFixedElements),A(this,"afterLayOutTitles",this.moveFixedElements)):this.fixedRenderer.setSize(this.chartWidth,this.chartHeight);if(this.scrollableDirty||a)this.scrollableDirty=!1,this.moveFixedElements();c=this.chartWidth+(this.scrollablePixelsX||0);g=this.chartHeight+(this.scrollablePixelsY||0);C(this.container);
this.container.style.width=c+"px";this.container.style.height=g+"px";this.renderer.boxWrapper.attr({width:c,height:g,viewBox:[0,0,c,g].join(" ")});this.chartBackground.attr({width:c,height:g});this.scrollingContainer.style.height=this.chartHeight+"px";a&&(f.scrollPositionX&&(this.scrollingContainer.scrollLeft=this.scrollablePixelsX*f.scrollPositionX),f.scrollPositionY&&(this.scrollingContainer.scrollTop=this.scrollablePixelsY*f.scrollPositionY));g=this.axisOffset;a=this.plotTop-g[0]-1;f=this.plotLeft-
g[3]-1;c=this.plotTop+this.plotHeight+g[2]+1;g=this.plotLeft+this.plotWidth+g[1]+1;var n=this.plotLeft+this.plotWidth-(this.scrollablePixelsX||0),q=this.plotTop+this.plotHeight-(this.scrollablePixelsY||0);a=this.scrollablePixelsX?[["M",0,a],["L",this.plotLeft-1,a],["L",this.plotLeft-1,c],["L",0,c],["Z"],["M",n,a],["L",this.chartWidth,a],["L",this.chartWidth,c],["L",n,c],["Z"]]:this.scrollablePixelsY?[["M",f,0],["L",f,this.plotTop-1],["L",g,this.plotTop-1],["L",g,0],["Z"],["M",f,q],["L",f,this.chartHeight],
["L",g,this.chartHeight],["L",g,q],["Z"]]:[["M",0,0]];"adjustHeight"!==this.redrawTrigger&&this.scrollableMask.attr({d:a})};A(f,"afterInit",function(){this.chart.scrollableDirty=!0});A(H,"show",function(){this.chart.scrollableDirty=!0});""});K(f,"Core/Axis/StackingAxis.js",[f["Core/Animation/AnimationUtilities.js"],f["Core/Axis/Axis.js"],f["Core/Utilities.js"]],function(a,f,B){var C=a.getDeferredAnimation,w=B.addEvent,E=B.destroyObjectProperties,I=B.fireEvent,A=B.isNumber,u=B.objectEach,n;(function(a){function e(){var a=
this.stacking;if(a){var c=a.stacks;u(c,function(a,e){E(a);c[e]=null});a&&a.stackTotalGroup&&a.stackTotalGroup.destroy()}}function c(){this.stacking||(this.stacking=new g(this))}var f=[];a.compose=function(a){-1===f.indexOf(a)&&(f.push(a),w(a,"init",c),w(a,"destroy",e));return a};var g=function(){function a(a){this.oldStacks={};this.stacks={};this.stacksTouched=0;this.axis=a}a.prototype.buildStacks=function(){var a=this.axis,c=a.series,e=a.options.reversedStacks,g=c.length,f;if(!a.isXAxis){this.usePercentage=
!1;for(f=g;f--;){var k=c[e?f:g-f-1];k.setStackedPoints();k.setGroupedPoints()}for(f=0;f<g;f++)c[f].modifyStacks();I(a,"afterBuildStacks")}};a.prototype.cleanStacks=function(){if(!this.axis.isXAxis){if(this.oldStacks)var a=this.stacks=this.oldStacks;u(a,function(a){u(a,function(a){a.cumulative=a.total})})}};a.prototype.resetStacks=function(){var a=this,c=a.stacks;a.axis.isXAxis||u(c,function(c){u(c,function(e,g){A(e.touched)&&e.touched<a.stacksTouched?(e.destroy(),delete c[g]):(e.total=null,e.cumulative=
null)})})};a.prototype.renderStackTotals=function(){var a=this.axis,c=a.chart,e=c.renderer,g=this.stacks;a=C(c,a.options.stackLabels&&a.options.stackLabels.animation||!1);var f=this.stackTotalGroup=this.stackTotalGroup||e.g("stack-labels").attr({zIndex:6,opacity:0}).add();f.translate(c.plotLeft,c.plotTop);u(g,function(a){u(a,function(a){a.render(f)})});f.animate({opacity:1},a)};return a}();a.Additions=g})(n||(n={}));return n});K(f,"Extensions/Stacking.js",[f["Core/Axis/Axis.js"],f["Core/Chart/Chart.js"],
f["Core/FormatUtilities.js"],f["Core/Globals.js"],f["Core/Series/Series.js"],f["Core/Axis/StackingAxis.js"],f["Core/Utilities.js"]],function(a,f,B,H,w,E,I){var A=B.format,u=I.correctFloat,n=I.defined,k=I.destroyObjectProperties,e=I.isArray,c=I.isNumber,p=I.objectEach,g=I.pick,t=function(){function a(a,c,e,g,f){var h=a.chart.inverted;this.axis=a;this.isNegative=e;this.options=c=c||{};this.x=g;this.total=null;this.points={};this.hasValidPoints=!1;this.stack=f;this.rightCliff=this.leftCliff=0;this.alignOptions=
{align:c.align||(h?e?"left":"right":"center"),verticalAlign:c.verticalAlign||(h?"middle":e?"bottom":"top"),y:c.y,x:c.x};this.textAlign=c.textAlign||(h?e?"right":"left":"center")}a.prototype.destroy=function(){k(this,this.axis)};a.prototype.render=function(a){var c=this.axis.chart,e=this.options,f=e.format;f=f?A(f,this,c):e.formatter.call(this);this.label?this.label.attr({text:f,visibility:"hidden"}):(this.label=c.renderer.label(f,null,null,e.shape,null,null,e.useHTML,!1,"stack-labels"),f={r:e.borderRadius||
0,text:f,rotation:e.rotation,padding:g(e.padding,5),visibility:"hidden"},c.styledMode||(f.fill=e.backgroundColor,f.stroke=e.borderColor,f["stroke-width"]=e.borderWidth,this.label.css(e.style)),this.label.attr(f),this.label.added||this.label.add(a));this.label.labelrank=c.plotSizeY};a.prototype.setOffset=function(a,e,f,k,m){var h=this.axis,b=h.chart;k=h.translate(h.stacking.usePercentage?100:k?k:this.total,0,0,0,1);f=h.translate(f?f:0);f=n(k)&&Math.abs(k-f);a=g(m,b.xAxis[0].translate(this.x))+a;h=
n(k)&&this.getStackBox(b,this,a,k,e,f,h);e=this.label;f=this.isNegative;a="justify"===g(this.options.overflow,"justify");var l=this.textAlign;e&&h&&(m=e.getBBox(),k=e.padding,l="left"===l?b.inverted?-k:k:"right"===l?m.width:b.inverted&&"center"===l?m.width/2:b.inverted?f?m.width+k:-k:m.width/2,f=b.inverted?m.height/2:f?-k:m.height,this.alignOptions.x=g(this.options.x,0),this.alignOptions.y=g(this.options.y,0),h.x-=l,h.y-=f,e.align(this.alignOptions,null,h),b.isInsidePlot(e.alignAttr.x+l-this.alignOptions.x,
e.alignAttr.y+f-this.alignOptions.y)?e.show():(e.hide(),a=!1),a&&w.prototype.justifyDataLabel.call(this.axis,e,this.alignOptions,e.alignAttr,m,h),e.attr({x:e.alignAttr.x,y:e.alignAttr.y}),g(!a&&this.options.crop,!0)&&((b=c(e.x)&&c(e.y)&&b.isInsidePlot(e.x-k+e.width,e.y)&&b.isInsidePlot(e.x+k,e.y))||e.hide()))};a.prototype.getStackBox=function(a,c,e,g,f,h,b){var l=c.axis.reversed,d=a.inverted,k=b.height+b.pos-(d?a.plotLeft:a.plotTop);c=c.isNegative&&!l||!c.isNegative&&l;return{x:d?c?g-b.right:g-h+
b.pos-a.plotLeft:e+a.xAxis[0].transB-a.plotLeft,y:d?b.height-e-f:c?k-g-h:k-g,width:d?h:f,height:d?f:h}};return a}();f.prototype.getStacks=function(){var a=this,c=a.inverted;a.yAxis.forEach(function(a){a.stacking&&a.stacking.stacks&&a.hasVisibleSeries&&(a.stacking.oldStacks=a.stacking.stacks)});a.series.forEach(function(e){var f=e.xAxis&&e.xAxis.options||{};!e.options.stacking||!0!==e.visible&&!1!==a.options.chart.ignoreHiddenSeries||(e.stackKey=[e.type,g(e.options.stack,""),c?f.top:f.left,c?f.height:
f.width].join())})};E.compose(a);w.prototype.setGroupedPoints=function(){var a=this.yAxis.stacking;this.options.centerInCategory&&(this.is("column")||this.is("columnrange"))&&!this.options.stacking&&1<this.chart.series.length?w.prototype.setStackedPoints.call(this,"group"):a&&p(a.stacks,function(c,e){"group"===e.slice(-5)&&(p(c,function(a){return a.destroy()}),delete a.stacks[e])})};w.prototype.setStackedPoints=function(a){var c=a||this.options.stacking;if(c&&(!0===this.visible||!1===this.chart.options.chart.ignoreHiddenSeries)){var f=
this.processedXData,k=this.processedYData,p=[],m=k.length,h=this.options,b=h.threshold,l=g(h.startFromThreshold&&b,0);h=h.stack;a=a?this.type+","+c:this.stackKey;var d="-"+a,q=this.negStacks,v=this.yAxis,r=v.stacking.stacks,w=v.stacking.oldStacks,A,C;v.stacking.stacksTouched+=1;for(C=0;C<m;C++){var B=f[C];var H=k[C];var I=this.getStackIndicator(I,B,this.index);var J=I.key;var E=(A=q&&H<(l?0:b))?d:a;r[E]||(r[E]={});r[E][B]||(w[E]&&w[E][B]?(r[E][B]=w[E][B],r[E][B].total=null):r[E][B]=new t(v,v.options.stackLabels,
A,B,h));E=r[E][B];null!==H?(E.points[J]=E.points[this.index]=[g(E.cumulative,l)],n(E.cumulative)||(E.base=J),E.touched=v.stacking.stacksTouched,0<I.index&&!1===this.singleStacks&&(E.points[J][0]=E.points[this.index+","+B+",0"][0])):E.points[J]=E.points[this.index]=null;"percent"===c?(A=A?a:d,q&&r[A]&&r[A][B]?(A=r[A][B],E.total=A.total=Math.max(A.total,E.total)+Math.abs(H)||0):E.total=u(E.total+(Math.abs(H)||0))):"group"===c?(e(H)&&(H=H[0]),null!==H&&(E.total=(E.total||0)+1)):E.total=u(E.total+(H||
0));E.cumulative="group"===c?(E.total||1)-1:g(E.cumulative,l)+(H||0);null!==H&&(E.points[J].push(E.cumulative),p[C]=E.cumulative,E.hasValidPoints=!0)}"percent"===c&&(v.stacking.usePercentage=!0);"group"!==c&&(this.stackedYData=p);v.stacking.oldStacks={}}};w.prototype.modifyStacks=function(){var a=this,c=a.stackKey,e=a.yAxis.stacking.stacks,g=a.processedXData,f,k=a.options.stacking;a[k+"Stacker"]&&[c,"-"+c].forEach(function(c){for(var b=g.length,h,d;b--;)if(h=g[b],f=a.getStackIndicator(f,h,a.index,
c),d=(h=e[c]&&e[c][h])&&h.points[f.key])a[k+"Stacker"](d,h,b)})};w.prototype.percentStacker=function(a,c,e){c=c.total?100/c.total:0;a[0]=u(a[0]*c);a[1]=u(a[1]*c);this.stackedYData[e]=a[1]};w.prototype.getStackIndicator=function(a,c,e,g){!n(a)||a.x!==c||g&&a.stackKey!==g?a={x:c,index:0,key:g,stackKey:g}:a.index++;a.key=[e,c,a.index].join();return a};H.StackItem=t;"";return H.StackItem});K(f,"Series/Line/LineSeries.js",[f["Core/Series/Series.js"],f["Core/Series/SeriesRegistry.js"],f["Core/Utilities.js"]],
function(a,f,B){var C=this&&this.__extends||function(){var a=function(f,u){a=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,f){a.__proto__=f}||function(a,f){for(var e in f)f.hasOwnProperty(e)&&(a[e]=f[e])};return a(f,u)};return function(f,u){function n(){this.constructor=f}a(f,u);f.prototype=null===u?Object.create(u):(n.prototype=u.prototype,new n)}}(),w=B.defined,E=B.merge;B=function(f){function A(){var a=null!==f&&f.apply(this,arguments)||this;a.data=void 0;a.options=void 0;a.points=
void 0;return a}C(A,f);A.prototype.drawGraph=function(){var a=this,f=this.options,k=(this.gappedPath||this.getGraphPath).call(this),e=this.chart.styledMode,c=[["graph","highcharts-graph"]];e||c[0].push(f.lineColor||this.color||"#cccccc",f.dashStyle);c=a.getZonesGraphs(c);c.forEach(function(c,g){var p=c[0],n=a[p],u=n?"animate":"attr";n?(n.endX=a.preventGraphAnimation?null:k.xMap,n.animate({d:k})):k.length&&(a[p]=n=a.chart.renderer.path(k).addClass(c[1]).attr({zIndex:1}).add(a.group));n&&!e&&(p={stroke:c[2],
"stroke-width":f.lineWidth,fill:a.fillGraph&&a.color||"none"},c[3]?p.dashstyle=c[3]:"square"!==f.linecap&&(p["stroke-linecap"]=p["stroke-linejoin"]="round"),n[u](p).shadow(2>g&&f.shadow));n&&(n.startX=k.xMap,n.isArea=k.isArea)})};A.prototype.getGraphPath=function(a,f,k){var e=this,c=e.options,p=[],g=[],n,q=c.step;a=a||e.points;var u=a.reversed;u&&a.reverse();(q={right:1,center:2}[q]||q&&3)&&u&&(q=4-q);a=this.getValidPoints(a,!1,!(c.connectNulls&&!f&&!k));a.forEach(function(t,x){var z=t.plotX,m=t.plotY,
h=a[x-1];(t.leftCliff||h&&h.rightCliff)&&!k&&(n=!0);t.isNull&&!w(f)&&0<x?n=!c.connectNulls:t.isNull&&!f?n=!0:(0===x||n?x=[["M",t.plotX,t.plotY]]:e.getPointSpline?x=[e.getPointSpline(a,t,x)]:q?(x=1===q?[["L",h.plotX,m]]:2===q?[["L",(h.plotX+z)/2,h.plotY],["L",(h.plotX+z)/2,m]]:[["L",z,h.plotY]],x.push(["L",z,m])):x=[["L",z,m]],g.push(t.x),q&&(g.push(t.x),2===q&&g.push(t.x)),p.push.apply(p,x),n=!1)});p.xMap=g;return e.graphPath=p};A.prototype.getZonesGraphs=function(a){this.zones.forEach(function(f,
k){k=["zone-graph-"+k,"highcharts-graph highcharts-zone-graph-"+k+" "+(f.className||"")];this.chart.styledMode||k.push(f.color||this.color,f.dashStyle||this.options.dashStyle);a.push(k)},this);return a};A.defaultOptions=E(a.defaultOptions,{});return A}(a);f.registerSeriesType("line",B);"";return B});K(f,"Series/Area/AreaSeries.js",[f["Core/Color/Color.js"],f["Core/Legend/LegendSymbol.js"],f["Core/Series/SeriesRegistry.js"],f["Core/Utilities.js"]],function(a,f,B,H){var w=this&&this.__extends||function(){var a=
function(e,c){a=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,c){a.__proto__=c}||function(a,c){for(var e in c)c.hasOwnProperty(e)&&(a[e]=c[e])};return a(e,c)};return function(e,c){function f(){this.constructor=e}a(e,c);e.prototype=null===c?Object.create(c):(f.prototype=c.prototype,new f)}}(),C=a.parse,I=B.seriesTypes.line;a=H.extend;var A=H.merge,u=H.objectEach,n=H.pick;H=function(a){function e(){var c=null!==a&&a.apply(this,arguments)||this;c.data=void 0;c.options=void 0;c.points=
void 0;return c}w(e,a);e.prototype.drawGraph=function(){this.areaPath=[];a.prototype.drawGraph.apply(this);var c=this,e=this.areaPath,f=this.options,k=[["area","highcharts-area",this.color,f.fillColor]];this.zones.forEach(function(a,e){k.push(["zone-area-"+e,"highcharts-area highcharts-zone-area-"+e+" "+a.className,a.color||c.color,a.fillColor||f.fillColor])});k.forEach(function(a){var g=a[0],k=c[g],p=k?"animate":"attr",q={};k?(k.endX=c.preventGraphAnimation?null:e.xMap,k.animate({d:e})):(q.zIndex=
0,k=c[g]=c.chart.renderer.path(e).addClass(a[1]).add(c.group),k.isArea=!0);c.chart.styledMode||(q.fill=n(a[3],C(a[2]).setOpacity(n(f.fillOpacity,.75)).get()));k[p](q);k.startX=e.xMap;k.shiftUnit=f.step?2:1})};e.prototype.getGraphPath=function(a){var c=I.prototype.getGraphPath,e=this.options,f=e.stacking,k=this.yAxis,u,y=[],x=[],z=this.index,m=k.stacking.stacks[this.stackKey],h=e.threshold,b=Math.round(k.getThreshold(e.threshold));e=n(e.connectNulls,"percent"===f);var l=function(c,d,e){var g=a[c];
c=f&&m[g.x].points[z];var l=g[e+"Null"]||0;e=g[e+"Cliff"]||0;g=!0;if(e||l){var p=(l?c[0]:c[1])+e;var n=c[0]+e;g=!!l}else!f&&a[d]&&a[d].isNull&&(p=n=h);"undefined"!==typeof p&&(x.push({plotX:D,plotY:null===p?b:k.getThreshold(p),isNull:g,isCliff:!0}),y.push({plotX:D,plotY:null===n?b:k.getThreshold(n),doCurve:!1}))};a=a||this.points;f&&(a=this.getStackPoints(a));for(u=0;u<a.length;u++){f||(a[u].leftCliff=a[u].rightCliff=a[u].leftNull=a[u].rightNull=void 0);var d=a[u].isNull;var D=n(a[u].rectPlotX,a[u].plotX);
var v=f?n(a[u].yBottom,b):b;if(!d||e)e||l(u,u-1,"left"),d&&!f&&e||(x.push(a[u]),y.push({x:u,plotX:D,plotY:v})),e||l(u,u+1,"right")}u=c.call(this,x,!0,!0);y.reversed=!0;d=c.call(this,y,!0,!0);(v=d[0])&&"M"===v[0]&&(d[0]=["L",v[1],v[2]]);d=u.concat(d);d.length&&d.push(["Z"]);c=c.call(this,x,!1,e);d.xMap=u.xMap;this.areaPath=d;return c};e.prototype.getStackPoints=function(a){var c=this,e=[],f=[],k=this.xAxis,w=this.yAxis,y=w.stacking.stacks[this.stackKey],x={},z=w.series,m=z.length,h=w.options.reversedStacks?
1:-1,b=z.indexOf(c);a=a||this.points;if(this.options.stacking){for(var l=0;l<a.length;l++)a[l].leftNull=a[l].rightNull=void 0,x[a[l].x]=a[l];u(y,function(b,a){null!==b.total&&f.push(a)});f.sort(function(b,a){return b-a});var d=z.map(function(b){return b.visible});f.forEach(function(a,g){var l=0,p,q;if(x[a]&&!x[a].isNull)e.push(x[a]),[-1,1].forEach(function(e){var l=1===e?"rightNull":"leftNull",k=0,n=y[f[g+e]];if(n)for(var r=b;0<=r&&r<m;){var t=z[r].index;p=n.points[t];p||(t===c.index?x[a][l]=!0:d[r]&&
(q=y[a].points[t])&&(k-=q[1]-q[0]));r+=h}x[a][1===e?"rightCliff":"leftCliff"]=k});else{for(var t=b;0<=t&&t<m;){if(p=y[a].points[z[t].index]){l=p[1];break}t+=h}l=n(l,0);l=w.translate(l,0,1,0,1);e.push({isNull:!0,plotX:k.translate(a,0,0,0,1),x:a,plotY:l,yBottom:l})}})}return e};e.defaultOptions=A(I.defaultOptions,{threshold:0});return e}(I);a(H.prototype,{singleStacks:!1,drawLegendSymbol:f.drawRectangle});B.registerSeriesType("area",H);"";return H});K(f,"Series/Spline/SplineSeries.js",[f["Core/Series/SeriesRegistry.js"],
f["Core/Utilities.js"]],function(a,f){var C=this&&this.__extends||function(){var a=function(f,u){a=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,f){a.__proto__=f}||function(a,f){for(var e in f)f.hasOwnProperty(e)&&(a[e]=f[e])};return a(f,u)};return function(f,u){function n(){this.constructor=f}a(f,u);f.prototype=null===u?Object.create(u):(n.prototype=u.prototype,new n)}}(),H=a.seriesTypes.line,w=f.merge,E=f.pick;f=function(a){function f(){var f=null!==a&&a.apply(this,arguments)||
this;f.data=void 0;f.options=void 0;f.points=void 0;return f}C(f,a);f.prototype.getPointSpline=function(a,f,k){var e=f.plotX||0,c=f.plotY||0,p=a[k-1];k=a[k+1];if(p&&!p.isNull&&!1!==p.doCurve&&!f.isCliff&&k&&!k.isNull&&!1!==k.doCurve&&!f.isCliff){a=p.plotY||0;var g=k.plotX||0;k=k.plotY||0;var n=0;var q=(1.5*e+(p.plotX||0))/2.5;var u=(1.5*c+a)/2.5;g=(1.5*e+g)/2.5;var y=(1.5*c+k)/2.5;g!==q&&(n=(y-u)*(g-e)/(g-q)+c-y);u+=n;y+=n;u>a&&u>c?(u=Math.max(a,c),y=2*c-u):u<a&&u<c&&(u=Math.min(a,c),y=2*c-u);y>k&&
y>c?(y=Math.max(k,c),u=2*c-y):y<k&&y<c&&(y=Math.min(k,c),u=2*c-y);f.rightContX=g;f.rightContY=y}f=["C",E(p.rightContX,p.plotX,0),E(p.rightContY,p.plotY,0),E(q,e,0),E(u,c,0),e,c];p.rightContX=p.rightContY=void 0;return f};f.defaultOptions=w(H.defaultOptions);return f}(H);a.registerSeriesType("spline",f);"";return f});K(f,"Series/AreaSpline/AreaSplineSeries.js",[f["Series/Area/AreaSeries.js"],f["Series/Spline/SplineSeries.js"],f["Core/Legend/LegendSymbol.js"],f["Core/Series/SeriesRegistry.js"],f["Core/Utilities.js"]],
function(a,f,B,H,w){var C=this&&this.__extends||function(){var a=function(f,e){a=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,e){a.__proto__=e}||function(a,e){for(var c in e)e.hasOwnProperty(c)&&(a[c]=e[c])};return a(f,e)};return function(f,e){function c(){this.constructor=f}a(f,e);f.prototype=null===e?Object.create(e):(c.prototype=e.prototype,new c)}}(),I=a.prototype,A=w.extend,u=w.merge;w=function(n){function k(){var a=null!==n&&n.apply(this,arguments)||this;a.data=void 0;a.points=
void 0;a.options=void 0;return a}C(k,n);k.defaultOptions=u(f.defaultOptions,a.defaultOptions);return k}(f);A(w.prototype,{getGraphPath:I.getGraphPath,getStackPoints:I.getStackPoints,drawGraph:I.drawGraph,drawLegendSymbol:B.drawRectangle});H.registerSeriesType("areaspline",w);"";return w});K(f,"Series/Column/ColumnSeries.js",[f["Core/Animation/AnimationUtilities.js"],f["Core/Color/Color.js"],f["Core/Globals.js"],f["Core/Legend/LegendSymbol.js"],f["Core/Series/Series.js"],f["Core/Series/SeriesRegistry.js"],
f["Core/Utilities.js"]],function(a,f,B,H,w,E,I){var C=this&&this.__extends||function(){var a=function(c,b){a=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(b,a){b.__proto__=a}||function(b,a){for(var c in a)a.hasOwnProperty(c)&&(b[c]=a[c])};return a(c,b)};return function(c,b){function e(){this.constructor=c}a(c,b);c.prototype=null===b?Object.create(b):(e.prototype=b.prototype,new e)}}(),u=a.animObject,n=f.parse,k=B.hasTouch;a=B.noop;var e=I.clamp,c=I.css,p=I.defined,g=I.extend,t=I.fireEvent,
q=I.isArray,F=I.isNumber,y=I.merge,x=I.pick,z=I.objectEach;I=function(a){function f(){var b=null!==a&&a.apply(this,arguments)||this;b.borderWidth=void 0;b.data=void 0;b.group=void 0;b.options=void 0;b.points=void 0;return b}C(f,a);f.prototype.animate=function(b){var a=this,c=this.yAxis,f=a.options,h=this.chart.inverted,k={},m=h?"translateX":"translateY";if(b)k.scaleY=.001,b=e(c.toPixels(f.threshold),c.pos,c.pos+c.len),h?k.translateX=b-c.len:k.translateY=b,a.clipBox&&a.setClip(),a.group.attr(k);else{var p=
Number(a.group.attr(m));a.group.animate({scaleY:1},g(u(a.options.animation),{step:function(b,d){a.group&&(k[m]=p+d.pos*(c.pos-p),a.group.attr(k))}}))}};f.prototype.init=function(b,c){a.prototype.init.apply(this,arguments);var d=this;b=d.chart;b.hasRendered&&b.series.forEach(function(b){b.type===d.type&&(b.isDirty=!0)})};f.prototype.getColumnMetrics=function(){var b=this,a=b.options,c=b.xAxis,e=b.yAxis,f=c.options.reversedStacks;f=c.reversed&&!f||!c.reversed&&f;var h={},g,k=0;!1===a.grouping?k=1:b.chart.series.forEach(function(a){var c=
a.yAxis,d=a.options;if(a.type===b.type&&(a.visible||!b.chart.options.chart.ignoreHiddenSeries)&&e.len===c.len&&e.pos===c.pos){if(d.stacking&&"group"!==d.stacking){g=a.stackKey;"undefined"===typeof h[g]&&(h[g]=k++);var f=h[g]}else!1!==d.grouping&&(f=k++);a.columnIndex=f}});var m=Math.min(Math.abs(c.transA)*(c.ordinal&&c.ordinal.slope||a.pointRange||c.closestPointRange||c.tickInterval||1),c.len),p=m*a.groupPadding,n=(m-2*p)/(k||1);a=Math.min(a.maxPointWidth||c.len,x(a.pointWidth,n*(1-2*a.pointPadding)));
b.columnMetrics={width:a,offset:(n-a)/2+(p+((b.columnIndex||0)+(f?1:0))*n-m/2)*(f?-1:1),paddedWidth:n,columnCount:k};return b.columnMetrics};f.prototype.crispCol=function(b,a,c,e){var d=this.chart,f=this.borderWidth,h=-(f%2?.5:0);f=f%2?.5:1;d.inverted&&d.renderer.isVML&&(f+=1);this.options.crisp&&(c=Math.round(b+c)+h,b=Math.round(b)+h,c-=b);e=Math.round(a+e)+f;h=.5>=Math.abs(a)&&.5<e;a=Math.round(a)+f;e-=a;h&&e&&(--a,e+=1);return{x:b,y:a,width:c,height:e}};f.prototype.adjustForMissingColumns=function(b,
a,c,e){var d=this,f=this.options.stacking;if(!c.isNull&&1<e.columnCount){var h=this.yAxis.options.reversedStacks,g=0,l=h?0:-e.columnCount;z(this.yAxis.stacking&&this.yAxis.stacking.stacks,function(b){if("number"===typeof c.x&&(b=b[c.x.toString()])){var a=b.points[d.index],e=b.total;f?(a&&(g=l),b.hasValidPoints&&(h?l++:l--)):q(a)&&(g=a[1],l=e||0)}});b=(c.plotX||0)+((l-1)*e.paddedWidth+a)/2-a-g*e.paddedWidth}return b};f.prototype.translate=function(){var b=this,a=b.chart,c=b.options,f=b.dense=2>b.closestPointRange*
b.xAxis.transA;f=b.borderWidth=x(c.borderWidth,f?0:1);var h=b.xAxis,g=b.yAxis,k=c.threshold,m=b.translatedThreshold=g.getThreshold(k),n=x(c.minPointLength,5),q=b.getColumnMetrics(),t=q.width,z=b.pointXOffset=q.offset,u=b.dataMin,y=b.dataMax,C=b.barW=Math.max(t,1+2*f);a.inverted&&(m-=.5);c.pointPadding&&(C=Math.ceil(C));w.prototype.translate.apply(b);b.points.forEach(function(d){var f=x(d.yBottom,m),l=999+Math.abs(f),r=d.plotX||0;l=e(d.plotY,-l,g.len+l);var v=Math.min(l,f),w=Math.max(l,f)-v,D=t,A=
r+z,B=C;n&&Math.abs(w)<n&&(w=n,r=!g.reversed&&!d.negative||g.reversed&&d.negative,F(k)&&F(y)&&d.y===k&&y<=k&&(g.min||0)<k&&(u!==y||(g.max||0)<=k)&&(r=!r),v=Math.abs(v-m)>n?f-n:m-(r?n:0));p(d.options.pointWidth)&&(D=B=Math.ceil(d.options.pointWidth),A-=Math.round((D-t)/2));c.centerInCategory&&(A=b.adjustForMissingColumns(A,D,d,q));d.barX=A;d.pointWidth=D;d.tooltipPos=a.inverted?[e(g.len+g.pos-a.plotLeft-l,g.pos-a.plotLeft,g.len+g.pos-a.plotLeft),h.len+h.pos-a.plotTop-A-B/2,w]:[h.left-a.plotLeft+A+
B/2,e(l+g.pos-a.plotTop,g.pos-a.plotTop,g.len+g.pos-a.plotTop),w];d.shapeType=b.pointClass.prototype.shapeType||"rect";d.shapeArgs=b.crispCol.apply(b,d.isNull?[A,m,B,0]:[A,v,B,w])})};f.prototype.drawGraph=function(){this.group[this.dense?"addClass":"removeClass"]("highcharts-dense-data")};f.prototype.pointAttribs=function(b,a){var c=this.options,e=this.pointAttrToOptions||{},f=e.stroke||"borderColor",h=e["stroke-width"]||"borderWidth",g=b&&b.color||this.color,l=b&&b[f]||c[f]||g;e=b&&b.options.dashStyle||
c.dashStyle;var k=b&&b[h]||c[h]||this[h]||0,m=x(b&&b.opacity,c.opacity,1);if(b&&this.zones.length){var p=b.getZone();g=b.options.color||p&&(p.color||b.nonZonedColor)||this.color;p&&(l=p.borderColor||l,e=p.dashStyle||e,k=p.borderWidth||k)}a&&b&&(b=y(c.states[a],b.options.states&&b.options.states[a]||{}),a=b.brightness,g=b.color||"undefined"!==typeof a&&n(g).brighten(b.brightness).get()||g,l=b[f]||l,k=b[h]||k,e=b.dashStyle||e,m=x(b.opacity,m));f={fill:g,stroke:l,"stroke-width":k,opacity:m};e&&(f.dashstyle=
e);return f};f.prototype.drawPoints=function(){var b=this,a=this.chart,c=b.options,e=a.renderer,f=c.animationLimit||250,h;b.points.forEach(function(d){var g=d.graphic,l=!!g,k=g&&a.pointCount<f?"animate":"attr";if(F(d.plotY)&&null!==d.y){h=d.shapeArgs;g&&d.hasNewShapeType()&&(g=g.destroy());b.enabledDataSorting&&(d.startXPos=b.xAxis.reversed?-(h?h.width||0:0):b.xAxis.width);g||(d.graphic=g=e[d.shapeType](h).add(d.group||b.group))&&b.enabledDataSorting&&a.hasRendered&&a.pointCount<f&&(g.attr({x:d.startXPos}),
l=!0,k="animate");if(g&&l)g[k](y(h));if(c.borderRadius)g[k]({r:c.borderRadius});a.styledMode||g[k](b.pointAttribs(d,d.selected&&"select")).shadow(!1!==d.allowShadow&&c.shadow,null,c.stacking&&!c.borderRadius);g&&(g.addClass(d.getClassName(),!0),g.attr({visibility:d.visible?"inherit":"hidden"}))}else g&&(d.graphic=g.destroy())})};f.prototype.drawTracker=function(){var b=this,a=b.chart,d=a.pointer,e=function(b){var a=d.getPointFromEvent(b);"undefined"!==typeof a&&(d.isDirectTouch=!0,a.onMouseOver(b))},
f;b.points.forEach(function(b){f=q(b.dataLabels)?b.dataLabels:b.dataLabel?[b.dataLabel]:[];b.graphic&&(b.graphic.element.point=b);f.forEach(function(a){a.div?a.div.point=b:a.element.point=b})});b._hasTracking||(b.trackerGroups.forEach(function(f){if(b[f]){b[f].addClass("highcharts-tracker").on("mouseover",e).on("mouseout",function(b){d.onTrackerMouseOut(b)});if(k)b[f].on("touchstart",e);!a.styledMode&&b.options.cursor&&b[f].css(c).css({cursor:b.options.cursor})}}),b._hasTracking=!0);t(this,"afterDrawTracker")};
f.prototype.remove=function(){var b=this,a=b.chart;a.hasRendered&&a.series.forEach(function(a){a.type===b.type&&(a.isDirty=!0)});w.prototype.remove.apply(b,arguments)};f.defaultOptions=y(w.defaultOptions,{borderRadius:0,centerInCategory:!1,groupPadding:.2,marker:null,pointPadding:.1,minPointLength:0,cropThreshold:50,pointRange:null,states:{hover:{halo:!1,brightness:.1},select:{color:"#cccccc",borderColor:"#000000"}},dataLabels:{align:void 0,verticalAlign:void 0,y:void 0},startFromThreshold:!0,stickyTracking:!1,
tooltip:{distance:6},threshold:0,borderColor:"#ffffff"});return f}(w);g(I.prototype,{cropShoulder:0,directTouch:!0,drawLegendSymbol:H.drawRectangle,getSymbol:a,negStacks:!0,trackerGroups:["group","dataLabelsGroup"]});E.registerSeriesType("column",I);"";"";return I});K(f,"Core/Series/DataLabel.js",[f["Core/Animation/AnimationUtilities.js"],f["Core/FormatUtilities.js"],f["Core/Utilities.js"]],function(a,f,B){var C=a.getDeferredAnimation,w=f.format,E=B.defined,I=B.extend,A=B.fireEvent,u=B.isArray,n=
B.merge,k=B.objectEach,e=B.pick,c=B.splat,p;(function(a){function f(a,b,c,d,f){var h=this,g=this.chart,l=this.isCartesian&&g.inverted,k=this.enabledDataSorting,m=e(a.dlBox&&a.dlBox.centerX,a.plotX),p=a.plotY,n=c.rotation,q=c.align,t=E(m)&&E(p)&&g.isInsidePlot(m,Math.round(p),{inverted:l,paneCoordinates:!0,series:h}),z=function(c){k&&h.xAxis&&!u&&h.setDataLabelStartPos(a,b,f,t,c)},u="justify"===e(c.overflow,k?"none":"justify"),x=this.visible&&!1!==a.visible&&(a.series.forceDL||k&&!u||t||e(c.inside,
!!this.options.stacking)&&d&&g.isInsidePlot(m,l?d.x+1:d.y+d.height-1,{inverted:l,paneCoordinates:!0,series:h}));if(x&&E(m)&&E(p)){n&&b.attr({align:q});q=b.getBBox(!0);var y=[0,0];var w=g.renderer.fontMetrics(g.styledMode?void 0:c.style.fontSize,b).b;d=I({x:l?this.yAxis.len-p:m,y:Math.round(l?this.xAxis.len-m:p),width:0,height:0},d);I(c,{width:q.width,height:q.height});n?(u=!1,y=g.renderer.rotCorr(w,n),m={x:d.x+(c.x||0)+d.width/2+y.x,y:d.y+(c.y||0)+{top:0,middle:.5,bottom:1}[c.verticalAlign]*d.height},
y=[q.x-Number(b.attr("x")),q.y-Number(b.attr("y"))],z(m),b[f?"attr":"animate"](m)):(z(d),b.align(c,void 0,d),m=b.alignAttr);u&&0<=d.height?this.justifyDataLabel(b,c,m,q,d,f):e(c.crop,!0)&&(d=m.x,z=m.y,d+=y[0],z+=y[1],x=g.isInsidePlot(d,z,{paneCoordinates:!0,series:h})&&g.isInsidePlot(d+q.width,z+q.height,{paneCoordinates:!0,series:h}));if(c.shape&&!n)b[f?"attr":"animate"]({anchorX:l?g.plotWidth-a.plotY:a.plotX,anchorY:l?g.plotHeight-a.plotX:a.plotY})}f&&k&&(b.placed=!1);x||k&&!u?b.show():(b.hide(),
b.placed=!1)}function g(a,b){var c=b.filter;return c?(b=c.operator,a=a[c.property],c=c.value,">"===b&&a>c||"<"===b&&a<c||">="===b&&a>=c||"<="===b&&a<=c||"=="===b&&a==c||"==="===b&&a===c?!0:!1):!0}function p(){var a=this,b=a.chart,f=a.options,d=a.points,m=a.hasRendered||0,p=b.renderer,n=f.dataLabels,q,t=n.animation;t=n.defer?C(b,t,a):{defer:0,duration:0};n=x(x(b.options.plotOptions&&b.options.plotOptions.series&&b.options.plotOptions.series.dataLabels,b.options.plotOptions&&b.options.plotOptions[a.type]&&
b.options.plotOptions[a.type].dataLabels),n);A(this,"drawDataLabels");if(u(n)||n.enabled||a._hasPointLabels){var z=a.plotGroup("dataLabelsGroup","data-labels",m?"inherit":"hidden",n.zIndex||6);z.attr({opacity:+m});!m&&(m=a.dataLabelsGroup)&&(a.visible&&z.show(),m[f.animation?"animate":"attr"]({opacity:1},t));d.forEach(function(d){q=c(x(n,d.dlOptions||d.options&&d.options.dataLabels));q.forEach(function(c,h){var l=c.enabled&&(!d.isNull||d.dataLabelOnNull)&&g(d,c),m=d.connectors?d.connectors[h]:d.connector,
n=d.dataLabels?d.dataLabels[h]:d.dataLabel,q=!n,r=e(c.distance,d.labelDistance);if(l){var t=d.getLabelConfig();var v=e(c[d.formatPrefix+"Format"],c.format);t=E(v)?w(v,t,b):(c[d.formatPrefix+"Formatter"]||c.formatter).call(t,c);v=c.style;var u=c.rotation;b.styledMode||(v.color=e(c.color,v.color,a.color,"#000000"),"contrast"===v.color?(d.contrastColor=p.getContrast(d.color||a.color),v.color=!E(r)&&c.inside||0>r||f.stacking?d.contrastColor:"#000000"):delete d.contrastColor,f.cursor&&(v.cursor=f.cursor));
var x={r:c.borderRadius||0,rotation:u,padding:c.padding,zIndex:1};b.styledMode||(x.fill=c.backgroundColor,x.stroke=c.borderColor,x["stroke-width"]=c.borderWidth);k(x,function(b,a){"undefined"===typeof b&&delete x[a]})}!n||l&&E(t)&&!!n.div===!!c.useHTML&&(n.rotation&&c.rotation||n.rotation===c.rotation)||(q=!0,d.dataLabel=n=d.dataLabel&&d.dataLabel.destroy(),d.dataLabels&&(1===d.dataLabels.length?delete d.dataLabels:delete d.dataLabels[h]),h||delete d.dataLabel,m&&(d.connector=d.connector.destroy(),
d.connectors&&(1===d.connectors.length?delete d.connectors:delete d.connectors[h])));l&&E(t)?(n?x.text=t:(d.dataLabels=d.dataLabels||[],n=d.dataLabels[h]=u?p.text(t,0,0,c.useHTML).addClass("highcharts-data-label"):p.label(t,0,0,c.shape,null,null,c.useHTML,null,"data-label"),h||(d.dataLabel=n),n.addClass(" highcharts-data-label-color-"+d.colorIndex+" "+(c.className||"")+(c.useHTML?" highcharts-tracker":""))),n.options=c,n.attr(x),b.styledMode||n.css(v).shadow(c.shadow),n.added||n.add(z),c.textPath&&
!c.useHTML&&(n.setTextPath(d.getDataLabelPath&&d.getDataLabelPath(n)||d.graphic,c.textPath),d.dataLabelPath&&!c.textPath.enabled&&(d.dataLabelPath=d.dataLabelPath.destroy())),a.alignDataLabel(d,n,c,null,q)):n&&n.hide()})})}A(this,"afterDrawDataLabels")}function y(a,b,c,d,e,f){var h=this.chart,g=b.align,k=b.verticalAlign,l=a.box?0:a.padding||0,m=b.x;m=void 0===m?0:m;var p=b.y;p=void 0===p?0:p;var n=(c.x||0)+l;if(0>n){"right"===g&&0<=m?(b.align="left",b.inside=!0):m-=n;var q=!0}n=(c.x||0)+d.width-l;
n>h.plotWidth&&("left"===g&&0>=m?(b.align="right",b.inside=!0):m+=h.plotWidth-n,q=!0);n=c.y+l;0>n&&("bottom"===k&&0<=p?(b.verticalAlign="top",b.inside=!0):p-=n,q=!0);n=(c.y||0)+d.height-l;n>h.plotHeight&&("top"===k&&0>=p?(b.verticalAlign="bottom",b.inside=!0):p+=h.plotHeight-n,q=!0);q&&(b.x=m,b.y=p,a.placed=!f,a.align(b,void 0,e));return q}function x(a,b){var c=[],d;if(u(a)&&!u(b))c=a.map(function(a){return n(a,b)});else if(u(b)&&!u(a))c=b.map(function(b){return n(a,b)});else if(u(a)||u(b))for(d=
Math.max(a.length,b.length);d--;)c[d]=n(a[d],b[d]);else c=n(a,b);return c}function z(a,b,c,d,e){var f=this.chart,g=f.inverted,h=this.xAxis,k=h.reversed,l=g?b.height/2:b.width/2;a=(a=a.pointWidth)?a/2:0;b.startXPos=g?e.x:k?-l-a:h.width-l+a;b.startYPos=g?k?this.yAxis.height-l+a:-l-a:e.y;d?"hidden"===b.visibility&&(b.show(),b.attr({opacity:0}).animate({opacity:1})):b.attr({opacity:1}).animate({opacity:0},void 0,b.hide);f.hasRendered&&(c&&b.attr({x:b.startXPos,y:b.startYPos}),b.placed=!0)}var m=[];a.compose=
function(a){if(-1===m.indexOf(a)){var b=a.prototype;m.push(a);b.alignDataLabel=f;b.drawDataLabels=p;b.justifyDataLabel=y;b.setDataLabelStartPos=z}}})(p||(p={}));"";return p});K(f,"Series/Column/ColumnDataLabel.js",[f["Core/Series/DataLabel.js"],f["Core/Series/SeriesRegistry.js"],f["Core/Utilities.js"]],function(a,f,B){var C=f.series,w=B.merge,E=B.pick,I;(function(f){function u(a,e,c,f,g){var k=this.chart.inverted,n=a.series,p=(n.xAxis?n.xAxis.len:this.chart.plotSizeX)||0;n=(n.yAxis?n.yAxis.len:this.chart.plotSizeY)||
0;var u=a.dlBox||a.shapeArgs,x=E(a.below,a.plotY>E(this.translatedThreshold,n)),z=E(c.inside,!!this.options.stacking);u&&(f=w(u),0>f.y&&(f.height+=f.y,f.y=0),u=f.y+f.height-n,0<u&&u<f.height&&(f.height-=u),k&&(f={x:n-f.y-f.height,y:p-f.x-f.width,width:f.height,height:f.width}),z||(k?(f.x+=x?0:f.width,f.width=0):(f.y+=x?f.height:0,f.height=0)));c.align=E(c.align,!k||z?"center":x?"right":"left");c.verticalAlign=E(c.verticalAlign,k||z?"middle":x?"top":"bottom");C.prototype.alignDataLabel.call(this,a,
e,c,f,g);c.inside&&a.contrastColor&&e.css({color:a.contrastColor})}var n=[];f.compose=function(f){a.compose(C);-1===n.indexOf(f)&&(n.push(f),f.prototype.alignDataLabel=u)}})(I||(I={}));return I});K(f,"Series/Bar/BarSeries.js",[f["Series/Column/ColumnSeries.js"],f["Core/Series/SeriesRegistry.js"],f["Core/Utilities.js"]],function(a,f,B){var C=this&&this.__extends||function(){var a=function(f,u){a=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,f){a.__proto__=f}||function(a,f){for(var e in f)f.hasOwnProperty(e)&&
(a[e]=f[e])};return a(f,u)};return function(f,u){function n(){this.constructor=f}a(f,u);f.prototype=null===u?Object.create(u):(n.prototype=u.prototype,new n)}}(),w=B.extend,E=B.merge;B=function(f){function w(){var a=null!==f&&f.apply(this,arguments)||this;a.data=void 0;a.options=void 0;a.points=void 0;return a}C(w,f);w.defaultOptions=E(a.defaultOptions,{});return w}(a);w(B.prototype,{inverted:!0});f.registerSeriesType("bar",B);"";return B});K(f,"Series/Scatter/ScatterSeries.js",[f["Series/Column/ColumnSeries.js"],
f["Series/Line/LineSeries.js"],f["Core/Series/SeriesRegistry.js"],f["Core/Utilities.js"]],function(a,f,B,H){var w=this&&this.__extends||function(){var a=function(f,k){a=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,c){a.__proto__=c}||function(a,c){for(var e in c)c.hasOwnProperty(e)&&(a[e]=c[e])};return a(f,k)};return function(f,k){function e(){this.constructor=f}a(f,k);f.prototype=null===k?Object.create(k):(e.prototype=k.prototype,new e)}}(),C=H.addEvent,I=H.extend,A=H.merge;H=
function(a){function n(){var f=null!==a&&a.apply(this,arguments)||this;f.data=void 0;f.options=void 0;f.points=void 0;return f}w(n,a);n.prototype.applyJitter=function(){var a=this,e=this.options.jitter,c=this.points.length;e&&this.points.forEach(function(f,g){["x","y"].forEach(function(k,n){var p="plot"+k.toUpperCase();if(e[k]&&!f.isNull){var q=a[k+"Axis"];var t=e[k]*q.transA;if(q&&!q.isLog){var z=Math.max(0,f[p]-t);q=Math.min(q.len,f[p]+t);n=1E4*Math.sin(g+n*c);f[p]=z+(q-z)*(n-Math.floor(n));"x"===
k&&(f.clientX=f.plotX)}}})})};n.prototype.drawGraph=function(){this.options.lineWidth?a.prototype.drawGraph.call(this):this.graph&&(this.graph=this.graph.destroy())};n.defaultOptions=A(f.defaultOptions,{lineWidth:0,findNearestPointBy:"xy",jitter:{x:0,y:0},marker:{enabled:!0},tooltip:{headerFormat:'<span style="color:{point.color}">\u25cf</span> <span style="font-size: 10px"> {series.name}</span><br/>',pointFormat:"x: <b>{point.x}</b><br/>y: <b>{point.y}</b><br/>"}});return n}(f);I(H.prototype,{drawTracker:a.prototype.drawTracker,
sorted:!1,requireSorting:!1,noSharedTooltip:!0,trackerGroups:["group","markerGroup","dataLabelsGroup"],takeOrdinalPosition:!1});C(H,"afterTranslate",function(){this.applyJitter()});B.registerSeriesType("scatter",H);"";return H});K(f,"Series/CenteredUtilities.js",[f["Core/Globals.js"],f["Core/Series/Series.js"],f["Core/Utilities.js"]],function(a,f,B){var C=a.deg2rad,w=B.isNumber,E=B.pick,I=B.relativeLength,A;(function(a){a.getCenter=function(){var a=this.options,k=this.chart,e=2*(a.slicedOffset||0),
c=k.plotWidth-2*e,p=k.plotHeight-2*e,g=a.center,t=Math.min(c,p),q=a.thickness,u=a.size,y=a.innerSize||0;"string"===typeof u&&(u=parseFloat(u));"string"===typeof y&&(y=parseFloat(y));a=[E(g[0],"50%"),E(g[1],"50%"),E(u&&0>u?void 0:a.size,"100%"),E(y&&0>y?void 0:a.innerSize||0,"0%")];!k.angular||this instanceof f||(a[3]=0);for(g=0;4>g;++g)u=a[g],k=2>g||2===g&&/%$/.test(u),a[g]=I(u,[c,p,t,a[2]][g])+(k?e:0);a[3]>a[2]&&(a[3]=a[2]);w(q)&&2*q<a[2]&&0<q&&(a[3]=a[2]-2*q);return a};a.getStartAndEndRadians=function(a,
f){a=w(a)?a:0;f=w(f)&&f>a&&360>f-a?f:a+360;return{start:C*(a+-90),end:C*(f+-90)}}})(A||(A={}));"";return A});K(f,"Series/Pie/PiePoint.js",[f["Core/Animation/AnimationUtilities.js"],f["Core/Series/Point.js"],f["Core/Utilities.js"]],function(a,f,B){var C=this&&this.__extends||function(){var a=function(e,c){a=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(a,c){a.__proto__=c}||function(a,c){for(var e in c)c.hasOwnProperty(e)&&(a[e]=c[e])};return a(e,c)};return function(e,c){function f(){this.constructor=
e}a(e,c);e.prototype=null===c?Object.create(c):(f.prototype=c.prototype,new f)}}(),w=a.setAnimation,E=B.addEvent,I=B.defined;a=B.extend;var A=B.isNumber,u=B.pick,n=B.relativeLength;f=function(a){function e(){var c=null!==a&&a.apply(this,arguments)||this;c.labelDistance=void 0;c.options=void 0;c.series=void 0;return c}C(e,a);e.prototype.getConnectorPath=function(){var a=this.labelPosition,e=this.series.options.dataLabels,f=this.connectorShapes,k=e.connectorShape;f[k]&&(k=f[k]);return k.call(this,{x:a.final.x,
y:a.final.y,alignment:a.alignment},a.connectorPosition,e)};e.prototype.getTranslate=function(){return this.sliced?this.slicedTranslation:{translateX:0,translateY:0}};e.prototype.haloPath=function(a){var c=this.shapeArgs;return this.sliced||!this.visible?[]:this.series.chart.renderer.symbols.arc(c.x,c.y,c.r+a,c.r+a,{innerR:c.r-1,start:c.start,end:c.end})};e.prototype.init=function(){var c=this;a.prototype.init.apply(this,arguments);this.name=u(this.name,"Slice");var e=function(a){c.slice("select"===
a.type)};E(this,"select",e);E(this,"unselect",e);return this};e.prototype.isValid=function(){return A(this.y)&&0<=this.y};e.prototype.setVisible=function(a,e){var c=this,f=this.series,k=f.chart,n=f.options.ignoreHiddenPoint;e=u(e,n);a!==this.visible&&(this.visible=this.options.visible=a="undefined"===typeof a?!this.visible:a,f.options.data[f.data.indexOf(this)]=this.options,["graphic","dataLabel","connector","shadowGroup"].forEach(function(e){if(c[e])c[e][a?"show":"hide"](a)}),this.legendItem&&k.legend.colorizeItem(this,
a),a||"hover"!==this.state||this.setState(""),n&&(f.isDirty=!0),e&&k.redraw())};e.prototype.slice=function(a,e,f){var c=this.series;w(f,c.chart);u(e,!0);this.sliced=this.options.sliced=I(a)?a:!this.sliced;c.options.data[c.data.indexOf(this)]=this.options;this.graphic&&this.graphic.animate(this.getTranslate());this.shadowGroup&&this.shadowGroup.animate(this.getTranslate())};return e}(f);a(f.prototype,{connectorShapes:{fixedOffset:function(a,e,c){var f=e.breakAt;e=e.touchingSliceAt;return[["M",a.x,
a.y],c.softConnector?["C",a.x+("left"===a.alignment?-5:5),a.y,2*f.x-e.x,2*f.y-e.y,f.x,f.y]:["L",f.x,f.y],["L",e.x,e.y]]},straight:function(a,e){e=e.touchingSliceAt;return[["M",a.x,a.y],["L",e.x,e.y]]},crookedLine:function(a,e,c){e=e.touchingSliceAt;var f=this.series,g=f.center[0],k=f.chart.plotWidth,q=f.chart.plotLeft;f=a.alignment;var u=this.shapeArgs.r;c=n(c.crookDistance,1);k="left"===f?g+u+(k+q-g-u)*(1-c):q+(g-u)*c;c=["L",k,a.y];g=!0;if("left"===f?k>a.x||k<e.x:k<a.x||k>e.x)g=!1;a=[["M",a.x,a.y]];
g&&a.push(c);a.push(["L",e.x,e.y]);return a}}});return f});K(f,"Series/Pie/PieSeries.js",[f["Series/CenteredUtilities.js"],f["Series/Column/ColumnSeries.js"],f["Core/Globals.js"],f["Core/Legend/LegendSymbol.js"],f["Series/Pie/PiePoint.js"],f["Core/Series/Series.js"],f["Core/Series/SeriesRegistry.js"],f["Core/Renderer/SVG/Symbols.js"],f["Core/Utilities.js"]],function(a,f,B,H,w,E,I,A,u){var n=this&&this.__extends||function(){var a=function(c,e){a=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&
function(a,c){a.__proto__=c}||function(a,c){for(var e in c)c.hasOwnProperty(e)&&(a[e]=c[e])};return a(c,e)};return function(c,e){function f(){this.constructor=c}a(c,e);c.prototype=null===e?Object.create(e):(f.prototype=e.prototype,new f)}}(),k=a.getStartAndEndRadians;B=B.noop;var e=u.clamp,c=u.extend,p=u.fireEvent,g=u.merge,t=u.pick,q=u.relativeLength;u=function(a){function c(){var c=null!==a&&a.apply(this,arguments)||this;c.center=void 0;c.data=void 0;c.maxLabelDistance=void 0;c.options=void 0;c.points=
void 0;return c}n(c,a);c.prototype.animate=function(a){var c=this,e=c.points,f=c.startAngleRad;a||e.forEach(function(a){var b=a.graphic,d=a.shapeArgs;b&&d&&(b.attr({r:t(a.startR,c.center&&c.center[3]/2),start:f,end:f}),b.animate({r:d.r,start:d.start,end:d.end},c.options.animation))})};c.prototype.drawEmpty=function(){var a=this.startAngleRad,c=this.endAngleRad,e=this.options;if(0===this.total&&this.center){var f=this.center[0];var b=this.center[1];this.graph||(this.graph=this.chart.renderer.arc(f,
b,this.center[1]/2,0,a,c).addClass("highcharts-empty-series").add(this.group));this.graph.attr({d:A.arc(f,b,this.center[2]/2,0,{start:a,end:c,innerR:this.center[3]/2})});this.chart.styledMode||this.graph.attr({"stroke-width":e.borderWidth,fill:e.fillColor||"none",stroke:e.color||"#cccccc"})}else this.graph&&(this.graph=this.graph.destroy())};c.prototype.drawPoints=function(){var a=this.chart.renderer;this.points.forEach(function(c){c.graphic&&c.hasNewShapeType()&&(c.graphic=c.graphic.destroy());c.graphic||
(c.graphic=a[c.shapeType](c.shapeArgs).add(c.series.group),c.delayedRendering=!0)})};c.prototype.generatePoints=function(){a.prototype.generatePoints.call(this);this.updateTotals()};c.prototype.getX=function(a,c,f){var g=this.center,b=this.radii?this.radii[f.index]||0:g[2]/2;a=Math.asin(e((a-g[1])/(b+f.labelDistance),-1,1));return g[0]+(c?-1:1)*Math.cos(a)*(b+f.labelDistance)+(0<f.labelDistance?(c?-1:1)*this.options.dataLabels.padding:0)};c.prototype.hasData=function(){return!!this.processedXData.length};
c.prototype.redrawPoints=function(){var a=this,c=a.chart,e=c.renderer,f=a.options.shadow,b,l,d,k;this.drawEmpty();!f||a.shadowGroup||c.styledMode||(a.shadowGroup=e.g("shadow").attr({zIndex:-1}).add(a.group));a.points.forEach(function(h){var m={};l=h.graphic;if(!h.isNull&&l){var n=void 0;k=h.shapeArgs;b=h.getTranslate();c.styledMode||(n=h.shadowGroup,f&&!n&&(n=h.shadowGroup=e.g("shadow").add(a.shadowGroup)),n&&n.attr(b),d=a.pointAttribs(h,h.selected&&"select"));h.delayedRendering?(l.setRadialReference(a.center).attr(k).attr(b),
c.styledMode||l.attr(d).attr({"stroke-linejoin":"round"}).shadow(f,n),h.delayedRendering=!1):(l.setRadialReference(a.center),c.styledMode||g(!0,m,d),g(!0,m,k,b),l.animate(m));l.attr({visibility:h.visible?"inherit":"hidden"});l.addClass(h.getClassName(),!0)}else l&&(h.graphic=l.destroy())})};c.prototype.sortByAngle=function(a,c){a.sort(function(a,e){return"undefined"!==typeof a.angle&&(e.angle-a.angle)*c})};c.prototype.translate=function(a){this.generatePoints();var c=this.options,e=c.slicedOffset,
f=e+(c.borderWidth||0),b=k(c.startAngle,c.endAngle),g=this.startAngleRad=b.start;b=(this.endAngleRad=b.end)-g;var d=this.points,n=c.dataLabels.distance;c=c.ignoreHiddenPoint;var v=d.length,r,u=0;a||(this.center=a=this.getCenter());for(r=0;r<v;r++){var w=d[r];var y=g+u*b;!w.isValid()||c&&!w.visible||(u+=w.percentage/100);var x=g+u*b;var C={x:a[0],y:a[1],r:a[2]/2,innerR:a[3]/2,start:Math.round(1E3*y)/1E3,end:Math.round(1E3*x)/1E3};w.shapeType="arc";w.shapeArgs=C;w.labelDistance=t(w.options.dataLabels&&
w.options.dataLabels.distance,n);w.labelDistance=q(w.labelDistance,C.r);this.maxLabelDistance=Math.max(this.maxLabelDistance||0,w.labelDistance);x=(x+y)/2;x>1.5*Math.PI?x-=2*Math.PI:x<-Math.PI/2&&(x+=2*Math.PI);w.slicedTranslation={translateX:Math.round(Math.cos(x)*e),translateY:Math.round(Math.sin(x)*e)};C=Math.cos(x)*a[2]/2;var A=Math.sin(x)*a[2]/2;w.tooltipPos=[a[0]+.7*C,a[1]+.7*A];w.half=x<-Math.PI/2||x>Math.PI/2?1:0;w.angle=x;y=Math.min(f,w.labelDistance/5);w.labelPosition={natural:{x:a[0]+C+
Math.cos(x)*w.labelDistance,y:a[1]+A+Math.sin(x)*w.labelDistance},"final":{},alignment:0>w.labelDistance?"center":w.half?"right":"left",connectorPosition:{breakAt:{x:a[0]+C+Math.cos(x)*y,y:a[1]+A+Math.sin(x)*y},touchingSliceAt:{x:a[0]+C,y:a[1]+A}}}}p(this,"afterTranslate")};c.prototype.updateTotals=function(){var a=this.points,c=a.length,e=this.options.ignoreHiddenPoint,f,b=0;for(f=0;f<c;f++){var g=a[f];!g.isValid()||e&&!g.visible||(b+=g.y)}this.total=b;for(f=0;f<c;f++)g=a[f],g.percentage=0<b&&(g.visible||
!e)?g.y/b*100:0,g.total=b};c.defaultOptions=g(E.defaultOptions,{center:[null,null],clip:!1,colorByPoint:!0,dataLabels:{allowOverlap:!0,connectorPadding:5,connectorShape:"fixedOffset",crookDistance:"70%",distance:30,enabled:!0,formatter:function(){return this.point.isNull?void 0:this.point.name},softConnector:!0,x:0},fillColor:void 0,ignoreHiddenPoint:!0,inactiveOtherPoints:!0,legendType:"point",marker:null,size:null,showInLegend:!1,slicedOffset:10,stickyTracking:!1,tooltip:{followPointer:!0},borderColor:"#ffffff",
borderWidth:1,lineWidth:void 0,states:{hover:{brightness:.1}}});return c}(E);c(u.prototype,{axisTypes:[],directTouch:!0,drawGraph:void 0,drawLegendSymbol:H.drawRectangle,drawTracker:f.prototype.drawTracker,getCenter:a.getCenter,getSymbol:B,isCartesian:!1,noSharedTooltip:!0,pointAttribs:f.prototype.pointAttribs,pointClass:w,requireSorting:!1,searchPoint:B,trackerGroups:["group","dataLabelsGroup"]});I.registerSeriesType("pie",u);"";return u});K(f,"Series/Pie/PieDataLabel.js",[f["Core/Series/DataLabel.js"],
f["Core/Globals.js"],f["Core/Renderer/RendererUtilities.js"],f["Core/Series/SeriesRegistry.js"],f["Core/Utilities.js"]],function(a,f,B,H,w){var C=f.noop,I=B.distribute,A=H.series,u=w.arrayMax,n=w.clamp,k=w.defined,e=w.merge,c=w.pick,p=w.relativeLength,g;(function(f){function g(){var a=this,f=a.data,b=a.chart,g=a.options.dataLabels||{},d=g.connectorPadding,n=b.plotWidth,p=b.plotHeight,q=b.plotLeft,t=Math.round(b.chartWidth/3),w=a.center,z=w[2]/2,x=w[1],y=[[],[]],C=[0,0,0,0],B=a.dataLabelPositioners,
F,E,H,K,U,G,T,M,V,W,Z,R;a.visible&&(g.enabled||a._hasPointLabels)&&(f.forEach(function(a){a.dataLabel&&a.visible&&a.dataLabel.shortened&&(a.dataLabel.attr({width:"auto"}).css({width:"auto",textOverflow:"clip"}),a.dataLabel.shortened=!1)}),A.prototype.drawDataLabels.apply(a),f.forEach(function(a){a.dataLabel&&(a.visible?(y[a.half].push(a),a.dataLabel._pos=null,!k(g.style.width)&&!k(a.options.dataLabels&&a.options.dataLabels.style&&a.options.dataLabels.style.width)&&a.dataLabel.getBBox().width>t&&(a.dataLabel.css({width:Math.round(.7*
t)+"px"}),a.dataLabel.shortened=!0)):(a.dataLabel=a.dataLabel.destroy(),a.dataLabels&&1===a.dataLabels.length&&delete a.dataLabels))}),y.forEach(function(e,f){var h=e.length,l=[],m;if(h){a.sortByAngle(e,f-.5);if(0<a.maxLabelDistance){var r=Math.max(0,x-z-a.maxLabelDistance);var t=Math.min(x+z+a.maxLabelDistance,b.plotHeight);e.forEach(function(a){0<a.labelDistance&&a.dataLabel&&(a.top=Math.max(0,x-z-a.labelDistance),a.bottom=Math.min(x+z+a.labelDistance,b.plotHeight),m=a.dataLabel.getBBox().height||
21,a.distributeBox={target:a.labelPosition.natural.y-a.top+m/2,size:m,rank:a.y},l.push(a.distributeBox))});r=t+m-r;I(l,r,r/5)}for(Z=0;Z<h;Z++){F=e[Z];G=F.labelPosition;K=F.dataLabel;W=!1===F.visible?"hidden":"inherit";V=r=G.natural.y;l&&k(F.distributeBox)&&("undefined"===typeof F.distributeBox.pos?W="hidden":(T=F.distributeBox.size,V=B.radialDistributionY(F)));delete F.positionIndex;if(g.justify)M=B.justify(F,z,w);else switch(g.alignTo){case "connectors":M=B.alignToConnectors(e,f,n,q);break;case "plotEdges":M=
B.alignToPlotEdges(K,f,n,q);break;default:M=B.radialDistributionX(a,F,V,r)}K._attr={visibility:W,align:G.alignment};R=F.options.dataLabels||{};K._pos={x:M+c(R.x,g.x)+({left:d,right:-d}[G.alignment]||0),y:V+c(R.y,g.y)-10};G.final.x=M;G.final.y=V;c(g.crop,!0)&&(U=K.getBBox().width,r=null,M-U<d&&1===f?(r=Math.round(U-M+d),C[3]=Math.max(r,C[3])):M+U>n-d&&0===f&&(r=Math.round(M+U-n+d),C[1]=Math.max(r,C[1])),0>V-T/2?C[0]=Math.max(Math.round(-V+T/2),C[0]):V+T/2>p&&(C[2]=Math.max(Math.round(V+T/2-p),C[2])),
K.sideOverflow=r)}}}),0===u(C)||this.verifyDataLabelOverflow(C))&&(this.placeDataLabels(),this.points.forEach(function(d){R=e(g,d.options.dataLabels);if(E=c(R.connectorWidth,1)){var f;H=d.connector;if((K=d.dataLabel)&&K._pos&&d.visible&&0<d.labelDistance){W=K._attr.visibility;if(f=!H)d.connector=H=b.renderer.path().addClass("highcharts-data-label-connector  highcharts-color-"+d.colorIndex+(d.className?" "+d.className:"")).add(a.dataLabelsGroup),b.styledMode||H.attr({"stroke-width":E,stroke:R.connectorColor||
d.color||"#666666"});H[f?"attr":"animate"]({d:d.getConnectorPath()});H.attr("visibility",W)}else H&&(d.connector=H.destroy())}}))}function t(){this.points.forEach(function(a){var c=a.dataLabel,b;c&&a.visible&&((b=c._pos)?(c.sideOverflow&&(c._attr.width=Math.max(c.getBBox().width-c.sideOverflow,0),c.css({width:c._attr.width+"px",textOverflow:(this.options.dataLabels.style||{}).textOverflow||"ellipsis"}),c.shortened=!0),c.attr(c._attr),c[c.moved?"animate":"attr"](b),c.moved=!0):c&&c.attr({y:-9999}));
delete a.distributeBox},this)}function w(a){var c=this.center,b=this.options,e=b.center,d=b.minSize||80,f=null!==b.size;if(!f){if(null!==e[0])var g=Math.max(c[2]-Math.max(a[1],a[3]),d);else g=Math.max(c[2]-a[1]-a[3],d),c[0]+=(a[3]-a[1])/2;null!==e[1]?g=n(g,d,c[2]-Math.max(a[0],a[2])):(g=n(g,d,c[2]-a[0]-a[2]),c[1]+=(a[0]-a[2])/2);g<c[2]?(c[2]=g,c[3]=Math.min(b.thickness?Math.max(0,g-2*b.thickness):Math.max(0,p(b.innerSize||0,g)),g),this.translate(c),this.drawDataLabels&&this.drawDataLabels()):f=!0}return f}
var x=[],z={radialDistributionY:function(a){return a.top+a.distributeBox.pos},radialDistributionX:function(a,c,b,e){return a.getX(b<c.top+2||b>c.bottom-2?e:b,c.half,c)},justify:function(a,c,b){return b[0]+(a.half?-1:1)*(c+a.labelDistance)},alignToPlotEdges:function(a,c,b,e){a=a.getBBox().width;return c?a+e:b-a-e},alignToConnectors:function(a,c,b,e){var d=0,f;a.forEach(function(a){f=a.dataLabel.getBBox().width;f>d&&(d=f)});return c?d+e:b-d-e}};f.compose=function(c){a.compose(A);-1===x.indexOf(c)&&
(x.push(c),c=c.prototype,c.dataLabelPositioners=z,c.alignDataLabel=C,c.drawDataLabels=g,c.placeDataLabels=t,c.verifyDataLabelOverflow=w)}})(g||(g={}));return g});K(f,"Extensions/OverlappingDataLabels.js",[f["Core/Chart/Chart.js"],f["Core/Utilities.js"]],function(a,f){function C(a,f){var e=!1;if(a){var c=a.newOpacity;a.oldOpacity!==c&&(a.alignAttr&&a.placed?(a[c?"removeClass":"addClass"]("highcharts-data-label-hidden"),e=!0,a.alignAttr.opacity=c,a[a.isOld?"animate":"attr"](a.alignAttr,null,function(){f.styledMode||
a.css({pointerEvents:c?"auto":"none"})}),w(f,"afterHideOverlappingLabel")):a.attr({opacity:c}));a.isOld=!0}return e}var H=f.addEvent,w=f.fireEvent,E=f.isArray,I=f.isNumber,A=f.objectEach,u=f.pick;H(a,"render",function(){var a=this,f=[];(this.labelCollectors||[]).forEach(function(a){f=f.concat(a())});(this.yAxis||[]).forEach(function(a){a.stacking&&a.options.stackLabels&&!a.options.stackLabels.allowOverlap&&A(a.stacking.stacks,function(a){A(a,function(a){a.label&&f.push(a.label)})})});(this.series||
[]).forEach(function(e){var c=e.options.dataLabels;e.visible&&(!1!==c.enabled||e._hasPointLabels)&&(c=function(c){return c.forEach(function(c){c.visible&&(E(c.dataLabels)?c.dataLabels:c.dataLabel?[c.dataLabel]:[]).forEach(function(e){var g=e.options;e.labelrank=u(g.labelrank,c.labelrank,c.shapeArgs&&c.shapeArgs.height);g.allowOverlap?(e.oldOpacity=e.opacity,e.newOpacity=1,C(e,a)):f.push(e)})})},c(e.nodes||[]),c(e.points))});this.hideOverlappingLabels(f)});a.prototype.hideOverlappingLabels=function(a){var f=
this,e=a.length,c=f.renderer,n,g,t,q=!1;var u=function(a){var e,f=a.box?0:a.padding||0,b=e=0,g;if(a&&(!a.alignAttr||a.placed)){var d=a.alignAttr||{x:a.attr("x"),y:a.attr("y")};var k=a.parentGroup;a.width||(e=a.getBBox(),a.width=e.width,a.height=e.height,e=c.fontMetrics(null,a.element).h);var n=a.width-2*f;(g={left:"0",center:"0.5",right:"1"}[a.alignValue])?b=+g*n:I(a.x)&&Math.round(a.x)!==a.translateX&&(b=a.x-a.translateX);return{x:d.x+(k.translateX||0)+f-(b||0),y:d.y+(k.translateY||0)+f-e,width:a.width-
2*f,height:a.height-2*f}}};for(g=0;g<e;g++)if(n=a[g])n.oldOpacity=n.opacity,n.newOpacity=1,n.absoluteBox=u(n);a.sort(function(a,c){return(c.labelrank||0)-(a.labelrank||0)});for(g=0;g<e;g++){var y=(u=a[g])&&u.absoluteBox;for(n=g+1;n<e;++n){var x=(t=a[n])&&t.absoluteBox;!y||!x||u===t||0===u.newOpacity||0===t.newOpacity||"hidden"===u.visibility||"hidden"===t.visibility||x.x>=y.x+y.width||x.x+x.width<=y.x||x.y>=y.y+y.height||x.y+x.height<=y.y||((u.labelrank<t.labelrank?u:t).newOpacity=0)}}a.forEach(function(a){C(a,
f)&&(q=!0)});q&&w(f,"afterHideAllOverlappingLabels")}});K(f,"Core/Responsive.js",[f["Core/Utilities.js"]],function(a){var f=a.extend,B=a.find,H=a.isArray,w=a.isObject,E=a.merge,I=a.objectEach,A=a.pick,u=a.splat,n=a.uniqueKey,k;(function(a){var c=[];a.compose=function(a){-1===c.indexOf(a)&&(c.push(a),f(a.prototype,e.prototype));return a};var e=function(){function a(){}a.prototype.currentOptions=function(a){function c(a,f,g,h){var b;I(a,function(a,d){if(!h&&-1<e.collectionsWithUpdate.indexOf(d)&&f[d])for(a=
u(a),g[d]=[],b=0;b<Math.max(a.length,f[d].length);b++)f[d][b]&&(void 0===a[b]?g[d][b]=f[d][b]:(g[d][b]={},c(a[b],f[d][b],g[d][b],h+1)));else w(a)?(g[d]=H(a)?[]:{},c(a,f[d]||{},g[d],h+1)):g[d]="undefined"===typeof f[d]?null:f[d]})}var e=this,f={};c(a,this.options,f,0);return f};a.prototype.matchResponsiveRule=function(a,c){var e=a.condition;(e.callback||function(){return this.chartWidth<=A(e.maxWidth,Number.MAX_VALUE)&&this.chartHeight<=A(e.maxHeight,Number.MAX_VALUE)&&this.chartWidth>=A(e.minWidth,
0)&&this.chartHeight>=A(e.minHeight,0)}).call(this)&&c.push(a._id)};a.prototype.setResponsive=function(a,c){var e=this,f=this.options.responsive,g=this.currentResponsive,k=[];!c&&f&&f.rules&&f.rules.forEach(function(a){"undefined"===typeof a._id&&(a._id=n());e.matchResponsiveRule(a,k)},this);c=E.apply(void 0,k.map(function(a){return B((f||{}).rules||[],function(c){return c._id===a})}).map(function(a){return a&&a.chartOptions}));c.isResponsiveOptions=!0;k=k.toString()||void 0;k!==(g&&g.ruleIds)&&(g&&
this.update(g.undoOptions,a,!0),k?(g=this.currentOptions(c),g.isResponsiveOptions=!0,this.currentResponsive={ruleIds:k,mergedOptions:c,undoOptions:g},this.update(c,a,!0)):this.currentResponsive=void 0)};return a}()})(k||(k={}));"";"";return k});K(f,"masters/highcharts.src.js",[f["Core/Globals.js"],f["Core/Utilities.js"],f["Core/DefaultOptions.js"],f["Core/Animation/Fx.js"],f["Core/Animation/AnimationUtilities.js"],f["Core/Renderer/HTML/AST.js"],f["Core/FormatUtilities.js"],f["Core/Renderer/RendererUtilities.js"],
f["Core/Renderer/SVG/SVGElement.js"],f["Core/Renderer/SVG/SVGRenderer.js"],f["Core/Renderer/HTML/HTMLElement.js"],f["Core/Renderer/HTML/HTMLRenderer.js"],f["Core/Axis/Axis.js"],f["Core/Axis/DateTimeAxis.js"],f["Core/Axis/LogarithmicAxis.js"],f["Core/Axis/PlotLineOrBand/PlotLineOrBand.js"],f["Core/Axis/Tick.js"],f["Core/Tooltip.js"],f["Core/Series/Point.js"],f["Core/Pointer.js"],f["Core/MSPointer.js"],f["Core/Legend/Legend.js"],f["Core/Chart/Chart.js"],f["Core/Series/Series.js"],f["Core/Series/SeriesRegistry.js"],
f["Series/Column/ColumnSeries.js"],f["Series/Column/ColumnDataLabel.js"],f["Series/Pie/PieSeries.js"],f["Series/Pie/PieDataLabel.js"],f["Core/Series/DataLabel.js"],f["Core/Responsive.js"],f["Core/Color/Color.js"],f["Core/Time.js"]],function(a,f,B,H,w,E,I,A,u,n,k,e,c,p,g,t,q,F,y,x,z,m,h,b,l,d,D,v,r,K,P,S,N){a.animate=w.animate;a.animObject=w.animObject;a.getDeferredAnimation=w.getDeferredAnimation;a.setAnimation=w.setAnimation;a.stop=w.stop;a.timers=H.timers;a.AST=E;a.Axis=c;a.Chart=h;a.chart=h.chart;
a.Fx=H;a.Legend=m;a.PlotLineOrBand=t;a.Point=y;a.Pointer=z.isRequired()?z:x;a.Series=b;a.SVGElement=u;a.SVGRenderer=n;a.Tick=q;a.Time=N;a.Tooltip=F;a.Color=S;a.color=S.parse;e.compose(n);k.compose(u);a.defaultOptions=B.defaultOptions;a.getOptions=B.getOptions;a.time=B.defaultTime;a.setOptions=B.setOptions;a.dateFormat=I.dateFormat;a.format=I.format;a.numberFormat=I.numberFormat;a.addEvent=f.addEvent;a.arrayMax=f.arrayMax;a.arrayMin=f.arrayMin;a.attr=f.attr;a.clearTimeout=f.clearTimeout;a.correctFloat=
f.correctFloat;a.createElement=f.createElement;a.css=f.css;a.defined=f.defined;a.destroyObjectProperties=f.destroyObjectProperties;a.discardElement=f.discardElement;a.distribute=A.distribute;a.erase=f.erase;a.error=f.error;a.extend=f.extend;a.extendClass=f.extendClass;a.find=f.find;a.fireEvent=f.fireEvent;a.getMagnitude=f.getMagnitude;a.getStyle=f.getStyle;a.inArray=f.inArray;a.isArray=f.isArray;a.isClass=f.isClass;a.isDOMElement=f.isDOMElement;a.isFunction=f.isFunction;a.isNumber=f.isNumber;a.isObject=
f.isObject;a.isString=f.isString;a.keys=f.keys;a.merge=f.merge;a.normalizeTickInterval=f.normalizeTickInterval;a.objectEach=f.objectEach;a.offset=f.offset;a.pad=f.pad;a.pick=f.pick;a.pInt=f.pInt;a.relativeLength=f.relativeLength;a.removeEvent=f.removeEvent;a.seriesType=l.seriesType;a.splat=f.splat;a.stableSort=f.stableSort;a.syncTimeout=f.syncTimeout;a.timeUnits=f.timeUnits;a.uniqueKey=f.uniqueKey;a.useSerialIds=f.useSerialIds;a.wrap=f.wrap;D.compose(d);K.compose(b);p.compose(c);g.compose(c);r.compose(v);
t.compose(c);P.compose(h);return a});f["masters/highcharts.src.js"]._modules=f;return f["masters/highcharts.src.js"]});
//# sourceMappingURL=highcharts.js.map